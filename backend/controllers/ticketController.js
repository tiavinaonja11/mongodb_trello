import Ticket from '../models/Ticket.js';
import Project from '../models/Project.js';
import { createNotification } from './notificationController.js';

// Helper function to enrich assignees with project count
const enrichAssigneesWithProjectCount = async (ticket) => {
  if (!ticket.assignees || !Array.isArray(ticket.assignees) || ticket.assignees.length === 0) {
    return ticket;
  }

  try {
    const enrichedAssignees = await Promise.all(
      ticket.assignees.map(async (assignee) => {
        // Handle both Mongoose documents and plain objects
        const assigneeObj = assignee.toObject ? assignee.toObject() : assignee;
        const userId = assigneeObj._id || assigneeObj.id;

        // Skip if no user ID
        if (!userId) {
          return assigneeObj;
        }

        const projectCount = await Project.countDocuments({
          $or: [
            { ownerId: userId },
            { 'members.userId': userId }
          ]
        }).catch(() => 0); // Handle any query errors

        return {
          ...assigneeObj,
          projectCount
        };
      })
    );

    // Convert ticket to object and ensure assignees are set
    const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
    return {
      ...ticketObj,
      assignees: enrichedAssignees
    };
  } catch (error) {
    console.error('Error enriching assignees:', error);
    // Return ticket with original assignees if enrichment fails
    const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
    return ticketObj;
  }
};

export const createTicket = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, type, teamId, assignees, estimatedDate } = req.body;
    const userId = req.user.id;

    console.log('🔧 createTicket - Received data:', {
      title,
      assignees,
      assigneesType: Array.isArray(assignees) ? 'array' : typeof assignees,
      assigneesLength: Array.isArray(assignees) ? assignees.length : 'N/A',
    });

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Ticket title is required' });
    }

    // Check if user has access to this project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const hasAccess = project.ownerId.toString() === userId ||
      project.members.some(m => m.userId.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Ensure assignees are valid ObjectIds and filter out empty values
    const validAssignees = assignees && Array.isArray(assignees)
      ? assignees.filter(id => id && String(id).trim().length > 0)
      : [];

    const ticket = new Ticket({
      title,
      description,
      projectId,
      status: status || 'todo',
      priority: priority || 'medium',
      type: type || '',
      teamId: teamId || null,
      creatorId: userId,
      assignees: validAssignees,
      estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
    });

    await ticket.save();
    console.log('📌 Ticket saved, assignees:', ticket.assignees);

    await ticket.populate('creatorId', '_id email fullName');
    await ticket.populate('assignees', '_id email fullName');
    await ticket.populate('teamId', 'name members');

    console.log('📌 After populate, assignees:', ticket.assignees);

    const enrichedTicket = await enrichAssigneesWithProjectCount(ticket);
    console.log('✅ Final ticket with enrichment:', enrichedTicket);

    // Create notifications for assigned users
    if (validAssignees && validAssignees.length > 0) {
      for (const assigneeId of validAssignees) {
        await createNotification(
          assigneeId,
          'ticket_assignment',
          'Ticket assigné',
          `Vous avez été assigné au ticket "${title}"`,
          ticket._id
        );
      }
    }

    res.status(201).json({
      success: true,
      ticket: enrichedTicket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectTickets = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check if user has access to this project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const hasAccess = project.ownerId.toString() === userId ||
      project.members.some(m => m.userId.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tickets = await Ticket.find({ projectId })
      .populate('creatorId', '_id email fullName')
      .populate('assignees', '_id email fullName')
      .populate('teamId', 'name members')
      .sort({ createdAt: -1 });

    const enrichedTickets = await Promise.all(
      tickets.map(ticket => enrichAssigneesWithProjectCount(ticket))
    );

    res.status(200).json({
      success: true,
      tickets: enrichedTickets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findById(ticketId)
      .populate('creatorId', '_id email fullName')
      .populate('assignees', '_id email fullName')
      .populate('projectId')
      .populate('teamId', 'name members');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check if user has access to this project
    const hasAccess = ticket.projectId.ownerId.toString() === userId ||
      ticket.projectId.members.some(m => m.userId.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const enrichedTicket = await enrichAssigneesWithProjectCount(ticket);

    res.status(200).json({
      success: true,
      ticket: enrichedTicket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { title, description, status, priority, type, teamId, assignees, estimatedDate } = req.body;
    const userId = req.user.id;

    const ticket = await Ticket.findById(ticketId).populate('projectId');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check if user has access to this project
    const hasAccess = ticket.projectId.ownerId.toString() === userId ||
      ticket.projectId.members.some(m => m.userId.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Track old assignees to detect changes
    const oldAssigneeIds = ticket.assignees.map(a => a.toString());
    const newAssigneeIds = assignees && Array.isArray(assignees)
      ? assignees.map(a => typeof a === 'string' ? a : a.toString())
      : oldAssigneeIds;

    if (title) ticket.title = title;
    if (description !== undefined) ticket.description = description;
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (type !== undefined) ticket.type = type;
    if (teamId !== undefined) ticket.teamId = teamId;
    if (assignees) ticket.assignees = assignees;
    if (estimatedDate !== undefined) ticket.estimatedDate = estimatedDate ? new Date(estimatedDate) : null;

    await ticket.save();
    await ticket.populate('creatorId', '_id email fullName');
    await ticket.populate('assignees', '_id email fullName');
    await ticket.populate('teamId', 'name members');

    // Notify newly added assignees
    const newlyAssignedIds = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));
    if (newlyAssignedIds.length > 0) {
      for (const assigneeId of newlyAssignedIds) {
        await createNotification(
          assigneeId,
          'ticket_assignment',
          'Ticket assigné',
          `Vous avez été assigné au ticket "${ticket.title}"`,
          ticketId
        );
      }
    }

    const enrichedTicket = await enrichAssigneesWithProjectCount(ticket);

    res.status(200).json({
      success: true,
      ticket: enrichedTicket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findById(ticketId).populate('projectId');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check if user is creator or project owner
    const isCreator = ticket.creatorId.toString() === userId;
    const isProjectOwner = ticket.projectId.ownerId.toString() === userId;

    if (!isCreator && !isProjectOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Ticket.findByIdAndDelete(ticketId);

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
