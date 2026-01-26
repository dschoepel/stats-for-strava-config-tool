'use client';

import { useState, useEffect, useMemo } from 'react';
import { NumberInput, Text } from '@chakra-ui/react';

/**
 * Parse currency input - remove all non-numeric characters except decimal point and minus
 */
const parseCurrency = (value) => value.replace(/[^0-9.-]+/g, '');

/**
 * CurrencyInput - Formatted currency input using Intl.NumberFormat
 * @param {Object} props
 * @param {string} props.value - Decimal value as string (e.g., "99.99")
 * @param {string} props.currency - ISO 4217 currency code (e.g., "USD")
 * @param {Function} props.onChange - Callback when value changes (value: string) => void
 * @param {string} props.label - Label text
 * @param {boolean} props.isRequired - Whether field is required
 * @param {string} props.error - Error message to display
 * @param {boolean} props.isDisabled - Whether input is disabled
 * @param {Function} props.onBlur - Callback when input loses focus
 */
export function CurrencyInput({
  value = '',
  currency = 'USD',
  onChange,
  label = 'Price',
  isRequired = false,
  error = null,
  isDisabled = false,
  onBlur = null
}) {
  const [internalValue, setInternalValue] = useState(value);

  // Update internal value when external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Get browser locale for formatting
  const locale = useMemo(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.language || 'en-US';
    }
    return 'en-US';
  }, []);

  // Create formatter based on currency and locale
  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      // Fallback to USD if currency is invalid
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }, [currency, locale]);

  const handleValueChange = (details) => {
    const newValue = details.value;
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <>
      <NumberInput.Root
        value={internalValue}
        onValueChange={handleValueChange}
        format={(val) => formatter.format(Number(val) || 0)}
        parse={parseCurrency}
        min={0}
        step={1}
        invalid={!!error}
        disabled={isDisabled}
      >
        {label && <NumberInput.Label>{label}{isRequired && ' *'}</NumberInput.Label>}
        <NumberInput.Control>
          <NumberInput.Input onBlur={handleBlur} />
          <NumberInput.IncrementTrigger />
          <NumberInput.DecrementTrigger />
        </NumberInput.Control>
      </NumberInput.Root>

      {error && (
        <Text color="red.500" fontSize="sm" mt={1}>
          {error}
        </Text>
      )}
    </>
  );
}
