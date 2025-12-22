import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Payment from '../models/paymentModel.js';
import Expense from '../models/expenseModel.js';
import Tenant from '../models/tenantModel.js';
import Staff from '../models/staffModel.js';
import { sendRentPaymentConfirmationEmail, sendSalaryCreditEmail } from '../utils/emailService.js';

// Helper to sync tenant payment status based on all records
export const syncTenantPaymentStatus = async (tenantId) => {
    if (!tenantId) return;
    
    // 1. Fetch Tenant data
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return;

    // 2. Find all rent/security deposit payments for this tenant in Finance
    const payments = await Payment.find({ 
        tenant: tenantId, 
        category: { $in: ['Rent', 'Security Deposit'] }
    });
    
    // Check if security deposit is paid in history
    const depositPayments = payments.filter(p => p.category === 'Security Deposit');
    const depositIsPaid = depositPayments.length > 0 && depositPayments.every(p => p.status.toLowerCase() === 'paid');
    
    if (depositIsPaid && tenant.depositStatus !== 'Paid' && tenant.securityDeposit > 0) {
        await Tenant.findByIdAndUpdate(tenantId, { depositStatus: 'Paid' });
        tenant.depositStatus = 'Paid'; 
    }

    const statuses = payments.map(p => p.status.toLowerCase());
    
    let finalStatus = 'Paid';
    
    // Check local field for override
    if (tenant.securityDeposit > 0 && tenant.depositStatus === 'Pending') {
        finalStatus = 'Pending';
    }

    if (statuses.includes('overdue')) {
        finalStatus = 'Overdue';
    } else if (statuses.includes('pending')) {
        finalStatus = 'Pending';
    }
    
    // Update if status has changed
    if (tenant.paymentStatus !== finalStatus) {
        await Tenant.findByIdAndUpdate(tenantId, { paymentStatus: finalStatus });
    }
};

// @desc    Get all Finance records (Consolidated)
// @route   GET /api/finance
export const getAllFinance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, status, entityId, propertyId } = req.query;
  const skip = (page - 1) * limit;

  // Normalizing status if needed (Frontend sends 'Paid', Backend Model expects 'paid')
  const normalizedStatus = status ? status.toLowerCase() : undefined;

  let query = { owner: req.user.id };
  if (normalizedStatus) query.status = normalizedStatus;
  if (propertyId) query.property = propertyId;
  
  // For Rent/Deposits we use tenant, for Expenses/Salaries we might need staff
  // But we handle this below in the specific model queries to be precise.
  const commonQuery = { ...query };

  // Filter by category if 'type' is provided
  if (type) query.category = type;

  let records = [];
  let total = 0;

  if (type === 'Salary' || type === 'Expense') {
    // Look in Expense model
    const expenseQuery = { ...commonQuery };
    if (type === 'Salary') {
        expenseQuery.category = 'Staff Salary';
        if (entityId) expenseQuery.staff = entityId;
    } else {
        expenseQuery.category = { $ne: 'Staff Salary' };
    }

    records = await Expense.find(expenseQuery)
      .populate('staff property')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    total = await Expense.countDocuments(expenseQuery);
  } else {
    // Rent, Deposit, Utility, etc. in Payment model
    const paymentQuery = { ...commonQuery };
    if (entityId) paymentQuery.tenant = entityId;
    if (type) paymentQuery.category = type;

    records = await Payment.find(paymentQuery)
      .populate('tenant property')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    total = await Payment.countDocuments(paymentQuery);
  }

  const mappedRecords = records.map(record => {
    const obj = record.toObject();
    const isSalary = type === 'Salary' || obj.category === 'Staff Salary';
    const isExpense = type === 'Expense' || (['Groceries', 'Electricity Bill', 'Water Bill', 'Gas Bill', 'Internet Bill', 'Repairs', 'Maintenance', 'Cleaning Supplies', 'Other'].includes(obj.category));
    
    const entityIdField = obj.staff || obj.tenant;
    
    return {
      id: obj._id,
      ...obj,
      entityId: entityIdField?._id || entityIdField || obj.entityId,
      entityName: (obj.staff?.name || obj.paidTo) || (obj.tenant?.name || obj.propertyName || 'N/A'),
      entityType: obj.staff ? 'Staff' : (obj.tenant ? 'Student' : 'Property'),
      category: obj.category === 'Staff Salary' ? 'Salary' : obj.category,
      amount: obj.amount,
      status: obj.status ? (obj.status.charAt(0).toUpperCase() + obj.status.slice(1)) : 'Paid',
    };
  });

  ApiResponse.paginated(res, mappedRecords, { page: parseInt(page), limit: parseInt(limit), total }, 'Finance records fetched successfully');
});

