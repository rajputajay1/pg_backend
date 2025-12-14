import { body } from 'express-validator';

export const validatePgOwnerCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('pgName')
    .trim()
    .notEmpty()
    .withMessage('PG name is required'),
  
  body('planName')
    .notEmpty()
    .withMessage('Plan name is required')
    .isIn(['Starter', 'Professional', 'Enterprise'])
    .withMessage('Invalid plan name'),
  
  body('planPrice')
    .notEmpty()
    .withMessage('Plan price is required')
    .isNumeric()
    .withMessage('Plan price must be a number')
    .custom((value) => value >= 0)
    .withMessage('Plan price cannot be negative'),
  
  body('businessType')
    .optional()
    .isIn(['PG', 'Hostel', 'Rental', 'Other'])
    .withMessage('Invalid business type'),
  
  body('noOfPgs')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of PGs must be at least 1'),
  
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'completed', 'failed'])
    .withMessage('Invalid payment status')
];

export const validatePgOwnerUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('planName')
    .optional()
    .isIn(['Starter', 'Professional', 'Enterprise'])
    .withMessage('Invalid plan name'),
  
  body('planPrice')
    .optional()
    .isNumeric()
    .withMessage('Plan price must be a number')
    .custom((value) => value >= 0)
    .withMessage('Plan price cannot be negative'),
  
  body('businessType')
    .optional()
    .isIn(['PG', 'Hostel', 'Rental', 'Other'])
    .withMessage('Invalid business type'),
  
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'completed', 'failed'])
    .withMessage('Invalid payment status'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];
