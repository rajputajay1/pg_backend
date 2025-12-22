import express from 'express';
import * as staffController from '../controllers/staffController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, staffController.getAllStaff);
router.get('/property/:propertyId', protect, staffController.getStaffByProperty);
router.get('/:id', protect, staffController.getStaffById);
router.post('/', protect, staffController.createStaff);
router.put('/:id', protect, staffController.updateStaff);
router.delete('/:id', protect, staffController.deleteStaff);
router.patch('/:id/permissions', protect, staffController.updateStaffPermissions);

export default router;