// @desc    Get Finance Stats
// @route   GET /api/finance/stats
export const getFinanceStats = asyncHandler(async (req, res) => {
    // Basic stats aggregation
    const payments = await Payment.find({ owner: req.user.id });
    
    let totalIncome = 0;
    let pendingIncome = 0;
    
    payments.forEach(p => {
        if (p.status === 'paid') totalIncome += p.amount;
        if (p.status === 'pending' || p.status === 'overdue') pendingIncome += p.amount;
    });

    const expenses = await Expense.find({ owner: req.user.id });
    let totalExpense = 0;
    let pendingExpense = 0;
    expenses.forEach(e => {
        if (e.status === 'paid') totalExpense += e.amount;
        if (e.status === 'pending' || e.status === 'overdue') pendingExpense += e.amount;
    });

    res.status(200).json({
        totalIncome,
        totalExpense,
        pendingIncome,
        pendingExpense
    });
});

// @desc    Bulk Generate Rent for all active students
// @route   POST /api/finance/generate-rent
export const bulkGenerateRent = asyncHandler(async (req, res) => {
    const { propertyId, month, year } = req.body;
    
    if (!month || !year) {
        return ApiResponse.error(res, 'Month and year are required', 400);
    }

    const query = { status: 'Active' };
    if (propertyId) query.property = propertyId;
    if (req.user.role === 'owner') query.owner = req.user.id;

    const tenants = await Tenant.find(query);
    
    if (tenants.length === 0) {
        return ApiResponse.error(res, 'No active tenants found to generate rent for.', 404);
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    const recordsCreated = [];

    for (const tenant of tenants) {
        // Check if rent already generated for this month
        const existing = await Payment.findOne({
            tenant: tenant._id,
            category: 'Rent',
            dueDate: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        if (!existing) {
            const newPayment = await Payment.create({
                owner: tenant.owner,
                property: tenant.property,
                tenant: tenant._id,
                amount: tenant.rentAmount || 0,
                category: 'Rent',
                status: 'pending',
                dueDate: new Date(year, month - 1, 10), // Default to 10th
                description: `Monthly Rent for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`
            });
            
            // Sync with Tenant status
            await syncTenantPaymentStatus(tenant._id);
            
            recordsCreated.push(newPayment);
        }
    }

    ApiResponse.success(res, { count: recordsCreated.length }, `${recordsCreated.length} rent records generated successfully.`);
});

// @desc    Bulk Generate Salary for all active staff
// @route   POST /api/finance/generate-salary
export const bulkGenerateSalary = asyncHandler(async (req, res) => {
    const { propertyId, month, year } = req.body;
    
    if (!month || !year) {
        return ApiResponse.error(res, 'Month and year are required', 400);
    }

    const query = { isActive: true };
    if (propertyId) query.property = propertyId;
    if (req.user.role === 'owner') query.owner = req.user.id;

    const staffList = await Staff.find(query);
    
    if (staffList.length === 0) {
        return ApiResponse.error(res, 'No active staff found to generate salary for.', 404);
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    const recordsCreated = [];

    for (const staff of staffList) {
        // Check if salary already generated for this month
        const existing = await Expense.findOne({
            staff: staff._id,
            category: 'Staff Salary',
            date: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        if (!existing) {
            const newSalary = await Expense.create({
                owner: staff.owner || req.user.id,
                property: staff.property,
                staff: staff._id,
                amount: staff.salary || 0,
                category: 'Staff Salary',
                status: 'pending',
                date: new Date(year, month - 1, 28), // Default to 28th for salary
                paidTo: staff.name,
                paymentMethod: 'Other',
                description: `Monthly Salary for ${staff.name} - ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
                addedBy: req.user.id
            });
            
            recordsCreated.push(newSalary);
        }
    }

    ApiResponse.success(res, { count: recordsCreated.length }, `${recordsCreated.length} salary records generated successfully.`);
});

// @desc    Create Finance record
export const createFinance = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (data.status) data.status = data.status.toLowerCase();
    
    // Ensure owner and addedBy are set
    if (!data.owner) data.owner = req.user.id;
    if (!data.addedBy) data.addedBy = req.user.id;

    // Auto-populate property if missing
    if (!data.property) {
        const owner = await PgOwner.findById(req.user.id);
        if (owner && owner.properties && owner.properties.length > 0) {
            data.property = owner.properties[0];
        }
    }

    let record;
    const isExpenseType = data.entityType === 'Staff' || ['Salary', 'Groceries', 'Electricity Bill', 'Water Bill', 'Gas Bill', 'Internet Bill', 'Repairs', 'Maintenance', 'Cleaning Supplies', 'Other Expense'].includes(data.category);

    if (isExpenseType) {
        if (data.entityId) data.staff = data.entityId;
        if (data.category === 'Salary') data.category = 'Staff Salary';
        if (!data.paidTo) data.paidTo = data.entityName || 'Staff';
        record = await Expense.create(data);
    } else {
        if (data.entityId) data.tenant = data.entityId;
        record = await Payment.create(data);
    }
    
    // Sync with Tenant if it's a Rent/Deposit payment
    if (record.tenant && ['Rent', 'Security Deposit'].includes(record.category)) {
        await syncTenantPaymentStatus(record.tenant);
    }

    await record.populate(record.staff ? 'staff property' : 'tenant property');

    // Trigger Email if Paid
    try {
        if (record.status && record.status.toLowerCase() === 'paid') {
            if (record.category === 'Rent' && record.tenant) {
                 await sendRentPaymentConfirmationEmail(record);
            } else if (['Staff Salary', 'Salary'].includes(record.category) && record.staff) {
                 await sendSalaryCreditEmail(record);
            }
        }
    } catch (emailErr) {
        console.error("Email sending failed for new record", emailErr);
    }

    const obj = record.toObject();
    const mapped = {
        id: obj._id,
        ...obj,
        entityId: (obj.tenant?._id || obj.tenant) || (obj.staff?._id || obj.staff) || obj.entityId,
        entityName: (obj.tenant?.name || obj.staff?.name) || obj.propertyName || obj.paidTo || 'N/A',
        entityType: obj.staff ? 'Staff' : (obj.tenant ? 'Student' : 'Property'),
        status: obj.status ? (obj.status.charAt(0).toUpperCase() + obj.status.slice(1)) : 'Paid',
    };

    ApiResponse.success(res, mapped, 'Finance record created successfully', 201);
});

// @desc    Update Finance record
export const updateFinance = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (data.status) data.status = data.status.toLowerCase();

    // Try to find in both models
    let record = await Payment.findById(req.params.id);
    let model = Payment;

    if (!record) {
        record = await Expense.findById(req.params.id);
        model = Expense;
    }

    if (!record) return ApiResponse.error(res, 'Record not found', 404);

    const updatedRecord = await model.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    
    // Sync with Tenant if it's a Rent/Deposit payment
    if (updatedRecord.tenant && ['Rent', 'Security Deposit'].includes(updatedRecord.category)) {
        await syncTenantPaymentStatus(updatedRecord.tenant);
    }

    await updatedRecord.populate(updatedRecord.staff ? 'staff property' : 'tenant property');

    // Trigger Email if Paid
    try {
        if (updatedRecord.status && updatedRecord.status.toLowerCase() === 'paid') {
            if (updatedRecord.category === 'Rent' && updatedRecord.tenant) {
                 await sendRentPaymentConfirmationEmail(updatedRecord);
            } else if (['Staff Salary', 'Salary'].includes(updatedRecord.category) && updatedRecord.staff) {
                 await sendSalaryCreditEmail(updatedRecord);
            }
        }
    } catch (emailErr) {
        console.error("Email sending failed for updated record", emailErr);
    }

    const obj = updatedRecord.toObject();
    const mapped = {
        id: obj._id,
        ...obj,
        entityId: (obj.tenant?._id || obj.tenant) || (obj.staff?._id || obj.staff) || obj.entityId,
        entityName: (obj.tenant?.name || obj.staff?.name) || obj.propertyName || obj.paidTo || 'N/A',
        entityType: obj.staff ? 'Staff' : (obj.tenant ? 'Student' : 'Property'),
        status: obj.status ? (obj.status.charAt(0).toUpperCase() + obj.status.slice(1)) : 'Paid',
    };

    ApiResponse.success(res, mapped, 'Finance record updated successfully');
});

// @desc    Delete Finance record
export const deleteFinance = asyncHandler(async (req, res) => {
    // Try to find and delete in both models
    let record = await Payment.findByIdAndDelete(req.params.id);
    let tenantId;
    
    if (record) {
        tenantId = record.tenant;
    } else {
        record = await Expense.findByIdAndDelete(req.params.id);
    }

    if (!record) return ApiResponse.error(res, 'Record not found', 404);

    if (tenantId && ['Rent', 'Security Deposit'].includes(record.category)) {
        await syncTenantPaymentStatus(tenantId);
    }

    ApiResponse.success(res, null, 'Finance record deleted successfully');
});
