const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for authentication
 * @param {string} id - User ID to encode in the token
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  // Make sure id is provided and convert to string if it's an ObjectId
  const userId = id ? id.toString() : null;
  
  if (!userId) {
    console.error('Error generating token: No user ID provided');
    throw new Error('Cannot generate token without user ID');
  }
  
  // Use environment variables with fallbacks
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables');
    throw new Error('JWT secret key is missing');
  }
  
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

module.exports = generateToken; 