import express from 'express';
import * as controller from '../controllers/menuController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, controller.getMenu);
router.post('/', auth, controller.updateMenu);

export default router;
