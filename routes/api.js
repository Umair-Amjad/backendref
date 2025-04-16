const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./user');
const investmentRoutes = require('./investment');
const withdrawalRoutes = require('./withdrawal');
const auth = require('../middleware/auth');

// Auth routes (public)
router.use('/auth', authRoutes);

// Protected routes
router.use('/user', auth, userRoutes);
router.use('/investments', auth, investmentRoutes);
router.use('/withdrawals', auth, withdrawalRoutes);

module.exports = router; 