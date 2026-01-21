'use client';

import React, { useState } from 'react';
import { NumberInput, Field } from '@chakra-ui/react';

/**
 * SafeNumberInput - A number input component that prevents multi-digit typing issues
 * 
 * This component stores the raw string value during typing and only parses/commits
 * the numeric value on blur. This prevents Chakra UI v3's NumberInput from breaking
 * when typing multi-digit numbers (e.g., typing "42" becoming "1220").
 * 
 * Features:
 * - Stores RAW STRING during typing
 * - Parses and commits numeric values only on blur
 * - Validates against min/max constraints
 * - Shows error UI when invalid
 * - Supports all Chakra NumberInput props
 * 
 * @example
 * <SafeNumberInput
 *   value={myNumber}
 *   onChange={(num) => setMyNumber(num)}
 *   min={0}
 *   max={100}
 *   step={1}
 *   label="Age"
 *   helperText="Enter your age"
 * />
 */
const SafeNumberInput = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  helperText,
  errorText,
  isRequired = false,
  isDisabled = false,
  placeholder,
  width,
  size = 'md',
  allowDecimal = false,
  ...props
}) => {
  // Local state for raw string during typing
  const [valueString, setValueString] = useState(String(value ?? ''));
  const [lastValue, setLastValue] = useState(value);
  const [error, setError] = useState(null);
  const [hasBlurred, setHasBlurred] = useState(false);

  // Sync valueString when external value changes
  if (value !== lastValue) {
    setLastValue(value);
    setValueString(String(value ?? ''));
    setError(null);
  }

  // Validate the input
  const validate = (str) => {
    if (str === '' || str === '-') {
      if (isRequired) {
        return 'This field is required';
      }
      return null;
    }

    const num = allowDecimal ? parseFloat(str) : parseInt(str);

    if (isNaN(num)) {
      return 'Please enter a valid number';
    }

    if (min !== undefined && num < min) {
      return `Value must be at least ${min}`;
    }

    if (max !== undefined && num > max) {
      return `Value must be at most ${max}`;
    }

    return null;
  };

  // Handle value change (only updates string, no parsing)
  const handleValueChange = (newValueString) => {
    setValueString(newValueString);

    // If user has already blurred once, show live validation
    if (hasBlurred) {
      const validationError = validate(newValueString);
      setError(validationError);
    }
  };

  // Handle blur (parse and commit)
  const handleBlur = () => {
    setHasBlurred(true);
    const validationError = validate(valueString);

    if (validationError) {
      setError(validationError);
      return;
    }

    // Clear error if valid
    setError(null);

    // Parse and commit
    if (valueString === '' || valueString === '-') {
      onChange(undefined);
      return;
    }

    const num = allowDecimal ? parseFloat(valueString) : parseInt(valueString);

    if (!isNaN(num)) {
      // Clamp to min/max if provided
      let clamped = num;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);

      onChange(clamped);
      setValueString(String(clamped)); // Update string with clamped value
    }
  };

  const showError = error && hasBlurred;
  const finalErrorText = errorText || error;

  return (
    <Field.Root invalid={showError} width={width}>
      {label && (
        <Field.Label>
          {label}
          {isRequired && <span style={{ color: 'red' }}> *</span>}
        </Field.Label>
      )}
      <NumberInput.Root
        value={valueString}
        onValueChange={(e) => handleValueChange(e.value)}
        min={min}
        max={max}
        step={step}
        disabled={isDisabled}
        size={size}
        {...props}
      >
        <NumberInput.Input
          placeholder={placeholder}
          onBlur={handleBlur}
          bg={props.bg || 'inputBg'}
          borderColor={showError ? 'red.500' : undefined}
          _focus={{
            borderColor: showError ? 'red.500' : 'blue.500',
            boxShadow: showError ? '0 0 0 1px var(--chakra-colors-red-500)' : undefined
          }}
        />
        <NumberInput.Control
          css={props.css || {
            '& button': {
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--chakra-colors-text)',
              fontSize: '12px',
              minHeight: '14px',
              height: '14px',
              width: '20px',
              padding: '0',
              borderRadius: '0'
            },
            '& button:hover': {
              backgroundColor: 'transparent',
              opacity: '0.7'
            },
            '& svg': {
              width: '12px',
              height: '12px',
              stroke: 'var(--chakra-colors-text)',
              strokeWidth: '2px'
            }
          }}
        />
      </NumberInput.Root>
      {helperText && !showError && (
        <Field.HelperText fontSize="xs" color="textMuted">
          {helperText}
        </Field.HelperText>
      )}
      {showError && (
        <Field.ErrorText fontSize="xs">
          {finalErrorText}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};

export default SafeNumberInput;
