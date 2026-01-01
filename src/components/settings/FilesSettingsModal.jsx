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
import { useToast } from '../../hooks/useToast';

const FilesSettingsModal = ({ isOpen, onClose, embedded = false }) => {
  const [settings, setSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
  const [originalDefaultPath, setOriginalDefaultPath] = useState('');
  const { showSuccess, showError, showWarning } = useToast();

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
    if (isOpen) {
      // Reset dirty flag immediately when modal opens
      setIsDirty(false);
      
      const loadAndExpandSettings = async () => {
        const loaded = loadSettings();
        
        // Expand the default path if it contains tilde
        if (loaded.files?.defaultPath?.startsWith('~')) {
          const expandedPath = await expandPath(loaded.files.defaultPath);
          if (expandedPath !== loaded.files.defaultPath) {
            loaded.files.defaultPath = expandedPath;
          }
        }
        
        setSettings(loaded);
        setOriginalDefaultPath(loaded.files?.defaultPath || '');
      };
      
      loadAndExpandSettings();
    } else {
      // Reset state when modal closes to prevent stale state on next open
      setIsDirty(false);
      setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
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
    // Check if default path has changed
    const newDefaultPath = settings.files?.defaultPath || '';
    const pathChanged = newDefaultPath !== originalDefaultPath;

    if (pathChanged) {
      // Show confirmation dialog before updating .env
      setConfirmDialog({
        isOpen: true,
        title: 'Update Environment Variable?',
        message: `You are changing the default file path from:\n\n"${originalDefaultPath}"\n\nto:\n\n"${newDefaultPath}"\n\nThis will update the DEFAULT_STATS_CONFIG_PATH environment variable in your .env file. The application will need to be restarted for this change to take full effect.\n\nDo you want to proceed?`,
        confirmText: 'Proceed',
        onConfirm: async () => {
          setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
          await performSave(newDefaultPath);
        }
      });
    } else {
      await performSave();
    }
  };

  const performSave = async (newPath = null) => {
    // Save settings
    const success = await saveSettings(settings);
    if (!success) {
      showError('Failed to save settings. Please try again.');
      return;
    }

    // If path changed, update .env file
    if (newPath) {
      try {
        const response = await fetch('/api/update-env', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'DEFAULT_STATS_CONFIG_PATH',
            value: newPath
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Environment variable updated successfully');
          showSuccess('Settings saved successfully! The DEFAULT_STATS_CONFIG_PATH environment variable has been updated. Please restart the application for the change to take full effect.', 8000);
        } else {
          console.error('Failed to update .env file:', result.error);
          showWarning(`Settings saved, but failed to update .env file: ${result.error}. You may need to manually update the DEFAULT_STATS_CONFIG_PATH in your .env file.`, 8000);
        }
      } catch (error) {
        console.error('Error updating .env file:', error);
        showWarning('Settings saved, but failed to update .env file. You may need to manually update the DEFAULT_STATS_CONFIG_PATH in your .env file.', 8000);
      }
    } else {
      // Show success message for regular save
      showSuccess('Settings saved successfully!');
    }

    setIsDirty(false);
    setOriginalDefaultPath(settings.files?.defaultPath || '');
    
    // Close modal after successful save
    onClose();
  };

  if (!isOpen) return null;

  // If embedded in a tabbed dialog, render without modal wrapper
  if (embedded) {
    return (
      <>
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
          confirmText={confirmDialog.confirmText || 'Leave Anyway'}
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
        confirmText={confirmDialog.confirmText || 'Leave Anyway'}
        confirmColorPalette="orange"
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' })}
      />
    </Box>
  );
};

export default FilesSettingsModal;