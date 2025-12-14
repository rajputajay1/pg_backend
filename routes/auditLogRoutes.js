import express from 'express';
import {
  getAllAuditLogs,
  getAuditLogById,
  createAuditLog,
  getAuditLogsByResource,
  getAuditLogsByUser,
  deleteAuditLog,
  clearOldLogs,
  getAuditLogStats
} from '../controllers/auditLogController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (Super Admin)
router.get('/', auth, getAllAuditLogs);
router.get('/stats/summary', auth, getAuditLogStats);
router.get('/resource/:resourceId', auth, getAuditLogsByResource);
router.get('/user/:userId', auth, getAuditLogsByUser);
router.get('/:id', auth, getAuditLogById);
router.post('/', auth, createAuditLog);
router.delete('/:id', auth, deleteAuditLog);
router.delete('/cleanup/:days', auth, clearOldLogs);

export default router;
