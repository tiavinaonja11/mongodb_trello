import express from 'express';
import {
  createTicket,
  getProjectTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
} from '../controllers/ticketController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/project/:projectId', createTicket);
router.get('/project/:projectId', getProjectTickets);
router.get('/:ticketId', getTicketById);
router.put('/:ticketId', updateTicket);
router.delete('/:ticketId', deleteTicket);

export default router;
