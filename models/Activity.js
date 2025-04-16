const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['page_view', 'user_action', 'system_event'],
      required: true
    },
    page: String,
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: Object,
      default: {}
    },
    ipAddress: String,
    userAgent: String
  },
  {
    timestamps: true
  }
);

// Index for faster queries
ActivitySchema.index({ user: 1, timestamp: -1 });
ActivitySchema.index({ type: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', ActivitySchema); 