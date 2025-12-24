import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Field,
  Input,
  NativeSelectRoot,
  NativeSelectField,
  HStack,
  Flex,
  Checkbox,
} from '@chakra-ui/react';
import { getSchemaBySection } from '../../schemas/configSchemas';
import { ConfirmDialog } from '../ConfirmDialog';

/**
 * BaseConfigEditor - Common form logic for all config section editors
 * Provides state management, validation, dirty tracking, and basic field rendering
 */
const BaseConfigEditor = ({
  sectionName,
  initialData = {},
  onSave,
  onCancel,
  isLoading = false,
  onDirtyChange,
  children,
  customValidation
}) => {
  const [formData, setFormData] = useState(() => initialData);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
  const schema = useMemo(() => getSchemaBySection(sectionName), [sectionName]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Notify parent of dirty state changes
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  // Nested value helpers
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return obj;
  };

  // Field change handler
  const handleFieldChange = (fieldPath, value) => {
    setFormData(prevData => {
      const newData = JSON.parse(JSON.stringify(prevData));
      setNestedValue(newData, fieldPath, value);
      return newData;
    });
    setIsDirty(true);
    
    // Clear error for this field
    if (errors[fieldPath]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    }
  };

  // Base validation
  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation based on schema requirements
    if (schema?.required) {
      schema.required.forEach(field => {
        const value = getNestedValue(formData, field);
        if (value === undefined || value === null || value === '') {
          newErrors[field] = `${field} is required`;
        }
      });
    }
    
    // Apply custom validation if provided
    if (customValidation) {
      const customErrors = customValidation(formData, getNestedValue);
      Object.assign(newErrors, customErrors);
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      setIsDirty(false);
    }
  };

  // Cancel with confirmation
  const handleCancelWithConfirm = () => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. These changes will be lost if you leave without saving. Are you sure you want to leave?',
        onConfirm: () => {
          onCancel();
          setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
        }
      });
    } else {
      onCancel();
    }
  };

  // Render basic field types
  const renderBasicField = (fieldName, fieldSchema, fieldPath = fieldName, skipDescription = false) => {
    const value = getNestedValue(formData, fieldPath);
    const hasError = errors[fieldPath];
    const fieldType = Array.isArray(fieldSchema.type) ? fieldSchema.type[0] : fieldSchema.type;
    const isRequired = schema?.required?.includes(fieldName);

    switch (fieldType) {
      case 'string':
        if (fieldSchema.enum) {
          return (
            <Field.Root key={fieldPath} invalid={!!hasError} required={isRequired}>
              <Field.Label htmlFor={fieldPath}>
                {fieldSchema.title || fieldName}
              </Field.Label>
              <NativeSelectRoot>
                <NativeSelectField
                  id={fieldPath}
                  value={value || ''}
                  onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                  placeholder="Select..."
                >
                  <option value="">Select...</option>
                  {fieldSchema.enum.map((option, idx) => (
                    <option key={option} value={option}>
                      {fieldSchema.enumTitles?.[idx] || option}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
              {!skipDescription && fieldSchema.description && (
                <Field.HelperText color="helperText">{fieldSchema.description}</Field.HelperText>
              )}
              {hasError && <Field.ErrorText>{hasError}</Field.ErrorText>}
            </Field.Root>
          );
        }
        return (
          <Field.Root key={fieldPath} invalid={!!hasError} required={isRequired}>
            <Field.Label htmlFor={fieldPath}>
              {fieldSchema.title || fieldName}
            </Field.Label>
            <Input
              id={fieldPath}
              type={fieldSchema.format === 'date' ? 'date' : 'text'}
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
              placeholder={fieldSchema.default}
              bg="inputBg"
            />
            {!skipDescription && fieldSchema.description && (
              <Field.HelperText color="helperText">{fieldSchema.description}</Field.HelperText>
            )}
            {hasError && <Field.ErrorText>{hasError}</Field.ErrorText>}
          </Field.Root>
        );

      case 'number':
      case 'integer':
        return (
          <Field.Root key={fieldPath} invalid={!!hasError} required={isRequired}>
            <Field.Label htmlFor={fieldPath}>
              {fieldSchema.title || fieldName}
            </Field.Label>
            <Input
              type="number"
              id={fieldPath}
              value={value ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : (fieldType === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value));
                handleFieldChange(fieldPath, val);
              }}
              placeholder={fieldSchema.default?.toString()}
              step={fieldType === 'integer' ? '1' : 'any'}
              bg="inputBg"
            />
            {!skipDescription && fieldSchema.description && (
              <Field.HelperText color="helperText">{fieldSchema.description}</Field.HelperText>
            )}
            {hasError && <Field.ErrorText>{hasError}</Field.ErrorText>}
          </Field.Root>
        );

      case 'boolean':
        return (
          <Field.Root key={fieldPath} invalid={!!hasError} required={isRequired}>
            <Checkbox.Root
              id={fieldPath}
              checked={value || false}
              onCheckedChange={(e) => handleFieldChange(fieldPath, e.checked)}
              colorPalette="orange"
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                {fieldSchema.title || fieldName}
                {isRequired && <Text as="span" color="red.500" ml={1}>*</Text>}
              </Checkbox.Label>
            </Checkbox.Root>
            {!skipDescription && fieldSchema.description && (
              <Field.HelperText color="helperText" mt={2}>{fieldSchema.description}</Field.HelperText>
            )}
            {hasError && <Field.ErrorText>{hasError}</Field.ErrorText>}
          </Field.Root>
        );

      default:
        return null;
    }
  };

  // Render object fields
  const renderObjectField = (fieldName, fieldSchema, fieldPath = fieldName) => {
    const properties = fieldSchema.properties || {};
    
    return (
      <Box key={fieldPath} p={4} bg="cardBg" borderRadius="md" border="1px solid" borderColor="border">
        <VStack align="stretch" gap={3}>
          <Box>
            <Heading as="h4" size="sm" color="text">
              {fieldSchema.title || fieldName}
            </Heading>
            {fieldSchema.description && (
              <Text fontSize="sm" color="textMuted" mt={1}>
                {fieldSchema.description}
              </Text>
            )}
          </Box>
          <VStack align="stretch" gap={4}>
            {Object.entries(properties).map(([propName, propSchema]) => 
              renderBasicField(propName, propSchema, `${fieldPath}.${propName}`, true)
            )}
          </VStack>
        </VStack>
      </Box>
    );
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={6} bg="cardBg" borderRadius="md" boxShadow="md" border="1px solid" borderColor="border">
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading as="h3" size="lg" color="text">
            {schema?.title || sectionName}
          </Heading>
          {schema?.description && (
            <Text color="textMuted" mt={2}>
              {schema.description}
            </Text>
          )}
        </Box>

        <VStack align="stretch" gap={4}>
          {children({
            formData,
            errors,
            schema,
            handleFieldChange,
            getNestedValue,
            renderBasicField,
            renderObjectField
          })}
        </VStack>

        <Flex 
          direction={{ base: "column-reverse", sm: "row" }}
          justify="flex-end" 
          gap={3} 
          pt={4} 
          borderTop="1px solid" 
          borderColor="border"
        >
          <Button
            onClick={handleCancelWithConfirm}
            isDisabled={isLoading}
            variant="outline"
            colorPalette="gray"
            width={{ base: "100%", sm: "auto" }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isDisabled={isLoading || !isDirty}
            isLoading={isLoading}
            bg="primary"
            color="white"
            _hover={{ bg: "primaryHover" }}
            border={isDirty ? "3px solid" : "none"}
            borderColor={isDirty ? "primaryHover" : "transparent"}
            boxShadow={isDirty ? { base: "0 0 8px rgba(252, 82, 0, 0.5)", _dark: "0 0 12px rgba(255, 127, 63, 0.8)" } : "none"}
            width={{ base: "100%", sm: "auto" }}
          >
            {isLoading ? 'Saving...' : `Save Changes${isDirty ? ' *' : ''}`}
          </Button>
        </Flex>
      </VStack>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Leave Anyway"
        confirmColorPalette="orange"
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' })}
      />
    </Box>
  );
};

export default BaseConfigEditor;
