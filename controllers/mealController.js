import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Meal from '../models/mealModel.js';

// @desc    Get all Meals
// @route   GET /api/meals
// @access  Private
export const getAllMeals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, isActive, propertyId } = req.query;

  const query = {};
  
  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  if (search) query.name = { $regex: search, $options: 'i' };
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (propertyId) query.property = propertyId;

  const skip = (page - 1) * limit;
  const meals = await Meal.find(query)
    .populate('property', 'name')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Meal.countDocuments(query);
  ApiResponse.paginated(res, meals, { page: parseInt(page), limit: parseInt(limit), total }, 'Meals fetched successfully');
});

// @desc    Get Meal Stats
// @route   GET /api/meals/stats
// @access  Private
export const getMealStats = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const [total, available, vegetarian, nonVegetarian] = await Promise.all([
    Meal.countDocuments(query),
    Meal.countDocuments({ ...query, isActive: true }),
    Meal.countDocuments({ ...query, menuType: 'Vegetarian' }),
    Meal.countDocuments({ ...query, menuType: 'Non-Vegetarian' }),
  ]);

  ApiResponse.success(res, {
    total,
    available,
    vegetarian,
    nonVegetarian,
    featured: 0 // Mock feature
  }, 'Meal stats fetched successfully');
});

// @desc    Get Meal by ID
// @route   GET /api/meals/:id
// @access  Private
export const getMealById = asyncHandler(async (req, res) => {
  const meal = await Meal.findById(req.params.id).populate('property');
  if (!meal) return ApiResponse.error(res, 'Meal not found', 404);
  ApiResponse.success(res, meal, 'Meal fetched successfully');
});

// @desc    Create Meal
// @route   POST /api/meals
// @access  Private
export const createMeal = asyncHandler(async (req, res) => {
  // Security: Force owner ID for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    req.body.owner = req.user._id;
  }
  const meal = await Meal.create(req.body);
  await meal.populate('property');
  ApiResponse.success(res, meal, 'Meal created successfully', 201);
});

// @desc    Update Meal
// @route   PUT /api/meals/:id
// @access  Private
export const updateMeal = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const meal = await Meal.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
  if (!meal) return ApiResponse.error(res, 'Meal not found or unauthorized', 404);
  ApiResponse.success(res, meal, 'Meal updated successfully');
});

// @desc    Delete Meal
// @route   DELETE /api/meals/:id
// @access  Private
export const deleteMeal = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const meal = await Meal.findOneAndDelete(query);
  if (!meal) return ApiResponse.error(res, 'Meal not found or unauthorized', 404);
  ApiResponse.success(res, null, 'Meal deleted successfully');
});
