import Project from '../models/Project.js';
import ProjectInvitation from '../models/ProjectInvitation.js';
import User from '../models/User.js';
import { sendInvitationEmail } from '../utils/emailService.js';
import { createNotification } from './notificationController.js';

export const createProject = async (req, res) => {
  try {
    const { name, description, status, type, dueDate } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const project = new Project({
      name,
      description,
      status: status || 'active',
      type: type || 'backend',
      dueDate: dueDate ? new Date(dueDate) : null,
      ownerId: userId,
      members: [
        {
          userId,
          role: 'owner',
        },
      ],
    });

    await project.save();
    await project.populate('ownerId', 'email fullName');
    await project.populate('members.userId', 'email fullName');

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId },
      ],
    })
      .populate('ownerId', 'email fullName')
      .populate('members.userId', 'email fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id)
      .populate('ownerId', 'email fullName')
      .populate('members.userId', 'email fullName');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user has access to this project
    const hasAccess = project.ownerId._id.toString() === userId ||
      project.members.some(m => m.userId.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, type, dueDate } = req.body;
    const userId = req.user.id;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user is owner or admin
    const userRole = project.members.find(m => m.userId.toString() === userId)?.role;
    if (project.ownerId.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (type) project.type = type;
    if (dueDate !== undefined) project.dueDate = dueDate ? new Date(dueDate) : null;

    await project.save();
    await project.populate('ownerId', 'email fullName');
    await project.populate('members.userId', 'email fullName');

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Only owner can delete
    if (project.ownerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only owner can delete' });
    }

    await Project.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const inviteUserToProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role = 'member' } = req.body;
    const invitingUserId = req.user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user is owner or admin
    const userRole = project.members.find(m => m.userId.toString() === invitingUserId)?.role;
    if (project.ownerId.toString() !== invitingUserId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owner or admin can invite' });
    }

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Email, firstName, and lastName are required' });
    }

    // Check if member already exists in project
    const memberExists = project.members.some((m) => {
      const memberId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
      return memberId === email; // This might need adjustment
    });

    // Check if invitation already pending
    const pendingInvitation = await ProjectInvitation.findOne({
      projectId: id,
      email,
      status: 'pending',
    });
    if (pendingInvitation) {
      return res.status(400).json({ success: false, message: 'An invitation is already pending for this email' });
    }

    // Try to find existing user
    const existingUser = await User.findOne({ email }).lean();

    // Create invitation
    const invitation = new ProjectInvitation({
      projectId: id,
      invitedUserId: existingUser ? existingUser._id : undefined,
      invitedByUserId: invitingUserId,
      email,
      firstName,
      lastName,
      role,
      status: 'pending',
    });

    await invitation.save();

    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/accept-project-invitation/${invitation.token}`;

    // Get inviter details
    const inviter = await User.findById(invitingUserId).lean();

    // Send invitation email
    const emailResult = await sendInvitationEmail(
      email,
      invitationUrl,
      project.name,
      inviter?.fullName || 'An admin',
      firstName
    );

    // If email failed in development, log the URL
    if (!emailResult.success) {
      console.log(`\n⚠️ Email failed for ${email}`);
      console.log(`📧 Invitation link (copy and share):`);
      console.log(`   ${invitationUrl}\n`);
    }

    // If user already exists, send notification
    if (existingUser) {
      await createNotification(
        existingUser._id,
        'project_invitation',
        `Invitation au projet ${project.name}`,
        `Vous avez été invité à rejoindre le projet "${project.name}"`,
        id
      );
    }

    res.status(201).json({
      success: true,
      invitation,
      invitationUrl,
      emailSent: emailResult.success,
      message: emailResult.success
        ? `Invitation sent to ${email}`
        : `Invitation created. Email failed but you can use the link below to invite manually.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingProjectInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    const invitations = await ProjectInvitation.find({
      invitedUserId: userId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('projectId', 'name description')
      .populate('invitedByUserId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      invitations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptProjectInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    const invitation = await ProjectInvitation.findOne({ token, status: 'pending' })
      .populate('projectId')
      .populate('invitedByUserId', 'fullName email');

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invitation' });
    }

    // Check expiration
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(410).json({ success: false, message: 'Invitation has expired' });
    }

    // Verify email matches
    const user = await User.findById(userId);
    if (user.email !== invitation.email) {
      return res.status(400).json({ success: false, message: 'Email does not match' });
    }

    const project = invitation.projectId;

    // Check if already a member
    const isMember = project.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      project.members.push({
        userId,
        role: invitation.role,
      });
      await project.save();
    }

    // Update invitation
    invitation.status = 'accepted';
    await invitation.save();

    // Notify inviter
    await createNotification(
      invitation.invitedByUserId._id,
      'project_invitation_accepted',
      'Invitation au projet acceptée',
      `${invitation.firstName} ${invitation.lastName} a accepté l'invitation au projet "${project.name}"`,
      project._id
    );

    res.status(200).json({
      success: true,
      message: 'Invitation accepted',
      project,
      invitation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectProjectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    const invitation = await ProjectInvitation.findById(invitationId)
      .populate('projectId', 'name')
      .populate('invitedByUserId', 'fullName email');

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    // Verify authorization
    if (invitation.invitedUserId && invitation.invitedUserId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Invitation is already ${invitation.status}` });
    }

    invitation.status = 'rejected';
    await invitation.save();

    // Notify inviter
    await createNotification(
      invitation.invitedByUserId._id,
      'project_invitation_rejected',
      'Invitation au projet refusée',
      `${invitation.firstName} ${invitation.lastName} a refusé l'invitation au projet "${invitation.projectId.name}"`,
      invitation.projectId._id
    );

    res.status(200).json({
      success: true,
      message: 'Invitation rejected',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
