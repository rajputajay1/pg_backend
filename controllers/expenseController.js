import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Expense from '../models/expenseModel.js';

// @desc    Get all Expenses
// @route   GET /api/expenses
// @access  Private
export const getAllExpenses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, propertyId, startDate, endDate } = req.query;

  const query = {};
  if (category) query.category = category;
  if (propertyId) query.property = propertyId;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const skip = (page - 1) * limit;
  const expenses = await Expense.find(query)
    .populate('property', 'name')
    .sort({ date: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Expense.countDocuments(query);
  ApiResponse.paginated(res, expenses, { page: parseInt(page), limit: parseInt(limit), total }, 'Expenses fetched successfully');
});

// @desc    Get Expense by ID
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id).populate('property');
  if (!expense) return ApiResponse.error(res, 'Expense not found', 404);
  ApiResponse.success(res, expense, 'Expense fetched successfully');
});

// @desc    Create Expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = asyncHandler(async (req, res) => {
  // Security: Force owner ID for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    req.body.owner = req.user._id;
  }
  const expense = await Expense.create(req.body);
  await expense.populate('property');
  ApiResponse.success(res, expense, 'Expense created successfully', 201);
});

// @desc    Update Expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const expense = await Expense.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
  if (!expense) return ApiResponse.error(res, 'Expense not found or unauthorized', 404);
  ApiResponse.success(res, expense, 'Expense updated successfully');
});

// @desc    Delete Expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const expense = await Expense.findOneAndDelete(query);
  if (!expense) return ApiResponse.error(res, 'Expense not found or unauthorized', 404);
  ApiResponse.success(res, null, 'Expense deleted successfully');
});
