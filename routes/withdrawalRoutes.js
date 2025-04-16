const express = require('express');
const router = express.Router();
const { 
  createWithdrawal, 
  getWithdrawals, 
  getWithdrawal, 
  cancelWithdrawal,
  getWithdrawalStats
} = require('../controllers/withdrawalController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Get withdrawal stats
router.route('/stats').get(getWithdrawalStats);

// Get all withdrawals and create new withdrawal
router.route('/')
  .get(getWithdrawals)
  .post(createWithdrawal);

// Get or cancel specific withdrawal by ID
router.route('/:id')
  .get(getWithdrawal)
  .delete(cancelWithdrawal);

module.exports = router; 