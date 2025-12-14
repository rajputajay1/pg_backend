import express from 'express';
import * as controller from '../controllers/securityDepositController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllSecurityDeposits);
router.get('/:id', auth, controller.getSecurityDepositById);
router.post('/', auth, controller.createSecurityDeposit);
router.put('/:id', auth, controller.updateSecurityDeposit);
router.delete('/:id', auth, controller.deleteSecurityDeposit);

export default router;
