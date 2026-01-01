import React from 'react';
import { Flex, Box, Heading, VStack, Button, Field, Input, Textarea, Checkbox } from '@chakra-ui/react';

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
  if (!isOpen) return null;

  const handleFormChange = (field, value) => {
    onChange(field, value);
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
              <Field.Root>
                <Field.Label color="text">Config Template (YAML)</Field.Label>
                <Textarea
                  placeholder="key: value"
                  value={formData.configTemplate}
                  onChange={e => handleFormChange('configTemplate', e.target.value)}
                  rows={5}
                  bg="inputBg"
                  fontFamily="monospace"
                  fontSize="sm"
                />
              </Field.Root>
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
