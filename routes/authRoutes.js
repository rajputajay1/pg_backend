import express from 'express';
import { adminLogin, verifyToken } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ==================== SUPER ADMIN ROUTES ====================

// Super Admin Login
router.post('/admin/login', adminLogin);

// Verify Token (Protected)
router.get('/verify', auth, verifyToken);

export default router;
