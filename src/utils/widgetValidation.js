/**
 * Validates a widget definition form
 * @param {Object} formData - The form data to validate
 * @param {string} formData.name - The widget name (camelCase)
 * @param {string} formData.displayName - The display name
 * @param {Array} existingWidgets - Array of existing widget definitions
 * @param {string|null} editingName - Name of widget being edited (null for new widget)
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export function validateWidgetForm(formData, existingWidgets, editingName = null) {
  // Validate required fields
  if (!formData.name.trim()) {
    return { isValid: false, error: 'Widget name is required' };
  }
  if (!formData.displayName.trim()) {
    return { isValid: false, error: 'Display name is required' };
  }

  // Validate camelCase for name
  const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/;
  if (!camelCaseRegex.test(formData.name)) {
    return {
      isValid: false,
      error: 'Widget name must be in camelCase (start with lowercase letter, no spaces or special characters)'
    };
  }

  // Check for duplicate names (skip if editing the same widget)
  const isDuplicate = existingWidgets.some(
    w => w.name === formData.name && w.name !== editingName
  );
  if (isDuplicate) {
    return {
      isValid: false,
      error: `A widget with the name "${formData.name}" already exists`
    };
  }

  return { isValid: true, error: null };
}
