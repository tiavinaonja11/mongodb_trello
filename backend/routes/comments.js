import express from 'express';
import {
  createComment,
  getTicketComments,
  deleteComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/:ticketId', createComment);
router.get('/:ticketId', getTicketComments);
router.delete('/:commentId', deleteComment);

export default router;
