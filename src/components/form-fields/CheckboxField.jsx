import { Field, Checkbox } from '@chakra-ui/react';

/**
 * Reusable checkbox field component with validation and error handling
 */
export const CheckboxField = ({
  label,
  path,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  ...props
}) => {
  return (
    <Field.Root invalid={!!error} disabled={disabled}>
      <Checkbox
        checked={!!value}
        onCheckedChange={(e) => onChange(path, e.checked)}
        disabled={disabled}
        {...props}
      >
        {label}
      </Checkbox>
      {helperText && !error && <Field.HelperText>{helperText}</Field.HelperText>}
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  );
};
