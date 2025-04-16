const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const investmentController = require('../controllers/investment');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'transactions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'transactions'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Validate uploaded files
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // limit to 5MB
  }
});

// Routes
router.get('/plans', investmentController.getInvestmentPlans);
router.get('/user', protect, investmentController.getUserInvestments);
router.get('/:id', protect, investmentController.getInvestmentById);

// @route   POST api/investments
// @desc    Make a new investment
// @access  Private
router.post(
  '/',
  protect,
  upload.single('transactionScreenshot'),
  [
    check('amount', 'Amount is required and must be a number').isNumeric(),
    check('paymentMethod', 'Payment method is required').not().isEmpty()
  ],
  investmentController.createInvestment
);

module.exports = router; 