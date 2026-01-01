import { Field, Input } from '@chakra-ui/react';

/**
 * Reusable text field component with validation and error handling
 */
export const TextField = ({
  label,
  path,
  value,
  onChange,
  error,
  helperText,
  placeholder,
  required = false,
  disabled = false,
  ...props
}) => {
  return (
    <Field.Root invalid={!!error} required={required} disabled={disabled}>
      <Field.Label>{label}</Field.Label>
      <Input
        value={value || ''}
        onChange={(e) => onChange(path, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
      {helperText && !error && <Field.HelperText>{helperText}</Field.HelperText>}
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  );
};
