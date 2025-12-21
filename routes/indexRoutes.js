import express from 'express';
import authRoutes from './authRoutes.js';
import pgOwnerRoutes from './pgOwnerRoutes.js';
import propertyRoutes from './propertyRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import planRoutes from './planRoutes.js';
import tenantRoutes from './tenantRoutes.js';
import staffRoutes from './staffRoutes.js';
import roomRoutes from './roomRoutes.js';
import furnitureRoutes from './furnitureRoutes.js';
import mealRoutes from './mealRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import complaintRoutes from './complaintRoutes.js';
import noticeRoutes from './noticeRoutes.js';
import chatRoutes from './chatRoutes.js';
import cleaningScheduleRoutes from './cleaningScheduleRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import securityDepositRoutes from './securityDepositRoutes.js';
import utilityRoutes from './utilityRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import razorpayRoutes from './razorpayRoutes.js';
import financeRoutes from './financeRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/pg-owners', pgOwnerRoutes);
router.use('/properties', propertyRoutes);
router.use('/transactions', transactionRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/plans', planRoutes);
router.use('/tenants', tenantRoutes);
router.use('/students', tenantRoutes); // Alias for frontend consistency
router.use('/staff', staffRoutes);
router.use('/rooms', roomRoutes);
router.use('/furniture', furnitureRoutes);
router.use('/meals', mealRoutes);
router.use('/expenses', expenseRoutes);
router.use('/payments', paymentRoutes);
router.use('/complaints', complaintRoutes);
router.use('/notices', noticeRoutes);
router.use('/chats', chatRoutes);
router.use('/cleaning-schedules', cleaningScheduleRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/security-deposits', securityDepositRoutes);
router.use('/utilities', utilityRoutes);
router.use('/settings', settingsRoutes);
router.use('/razorpay', razorpayRoutes);
router.use('/finance', financeRoutes);

export default router;
