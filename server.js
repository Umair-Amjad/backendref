const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

// Import DB connection
const { connectDB } = require('./config/db');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const investmentRoutes = require('./routes/investment');
const referralRoutes = require('./routes/referral');
const withdrawalRoutes = require('./routes/withdrawal');
const adminRoutes = require('./routes/admin');

// Import Models and Services
const Plan = require('./models/Plan');
const { initCronJobs } = require('./services/cronService');

// Initialize Express app
const app = express();

// App Configs
const PORT = process.env.PORT || 8000;

// Global Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(morgan('dev'));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/admin', adminRoutes);

// Root Route
app.get('/', (req, res) => {
  res.status(200).send('📡 Investment Platform API is Live and Running!');
});

// Start Server with DB Connection
const startServer = async () => {
  try {
    await connectDB();

    // Initialize investment plans (only once)
    try {
      await Plan.initDefaultPlans();
      console.log('📦 Default investment plans checked/created');
    } catch (initErr) {
      console.warn('⚠️ Plan Initialization Error:', initErr.message);
    }

    // Start Cron Jobs
    initCronJobs();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ Server failed to start:', err.message);
    process.exit(1); // Optional: stop process on failure
  }
};

startServer();
