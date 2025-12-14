import express from 'express';
import * as controller from '../controllers/inventoryController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllInventory);
router.get('/:id', auth, controller.getInventoryById);
router.post('/', auth, controller.createInventory);
router.put('/:id', auth, controller.updateInventory);
router.delete('/:id', auth, controller.deleteInventory);

export default router;
