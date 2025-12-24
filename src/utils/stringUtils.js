/**
 * Generate a random string of characters suitable for tokens or passwords
 * @param {number} length - The length of the string to generate (default: 30)
 * @returns {string} A random string containing uppercase, lowercase, numbers, and special characters
 */
export const generateRandomString = (length = 30) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allCharacters = uppercase + lowercase + numbers + special;
  
  let result = '';
  
  // Ensure at least one character from each category
  result += uppercase[Math.floor(Math.random() * uppercase.length)];
  result += lowercase[Math.floor(Math.random() * lowercase.length)];
  result += numbers[Math.floor(Math.random() * numbers.length)];
  result += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = result.length; i < length; i++) {
    result += allCharacters[Math.floor(Math.random() * allCharacters.length)];
  }
  
  // Shuffle the result to randomize the guaranteed characters
  return result
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};
