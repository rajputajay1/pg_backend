import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id, email, role = 'admin') => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ==================== SUPER ADMIN LOGIN ====================

// @desc    Super Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return ApiResponse.error(res, 'Please provide email and password', 400);
  }

  // Check against environment variables for super admin
  const adminEmail = process.env.ADMIN_EMAIL || 'ajayrajput9306@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Rajput@9306';

  if (email !== adminEmail || password !== adminPassword) {
    return ApiResponse.error(res, 'Invalid admin credentials', 401);
  }

  // Generate admin token
  const token = generateToken('admin', email, 'admin');

  ApiResponse.success(res, {
    token,
    user: {
      id: 'admin',
      email,
      role: 'admin',
      name: 'Super Admin'
    }
  }, 'Admin login successful');
});

// @desc    Verify Token
// @route   GET /api/auth/verify
// @access  Private
export const verifyToken = asyncHandler(async (req, res) => {
  ApiResponse.success(res, {
    valid: true,
    user: req.user
  }, 'Token is valid');
});
