import express from 'express';
import {
  getActivePlans,
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanStatus,
} from '../controllers/planController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getActivePlans);
router.get('/:id', getPlanById);

// Admin routes
router.get('/all/list', protect, adminOnly, getAllPlans);
router.post('/', protect, adminOnly, createPlan);
router.put('/:id', protect, adminOnly, updatePlan);
router.delete('/:id', protect, adminOnly, deletePlan);
router.patch('/:id/toggle', protect, adminOnly, togglePlanStatus);

export default router;
