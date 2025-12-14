import express from 'express';
import * as controller from '../controllers/complaintController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllComplaints);
router.get('/:id', auth, controller.getComplaintById);
router.post('/', auth, controller.createComplaint);
router.put('/:id', auth, controller.updateComplaint);
router.delete('/:id', auth, controller.deleteComplaint);

export default router;
