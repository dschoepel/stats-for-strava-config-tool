'use client';

import { useState } from 'react';
import { Input, Field } from '@chakra-ui/react';

/**
 * CurrencyInput - Simple currency input field (stores as decimal string)
 * @param {Object} props
 * @param {string} props.value - Decimal value as string (e.g., "99.99")
 * @param {string} props.currency - ISO 4217 currency code (e.g., "USD") - for display only
 * @param {Function} props.onChange - Callback when value changes (value: string) => void
 * @param {string} props.label - Label text
 * @param {boolean} props.isRequired - Whether field is required
 * @param {string} props.error - Error message to display
 * @param {boolean} props.isDisabled - Whether input is disabled
 * @param {Function} props.onBlur - Callback when input loses focus
 */
export function CurrencyInput({
  value = '',
  currency = null,
  onChange,
  label = 'Amount',
  isRequired = false,
  error = null,
  isDisabled = false,
  onBlur = null
}) {
  // Keep local state for typing without formatting interference
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Format value with currency symbol when not focused
  const formatValue = (val) => {
    if (!val || !currency || isFocused) return val;
    
    try {
      const numValue = parseFloat(val);
      if (isNaN(numValue)) return val;
      
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue);
    } catch {
      return val;
    }
  };

  const handleChange = (e) => {
    let newValue = e.target.value;
    
    // Remove currency symbols and formatting
    newValue = newValue.replace(/[^0-9.]/g, '');
    
    // Allow empty, numbers, and one decimal point with up to 2 decimal places
    if (newValue === '' || /^\d*\.?\d{0,2}$/.test(newValue)) {
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value); // Set to raw value when focusing
  };

  const handleBlur = () => {
    setIsFocused(false);
    setLocalValue(value);
    if (onBlur) {
      onBlur();
    }
  };

  const displayValue = isFocused ? localValue : formatValue(localValue || value);

  return (
    <Field.Root invalid={!!error}>
      {label && (
        <Field.Label>
          {label}{isRequired && ' *'}
        </Field.Label>
      )}
      <Input
        type="text"
        value={displayValue || ''}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isDisabled}
        placeholder="0.00"
        autoComplete="off"
      />
      {error && (
        <Field.ErrorText>
          {error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
}
