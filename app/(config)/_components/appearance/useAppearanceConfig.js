import { useSportsList } from '../../../../src/contexts/SportsListContext';

/**
 * Custom hook for appearance configuration logic
 * Handles sports list loading and appearance-specific validation
 */
export const useAppearanceConfig = () => {
  const { sportsList, getAllSportTypes } = useSportsList();

  // Custom validation for appearance fields
  const validateAppearanceFields = (formData, getNestedValue) => {
    const errors = {};
    
    // Validate polyline color format
    const polylineColor = getNestedValue(formData, 'heatmap.polylineColor');
    if (polylineColor && !polylineColor.match(/^(#[0-9A-Fa-f]{3,6}|rgb|rgba|hsl|hsla|[a-z]+)/)) {
      errors['heatmap.polylineColor'] = 'Must be a valid CSS color (e.g., #fc6719, red, rgb(252, 103, 25))';
    }

    // Validate country code format if provided
    const countryCode = getNestedValue(formData, 'photos.defaultEnabledFilters.countryCode');
    if (countryCode && countryCode !== null && !countryCode.match(/^[A-Z]{2}$/)) {
      errors['photos.defaultEnabledFilters.countryCode'] = 'Must be a 2-letter uppercase ISO2 country code (e.g., US, GB, FR)';
    }

    return errors;
  };

  return {
    sportsList,
    getAllSportTypes,
    validateAppearanceFields
  };
};
