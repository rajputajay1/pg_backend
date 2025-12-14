import express from 'express';
import * as controller from '../controllers/mealController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.get('/', auth, controller.getAllMeals);
router.get('/:id', auth, controller.getMealById);
router.post('/', auth, controller.createMeal);
router.put('/:id', auth, controller.updateMeal);
router.delete('/:id', auth, controller.deleteMeal);

export default router;
