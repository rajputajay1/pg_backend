import express from 'express';
import * as roomController from '../controllers/roomController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, roomController.getAllRooms);
router.get('/stats', auth, roomController.getRoomStats); // Place before /:id
router.post('/bulk', auth, roomController.bulkCreateRooms);
router.get('/property/:propertyId', auth, roomController.getRoomsByProperty);
router.get('/available/:propertyId', auth, roomController.getAvailableRooms);
router.get('/:id', auth, roomController.getRoomById);
router.post('/', auth, roomController.createRoom);
router.put('/:id', auth, roomController.updateRoom);
router.delete('/:id', auth, roomController.deleteRoom);
router.patch('/:id/status', auth, roomController.updateRoomStatus);

export default router;
