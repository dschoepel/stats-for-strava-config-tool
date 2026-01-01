import { Field, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';

/**
 * Reusable select field component with validation and error handling
 */
export const SelectField = ({
  label,
  path,
  value,
  onChange,
  options,
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
      <NativeSelectRoot>
        <NativeSelectField
          value={value || ''}
          onChange={(e) => onChange(path, e.target.value)}
          disabled={disabled}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>
      {helperText && !error && <Field.HelperText>{helperText}</Field.HelperText>}
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  );
};
