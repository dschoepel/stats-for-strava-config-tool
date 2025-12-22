import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Field,
  NativeSelectRoot,
  NativeSelectField,
  Flex,
  Switch,
} from '@chakra-ui/react';
import { loadSettings, saveSettings } from '../../utils/settingsManager';

const UISettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadSettings();
      setSettings(loaded);
      setIsDirty(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
    onClose();
  };

  const handleChange = (path, value) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setIsDirty(true);
  };

  const handleSave = async () => {
    const success = await saveSettings(settings);
    if (success) {
      setIsDirty(false);
    } else {
      alert('Failed to save settings. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.600"
      zIndex="1000"
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={handleClose}
    >
      <Box
        bg="bg"
        borderRadius="lg"
        boxShadow="lg"
        maxW={{ base: "95%", sm: "600px" }}
        w="100%"
        maxH={{ base: "90vh", sm: "80vh" }}
        overflowY="auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <Flex
          justify="space-between"
          align="center"
          p={{ base: 3, sm: 4 }}
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Heading size={{ base: "md", sm: "lg" }} lineHeight="1.2" wordBreak="break-word">
            🎨 User Interface Settings
          </Heading>
          <Button
            onClick={handleClose}
            size={{ base: "xs", sm: "sm" }}
            variant="ghost"
            minW="auto"
            px={{ base: 2, sm: 3 }}
          >
            ✕
          </Button>
        </Flex>

        {/* Modal Body */}
        <VStack align="stretch" gap={4} p={{ base: 3, sm: 4 }}>
          {/* Theme Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Theme</Field.Label>
            <NativeSelectRoot>
              <NativeSelectField
                value={settings.ui?.theme || 'dark'}
                onChange={(e) => handleChange('ui.theme', e.target.value)}
                bg="inputBg"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </NativeSelectField>
            </NativeSelectRoot>
          </Field.Root>

          {/* Sidebar Collapsed Setting */}
          <Field.Root>
            <Switch.Root
              checked={settings.ui?.sidebarCollapsed || false}
              onCheckedChange={(e) => handleChange('ui.sidebarCollapsed', e.checked)}
              colorPalette="blue"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>Start with sidebar collapsed</Switch.Label>
            </Switch.Root>
          </Field.Root>

          {/* Auto-save Setting */}
          <Field.Root>
            <Switch.Root
              checked={settings.ui?.autoSave !== false}
              onCheckedChange={(e) => handleChange('ui.autoSave', e.checked)}
              colorPalette="blue"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>Auto-save changes</Switch.Label>
            </Switch.Root>
          </Field.Root>

          {/* Show Line Numbers Setting */}
          <Field.Root>
            <Switch.Root
              checked={settings.ui?.showLineNumbers !== false}
              onCheckedChange={(e) => handleChange('ui.showLineNumbers', e.checked)}
              colorPalette="blue"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>Show line numbers in YAML viewer</Switch.Label>
            </Switch.Root>
          </Field.Root>
        </VStack>

        {/* Modal Footer */}
        <Flex
          direction={{ base: "column-reverse", sm: "row" }}
          justify="flex-end"
          gap={3}
          p={{ base: 3, sm: 4 }}
          borderTopWidth="1px"
          borderColor="border"
        >
          <Button
            onClick={handleClose}
            variant="outline"
            size={{ base: "sm", sm: "md" }}
            width={{ base: "100%", sm: "auto" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            colorPalette="blue"
            disabled={!isDirty}
            size={{ base: "sm", sm: "md" }}
            width={{ base: "100%", sm: "auto" }}
          >
            💾 Save{isDirty && ' *'}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default UISettingsModal;
