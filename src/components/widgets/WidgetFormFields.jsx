import React from 'react';
import { Box, VStack, Field, Input, Textarea, Checkbox } from '@chakra-ui/react';

/**
 * WidgetFormFields - Reusable form fields for add/edit widget modals
 */
const WidgetFormFields = ({ formData, onChange, isEditing = false, error }) => {
  return (
    <VStack align="stretch" gap={4}>
      {error && (
        <Box p={3} bg="red.50" borderRadius="md" color="red.800" fontSize="sm">
          {error}
        </Box>
      )}

      <Field.Root invalid={!formData.name.trim()}>
        <Field.Label>Widget Name (camelCase)</Field.Label>
        <Input
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., yearInSport, activityFeed"
          disabled={isEditing}
          bg="inputBg"
        />
        <Field.HelperText>
          Must be camelCase (start with lowercase letter, no spaces)
        </Field.HelperText>
      </Field.Root>

      <Field.Root invalid={!formData.displayName.trim()}>
        <Field.Label>Display Name</Field.Label>
        <Input
          value={formData.displayName}
          onChange={(e) => onChange('displayName', e.target.value)}
          placeholder="e.g., Year in Sport, Activity Feed"
          bg="inputBg"
        />
        <Field.HelperText>
          Human-readable name shown in the UI
        </Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>Description (optional)</Field.Label>
        <Textarea
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Brief description of what this widget does"
          rows={3}
          bg="inputBg"
        />
      </Field.Root>

      <Checkbox
        checked={formData.allowMultiple}
        onChange={(e) => onChange('allowMultiple', e.target.checked)}
      >
        Allow Multiple Instances
      </Checkbox>

      <Checkbox
        checked={formData.hasConfig}
        onChange={(e) => onChange('hasConfig', e.target.checked)}
      >
        Has Configuration
      </Checkbox>

      {formData.hasConfig && (
        <Field.Root>
          <Field.Label>Config Template (YAML)</Field.Label>
          <Textarea
            value={formData.configTemplate}
            onChange={(e) => onChange('configTemplate', e.target.value)}
            placeholder="key: value&#10;anotherKey: defaultValue"
            rows={5}
            fontFamily="mono"
            bg="inputBg"
          />
          <Field.HelperText>
            YAML template for widget configuration
          </Field.HelperText>
        </Field.Root>
      )}
    </VStack>
  );
};

export default WidgetFormFields;
