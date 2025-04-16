const Activity = require('../models/Activity');

// @desc    Log user activity
// @route   POST /api/user/activity
// @access  Private
exports.logActivity = async (req, res) => {
  try {
    const { activities } = req.body;
    
    if (!activities || !Array.isArray(activities)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of activities'
      });
    }
    
    // Add user ID and IP/user agent to each activity
    const processedActivities = activities.map(activity => ({
      ...activity,
      user: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }));
    
    await Activity.insertMany(processedActivities);
    
    res.status(201).json({
      success: true,
      message: 'Activities logged successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user activities (admin)
// @route   GET /api/admin/activities
// @access  Private/Admin
exports.getActivities = async (req, res) => {
  try {
    const { 
      userId, 
      type, 
      page, 
      startDate, 
      endDate, 
      limit = 50, 
      skip = 0 
    } = req.query;
    
    const query = {};
    
    // Filter by user if provided
    if (userId) {
      query.user = userId;
    }
    
    // Filter by activity type
    if (type) {
      query.type = type;
    }
    
    // Filter by page
    if (page) {
      query.page = page;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Get total count for pagination
    const total = await Activity.countDocuments(query);
    
    // Get activities with pagination
    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('user', 'name email');
    
    // Get page view metrics
    const pageViewMetrics = await Activity.aggregate([
      { $match: { type: 'page_view' } },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get active users
    const activeUsers = await Activity.aggregate([
      { $match: { timestamp: { $gte: new Date(new Date() - 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$user', activityCount: { $sum: 1 } } },
      { $sort: { activityCount: -1 } },
      { $limit: 10 }
    ]);
    
    // Populate user details for active users
    const populatedActiveUsers = await Activity.populate(activeUsers, {
      path: '_id',
      select: 'name email',
      model: 'User'
    });
    
    res.status(200).json({
      success: true,
      data: {
        activities,
        meta: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          pageViewMetrics,
          activeUsers: populatedActiveUsers.map(user => ({
            user: user._id,
            activityCount: user.activityCount
          }))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 