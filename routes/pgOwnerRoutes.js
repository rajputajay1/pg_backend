import express from 'express';
import {
  initiateRegistration,
  completeRegistration,
  checkEmailAvailability,
  login,
  changePassword,
  getAllPgOwners,
  getPgOwnerById,
  updatePgOwner,
  deletePgOwner,
  toggleOwnerStatus,
  getDashboardStats,
  getOwnerDashboardStats
} from '../controllers/pgOwnerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// PG Owner Registration
router.post('/register/initiate', initiateRegistration);
router.post('/register/complete', completeRegistration);
router.post('/check-email', checkEmailAvailability);

// PG Owner Login
router.post('/login', login);

// ==================== PG OWNER PROTECTED ROUTES ====================

// Owner Dashboard Stats
router.get('/dashboard-stats', protect, getOwnerDashboardStats);

// Change Password (Protected)
router.post('/change-password', protect, changePassword);

// ==================== SUPER ADMIN ROUTES (Protected) ====================

// Get all PG Owners
router.get('/', protect, getAllPgOwners);

// Get Dashboard Stats
router.get('/stats/dashboard', protect, getDashboardStats);

// Get PG Owner by ID
router.get('/:id', protect, getPgOwnerById);

// Update PG Owner
router.put('/:id', protect, updatePgOwner);

// Delete PG Owner
router.delete('/:id', protect, deletePgOwner);

// Toggle PG Owner Status
router.patch('/:id/status', protect, toggleOwnerStatus);

export default router;
