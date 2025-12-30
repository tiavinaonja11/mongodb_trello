import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['comment', 'ticket_assignment', 'ticket_update', 'project_invitation', 'project_invitation_accepted', 'project_invitation_rejected'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedTicketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
    },
    relatedCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
