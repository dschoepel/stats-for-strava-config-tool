import React, { useState } from 'react';
import { Flex, Box, Heading, VStack, Button, Field, Input, Textarea, Checkbox } from '@chakra-ui/react';
import { MdAutoFixHigh } from 'react-icons/md';

/**
 * Simple YAML to JSON converter for config templates
 */
const yamlToJson = (yamlText) => {
  const lines = yamlText.trim().split('\n');
  const result = {};
  const stack = [{ obj: result, indent: -1 }];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Handle array items
    if (trimmed.startsWith('- ')) {
      const value = trimmed.substring(2).trim();
      const parent = stack[stack.length - 1];
      if (!Array.isArray(parent.currentArray)) {
        parent.currentArray = [];
        parent.obj[parent.currentKey] = parent.currentArray;
      }
      // Parse value
      if (value.startsWith('"') && value.endsWith('"')) {
        parent.currentArray.push(value.slice(1, -1));
      } else if (value.startsWith("'") && value.endsWith("'")) {
        parent.currentArray.push(value.slice(1, -1));
      } else if (value === 'true') {
        parent.currentArray.push(true);
      } else if (value === 'false') {
        parent.currentArray.push(false);
      } else if (!isNaN(value) && value !== '') {
        parent.currentArray.push(Number(value));
      } else {
        parent.currentArray.push(value);
      }
      continue;
    }

    // Handle key: value pairs
    const match = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;

      // Pop stack to correct level
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];

      if (value === '' || value === '[]') {
        // Empty value or empty array
        if (value === '[]') {
          parent.obj[key] = [];
        } else {
          // Nested object coming
          parent.obj[key] = {};
          stack.push({ obj: parent.obj[key], indent, currentKey: key });
        }
      } else {
        // Parse value
        if (value.startsWith('[') && value.endsWith(']')) {
          // Inline array like ['a', 'b', 'c']
          const arrayContent = value.slice(1, -1);
          if (arrayContent.trim() === '') {
            parent.obj[key] = [];
          } else {
            parent.obj[key] = arrayContent.split(',').map(item => {
              const trimmed = item.trim();
              if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
              if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
              if (trimmed === 'true') return true;
              if (trimmed === 'false') return false;
              if (!isNaN(trimmed) && trimmed !== '') return Number(trimmed);
              return trimmed;
            });
          }
        } else if (value.startsWith('"') && value.endsWith('"')) {
          parent.obj[key] = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          parent.obj[key] = value.slice(1, -1);
        } else if (value === 'true') {
          parent.obj[key] = true;
        } else if (value === 'false') {
          parent.obj[key] = false;
        } else if (!isNaN(value) && value !== '') {
          parent.obj[key] = Number(value);
        } else {
          parent.obj[key] = value;
        }
      }

      parent.currentKey = key;
      parent.currentArray = null;
    }
  }

  return result;
};

/**
 * WidgetFormModal - Modal for adding/editing widget definitions
 */
