const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');

// Import controllers
const { 
  getAllUsers,
  getAllInvestments,
  getAllWithdrawals,
  processWithdrawal,
  updateInvestmentStatus,
  getAdminDashboard,
  updateInvestmentPlan,
  verifyInvestmentPayment,
  toggleUserActiveStatus,
  getSystemSettings,
  updateSystemSettings
} = require('../controllers/admin');

const { getActivities } = require('../controllers/activity');

// All routes require admin access
router.use(protect, admin);

// Routes
router.get('/users', getAllUsers);
router.get('/investments', getAllInvestments);
router.get('/withdrawals', getAllWithdrawals);
router.put('/withdrawal/:id', processWithdrawal);
router.put('/investment/:id', updateInvestmentStatus);
router.put('/investment/verify/:id', verifyInvestmentPayment);
router.put('/user/toggle-active/:id', toggleUserActiveStatus);
router.get('/dashboard', getAdminDashboard);
router.put('/plans/:name', updateInvestmentPlan);
router.get('/activities', getActivities);
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

module.exports = router; 