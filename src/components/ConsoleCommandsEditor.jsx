'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Heading,
  Text,
  Button,
  Icon,
  Input,
  Textarea,
  Badge
} from '@chakra-ui/react';
import {
  MdAdd,
  MdSave,
  MdRefresh,
  MdTerminal,
  MdEdit,
  MdDelete,
  MdClose,
  MdCheck,
  MdDragIndicator
} from 'react-icons/md';
import { ConfirmDialog } from '../../app/_components/ui/ConfirmDialog';
import { initialConsoleCommands } from '../utils/consoleCommandsManager';

/**
 * Console Commands Editor
 * Allows users to manage the list of available SFS console commands
 */
export default function ConsoleCommandsEditor({ settings, onDirtyChange }) {
  const [commands, setCommands] = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState(() => JSON.stringify([]));
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ id: '', name: '', command: '', description: '' });

  // Add new command state
  const [isAdding, setIsAdding] = useState(false);
  const [newCommand, setNewCommand] = useState({ id: '', name: '', command: '', description: '' });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    onConfirm: null,
    title: '',
    message: ''
  });

  // Load commands
  useEffect(() => {
    async function loadCommands() {
      setIsLoading(true);
      try {
        const defaultPath = settings?.files?.defaultPath || '/data/config/';
        const response = await fetch(`/api/console-commands?defaultPath=${encodeURIComponent(defaultPath)}`);
        const data = await response.json();

        if (data.success) {
          const snapshot = JSON.stringify(data.commands);
          setCommands(data.commands);
          setInitialSnapshot(snapshot);
          setIsDirty(false);
          if (onDirtyChange) onDirtyChange(false);
        } else {
          showMessage(data.error || 'Failed to load commands', 'error');
        }
      } catch (error) {
        console.error('Failed to load commands:', error);
        showMessage('Failed to load commands', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    loadCommands();
  }, [settings?.files?.defaultPath, onDirtyChange]);

  // Track changes
  useEffect(() => {
    const currentSnapshot = JSON.stringify(commands);
    const hasChanges = currentSnapshot !== initialSnapshot;

    queueMicrotask(() => {
      setIsDirty(hasChanges);
      if (onDirtyChange) onDirtyChange(hasChanges);
    });
  }, [commands, initialSnapshot, onDirtyChange]);

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  // Generate unique ID
  const generateId = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const defaultPath = settings?.files?.defaultPath || '/data/config/';
      const response = await fetch('/api/console-commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands, defaultPath })
      });

      const data = await response.json();

      if (data.success) {
        const snapshot = JSON.stringify(commands);
        setInitialSnapshot(snapshot);
        setIsDirty(false);
        if (onDirtyChange) onDirtyChange(false);
        showMessage('Commands saved successfully');
      } else {
        showMessage(data.error || 'Failed to save commands', 'error');
      }
    } catch (error) {
      console.error('Failed to save commands:', error);
      showMessage('Failed to save commands', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset to defaults
  const handleResetToDefaults = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset to Defaults',
      message: 'This will replace all commands with the default set. Are you sure?',
      onConfirm: () => {
        setCommands([...initialConsoleCommands]);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        showMessage('Commands reset to defaults');
      }
    });
  };

  // Start editing a command
  const startEdit = (cmd) => {
    setEditingId(cmd.id);
    setEditForm({ ...cmd });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ id: '', name: '', command: '', description: '' });
  };

  // Save edit
  const saveEdit = () => {
    if (!editForm.name.trim() || !editForm.command.trim()) {
      showMessage('Name and command are required', 'error');
      return;
    }

    // Check for duplicate command
    const duplicate = commands.find(
      c => c.command === editForm.command && c.id !== editingId
    );
    if (duplicate) {
      showMessage('A command with this value already exists', 'error');
      return;
    }

    setCommands(prev =>
      prev.map(cmd =>
        cmd.id === editingId
          ? { ...editForm }
          : cmd
      )
    );
    cancelEdit();
    showMessage('Command updated');
  };

  // Start adding new command
  const startAdd = () => {
    setIsAdding(true);
    setNewCommand({ id: '', name: '', command: '', description: '' });
  };

  // Cancel adding
  const cancelAdd = () => {
    setIsAdding(false);
    setNewCommand({ id: '', name: '', command: '', description: '' });
  };

  // Save new command
  const saveNewCommand = () => {
    if (!newCommand.name.trim() || !newCommand.command.trim()) {
      showMessage('Name and command are required', 'error');
      return;
    }

    // Check for duplicate command
    const duplicate = commands.find(c => c.command === newCommand.command);
    if (duplicate) {
      showMessage('A command with this value already exists', 'error');
      return;
    }

    const id = generateId(newCommand.name);
    setCommands(prev => [...prev, { ...newCommand, id }]);
    cancelAdd();
    showMessage('Command added');
  };

  // Delete command
  const handleDelete = (cmd) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Command',
      message: `Are you sure you want to delete "${cmd.name}"?`,
      onConfirm: () => {
        setCommands(prev => prev.filter(c => c.id !== cmd.id));
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        showMessage('Command deleted');
      }
    });
  };

  // Move command up/down
  const moveCommand = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= commands.length) return;

    const newCommands = [...commands];
    [newCommands[index], newCommands[newIndex]] = [newCommands[newIndex], newCommands[index]];
    setCommands(newCommands);
  };

  return (
    <Box p={6} bg="cardBg" minH="100%">
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <HStack gap={3}>
            <Icon as={MdTerminal} boxSize={6} color="primary" />
            <Heading as="h2" size="lg" color="text">
              Console Commands
            </Heading>
            {isDirty && (
              <Badge colorPalette="orange" variant="solid">
                Unsaved Changes
              </Badge>
            )}
          </HStack>
          <HStack gap={2}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetToDefaults}
              disabled={isLoading || isSaving}
              color="text"
              borderColor="border"
            >
              <Icon as={MdRefresh} mr={2} />
              Reset to Defaults
            </Button>
            <Button
              size="sm"
              colorPalette="green"
              onClick={handleSave}
              disabled={!isDirty || isLoading || isSaving}
              loading={isSaving}
            >
              <Icon as={MdSave} mr={2} />
              Save Changes
            </Button>
          </HStack>
        </Flex>

        {/* Description */}
        <Text color="textMuted" fontSize="sm">
          Configure the commands available in the SFS Console. Each command runs inside the Docker container as:
          <Text as="span" fontFamily="mono" ml={2}>
            docker compose exec app bin/console app:strava:&#123;command&#125;
          </Text>
        </Text>

        {/* Message */}
        {message && (
          <Box
            p={3}
            borderRadius="md"
            bg={messageType === 'error' ? 'red.50' : 'green.50'}
            _dark={{ bg: messageType === 'error' ? 'red.900' : 'green.900' }}
          >
            <Text color={messageType === 'error' ? 'red.600' : 'green.600'}
              _dark={{ color: messageType === 'error' ? 'red.200' : 'green.200' }}>
              {message}
            </Text>
          </Box>
        )}

        {/* Commands List */}
        <Box
          bg="bg"
          borderRadius="lg"
          border="1px solid"
          borderColor="border"
          overflow="hidden"
        >
          {/* Header */}
          <Flex
            px={4}
            py={3}
            bg="panelBg"
            borderBottom="1px solid"
            borderColor="border"
            justify="space-between"
            align="center"
          >
            <Text fontWeight="medium" color="text">
              Commands ({commands.length})
            </Text>
            <Button
              size="sm"
              colorPalette="blue"
              onClick={startAdd}
              disabled={isAdding || editingId}
            >
              <Icon as={MdAdd} mr={2} />
              Add Command
            </Button>
          </Flex>

          {/* Loading state */}
          {isLoading ? (
            <Box p={6} textAlign="center">
              <Text color="textMuted">Loading commands...</Text>
            </Box>
          ) : (
            <VStack gap={0} align="stretch">
              {/* Add new command form */}
              {isAdding && (
                <Box
                  p={4}
                  borderBottom="1px solid"
                  borderColor="border"
                  bg="blue.50"
                  _dark={{ bg: 'blue.900' }}
                >
                  <VStack align="stretch" gap={3}>
                    <Text fontWeight="medium" color="text">New Command</Text>
                    <HStack gap={3} flexWrap="wrap">
                      <Box flex="1" minW="150px">
                        <Text fontSize="xs" color="textMuted" mb={1}>Name</Text>
                        <Input
                          size="sm"
                          value={newCommand.name}
                          onChange={(e) => setNewCommand(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Build Files"
                          bg="inputBg"
                        />
                      </Box>
                      <Box flex="1" minW="150px">
                        <Text fontSize="xs" color="textMuted" mb={1}>Command</Text>
                        <Input
                          size="sm"
                          value={newCommand.command}
                          onChange={(e) => setNewCommand(prev => ({ ...prev, command: e.target.value }))}
                          placeholder="e.g., build-files"
                          bg="inputBg"
                        />
                      </Box>
                    </HStack>
                    <Box>
                      <Text fontSize="xs" color="textMuted" mb={1}>Description</Text>
                      <Textarea
                        size="sm"
                        value={newCommand.description}
                        onChange={(e) => setNewCommand(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of what this command does"
                        rows={2}
                        bg="inputBg"
                      />
                    </Box>
                    <HStack justify="flex-end" gap={2}>
                      <Button size="sm" variant="ghost" onClick={cancelAdd}>
                        Cancel
                      </Button>
                      <Button size="sm" colorPalette="green" onClick={saveNewCommand}>
                        <Icon as={MdAdd} mr={1} />
                        Add
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              )}

              {/* Command items */}
              {commands.map((cmd, index) => (
                <Box
                  key={cmd.id}
                  p={4}
                  borderBottom={index < commands.length - 1 ? '1px solid' : 'none'}
                  borderColor="border"
                  _hover={{ bg: 'panelBg' }}
                  transition="background 0.2s"
                >
                  {editingId === cmd.id ? (
                    // Edit mode
                    <VStack align="stretch" gap={3}>
                      <HStack gap={3} flexWrap="wrap">
                        <Box flex="1" minW="150px">
                          <Text fontSize="xs" color="textMuted" mb={1}>Name</Text>
                          <Input
                            size="sm"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            bg="inputBg"
                          />
                        </Box>
                        <Box flex="1" minW="150px">
                          <Text fontSize="xs" color="textMuted" mb={1}>Command</Text>
                          <Input
                            size="sm"
                            value={editForm.command}
                            onChange={(e) => setEditForm(prev => ({ ...prev, command: e.target.value }))}
                            bg="inputBg"
                          />
                        </Box>
                      </HStack>
                      <Box>
                        <Text fontSize="xs" color="textMuted" mb={1}>Description</Text>
                        <Textarea
                          size="sm"
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={2}
                          bg="inputBg"
                        />
                      </Box>
                      <HStack justify="flex-end" gap={2}>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <Icon as={MdClose} mr={1} />
                          Cancel
                        </Button>
                        <Button size="sm" colorPalette="green" onClick={saveEdit}>
                          <Icon as={MdCheck} mr={1} />
                          Save
                        </Button>
                      </HStack>
                    </VStack>
                  ) : (
                    // View mode
                    <Flex justify="space-between" align="flex-start" gap={4}>
                      <HStack gap={3} align="flex-start">
                        <Icon as={MdDragIndicator} color="textMuted" cursor="grab" mt={1} />
                        <VStack align="flex-start" gap={1}>
                          <HStack gap={2}>
                            <Text fontWeight="medium" color="text">
                              {cmd.name}
                            </Text>
                            <Badge colorPalette="gray" variant="subtle" size="sm" fontFamily="mono">
                              {cmd.command}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="textMuted">
                            {cmd.description || 'No description'}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack gap={1} flexShrink={0}>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => startEdit(cmd)}
                          disabled={isAdding}
                          title="Edit command"
                          color="text"
                        >
                          <Icon as={MdEdit} />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDelete(cmd)}
                          disabled={isAdding}
                          title="Delete command"
                          color="text"
                          _hover={{ color: 'red.500' }}
                        >
                          <Icon as={MdDelete} />
                        </Button>
                      </HStack>
                    </Flex>
                  )}
                </Box>
              ))}

              {commands.length === 0 && !isAdding && (
                <Box p={6} textAlign="center">
                  <Text color="textMuted">No commands configured. Click "Add Command" to get started.</Text>
                </Box>
              )}
            </VStack>
          )}
        </Box>
      </VStack>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </Box>
  );
}
