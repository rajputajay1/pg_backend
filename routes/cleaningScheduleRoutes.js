import express from 'express';
import * as controller from '../controllers/cleaningScheduleController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllCleaningSchedules);
router.get('/:id', auth, controller.getCleaningScheduleById);
router.post('/', auth, controller.createCleaningSchedule);
router.put('/:id', auth, controller.updateCleaningSchedule);
router.delete('/:id', auth, controller.deleteCleaningSchedule);

export default router;
