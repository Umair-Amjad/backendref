const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const userController = require('../controllers/user');
const { check } = require('express-validator');
const { logActivity } = require('../controllers/activity');

// Routes
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.get('/referral', protect, userController.getReferralInfo);
router.get('/dashboard', protect, userController.getDashboardStats);

// @route   GET api/user/referral-earnings
// @desc    Get user's referral earnings
// @access  Private
router.get('/referral-earnings', protect, userController.getReferralEarnings);

// @route   GET api/user/earning-history
// @desc    Get user's earning history
// @access  Private
router.get('/earning-history', protect, userController.getEarningHistory);

// @route   GET api/user/referrals
// @desc    Get user's referral data
// @access  Private
router.get('/referrals', protect, userController.getReferrals);

// @route   GET api/user/referral-tree
// @desc    Get user's referral tree
// @access  Private
router.get('/referral-tree', protect, userController.getReferralTree);

// Activity logging route
router.post('/activity', protect, logActivity);

module.exports = router; 