const WidgetFormModal = ({ 
  isOpen, 
  mode = 'add', // 'add' or 'edit'
  formData, 
  onChange, 
  onSubmit, 
  onClose, 
  error 
}) => {
  const [convertError, setConvertError] = useState('');

  if (!isOpen) return null;

  const handleFormChange = (field, value) => {
    onChange(field, value);
  };

  const handleGenerateDefaultConfig = () => {
    if (!formData.configTemplate) {
      setConvertError('Please enter a Config Template first');
      setTimeout(() => setConvertError(''), 3000);
      return;
    }

    try {
      const parsed = yamlToJson(formData.configTemplate);
      const json = JSON.stringify(parsed, null, 2);
      handleFormChange('defaultConfig', json);
      setConvertError('');
    } catch (err) {
      setConvertError('Failed to convert YAML to JSON. Check your Config Template syntax.');
      setTimeout(() => setConvertError(''), 3000);
    }
  };

  return (
    <Flex
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.7)"
      align="center"
      justify="center"
      zIndex={1000}
      onClick={onClose}
    >
      <Flex
        direction="column"
        bg="cardBg"
        border="2px solid"
        borderColor="border"
        borderRadius="lg"
        boxShadow="xl"
        w="90%"
        maxW="600px"
        maxH="90vh"
        overflow="hidden"
        onClick={e => e.stopPropagation()}
      >
        <Flex
          justify="space-between"
          align="center"
          px={6}
          py={4}
          bg="panelBg"
          borderBottom="1px solid"
          borderColor="border"
        >
          <Heading as="h4" size="lg" color="text">
            {mode === 'add' ? 'Add Custom Widget' : 'Edit Widget Definition'}
          </Heading>
        </Flex>

        <Box px={6} py={4} overflowY="auto" bg="cardBg">
          {error && (
            <Box
              mb={4}
              p={3}
              borderRadius="md"
              bg={{ base: "#f8d7da", _dark: "#7f1d1d" }}
              color={{ base: "#721c24", _dark: "#fca5a5" }}
              border="1px solid"
              borderColor={{ base: "#f5c6cb", _dark: "#991b1b" }}
            >
              {error}
            </Box>
          )}

          <VStack align="stretch" gap={4}>
            <Field.Root>
              <Field.Label color="text">Widget Name (camelCase)*</Field.Label>
              <Input
                placeholder="myCustomWidget"
                value={formData.name}
                onChange={e => handleFormChange('name', e.target.value)}
                bg="inputBg"
                disabled={mode === 'edit'}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label color="text">Display Name*</Field.Label>
              <Input
                placeholder="My Custom Widget"
                value={formData.displayName}
                onChange={e => handleFormChange('displayName', e.target.value)}
                bg="inputBg"
              />
            </Field.Root>

            <Field.Root>
              <Field.Label color="text">Description</Field.Label>
              <Textarea
                placeholder="What does this widget do?"
                value={formData.description}
                onChange={e => handleFormChange('description', e.target.value)}
                rows={3}
                bg="inputBg"
              />
            </Field.Root>

            <Checkbox.Root
              checked={formData.allowMultiple}
              onCheckedChange={e => handleFormChange('allowMultiple', e.checked)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label color="text" fontWeight="medium">Allow multiple instances</Checkbox.Label>
            </Checkbox.Root>

            <Checkbox.Root
              checked={formData.hasConfig}
              onCheckedChange={e => handleFormChange('hasConfig', e.checked)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label color="text" fontWeight="medium">Has configuration options</Checkbox.Label>
            </Checkbox.Root>

            {formData.hasConfig && (
              <>
                <Field.Root>
                  <Field.Label color="text">Config Template (YAML)</Field.Label>
                  <Field.HelperText fontSize="xs" color="textMuted">Schema/documentation shown in dashboard editor</Field.HelperText>
                  <Textarea
                    placeholder="key: value"
                    value={formData.configTemplate}
                    onChange={e => handleFormChange('configTemplate', e.target.value)}
                    rows={4}
                    bg="inputBg"
                    fontFamily="monospace"
                    fontSize="sm"
                  />
                </Field.Root>

                <Flex justify="center" py={2}>
                  <Button
                    onClick={handleGenerateDefaultConfig}
                    variant="outline"
                    size="sm"
                    colorPalette="blue"
                    leftIcon={<MdAutoFixHigh />}
                  >
                    Generate Default Config from Template
                  </Button>
                </Flex>

                {convertError && (
                  <Box
                    p={2}
                    borderRadius="md"
                    bg={{ base: "#fff3cd", _dark: "#7f6000" }}
                    color={{ base: "#856404", _dark: "#ffc107" }}
                    border="1px solid"
                    borderColor={{ base: "#ffeeba", _dark: "#997400" }}
                    fontSize="sm"
                  >
                    {convertError}
                  </Box>
                )}

                <Field.Root>
                  <Field.Label color="text">Default Config (JSON)</Field.Label>
                  <Field.HelperText fontSize="xs" color="textMuted">Initial values when widget is added to dashboard</Field.HelperText>
                  <Textarea
                    placeholder='{"key": "value"}'
                    value={formData.defaultConfig}
                    onChange={e => handleFormChange('defaultConfig', e.target.value)}
                    rows={4}
                    bg="inputBg"
                    fontFamily="monospace"
                    fontSize="sm"
                  />
                </Field.Root>
              </>
            )}
          </VStack>
        </Box>

        <Flex
          justify="flex-end"
          gap={3}
          px={6}
          py={4}
          bg="panelBg"
          borderTop="1px solid"
          borderColor="border"
        >
          <Button
            onClick={onClose}
            variant="outline"
            colorPalette="gray"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            bg="primary"
            color="white"
            _hover={{ bg: "primaryHover" }}
          >
            {mode === 'add' ? 'Add Widget' : 'Save Changes'}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default WidgetFormModal;
