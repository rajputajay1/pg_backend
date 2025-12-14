import express from 'express';
import * as controller from '../controllers/paymentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllPayments);
router.get('/:id', auth, controller.getPaymentById);
router.post('/', auth, controller.createPayment);
router.put('/:id', auth, controller.updatePayment);
router.delete('/:id', auth, controller.deletePayment);

export default router;
