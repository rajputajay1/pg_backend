import express from 'express';
import {
  getAllProperties,
  getPropertiesByOwner,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  updateRoomOccupancy
} from '../controllers/propertyController.js';
import auth from '../middleware/auth.js';
import { validatePropertyCreate, validatePropertyUpdate } from '../validation/propertyValidation.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// All routes are protected
router.get('/', auth, getAllProperties);
router.get('/owner/:ownerId', auth, getPropertiesByOwner);
router.get('/:id', auth, getPropertyById);
router.post('/', auth, validatePropertyCreate, validate, createProperty);
router.put('/:id', auth, validatePropertyUpdate, validate, updateProperty);
router.delete('/:id', auth, deleteProperty);
router.patch('/:id/status', auth, updatePropertyStatus);
router.patch('/:id/occupancy', auth, updateRoomOccupancy);

export default router;
