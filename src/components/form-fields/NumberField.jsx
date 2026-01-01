import { Field, Input } from '@chakra-ui/react';

/**
 * Reusable number field component with validation and error handling
 */
export const NumberField = ({
  label,
  path,
  value,
  onChange,
  error,
  helperText,
  placeholder,
  min,
  max,
  step = 1,
  required = false,
  disabled = false,
  ...props
}) => {
  const handleChange = (e) => {
    const numValue = e.target.value === '' ? '' : Number(e.target.value);
    onChange(path, numValue);
  };

  return (
    <Field.Root invalid={!!error} required={required} disabled={disabled}>
      <Field.Label>{label}</Field.Label>
      <Input
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        {...props}
      />
      {helperText && !error && <Field.HelperText>{helperText}</Field.HelperText>}
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  );
};
