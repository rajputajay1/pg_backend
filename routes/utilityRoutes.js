import express from 'express';
import * as controller from '../controllers/utilityController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllUtilities);
router.get('/:id', auth, controller.getUtilityById);
router.post('/', auth, controller.createUtility);
router.put('/:id', auth, controller.updateUtility);
router.delete('/:id', auth, controller.deleteUtility);

export default router;
