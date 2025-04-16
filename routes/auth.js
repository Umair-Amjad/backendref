const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  authController.register
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

// @route   GET api/auth/verify
// @desc    Verify user's token and get user data
// @access  Private
router.get('/verify', protect, authController.verifyUser);

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post(
  '/forgot-password',
  [check('email', 'Please include a valid email').isEmail()],
  authController.forgotPassword
);

// @route   POST api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post(
  '/reset-password/:token',
  [check('password', 'Password must be at least 6 characters').isLength({ min: 6 })],
  authController.resetPassword
);

// @route   POST api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router; 