const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WithdrawalSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1, 'Withdrawal amount must be at least 1']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['jazzcash', 'easypaisa', 'crypto', 'bank', 'paypal', 'JazzCash', 'EasyPaisa', 'USDT', 'BankTransfer'],
    required: true
  },
  withdrawalType: {
    type: String,
    enum: ['main', 'referral', 'combined'],
    default: 'main'
  },
  paymentDetails: {
    type: Object,
    required: true,
    validate: {
      validator: function(details) {
        // Validation based on payment method
        if (this.method === 'JazzCash' || this.method === 'jazzcash') {
          return details.number || details.phoneNumber;
        } else if (this.method === 'EasyPaisa' || this.method === 'easypaisa') {
          return details.number || details.phoneNumber;
        } else if (this.method === 'USDT' || this.method === 'crypto') {
          return details.address || details.walletAddress;
        } else if (this.method === 'BankTransfer' || this.method === 'bank') {
          return details.bankName && (details.accountNumber || details.accountNo) && details.accountName;
        } else if (this.method === 'paypal') {
          return details.email;
        }
        return false;
      },
      message: 'Required payment details missing for the selected payment method'
    }
  },
  reason: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries by user
WithdrawalSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Withdrawal', WithdrawalSchema); 