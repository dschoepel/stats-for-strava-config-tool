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
  Icon,
} from '@chakra-ui/react';
import { MdSave, MdPalette } from 'react-icons/md';
import { loadSettings, saveSettings } from '../../utils/settingsManager';
import { ConfirmDialog } from '../../../app/_components/ui/ConfirmDialog';

const UISettingsModal = ({ isOpen, onClose, embedded = false }) => {
  const [settings, setSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  useEffect(() => {
    if (isOpen) {
      // Use queueMicrotask to defer state updates and avoid cascading renders
      queueMicrotask(() => {
        const loaded = loadSettings();
        setSettings(loaded);
        setIsDirty(false);
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to close?',
        onConfirm: () => {
          onClose();
          setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
        }
      });
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

  // If embedded in a tabbed dialog, render without modal wrapper
  if (embedded) {
    return (
      <>
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
              <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
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
              <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
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
              <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
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
            <Flex align="center" gap={2}><Icon><MdSave /></Icon> Save{isDirty && ' *'}</Flex>
          </Button>
        </Flex>

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
      </>
    );
  }

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
          <Heading size={{ base: "md", sm: "lg" }} lineHeight="1.2" wordBreak="break-word" display="flex" alignItems="center" gap={2}>
            <Icon color="primary"><MdPalette /></Icon> User Interface Settings
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
              <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
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
              <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
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
              <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
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
            <Flex align="center" gap={2}><Icon><MdSave /></Icon> Save{isDirty && ' *'}</Flex>
          </Button>
        </Flex>
      </Box>

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

export default UISettingsModal;


