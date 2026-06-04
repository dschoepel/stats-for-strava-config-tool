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
    const polylineColor = getNestedValue(formData, 'maps.polylineColor');
    if (polylineColor && !polylineColor.match(/^(#[0-9A-Fa-f]{3,6}|rgb|rgba|hsl|hsla|[a-z]+)/)) {
      errors['maps.polylineColor'] = 'Must be a valid CSS color (e.g., #fc6719, red, rgb(252, 103, 25))';
    }

    // Validate country code format if provided
    const countryCode = getNestedValue(formData, 'photos.defaultEnabledFilters.countryCode');
    if (countryCode && countryCode !== null && !countryCode.match(/^[A-Z]{2}$/)) {
      errors['photos.defaultEnabledFilters.countryCode'] = 'Must be a 2-letter uppercase ISO2 country code (e.g., US, GB, FR)';
    }

    // Validate initialCenter and initialZoom (must be used together)
    const initialCenter = getNestedValue(formData, 'maps.heatmap.initialCenter');
    const initialZoom = getNestedValue(formData, 'maps.heatmap.initialZoom');
    const centerSet = initialCenter !== null && initialCenter !== undefined;
    const zoomSet = initialZoom !== null && initialZoom !== undefined;

    if (centerSet) {
      if (!zoomSet) {
        errors['maps.heatmap.initialZoom'] = 'Required when Initial Center is set';
      }
      if (Array.isArray(initialCenter)) {
        const lat = initialCenter[0];
        const lng = initialCenter[1];
        if (lat < -90 || lat > 90) {
          errors['maps.heatmap.initialCenter'] = 'Latitude must be between -90 and 90';
        } else if (lng < -180 || lng > 180) {
          errors['maps.heatmap.initialCenter'] = 'Longitude must be between -180 and 180';
        }
      }
    }

    if (zoomSet && !centerSet) {
      errors['maps.heatmap.initialCenter'] = 'Required when Initial Zoom is set';
    }

    return errors;
  };

  return {
    sportsList,
    getAllSportTypes,
    validateAppearanceFields
  };
};
