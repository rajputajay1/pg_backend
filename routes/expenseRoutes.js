import express from 'express';
import * as controller from '../controllers/expenseController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllExpenses);
router.get('/:id', auth, controller.getExpenseById);
router.post('/', auth, controller.createExpense);
router.put('/:id', auth, controller.updateExpense);
router.delete('/:id', auth, controller.deleteExpense);

export default router;
