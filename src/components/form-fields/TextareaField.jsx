import { Field, Textarea } from '@chakra-ui/react';

/**
 * Reusable textarea field component with validation and error handling
 */
export const TextareaField = ({
  label,
  path,
  value,
  onChange,
  error,
  helperText,
  placeholder,
  rows = 3,
  required = false,
  disabled = false,
  ...props
}) => {
  return (
    <Field.Root invalid={!!error} required={required} disabled={disabled}>
      <Field.Label>{label}</Field.Label>
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(path, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        {...props}
      />
      {helperText && !error && <Field.HelperText>{helperText}</Field.HelperText>}
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  );
};
