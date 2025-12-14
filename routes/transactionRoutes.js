import express from 'express';
import {
  getAllTransactions,
  getTransactionById,
  getTransactionsByOwner,
  createTransaction,
  updateTransactionStatus,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  createRazorpayOrder,
  verifyRazorpayPayment
} from '../controllers/transactionController.js';
import auth from '../middleware/auth.js';
import { validateTransactionCreate } from '../validation/transactionValidation.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// Public routes for payment flow
router.post('/', validateTransactionCreate, validate, createTransaction);
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify-payment', verifyRazorpayPayment);

// Protected routes
router.get('/', auth, getAllTransactions);
router.get('/stats/summary', auth, getTransactionStats);
router.get('/owner/:ownerId', auth, getTransactionsByOwner);
router.get('/:id', auth, getTransactionById);
router.patch('/:id/status', auth, updateTransactionStatus);
router.put('/:id', auth, updateTransaction);
router.delete('/:id', auth, deleteTransaction);

export default router;

