/**
 * Checks if a value is empty
 * @param {*} value - Value to check
 * @returns {boolean} True if value is empty, false otherwise
 */
const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === 'object' && Object.keys(value).length === 0) ||
  (typeof value === 'string' && value.trim().length === 0);

module.exports = isEmpty; 