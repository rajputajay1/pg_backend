import express from 'express';
import * as controller from '../controllers/settingsController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllSettings);
router.get('/:id', auth, controller.getSettingsById);
router.post('/', auth, controller.createSettings);
router.put('/:id', auth, controller.updateSettings);
router.delete('/:id', auth, controller.deleteSettings);

export default router;
