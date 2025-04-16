const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Plan description is required']
    },
    minimumAmount: {
      type: Number,
      required: [true, 'Minimum investment amount is required'],
      min: [10, 'Minimum amount cannot be less than $10']
    },
    maximumAmount: {
      type: Number,
      required: [true, 'Maximum investment amount is required']
    },
    returns: {
      type: Number,
      required: [true, 'Return percentage is required'],
      min: [1, 'Return percentage must be at least 1%']
    },
    duration: {
      type: Number,
      required: [true, 'Plan duration is required'],
      min: [1, 'Duration must be at least 1 day']
    },
    features: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Initialize default plans if none exist
PlanSchema.statics.initDefaultPlans = async function() {
  const count = await this.countDocuments();
  if (count === 0) {
    const defaultPlans = [
      {
        name: 'Bronze',
        description: 'Entry-level investment plan with low risk and steady returns',
        minimumAmount: 100,
        maximumAmount: 999,
        returns: 5,
        duration: 30,
        features: ['24/7 Support', 'Referral Bonus'],
        displayOrder: 1
      },
      {
        name: 'Silver',
        description: 'Medium-tier investment plan with balanced risk and returns',
        minimumAmount: 1000,
        maximumAmount: 4999,
        returns: 8,
        duration: 30,
        features: ['24/7 Support', 'Referral Bonus', 'Weekly Reports'],
        displayOrder: 2
      },
      {
        name: 'Gold',
        description: 'Premium investment plan with attractive returns',
        minimumAmount: 5000,
        maximumAmount: 9999,
        returns: 12,
        duration: 30,
        features: ['24/7 Support', 'Referral Bonus', 'Weekly Reports', 'Priority Support'],
        displayOrder: 3
      },
      {
        name: 'Platinum',
        description: 'High-tier investment plan with significant returns',
        minimumAmount: 10000,
        maximumAmount: 49999,
        returns: 15,
        duration: 30,
        features: [
          '24/7 Support',
          'Referral Bonus',
          'Weekly Reports',
          'Priority Support',
          'Investment Consultation'
        ],
        displayOrder: 4
      },
      {
        name: 'Diamond',
        description: 'Elite investment plan with exceptional returns',
        minimumAmount: 50000,
        maximumAmount: 250000,
        returns: 20,
        duration: 30,
        features: [
          '24/7 Support',
          'Referral Bonus',
          'Weekly Reports',
          'Priority Support',
          'Investment Consultation',
          'VIP Services'
        ],
        displayOrder: 5
      }
    ];

    await this.insertMany(defaultPlans);
  }
};

module.exports = mongoose.model('Plan', PlanSchema); 