import express from 'express';
import * as controller from '../controllers/chatController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllChats);
router.get('/:id', auth, controller.getChatById);
router.post('/', auth, controller.createChat);
router.delete('/:id', auth, controller.deleteChat);

export default router;
