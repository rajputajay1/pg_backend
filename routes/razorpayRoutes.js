import express from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentDetails,
} from '../controllers/razorpayController.js';

const router = express.Router();

// Public routes
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

// Protected routes (optional - add auth middleware if needed)
router.get('/payment/:paymentId', getPaymentDetails);

export default router;
