import express from 'express';
import * as tenantController from '../controllers/tenantController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, tenantController.getAllTenants);
router.get('/property/:propertyId', auth, tenantController.getTenantsByProperty);
router.get('/:id', auth, tenantController.getTenantById);
router.post('/', auth, tenantController.createTenant);
router.put('/:id', auth, tenantController.updateTenant);
router.delete('/:id', auth, tenantController.deleteTenant);
router.patch('/:id/payment-status', auth, tenantController.updatePaymentStatus);

export default router;
