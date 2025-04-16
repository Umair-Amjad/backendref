const validator = require('validator');
const isEmpty = require('./is-empty');

/**
 * Validates withdrawal input data
 * @param {Object} data - Withdrawal data to validate
 * @returns {Object} Errors object and isValid boolean
 */
function validateWithdrawalInput(data) {
  const errors = {};
  
  // Normalize data fields to empty string if they're null/undefined
  data.amount = !isEmpty(data.amount) ? data.amount : '';
  data.method = !isEmpty(data.method) ? data.method : '';
  data.paymentDetails = !isEmpty(data.paymentDetails) ? data.paymentDetails : {};

  // Validate amount
  if (isEmpty(data.amount)) {
    errors.amount = 'Withdrawal amount is required';
  } else if (isNaN(data.amount) || Number(data.amount) <= 0) {
    errors.amount = 'Amount must be a positive number';
  }

  // Validate payment method
  if (isEmpty(data.method)) {
    errors.method = 'Payment method is required';
  } else if (!['JazzCash', 'EasyPaisa', 'USDT', 'BankTransfer'].includes(data.method)) {
    errors.method = 'Invalid payment method';
  }

  // Validate payment details based on method
  if (data.method === 'JazzCash' || data.method === 'EasyPaisa') {
    if (isEmpty(data.paymentDetails.phoneNumber)) {
      errors.paymentDetails = 'Phone number is required';
    } else if (!validator.isMobilePhone(data.paymentDetails.phoneNumber, 'any')) {
      errors.paymentDetails = 'Please enter a valid phone number';
    }
  } else if (data.method === 'USDT') {
    if (isEmpty(data.paymentDetails.walletAddress)) {
      errors.paymentDetails = 'Wallet address is required';
    }
    
    if (isEmpty(data.paymentDetails.network)) {
      errors.paymentDetails = 'Network is required (TRC20, ERC20, etc.)';
    }
  } else if (data.method === 'BankTransfer') {
    if (isEmpty(data.paymentDetails.bankName)) {
      errors.paymentDetails = 'Bank name is required';
    }
    
    if (isEmpty(data.paymentDetails.accountNumber)) {
      errors.paymentDetails = 'Account number is required';
    }
    
    if (isEmpty(data.paymentDetails.accountName)) {
      errors.paymentDetails = 'Account holder name is required';
    }
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
}

module.exports = validateWithdrawalInput; 