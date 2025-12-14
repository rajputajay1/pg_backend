import express from 'express';
import * as staffController from '../controllers/staffController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, staffController.getAllStaff);
router.get('/property/:propertyId', auth, staffController.getStaffByProperty);
router.get('/:id', auth, staffController.getStaffById);
router.post('/', auth, staffController.createStaff);
router.put('/:id', auth, staffController.updateStaff);
router.delete('/:id', auth, staffController.deleteStaff);
router.patch('/:id/permissions', auth, staffController.updateStaffPermissions);

export default router;
