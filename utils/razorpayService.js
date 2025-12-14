import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Lazy initialization of Razorpay instance
let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not found in environment variables');
      console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not Set');
      console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not Set');
      throw new Error('Razorpay credentials are required. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file');
    }
    
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    console.log('✅ Razorpay initialized successfully');
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in rupees
 * @param {string} currency - Currency code (default: INR)
 * @param {object} notes - Additional notes
 * @returns {Promise<object>} Order details
 */
export const createOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    const razorpay = getRazorpayInstance();
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes,
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Verification result
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_SECRET not found');
    }
    
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Payment signature verification failed:', error);
    return false;
  }
};

/**
 * Fetch payment details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<object>} Payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  createOrder,
  verifyPaymentSignature,
  getPaymentDetails,
};
