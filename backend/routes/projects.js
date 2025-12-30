import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteUserToProject,
  getPendingProjectInvitations,
  acceptProjectInvitation,
  rejectProjectInvitation,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Project invitations
router.post('/:id/invite', inviteUserToProject);
router.get('/invitations/pending', getPendingProjectInvitations);
router.post('/invitations/:token/accept', acceptProjectInvitation);
router.post('/invitations/:invitationId/reject', rejectProjectInvitation);

export default router;
