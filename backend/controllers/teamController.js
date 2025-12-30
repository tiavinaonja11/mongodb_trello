import Team from '../models/Team.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import TeamInvitation from '../models/TeamInvitation.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { createNotification } from './notificationController.js';
import { sendInvitationEmail, sendInvitationAcceptedEmail } from '../utils/emailService.js';

// Helper function to enrich team members with project count
const enrichMembersWithProjectCount = async (team) => {
  if (!team.members || team.members.length === 0) {
    return team;
  }

  const enrichedMembers = await Promise.all(
    team.members.map(async (member) => {
      try {
        let userId = null;

        // Try to get userId from member object
        if (member.userId) {
          userId = member.userId;
        } else if (member.email) {
          // If no userId, try to find user by email
          const user = await User.findOne({ email: member.email }).lean();
          if (user) {
            userId = user._id;
          }
        }

        let projectCount = 0;
        if (userId) {
          projectCount = await Project.countDocuments({
            $or: [
              { ownerId: userId },
              { 'members.userId': userId }
            ]
          });
        }

        const memberObj = member.toObject ? member.toObject() : member;
        return {
          ...memberObj,
          projectCount
        };
      } catch (err) {
        console.error('Error enriching member:', err);
        const memberObj = member.toObject ? member.toObject() : member;
        return {
          ...memberObj,
          projectCount: 0
        };
      }
    })
  );

  const teamObj = team.toObject ? team.toObject() : team;
  return {
    ...teamObj,
    members: enrichedMembers
  };
};

export const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return sendError(res, 'Team name is required', 400);
    }

    const team = new Team({
      name,
      description,
      createdBy: userId,
    });

    await team.save();
    sendSuccess(res, team, 'Team created successfully', 201);
  } catch (error) {
    console.error('Create team error:', error);
    sendError(res, error.message, 500);
  }
};

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    const enrichedTeams = await Promise.all(
      teams.map(team => enrichMembersWithProjectCount(team))
    );

    sendSuccess(res, enrichedTeams, 'Teams retrieved successfully');
  } catch (error) {
    console.error('Get teams error:', error);
    sendError(res, error.message, 500);
  }
};

export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id)
      .populate('createdBy', 'fullName email')
      .populate('members.userId', 'fullName email');

    if (!team) {
      return sendError(res, 'Team not found', 404);
    }

    const enrichedTeam = await enrichMembersWithProjectCount(team);
    sendSuccess(res, enrichedTeam, 'Team retrieved successfully');
  } catch (error) {
    console.error('Get team error:', error);
    sendError(res, error.message, 500);
  }
};

export const addMemberToTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, firstName, lastName, phone, role = 'member' } = req.body;
    const invitingUserId = req.user.id;

    if (!email || !firstName || !lastName) {
      return sendError(res, 'Email, first name, and last name are required', 400);
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return sendError(res, 'Team not found', 404);
    }

    // Check if member already exists in team
    const memberExists = team.members.some((m) => m.email === email);
    if (memberExists) {
      return sendError(res, 'A member with this email already exists in this team', 400);
    }

    // Check if invitation already pending for this email in this team
    const pendingInvitation = await TeamInvitation.findOne({
      teamId,
      email,
      status: 'pending',
    });
    if (pendingInvitation) {
      return sendError(res, 'An invitation is already pending for this email', 400);
    }

    // Try to find existing user by email (optional - they may not have created account yet)
    const existingUser = await User.findOne({ email }).lean();

    // Create a team invitation (with or without invitedUserId)
    const invitation = new TeamInvitation({
      teamId,
      invitedUserId: existingUser ? existingUser._id : undefined,
      invitedByUserId: invitingUserId,
      email,
      firstName,
      lastName,
      phone: phone ? Number(phone) : undefined,
      role,
      status: 'pending',
    });

    await invitation.save();

    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/accept-invitation/${invitation.token}`;
    // Note: The backend endpoint is POST /api/teams/accept-invitation/:token

    // Get inviter details for email
    const inviter = await User.findById(invitingUserId).lean();

    // Send invitation email
    const emailResult = await sendInvitationEmail(
      email,
      invitationUrl,
      team.name,
      inviter?.fullName || 'Un administrateur',
      firstName
    );

    // If user already exists, send notification
    if (existingUser) {
      await createNotification(
        existingUser._id,
        'team_invitation',
        'Invitation à rejoindre une équipe',
        `Vous avez été invité à rejoindre l'équipe "${team.name}". Acceptez ou refusez cette invitation.`,
        teamId
      );
    }

    const message = emailResult.success
      ? `Invitation created and email sent to ${email}`
      : `Invitation created but email sending failed. Share the link manually: ${invitationUrl}`;

    sendSuccess(res, {
      invitation,
      invitationUrl,
      emailSent: emailResult.success,
      message
    }, 'Invitation created successfully');
  } catch (error) {
    console.error('Add member error:', error);
    sendError(res, error.message, 500);
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const team = await Team.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!team) {
      return sendError(res, 'Team not found', 404);
    }

    const enrichedTeam = await enrichMembersWithProjectCount(team);
    sendSuccess(res, enrichedTeam, 'Team updated successfully');
  } catch (error) {
    console.error('Update team error:', error);
    sendError(res, error.message, 500);
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findByIdAndDelete(id);

    if (!team) {
      return sendError(res, 'Team not found', 404);
    }

    sendSuccess(res, { id }, 'Team deleted successfully');
  } catch (error) {
    console.error('Delete team error:', error);
    sendError(res, error.message, 500);
  }
};

