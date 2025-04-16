// Investment plans configuration
const investmentPlans = [
  {
    name: 'Bronze',
    minAmount: 3,
    maxAmount: 10,
    roi: 5, // 5% ROI
    duration: 1 // 1 day (for demo purposes, in real app this might be longer)
  },
  {
    name: 'Silver',
    minAmount: 11,
    maxAmount: 50,
    roi: 7, // 7% ROI
    duration: 1 // 1 day
  },
  {
    name: 'Gold',
    minAmount: 51,
    maxAmount: 200,
    roi: 10, // 10% ROI
    duration: 2 // 2 days
  },
  {
    name: 'Platinum',
    minAmount: 201,
    maxAmount: 500,
    roi: 15, // 15% ROI
    duration: 3 // 3 days
  },
  {
    name: 'Diamond',
    minAmount: 501,
    maxAmount: 1000,
    roi: 20, // 20% ROI
    duration: 5 // 5 days
  },
  {
    name: 'Elite',
    minAmount: 1001,
    maxAmount: 50000,
    roi: 25, // 25% ROI
    duration: 1 // 7 days
  }
];

const getPlanByAmount = (amount) => {
  return investmentPlans.find(
    plan => amount >= plan.minAmount && amount <= plan.maxAmount
  );
};

module.exports = {
  investmentPlans,
  getPlanByAmount
}; 