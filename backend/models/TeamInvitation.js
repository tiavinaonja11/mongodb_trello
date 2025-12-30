import mongoose from 'mongoose';
import crypto from 'crypto';

const teamInvitationSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    invitedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    invitedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    token: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Generate unique token before saving
teamInvitationSchema.pre('save', function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Index to quickly find pending invitations for a user
teamInvitationSchema.index({ invitedUserId: 1, status: 1 });
teamInvitationSchema.index({ teamId: 1, status: 1 });
teamInvitationSchema.index({ token: 1 }, { unique: true, sparse: true }); // Unique token for invitations
teamInvitationSchema.index({ email: 1, status: 1 });
teamInvitationSchema.index({ expiresAt: 1 }); // For cleanup of expired invitations

export default mongoose.model('TeamInvitation', teamInvitationSchema);
