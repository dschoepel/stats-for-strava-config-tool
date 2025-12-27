import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Field,
  Input,
  Flex,
  Switch,
  Icon,
} from '@chakra-ui/react';
import { MdFolder, MdSave } from 'react-icons/md';
import { loadSettings, saveSettings } from '../../utils/settingsManager';
import { ConfirmDialog } from '../ConfirmDialog';

const FilesSettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  // Expand tilde to full path
  const expandPath = async (path) => {
    if (!path || !path.startsWith('~')) return path;
    
    try {
      const response = await fetch('/api/expand-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const data = await response.json();
      return data.success ? data.expandedPath : path;
    } catch (error) {
      console.error('Failed to expand path:', error);
      return path;
    }
  };

  useEffect(() => {
    const loadAndExpandSettings = async () => {
      if (isOpen) {
        const loaded = loadSettings();
        
        // Expand the default path if it contains tilde
        if (loaded.files?.defaultPath?.startsWith('~')) {
          const expandedPath = await expandPath(loaded.files.defaultPath);
          if (expandedPath !== loaded.files.defaultPath) {
            loaded.files.defaultPath = expandedPath;
          }
        }
        
        setSettings(loaded);
        setIsDirty(false);
      }
    };
    
    loadAndExpandSettings();
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
          <Heading size={{ base: "md", sm: "lg" }} lineHeight="1.2" wordBreak="break-word" display="flex" alignItems="center" gap={2}>
            <Icon color="primary"><MdFolder /></Icon> File Settings
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
          {/* Default File Path Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Default file path</Field.Label>
            <Input
              type="text"
              value={settings.files?.defaultPath || ''}
              onChange={(e) => handleChange('files.defaultPath', e.target.value)}
              placeholder="~/Documents/strava-config-tool/"
              bg="inputBg"
            />
          </Field.Root>

          {/* Auto Backup Setting */}
          <Field.Root>
            <Switch.Root
              checked={settings.files?.autoBackup !== false}
              onCheckedChange={(e) => handleChange('files.autoBackup', e.checked)}
              colorPalette="blue"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>Create automatic backups</Switch.Label>
            </Switch.Root>
          </Field.Root>

          {/* Validate On Load Setting */}
          <Field.Root>
            <Switch.Root
              checked={settings.files?.validateOnLoad !== false}
              onCheckedChange={(e) => handleChange('files.validateOnLoad', e.checked)}
              colorPalette="blue"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>Validate YAML syntax on file load</Switch.Label>
            </Switch.Root>
          </Field.Root>

          {/* Maximum Recent Files Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Maximum recent files</Field.Label>
            <Input
              type="number"
              min="1"
              max="50"
              value={settings.files?.maxRecentFiles || 10}
              onChange={(e) => handleChange('files.maxRecentFiles', parseInt(e.target.value))}
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

export default FilesSettingsModal;