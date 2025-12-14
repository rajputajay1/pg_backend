import express from 'express';
import * as controller from '../controllers/noticeController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllNotices);
router.get('/:id', auth, controller.getNoticeById);
router.post('/', auth, controller.createNotice);
router.put('/:id', auth, controller.updateNotice);
router.delete('/:id', auth, controller.deleteNotice);

export default router;
