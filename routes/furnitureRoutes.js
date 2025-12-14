import express from 'express';
import * as controller from '../controllers/furnitureController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllFurniture);
router.get('/:id', auth, controller.getFurnitureById);
router.post('/', auth, controller.createFurniture);
router.put('/:id', auth, controller.updateFurniture);
router.delete('/:id', auth, controller.deleteFurniture);

export default router;