export const removeMemberFromTeam = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return sendError(res, 'Team not found', 404);
    }

    team.members = team.members.filter(
      (m) => m._id.toString() !== memberId
    );
    await team.save();

    const enrichedTeam = await enrichMembersWithProjectCount(team);
    sendSuccess(res, enrichedTeam, 'Member removed from team successfully');
  } catch (error) {
    console.error('Remove member error:', error);
    sendError(res, error.message, 500);
  }
};

export const updateMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { firstName, lastName, phone, role } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return sendError(res, 'Team not found', 404);
    }

    const member = team.members.find((m) => m._id.toString() === memberId);
    if (!member) {
      return sendError(res, 'Member not found', 404);
    }

    if (firstName) member.firstName = firstName;
    if (lastName) member.lastName = lastName;
    if (phone !== undefined) member.phone = phone ? Number(phone) : undefined;
    if (role) member.role = role;

    await team.save();
    const enrichedTeam = await enrichMembersWithProjectCount(team);
    sendSuccess(res, enrichedTeam, 'Member updated successfully');
  } catch (error) {
    console.error('Update member error:', error);
    sendError(res, error.message, 500);
  }
};

export const getPendingInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    const invitations = await TeamInvitation.find({
      invitedUserId: userId,
      status: 'pending',
      expiresAt: { $gt: new Date() }, // Only non-expired invitations
    })
      .populate('teamId', 'name description')
      .populate('invitedByUserId', 'fullName email')
      .sort({ createdAt: -1 });

    sendSuccess(res, invitations, 'Pending invitations retrieved successfully');
  } catch (error) {
    console.error('Get pending invitations error:', error);
    sendError(res, error.message, 500);
  }
};

