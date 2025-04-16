const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
    console.log('Token received:', token);
  }
  
  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }
  
  try {
    // Verify token
    console.log('Verifying token with JWT_SECRET');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Get user from the token
    const user = await User.findById(decoded.id);
    console.log('User found?', !!user);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found with this id' 
      });
    }
    
    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been disabled. Please contact support.' 
      });
    }
    
    // Check if user is verified
    /*
    if (!user.isVerified) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please verify your email address before accessing this route' 
      });
    }
    */
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }
};

exports.admin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required for this route' 
    });
  }
  next();
}; 