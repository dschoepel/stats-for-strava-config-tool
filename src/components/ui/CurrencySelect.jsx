'use client';

import { NativeSelect, Text } from '@chakra-ui/react';
import { COMMON_CURRENCIES, OTHER_CURRENCIES } from '../../utils/currencyData';

/**
 * CurrencySelect - Dropdown for selecting ISO 4217 currency codes
 * @param {Object} props
 * @param {string} props.value - Selected currency code (e.g., "USD")
 * @param {Function} props.onChange - Callback when currency changes (code) => void
 * @param {boolean} props.isRequired - Whether currency is required
 * @param {string} props.error - Error message to display
 * @param {boolean} props.isDisabled - Whether select is disabled
 * @param {string} props.placeholder - Placeholder text
 */
export function CurrencySelect({
  value,
  onChange,
  isRequired = false,
  error = null,
  isDisabled = false,
  placeholder = 'Select currency...'
}) {
  return (
    <>
      <NativeSelect.Root
        value={value || ''}
        onValueChange={(details) => onChange(details.value || null)}
        invalid={!!error}
        disabled={isDisabled}
      >
        <NativeSelect.Field
          placeholder={placeholder}
          required={isRequired}
        >
          <option value="">{placeholder}</option>
          
          {/* Common currencies */}
          <optgroup label="Common Currencies">
            {COMMON_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </optgroup>
          
          {/* Other currencies */}
          <optgroup label="Other Currencies">
            {OTHER_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </optgroup>
        </NativeSelect.Field>
      </NativeSelect.Root>
      
      {error && (
        <Text color="red.500" fontSize="sm" mt={1}>
          {error}
        </Text>
      )}
    </>
  );
}