export const getTeamInvitationStatuses = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    // Get all invitations for this team (all statuses)
    const invitations = await TeamInvitation.find({ teamId })
      .select('invitedUserId status email')
      .lean();

    // Create a map of userId -> invitation status
    const statusMap = {};
    invitations.forEach(inv => {
      statusMap[inv.invitedUserId.toString()] = inv.status;
    });

    sendSuccess(res, statusMap, 'Team invitation statuses retrieved successfully');
  } catch (error) {
    console.error('Get team invitation statuses error:', error);
    sendError(res, error.message, 500);
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    const invitation = await TeamInvitation.findById(invitationId)
      .populate('teamId')
      .populate('invitedByUserId', 'fullName email');

    if (!invitation) {
      return sendError(res, 'Invitation not found', 404);
    }

    // Get the current user to check their email
    const currentUser = await User.findById(userId).lean();
    if (!currentUser) {
      return sendError(res, 'User not found', 404);
    }

    // Verify the invitation belongs to the current user
    // Either invitedUserId is set and matches, or email matches and invitedUserId is not set
    const isAuthorized =
      (invitation.invitedUserId && invitation.invitedUserId.toString() === userId) ||
      (!invitation.invitedUserId && invitation.email === currentUser.email);

    if (!isAuthorized) {
      return sendError(res, 'You are not authorized to accept this invitation', 403);
    }

    // Check if invitation is not expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return sendError(res, 'This invitation has expired', 410);
    }

    // Check if already accepted or rejected
    if (invitation.status !== 'pending') {
      return sendError(res, `Invitation is already ${invitation.status}`, 400);
    }

    const team = invitation.teamId;

    // Check if member already exists in team
    const memberExists = team.members.some((m) => {
      if (!m.userId) return false;
      const memberUserId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
      return memberUserId === userId.toString();
    });
    if (memberExists) {
      invitation.status = 'accepted';
      await invitation.save();
      return sendSuccess(res, { invitation }, 'You are already a member of this team');
    }

    // Add member to team
    const newMember = {
      userId,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      phone: invitation.phone,
      role: invitation.role,
    };

    team.members.push(newMember);
    await team.save();

    // Update invitation status and set invitedUserId if not already set
    invitation.status = 'accepted';
    if (!invitation.invitedUserId) {
      invitation.invitedUserId = userId;
    }
    await invitation.save();

    // Notify the inviter
    await createNotification(
      invitation.invitedByUserId._id,
      'team_invitation_accepted',
      'Invitation acceptée',
      `${invitation.firstName} ${invitation.lastName} a accepté votre invitation pour rejoindre l'équipe "${team.name}"`,
      team._id
    );

    const enrichedTeam = await enrichMembersWithProjectCount(team);
    sendSuccess(res, { team: enrichedTeam, invitation }, 'Invitation accepted. You have been added to the team.');
  } catch (error) {
    console.error('Accept invitation error:', error);
    sendError(res, error.message, 500);
  }
};

export const rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    const invitation = await TeamInvitation.findById(invitationId)
      .populate('teamId', 'name')
      .populate('invitedByUserId', 'fullName email');

    if (!invitation) {
      return sendError(res, 'Invitation not found', 404);
    }

    // Verify the invitation belongs to the current user
    if (invitation.invitedUserId && invitation.invitedUserId.toString() !== userId) {
      return sendError(res, 'You are not authorized to reject this invitation', 403);
    }

    // Check if already accepted or rejected
    if (invitation.status !== 'pending') {
      return sendError(res, `Invitation is already ${invitation.status}`, 400);
    }

    // Update invitation status
    invitation.status = 'rejected';
    await invitation.save();

    // Notify the inviter
    await createNotification(
      invitation.invitedByUserId._id,
      'team_invitation_rejected',
      'Invitation refusée',
      `${invitation.firstName} ${invitation.lastName} a refusé votre invitation pour rejoindre l'équipe "${invitation.teamId.name}"`,
      invitation.teamId._id
    );

    sendSuccess(res, { invitation }, 'Invitation rejected successfully.');
  } catch (error) {
    console.error('Reject invitation error:', error);
    sendError(res, error.message, 500);
  }
};

export const acceptInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { fullName, email, password } = req.body;

    // Find invitation by token
    const invitation = await TeamInvitation.findOne({ token, status: 'pending' })
      .populate('teamId')
      .populate('invitedByUserId', 'fullName email');

    if (!invitation) {
      return sendError(res, 'Invalid or expired invitation token', 404);
    }

    // Check if invitation is not expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return sendError(res, 'This invitation has expired', 410);
    }

    // Check email matches
    if (invitation.email !== email) {
      return sendError(res, 'Email does not match the invitation', 400);
    }

    let user = await User.findOne({ email }).lean();

    // If user doesn't exist, create new user
    if (!user) {
      if (!password || password.length < 6) {
        return sendError(res, 'Password must be at least 6 characters', 400);
      }

      const newUser = new User({
        email,
        fullName: fullName || `${invitation.firstName} ${invitation.lastName}`,
        password,
      });

      await newUser.save();
      user = newUser;
    }

    const team = invitation.teamId;
    const userId = user._id;

    // Check if member already exists in team
    const memberExists = team.members.some((m) => {
      if (!m.userId) return false;
      const memberUserId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
      return memberUserId === userId.toString();
    });
    if (!memberExists) {
      // Add member to team
      const newMember = {
        userId,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        phone: invitation.phone,
        role: invitation.role,
      };

      team.members.push(newMember);
      await team.save();
    }

    // Update invitation status and set invitedUserId
    invitation.invitedUserId = userId;
    invitation.status = 'accepted';
    await invitation.save();

    // Notify the inviter via notification
    await createNotification(
      invitation.invitedByUserId._id,
      'team_invitation_accepted',
      'Invitation acceptée',
      `${invitation.firstName} ${invitation.lastName} a accepté votre invitation pour rejoindre l'équipe "${team.name}"`,
      team._id
    );

    // Send acceptance email to inviter
    await sendInvitationAcceptedEmail(
      invitation.invitedByUserId.email,
      invitation.firstName,
      `${invitation.firstName} ${invitation.lastName}`,
      team.name
    );

    const enrichedTeam = await enrichMembersWithProjectCount(team);
    sendSuccess(res, {
      user,
      team: enrichedTeam,
      invitation,
      message: 'Invitation accepted successfully! You have been added to the team.'
    }, 'Invitation accepted successfully');
  } catch (error) {
    console.error('Accept invitation by token error:', error);
    sendError(res, error.message, 500);
  }
};

