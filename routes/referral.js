const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Import controllers
const { 
  getUserReferrals,
  getReferralEarnings
} = require('../controllers/referral');

// Routes
router.get('/', protect, getUserReferrals);
router.get('/earnings', protect, getReferralEarnings);

module.exports = router; 