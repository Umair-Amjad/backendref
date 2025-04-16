const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Use environment variable or fallback for local dev
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fallbackDB';

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined!');
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);

    // Handle disconnects and errors
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
};
