import Comment from '../models/Comment.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

export const createComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    // Check if ticket exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const comment = new Comment({
      ticketId,
      authorId: userId,
      content,
    });

    await comment.save();
    await comment.populate('authorId', 'email fullName');

    const responseComment = {
      id: comment._id,
      ticketId: comment.ticketId,
      authorId: comment.authorId._id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.authorId._id,
        email: comment.authorId.email,
        fullName: comment.authorId.fullName,
      },
    };

    // Notify ticket creator if not the comment author
    if (ticket.creatorId.toString() !== userId) {
      await createNotification(
        ticket.creatorId,
        'comment',
        'Nouveau commentaire',
        `${comment.authorId.fullName} a commenté sur "${ticket.title}"`,
        ticketId,
        comment._id
      );
    }

    // Notify ticket assignees if not the comment author
    if (ticket.assignees && ticket.assignees.length > 0) {
      for (const assigneeId of ticket.assignees) {
        if (assigneeId.toString() !== userId) {
          await createNotification(
            assigneeId,
            'comment',
            'Nouveau commentaire',
            `${comment.authorId.fullName} a commenté sur "${ticket.title}"`,
            ticketId,
            comment._id
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      comment: responseComment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTicketComments = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const comments = await Comment.find({ ticketId })
      .populate('authorId', 'email fullName')
      .sort({ createdAt: -1 });

    const responseComments = comments.map((comment) => ({
      id: comment._id,
      ticketId: comment.ticketId,
      authorId: comment.authorId._id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.authorId._id,
        email: comment.authorId.email,
        fullName: comment.authorId.fullName,
      },
    }));

    res.status(200).json({
      success: true,
      comments: responseComments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is comment author
    if (comment.authorId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
