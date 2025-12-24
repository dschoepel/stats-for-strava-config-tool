import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Button,
  Field,
  Input,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { MdSave } from 'react-icons/md';
import { loadSettings, saveSettings } from '../../utils/settingsManager';
import { ConfirmDialog } from '../ConfirmDialog';

const PerformanceSettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  useEffect(() => {
    if (isOpen) {
      const loaded = loadSettings();
      setSettings(loaded);
      setIsDirty(false);
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
            ⚡ Performance Settings
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
          {/* Maximum File Size Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Maximum file size (MB)</Field.Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={Math.round((settings.performance?.maxFileSize || 10485760) / 1024 / 1024)}
              onChange={(e) => handleChange('performance.maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
              bg="inputBg"
              width={{ base: "100%", sm: "150px" }}
            />
          </Field.Root>

          {/* Search Timeout Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Search timeout (ms)</Field.Label>
            <Input
              type="number"
              min="100"
              max="2000"
              step="100"
              value={settings.performance?.searchTimeout || 500}
              onChange={(e) => handleChange('performance.searchTimeout', parseInt(e.target.value))}
              bg="inputBg"
              width={{ base: "100%", sm: "150px" }}
            />
          </Field.Root>

          {/* Auto-save Interval Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Auto-save interval (seconds)</Field.Label>
            <Input
              type="number"
              min="10"
              max="300"
              step="10"
              value={Math.round((settings.performance?.autoSaveInterval || 30000) / 1000)}
              onChange={(e) => handleChange('performance.autoSaveInterval', parseInt(e.target.value) * 1000)}
              bg="inputBg"
              width={{ base: "100%", sm: "150px" }}
            />
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

export default PerformanceSettingsModal;
