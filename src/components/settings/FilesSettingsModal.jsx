import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Field,
  Input,
  Flex,
  Switch,
  Icon,
  NumberInput,
} from '@chakra-ui/react';
import { MdFolder, MdSave } from 'react-icons/md';
import { loadSettings, saveSettings } from '../../utils/settingsManager';
import { ConfirmDialog } from '../../../app/_components/ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { expandPath as expandPathService, updateEnv } from '../../services';
import ManageBackupsModal from './ManageBackupsModal';

const FilesSettingsModal = ({ isOpen, onClose, embedded = false, shouldOpenBackupManager = false, onBackupManagerOpened }) => {
  const [settings, setSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showManageBackups, setShowManageBackups] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
  const [originalDefaultPath, setOriginalDefaultPath] = useState('');
  const [originalGearMaintenancePath, setOriginalGearMaintenancePath] = useState('');
  const { showSuccess, showError, showWarning } = useToast();

  // Expand tilde to full path
  const expandPath = async (path) => {
    if (!path || !path.startsWith('~')) return path;

    try {
      const data = await expandPathService(path);
      return data.success ? data.expandedPath : path;
    } catch (error) {
      console.error('Failed to expand path:', error);
      return path;
    }
  };

  // Open backup manager when triggered from notification
  useEffect(() => {
    if (shouldOpenBackupManager && !showManageBackups) {
      // Use setTimeout to defer state update to next tick
      const timer = setTimeout(() => {
        setShowManageBackups(true);
        if (onBackupManagerOpened) {
          onBackupManagerOpened();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [shouldOpenBackupManager, showManageBackups, onBackupManagerOpened]);

  useEffect(() => {
    if (isOpen) {
      const loadAndExpandSettings = async () => {
        // Reset dirty flag before loading settings
        setIsDirty(false);
        
        const loaded = await loadSettings();
        
        // Expand the default path if it contains tilde
        if (loaded.files?.defaultPath?.startsWith('~')) {
          const expandedPath = await expandPath(loaded.files.defaultPath);
          if (expandedPath !== loaded.files.defaultPath) {
            loaded.files.defaultPath = expandedPath;
          }
        }
        
        // Expand the gear maintenance path if it contains tilde
        if (loaded.files?.gearMaintenancePath?.startsWith('~')) {
          const expandedPath = await expandPath(loaded.files.gearMaintenancePath);
          if (expandedPath !== loaded.files.gearMaintenancePath) {
            loaded.files.gearMaintenancePath = expandedPath;
          }
        }
        
        setSettings(loaded);
        setOriginalDefaultPath(loaded.files?.defaultPath || '');
        setOriginalGearMaintenancePath(loaded.files?.gearMaintenancePath || '');
      };
      
      loadAndExpandSettings();
    } else {
      // Reset state when modal closes to prevent stale state on next open
      // Use setTimeout to defer state update to next tick
      const timer = setTimeout(() => {
        setIsDirty(false);
        setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
      }, 0);
      return () => clearTimeout(timer);
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
    const defaultPathChanged = newDefaultPath !== originalDefaultPath;
    
    // Check if gear maintenance path has changed
    const newGearMaintenancePath = settings.files?.gearMaintenancePath || '';
    const gearMaintenancePathChanged = newGearMaintenancePath !== originalGearMaintenancePath;

    if (defaultPathChanged || gearMaintenancePathChanged) {
      // Build confirmation message
      let message = '';
      
      if (defaultPathChanged) {
        message += `You are changing the default file path from:\n\n"${originalDefaultPath}"\n\nto:\n\n"${newDefaultPath}"\n\nThis will update the DEFAULT_STATS_CONFIG_PATH environment variable.`;
      }
      
      if (gearMaintenancePathChanged) {
        if (message) message += '\n\n';
        message += `You are changing the gear maintenance path from:\n\n"${originalGearMaintenancePath}"\n\nto:\n\n"${newGearMaintenancePath}"\n\nThis will update the DEFAULT_GEAR_MAINTENANCE_PATH environment variable.`;
      }
      
      message += '\n\nThe application will need to be restarted for these changes to take full effect.\n\nDo you want to proceed?';
      
      // Show confirmation dialog before updating .env
      setConfirmDialog({
        isOpen: true,
        title: 'Update Environment Variable?',
        message,
        confirmText: 'Proceed',
        onConfirm: async () => {
          setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
          await performSave(defaultPathChanged ? newDefaultPath : null, gearMaintenancePathChanged ? newGearMaintenancePath : null);
        }
      });
    } else {
      await performSave();
    }
  };

  const performSave = async (newDefaultPath = null, newGearMaintenancePath = null) => {
    // Save settings
    const success = await saveSettings(settings);
    if (!success) {
      showError('Failed to save settings. Please try again.');
      return;
    }

    const envUpdates = [];
    let anyFailed = false;
    
    // If default path changed, update .env file
    if (newDefaultPath) {
      try {
        const result = await updateEnv('DEFAULT_STATS_CONFIG_PATH', newDefaultPath);
        
        if (result.success) {
          envUpdates.push('DEFAULT_STATS_CONFIG_PATH');
        } else {
          console.error('Failed to update DEFAULT_STATS_CONFIG_PATH:', result.error);
          anyFailed = true;
        }
      } catch (error) {
        console.error('Error updating DEFAULT_STATS_CONFIG_PATH:', error);
        anyFailed = true;
      }
    }

    // If gear maintenance path changed, update .env file
    if (newGearMaintenancePath) {
      try {
        const result = await updateEnv('DEFAULT_GEAR_MAINTENANCE_PATH', newGearMaintenancePath);
        
        if (result.success) {
          envUpdates.push('DEFAULT_GEAR_MAINTENANCE_PATH');
        } else {
          console.error('Failed to update DEFAULT_GEAR_MAINTENANCE_PATH:', result.error);
          anyFailed = true;
        }
      } catch (error) {
        console.error('Error updating DEFAULT_GEAR_MAINTENANCE_PATH:', error);
        anyFailed = true;
      }
    }
    
    // Show appropriate success/warning message
    if (envUpdates.length > 0) {
      if (anyFailed) {
        showWarning(`Settings saved, but some environment variables failed to update: ${envUpdates.join(', ')}. You may need to manually update your .env file.`, 8000);
      } else {
        showSuccess(`Settings saved successfully! Environment variables updated: ${envUpdates.join(', ')}. Please restart the application for the changes to take full effect.`, 8000);
      }
    } else {
      // Show success message for regular save
      showSuccess('Settings saved successfully!');
    }

    setIsDirty(false);
    setOriginalDefaultPath(settings.files?.defaultPath || '');
    setOriginalGearMaintenancePath(settings.files?.gearMaintenancePath || '');
    
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
          {/* Default Configuration File Path Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Default configuration file path</Field.Label>
            <Input
              type="text"
              value={settings.files?.defaultPath || ''}
              onChange={(e) => handleChange('files.defaultPath', e.target.value)}
              placeholder="~/Documents/strava-config-tool/"
              bg="inputBg"
            />
            <Text fontSize="sm" color="gray.500" mt={1}>Where your configuration files are stored</Text>
          </Field.Root>

          {/* Backup Directory Path Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Backup directory path</Field.Label>
            <HStack gap={2} align="stretch" width="100%">
              <Input
                type="text"
                value={settings.files?.backupsDir || ''}
                onChange={(e) => handleChange('files.backupsDir', e.target.value)}
                placeholder={settings.files?.defaultPath || '~/Documents/strava-config-tool/'}
                bg="inputBg"
                flex={1}
              />
              <Button
                onClick={() => handleChange('files.backupsDir', settings.files?.defaultPath || '')}
                variant="outline"
                size="sm"
                flexShrink={0}
                title="Reset to default config path"
              >
                Reset
              </Button>
            </HStack>
            <Text fontSize="sm" color="gray.500" mt={1}>Backups are saved to a 'backups' subfolder in this directory</Text>
          </Field.Root>

          {/* Gear Maintenance Path Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Gear maintenance directory path</Field.Label>
            <Input
              type="text"
              value={settings.files?.gearMaintenancePath || ''}
              onChange={(e) => handleChange('files.gearMaintenancePath', e.target.value)}
              placeholder="/data/storage/gear-maintenance"
              bg="inputBg"
            />
            <Text fontSize="sm" color="gray.500" mt={1}>Where gear maintenance images and data are stored</Text>
          </Field.Root>

          {/* Auto Backup Setting */}
          <Field.Root>
            <Switch.Root
              checked={settings.files?.autoBackup !== false}
              onCheckedChange={(e) => handleChange('files.autoBackup', e.checked)}
              colorPalette="blue"
            >
              <Switch.HiddenInput />
              <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>Create automatic backups</Switch.Label>
            </Switch.Root>
          </Field.Root>

          {/* Backup Threshold Setting - Only shown when auto backup is enabled */}
          {settings.files?.autoBackup !== false && (
            <Field.Root>
              <Flex 
                direction={{ base: "column", sm: "row" }} 
                align={{ base: "stretch", sm: "center" }} 
                gap={{ base: 2, sm: 3 }}
                mb={1}
              >
                <Field.Label fontWeight="500" mb={0} minW="fit-content">
                  Backup file threshold
                </Field.Label>
                <NumberInput.Root
                  value={String(settings.files?.backupThreshold || 10)}
                  onValueChange={(e) => handleChange('files.backupThreshold', parseInt(e.value) || 10)}
                  min={1}
                  max={100}
                  step={1}
                  width={{ base: "100%", sm: "150px" }}
                  size="sm"
                >
                  <NumberInput.Input bg="inputBg" />
                  <NumberInput.Control css={{
                    '& button': {
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--chakra-colors-text)',
                      fontSize: '12px',
                      minHeight: '14px',
                      height: '14px',
                      width: '20px',
                      padding: '0',
                      borderRadius: '0'
                    },
                    '& button:hover': {
                      backgroundColor: 'transparent',
                      opacity: '0.7'
                    },
                    '& svg': {
                      width: '12px',
                      height: '12px',
                      stroke: 'var(--chakra-colors-text)',
                      strokeWidth: '2px'
                    }
                  }} />
                </NumberInput.Root>
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Show a notification when backup count exceeds this number
              </Text>
            </Field.Root>
          )}

          {/* Manage Backups Button - Only shown when auto backup is enabled */}
          {settings.files?.autoBackup !== false && (
            <Field.Root>
              <Button
                onClick={() => setShowManageBackups(true)}
                variant="outline"
                colorPalette="blue"
                size={{ base: "sm", sm: "md" }}
                width="100%"
              >
                <Flex align="center" gap={2}>
                  <Icon><MdFolder /></Icon> Manage Backups
                </Flex>
              </Button>
              <Text fontSize="sm" color="gray.500" mt={1}>
                View and delete old backup files
              </Text>
            </Field.Root>
          )}

          {/* Validate On Load Setting */}
          <Field.Root>
            <Switch.Root
              checked={settings.files?.validateOnLoad !== false}
              onCheckedChange={(e) => handleChange('files.validateOnLoad', e.checked)}
              colorPalette="blue"
            >
              <Switch.HiddenInput />
              <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
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

        {/* Manage Backups Modal */}
        {showManageBackups && (
          <ManageBackupsModal
            isOpen={showManageBackups}
            onClose={() => setShowManageBackups(false)}
            backupDir={settings.files?.backupsDir || settings.files?.defaultPath || ''}
          />
        )}
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
          {/* Default Configuration File Path Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Default configuration file path</Field.Label>
            <Input
              type="text"
              value={settings.files?.defaultPath || ''}
              onChange={(e) => handleChange('files.defaultPath', e.target.value)}
              placeholder="~/Documents/strava-config-tool/"
              bg="inputBg"
            />
            <Text fontSize="sm" color="gray.500" mt={1}>Where your configuration files are stored</Text>
          </Field.Root>

          {/* Backup Directory Path Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Backup directory path</Field.Label>
            <HStack gap={2} align="stretch" width="100%">
              <Input
                type="text"
                value={settings.files?.backupsDir || ''}
                onChange={(e) => handleChange('files.backupsDir', e.target.value)}
                placeholder={settings.files?.defaultPath || '~/Documents/strava-config-tool/'}
                bg="inputBg"
                flex={1}
              />
              <Button
                onClick={() => handleChange('files.backupsDir', settings.files?.defaultPath || '')}
                variant="outline"
                size="sm"
                flexShrink={0}
                title="Reset to default config path"
              >
                Reset
              </Button>
            </HStack>
            <Text fontSize="sm" color="gray.500" mt={1}>Backups are saved to a 'backups' subfolder in this directory</Text>
          </Field.Root>

          {/* Gear Maintenance Path Setting */}
          <Field.Root>
            <Field.Label fontWeight="500" mb={2}>Gear maintenance directory path</Field.Label>
            <Input
              type="text"
              value={settings.files?.gearMaintenancePath || ''}
              onChange={(e) => handleChange('files.gearMaintenancePath', e.target.value)}
              placeholder="/data/storage/gear-maintenance"
              bg="inputBg"
            />
            <Text fontSize="sm" color="gray.500" mt={1}>Where gear maintenance images and data are stored</Text>
          </Field.Root>

          {/* Auto Backup Setting */}
          <Field.Root>
            <Switch.Root
              checked={settings.files?.autoBackup !== false}
              onCheckedChange={(e) => handleChange('files.autoBackup', e.checked)}
              colorPalette="blue"
            >
              <Switch.HiddenInput />
              <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>Create automatic backups</Switch.Label>
            </Switch.Root>
          </Field.Root>

          {/* Backup Threshold Setting - Only shown when auto backup is enabled */}
          {settings.files?.autoBackup !== false && (
            <Field.Root>
              <Flex 
                direction={{ base: "column", sm: "row" }} 
                align={{ base: "stretch", sm: "center" }} 
                gap={{ base: 2, sm: 3 }}
                mb={1}
              >
                <Field.Label fontWeight="500" mb={0} minW="fit-content">
                  Backup file threshold
                </Field.Label>
                <NumberInput.Root
                  value={String(settings.files?.backupThreshold || 10)}
                  onValueChange={(e) => handleChange('files.backupThreshold', parseInt(e.value) || 10)}
                  min={1}
                  max={100}
                  step={1}
                  width={{ base: "100%", sm: "150px" }}
                  size="sm"
                >
                  <NumberInput.Input bg="inputBg" />
                  <NumberInput.Control css={{
                    '& button': {
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--chakra-colors-text)',
                      fontSize: '12px',
                      minHeight: '14px',
                      height: '14px',
                      width: '20px',
                      padding: '0',
                      borderRadius: '0'
                    },
                    '& button:hover': {
                      backgroundColor: 'transparent',
                      opacity: '0.7'
                    },
                    '& svg': {
                      width: '12px',
                      height: '12px',
                      stroke: 'var(--chakra-colors-text)',
                      strokeWidth: '2px'
                    }
                  }} />
                </NumberInput.Root>
              </Flex>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Show a notification when backup count exceeds this number
              </Text>
            </Field.Root>
          )}

          {/* Manage Backups Button - Only shown when auto backup is enabled */}
          {settings.files?.autoBackup !== false && (
            <Field.Root>
              <Button
                onClick={() => setShowManageBackups(true)}
                variant="outline"
                colorPalette="blue"
                size={{ base: "sm", sm: "md" }}
                width="100%"
              >
                <Flex align="center" gap={2}>
                  <Icon><MdFolder /></Icon> Manage Backups
                </Flex>
              </Button>
              <Text fontSize="sm" color="gray.500" mt={1}>
                View and delete old backup files
              </Text>
            </Field.Root>
          )}

          {/* Validate On Load Setting */}
          <Field.Root>
            <Switch.Root
              checked={settings.files?.validateOnLoad !== false}
              onCheckedChange={(e) => handleChange('files.validateOnLoad', e.checked)}
              colorPalette="blue"
            >
              <Switch.HiddenInput />
              <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
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

