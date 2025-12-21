import express from 'express';
import * as controller from '../controllers/financeController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, controller.getAllFinance);
router.get('/stats', auth, controller.getFinanceStats);
router.post('/generate-rent', auth, controller.bulkGenerateRent);
router.post('/generate-salary', auth, controller.bulkGenerateSalary);
router.post('/', auth, controller.createFinance);
router.put('/:id', auth, controller.updateFinance);
router.delete('/:id', auth, controller.deleteFinance);

export default router;
