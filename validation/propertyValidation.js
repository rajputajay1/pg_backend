import { body } from 'express-validator';

export const validatePropertyCreate = [
  body('owner')
    .notEmpty()
    .withMessage('Owner reference is required')
    .isMongoId()
    .withMessage('Invalid owner ID'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Property name is required'),
  
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Property address is required'),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  
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
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Pending'])
    .withMessage('Invalid status'),
  
  body('totalRooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total rooms must be a non-negative integer'),
  
  body('occupiedRooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Occupied rooms must be a non-negative integer')
    .custom((value, { req }) => {
      if (req.body.totalRooms && value > req.body.totalRooms) {
        throw new Error('Occupied rooms cannot exceed total rooms');
      }
      return true;
    })
];

export const validatePropertyUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Property name cannot be empty'),
  
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Property address cannot be empty'),
  
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  
  body('state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('State cannot be empty'),
  
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
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Pending'])
    .withMessage('Invalid status'),
  
  body('totalRooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total rooms must be a non-negative integer'),
  
  body('occupiedRooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Occupied rooms must be a non-negative integer')
];
