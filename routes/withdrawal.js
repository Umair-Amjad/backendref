const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const withdrawalController = require('../controllers/withdrawal');
const { check } = require('express-validator');

// Routes
// @route   GET api/withdrawals/balance
// @desc    Get user's withdrawable balance
// @access  Private
router.get('/balance', protect, withdrawalController.getWithdrawableBalance);

// @route   POST api/withdrawals
// @desc    Request a withdrawal
// @access  Private
router.post('/', protect, withdrawalController.requestWithdrawal);

// @route   GET api/withdrawals
// @desc    Get all user withdrawals
// @access  Private
router.get('/', protect, withdrawalController.getUserWithdrawals);

// @route   GET api/withdrawals/:id
// @desc    Get withdrawal by ID
// @access  Private
router.get('/:id', protect, withdrawalController.getWithdrawalById);

module.exports = router; 