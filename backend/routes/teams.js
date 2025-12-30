import express from 'express';
import {
  createTeam,
  getTeams,
  getTeamById,
  addMemberToTeam,
  updateTeam,
  deleteTeam,
  removeMemberFromTeam,
  updateMember,
  getPendingInvitations,
  acceptInvitation,
  rejectInvitation,
  getTeamInvitationStatuses,
  acceptInvitationByToken,
  getProjectParticipants,
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Specific routes MUST come BEFORE generic ID routes (/:id pattern matches anything)
// Named routes must be registered BEFORE parameterized routes

// Generic list routes
router.get('/', getTeams);
router.post('/', protect, createTeam);

// Named specific routes (before /:id pattern)
router.get('/participants', protect, getProjectParticipants);

// Invitation management routes (before /:id pattern)
router.get('/invitations/pending', protect, getPendingInvitations);
router.post('/invitations/:invitationId/accept', protect, acceptInvitation);
router.post('/invitations/:invitationId/reject', protect, rejectInvitation);
router.post('/accept-invitation/:token', acceptInvitationByToken);

// Team-specific routes with ID parameter (/:id comes last)
router.get('/:id/invitations/statuses', protect, getTeamInvitationStatuses);
router.get('/:id', getTeamById);
router.put('/:id', protect, updateTeam);
router.delete('/:id', protect, deleteTeam);

// Member management
router.post('/:teamId/members', protect, addMemberToTeam);
router.put('/:teamId/members/:memberId', protect, updateMember);
router.delete('/:teamId/members/:memberId', protect, removeMemberFromTeam);

export default router;
