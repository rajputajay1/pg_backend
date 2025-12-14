import { body } from 'express-validator';

export const validateTransactionCreate = [
  body('ownerName')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required'),
  
  body('ownerEmail')
    .trim()
    .notEmpty()
    .withMessage('Owner email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('ownerPhone')
    .trim()
    .notEmpty()
    .withMessage('Owner phone is required'),
  
  body('propertyName')
    .trim()
    .notEmpty()
    .withMessage('Property name is required'),
  
  body('type')
    .optional()
    .isIn(['credit', 'debit'])
    .withMessage('Invalid transaction type'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => value >= 0)
    .withMessage('Amount cannot be negative'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  
  body('method')
    .optional()
    .isIn(['Razorpay', 'Cash', 'Bank Transfer', 'UPI', 'Other'])
    .withMessage('Invalid payment method'),
  
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'overdue'])
    .withMessage('Invalid status'),
  
  body('owner')
    .optional()
    .isMongoId()
    .withMessage('Invalid owner ID'),
  
  body('planName')
    .optional()
    .isIn(['Starter', 'Professional', 'Enterprise'])
    .withMessage('Invalid plan name'),
  
  body('businessType')
    .optional()
    .isIn(['PG', 'Hostel', 'Rental', 'Other'])
    .withMessage('Invalid business type')
];
