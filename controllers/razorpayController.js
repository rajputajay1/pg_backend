import Razorpay from 'razorpay';
import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create Razorpay order
 * @route   POST /api/razorpay/create-order
 * @access  Public
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;

  // Validate amount
  if (!amount || amount <= 0) {
    return ApiResponse.error(res, 'Invalid amount', 400);
  }

  // Create order options
  const options = {
    amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
    notes: notes || {},
  };

  try {
    // Create order via Razorpay API
    const order = await razorpay.orders.create(options);

    console.log('Razorpay order created:', order.id);

    ApiResponse.success(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    }, 'Order created successfully', 201);
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return ApiResponse.error(
      res,
      `Failed to create order: ${error.message}`,
      500
    );
  }
});

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/razorpay/verify-payment
 * @access  Public
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return ApiResponse.error(res, 'Missing payment verification data', 400);
  }

  try {
    // Create signature verification string
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Compare signatures
    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      console.log('Payment signature verified successfully');
      ApiResponse.success(res, {
        verified: true,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      }, 'Payment verified successfully');
    } else {
      console.error('Payment signature verification failed');
      return ApiResponse.error(res, 'Invalid payment signature', 400);
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return ApiResponse.error(
      res,
      `Payment verification failed: ${error.message}`,
      500
    );
  }
});

/**
 * @desc    Get payment details
 * @route   GET /api/razorpay/payment/:paymentId
 * @access  Private
 */
export const getPaymentDetails = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await razorpay.payments.fetch(paymentId);

    ApiResponse.success(res, payment, 'Payment details fetched successfully');
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    return ApiResponse.error(
      res,
      `Failed to fetch payment details: ${error.message}`,
      500
    );
  }
});

export default {
  createOrder,
  verifyPayment,
  getPaymentDetails,
};