// Get project participants (users who participated in any of the user's projects)
export const getProjectParticipants = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all projects where user is owner or member
    const projects = await Project.find({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ]
    })
      .populate('ownerId', '_id email fullName firstName lastName')
      .populate('members.userId', '_id email fullName firstName lastName')
      .lean();

    // Collect unique participants
    const participantsMap = new Map();

    for (const project of projects) {
      // Add project owner
      if (project.ownerId) {
        const ownerId = project.ownerId._id?.toString() || project.ownerId;
        if (!participantsMap.has(ownerId)) {
          const owner = typeof project.ownerId === 'object' ? project.ownerId : null;
          if (owner) {
            // Extract firstName and lastName from fullName if they're missing
            let firstName = owner.firstName?.trim() || '';
            let lastName = owner.lastName?.trim() || '';

            if (!firstName && !lastName && owner.fullName) {
              const nameParts = owner.fullName.trim().split(/\s+/);
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }

            participantsMap.set(ownerId, {
              _id: owner._id,
              email: owner.email,
              firstName: firstName || 'Unknown',
              lastName: lastName,
              fullName: owner.fullName || `${firstName} ${lastName}`.trim(),
              role: 'owner',
              projectCount: 0,
              projectIds: [project._id]
            });
          }
        } else {
          // Increment project count
          const participant = participantsMap.get(ownerId);
          participant.projectCount = (participant.projectCount || 0) + 1;
          if (!participant.projectIds) participant.projectIds = [];
          participant.projectIds.push(project._id);
        }
      }

      // Add project members
      if (project.members && Array.isArray(project.members)) {
        for (const member of project.members) {
          const memberId = member.userId?._id?.toString() || member.userId;
          if (!participantsMap.has(memberId)) {
            const memberUser = typeof member.userId === 'object' ? member.userId : null;
            if (memberUser) {
              // Extract firstName and lastName from fullName if they're missing
              let firstName = memberUser.firstName?.trim() || '';
              let lastName = memberUser.lastName?.trim() || '';

              if (!firstName && !lastName && memberUser.fullName) {
                const nameParts = memberUser.fullName.trim().split(/\s+/);
                firstName = nameParts[0] || '';
                lastName = nameParts.slice(1).join(' ') || '';
              }

              participantsMap.set(memberId, {
                _id: memberUser._id,
                email: memberUser.email,
                firstName: firstName || 'Unknown',
                lastName: lastName,
                fullName: memberUser.fullName || `${firstName} ${lastName}`.trim(),
                role: member.role || 'member',
                projectCount: 1,
                projectIds: [project._id]
              });
            }
          } else {
            // Increment project count
            const participant = participantsMap.get(memberId);
            participant.projectCount = (participant.projectCount || 0) + 1;
            if (!participant.projectIds) participant.projectIds = [];
            participant.projectIds.push(project._id);
          }
        }
      }
    }

    // Convert map to array and sort by name
    const participants = Array.from(participantsMap.values())
      .sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

    sendSuccess(res, participants, 'Project participants retrieved successfully');
  } catch (error) {
    console.error('Get project participants error:', error);
    sendError(res, error.message, 500);
  }
};
