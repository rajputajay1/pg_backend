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
  getDashboardStats
} from '../controllers/pgOwnerController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// PG Owner Registration
router.post('/register/initiate', initiateRegistration);
router.post('/register/complete', completeRegistration);
router.post('/check-email', checkEmailAvailability);

// PG Owner Login
router.post('/login', login);

// ==================== PG OWNER PROTECTED ROUTES ====================

// Change Password (Protected)
router.post('/change-password', auth, changePassword);

// ==================== SUPER ADMIN ROUTES (Protected) ====================

// Get all PG Owners
router.get('/', auth, getAllPgOwners);

// Get Dashboard Stats
router.get('/stats/dashboard', auth, getDashboardStats);

// Get PG Owner by ID
router.get('/:id', auth, getPgOwnerById);

// Update PG Owner
router.put('/:id', auth, updatePgOwner);

// Delete PG Owner
router.delete('/:id', auth, deletePgOwner);

// Toggle PG Owner Status
router.patch('/:id/status', auth, toggleOwnerStatus);

export default router;
