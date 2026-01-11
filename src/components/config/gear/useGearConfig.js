import { useState, useEffect } from 'react';
import { useSettings } from '../../../state/SettingsProvider';
import { listConfigFiles, readFile } from '../../../services';
import * as YAML from 'yaml';

// Locale to currency mapping
const localeToCurrency = {
  'en_US': 'USD',
  'fr_FR': 'EUR',
  'it_IT': 'EUR',
  'nl_BE': 'EUR',
  'de_DE': 'EUR',
  'pt_BR': 'BRL',
  'pt_PT': 'EUR',
  'sv_SE': 'SEK',
  'zh_CN': 'CNY'
};

/**
 * Custom hook for gear configuration logic
 * Handles currency loading from appearance config and gear validation
 */
export const useGearConfig = () => {
  const { settings } = useSettings();
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  // Load appearance config to get locale and derive currency
  useEffect(() => {
    const loadAppearanceConfig = async () => {
      try {
        const defaultPath = settings.files?.defaultPath || '/data/statistics-for-strava/config/';
        const configFiles = await listConfigFiles(defaultPath);
        
        // Find the file containing appearance section
        const appearanceFile = configFiles.files.find(file => 
          file.sections && file.sections.some(s => s.name === 'appearance')
        );
        
        if (appearanceFile) {
          const fileData = await readFile(appearanceFile.path);

          // Parse YAML content directly
          const sections = YAML.parse(fileData.content);
          
          if (sections.appearance) {
            const locale = sections.appearance.locale || 'en_US';
            const currency = localeToCurrency[locale] || 'USD';
            setDefaultCurrency(currency);
          }
        }
      } catch (error) {
        console.error('Failed to load appearance config:', error);
        setDefaultCurrency('USD');
      }
    };

    loadAppearanceConfig();
  }, [settings]);

  // Custom validation for gear fields
  const validateGearFields = (formData, getNestedValue) => {
    const errors = {};
    
    const stravaGearArray = getNestedValue(formData, 'stravaGear') || [];
    
    stravaGearArray.forEach((gear, index) => {
      // Validate gear ID
      if (!gear.gearId || gear.gearId.trim() === '') {
        errors[`stravaGear[${index}].gearId`] = 'Gear ID is required';
      }
      
      // Validate purchase price if provided
      if (gear.purchasePrice) {
        if (gear.purchasePrice.amountInCents === undefined || gear.purchasePrice.amountInCents === null) {
          errors[`stravaGear[${index}].purchasePrice.amountInCents`] = 'Amount is required when purchase price is specified';
        } else if (gear.purchasePrice.amountInCents < 0) {
          errors[`stravaGear[${index}].purchasePrice.amountInCents`] = 'Amount must be positive';
        }
        
        if (!gear.purchasePrice.currency || gear.purchasePrice.currency.trim() === '') {
          errors[`stravaGear[${index}].purchasePrice.currency`] = 'Currency is required when purchase price is specified';
        } else if (!/^[A-Z]{3}$/.test(gear.purchasePrice.currency)) {
          errors[`stravaGear[${index}].purchasePrice.currency`] = 'Currency must be a 3-letter ISO code (e.g., USD, EUR, GBP)';
        }
      }
    });
    
    // Validate custom gear
    const customGearConfig = getNestedValue(formData, 'customGear') || {};
    const customGearsArray = customGearConfig.customGears || [];
    
    // Validate hashtag prefix if custom gear is enabled
    if (customGearConfig.enabled) {
      if (!customGearConfig.hashtagPrefix || customGearConfig.hashtagPrefix.trim() === '') {
        errors['customGear.hashtagPrefix'] = 'Hashtag prefix is required when custom gear is enabled';
      } else if (!/^[a-z0-9-]+$/i.test(customGearConfig.hashtagPrefix)) {
        errors['customGear.hashtagPrefix'] = 'Hashtag prefix should only contain letters, numbers, and hyphens';
      }
    }
    
    // Track unique tags
    const tags = new Set();
    
    customGearsArray.forEach((gear, index) => {
      // Validate tag
      if (!gear.tag || gear.tag.trim() === '') {
        errors[`customGear.customGears[${index}].tag`] = 'Tag is required';
      } else if (!/^[a-z0-9-]+$/i.test(gear.tag)) {
        errors[`customGear.customGears[${index}].tag`] = 'Tag should only contain letters, numbers, and hyphens (no spaces)';
      } else if (tags.has(gear.tag)) {
        errors[`customGear.customGears[${index}].tag`] = 'Tag must be unique';
      } else {
        tags.add(gear.tag);
      }
      
      // Validate label
      if (!gear.label || gear.label.trim() === '') {
        errors[`customGear.customGears[${index}].label`] = 'Label is required';
      }
      
      // Validate purchase price if provided
      if (gear.purchasePrice) {
        if (gear.purchasePrice.amountInCents === undefined || gear.purchasePrice.amountInCents === null) {
          errors[`customGear.customGears[${index}].purchasePrice.amountInCents`] = 'Amount is required when purchase price is specified';
        } else if (gear.purchasePrice.amountInCents < 0) {
          errors[`customGear.customGears[${index}].purchasePrice.amountInCents`] = 'Amount must be positive';
        }
        
        if (!gear.purchasePrice.currency || gear.purchasePrice.currency.trim() === '') {
          errors[`customGear.customGears[${index}].purchasePrice.currency`] = 'Currency is required when purchase price is specified';
        } else if (!/^[A-Z]{3}$/.test(gear.purchasePrice.currency)) {
          errors[`customGear.customGears[${index}].purchasePrice.currency`] = 'Currency must be a 3-letter ISO code (e.g., USD, EUR, GBP)';
        }
      }
    });
    
    return errors;
  };

  return {
    defaultCurrency,
    validateGearFields
  };
};
