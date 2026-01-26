/**
 * Currency conversion utilities
 * Handles conversion between cents (integer) and decimal (display) values
 */

/**
 * Convert cents (integer) to decimal string
 * @param {number|null|undefined} cents - Integer cents value
 * @returns {string} Decimal string (e.g., "99.99") or empty string if null/undefined
 * @example centsToDecimal(9999) => "99.99"
 * @example centsToDecimal(100) => "1.00"
 * @example centsToDecimal(0) => "0.00"
 * @example centsToDecimal(null) => ""
 */
export function centsToDecimal(cents) {
  if (cents === null || cents === undefined || cents === '') {
    return '';
  }
  
  const numCents = Number(cents);
  if (isNaN(numCents)) {
    return '';
  }
  
  // Divide by 100 and format to 2 decimal places
  return (numCents / 100).toFixed(2);
}

/**
 * Convert decimal string to cents (integer)
 * @param {string|number|null|undefined} decimal - Decimal value
 * @returns {number|null} Integer cents value or null if empty/invalid
 * @example decimalToCents("99.99") => 9999
 * @example decimalToCents("1.00") => 100
 * @example decimalToCents("0") => 0
 * @example decimalToCents("") => null
 * @example decimalToCents(null) => null
 */
export function decimalToCents(decimal) {
  if (decimal === null || decimal === undefined || decimal === '') {
    return null;
  }
  
  const numDecimal = Number(decimal);
  if (isNaN(numDecimal)) {
    return null;
  }
  
  // Multiply by 100 and round to avoid floating point errors
  return Math.round(numDecimal * 100);
}

/**
 * Validate price and currency pairing
 * @param {string|number} price - Price value (decimal string or number)
 * @param {string} currency - Currency code (e.g., "USD")
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validatePriceCurrency(price, currency) {
  const hasPrice = price !== null && price !== undefined && price !== '';
  const hasCurrency = currency !== null && currency !== undefined && currency !== '';
  
  // Both empty is valid (optional field)
  if (!hasPrice && !hasCurrency) {
    return { isValid: true, error: null };
  }
  
  // Price without currency
  if (hasPrice && !hasCurrency) {
    return { isValid: false, error: 'Currency is required when price is specified' };
  }
  
  // Currency without price
  if (!hasPrice && hasCurrency) {
    return { isValid: false, error: 'Price is required when currency is specified' };
  }
  
  // Both present - validate price is a valid number
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    return { isValid: false, error: 'Price must be a valid positive number' };
  }
  
  return { isValid: true, error: null };
}
