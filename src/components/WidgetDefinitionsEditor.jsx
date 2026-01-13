import React, { useState, useEffect } from 'react';
import { Box, VStack, Flex, HStack, Heading, Text, Button, Icon } from '@chakra-ui/react';
import { MdAdd, MdSave, MdRefresh, MdDescription, MdLightbulb } from 'react-icons/md';
import { readWidgetDefinitions, writeWidgetDefinitions, initialWidgetDefinitions } from '../utils/widgetDefinitionsManager';
import { getSetting } from '../utils/settingsManager';
import { ConfirmDialog } from '../../app/_components/ui/ConfirmDialog';
import WidgetListItem from './widgets/WidgetListItem';
import WidgetFormModal from './widgets/WidgetFormModal';
import { validateWidgetForm } from '../utils/widgetValidation';

export default function WidgetDefinitionsEditor({ settings, onDirtyChange }) {
  const [widgetDefinitions, setWidgetDefinitions] = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState(() => JSON.stringify([]));
  const [expandedWidgets, setExpandedWidgets] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  // Modal state
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [showEditWidgetModal, setShowEditWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    allowMultiple: false,
    hasConfig: false,
    configTemplate: '',
    defaultConfig: ''
  });

  useEffect(() => {
    async function load() {
      const definitions = await readWidgetDefinitions(settings);
      // Convert object to array
      const definitionsArray = Object.values(definitions);
      const snapshot = JSON.stringify(definitionsArray);
      setWidgetDefinitions(definitionsArray);
      setInitialSnapshot(snapshot);
      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
    }
    load();
  }, [settings, onDirtyChange]);

  // Track changes by comparing current state to initial snapshot
  useEffect(() => {
    const currentSnapshot = JSON.stringify(widgetDefinitions);
    const hasChanges = currentSnapshot !== initialSnapshot;
    
    // Use a microtask to avoid synchronous setState during render
    queueMicrotask(() => {
      setIsDirty(hasChanges);
      if (onDirtyChange) onDirtyChange(hasChanges);
    });
  }, [widgetDefinitions, initialSnapshot, onDirtyChange]);

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleWidget = (name) => {
    setExpandedWidgets(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const collapseAll = () => setExpandedWidgets({});

  const expandAll = () => {
    const expanded = {};
    widgetDefinitions.forEach(w => expanded[w.name] = true);
    setExpandedWidgets(expanded);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setModalError('');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      allowMultiple: false,
      hasConfig: false,
      configTemplate: '',
      defaultConfig: ''
    });
    setModalError('');
  };

  const handleAddWidget = () => {
    const validation = validateWidgetForm(formData, widgetDefinitions);
    if (!validation.isValid) {
      setModalError(validation.error);
      return;
    }

    // Parse defaultConfig if provided
    let parsedDefaultConfig = null;
    if (formData.hasConfig && formData.defaultConfig) {
      try {
        parsedDefaultConfig = JSON.parse(formData.defaultConfig);
      } catch {
        setModalError('Invalid JSON in Default Config field');
        return;
      }
    }

    const newWidget = {
      name: formData.name,
      displayName: formData.displayName,
      description: formData.description || '',
      allowMultiple: formData.allowMultiple,
      hasConfig: formData.hasConfig,
      ...(formData.hasConfig && formData.configTemplate ? { configTemplate: formData.configTemplate } : {}),
      ...(parsedDefaultConfig ? { defaultConfig: parsedDefaultConfig } : {})
    };

    setWidgetDefinitions([...widgetDefinitions, newWidget]);
    setShowAddWidgetModal(false);
    resetForm();
    showMessage('Widget definition added successfully');
  };

  const handleEditWidget = () => {
    if (!editingWidget) return;

    const validation = validateWidgetForm(formData, widgetDefinitions, editingWidget.name);
    if (!validation.isValid) {
      setModalError(validation.error);
      return;
    }

    // Parse defaultConfig if provided
    let parsedDefaultConfig = null;
    if (formData.hasConfig && formData.defaultConfig) {
      try {
        parsedDefaultConfig = JSON.parse(formData.defaultConfig);
      } catch {
        setModalError('Invalid JSON in Default Config field');
        return;
      }
    }

    const updatedWidget = {
      name: formData.name,
      displayName: formData.displayName,
      description: formData.description || '',
      allowMultiple: formData.allowMultiple,
      hasConfig: formData.hasConfig,
      ...(formData.hasConfig && formData.configTemplate ? { configTemplate: formData.configTemplate } : {}),
      ...(parsedDefaultConfig ? { defaultConfig: parsedDefaultConfig } : {})
    };

    const updatedDefinitions = widgetDefinitions.map(w =>
      w.name === editingWidget.name ? updatedWidget : w
    );

    setWidgetDefinitions(updatedDefinitions);
    setShowEditWidgetModal(false);
    setEditingWidget(null);
    resetForm();
    showMessage('Widget definition updated successfully');
  };

  const handleDeleteWidget = (name) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Widget Definition',
      message: `Are you sure you want to delete the widget definition "${name}"? This action cannot be undone.`,
      onConfirm: () => {
        const updatedDefinitions = widgetDefinitions.filter(w => w.name !== name);
        setWidgetDefinitions(updatedDefinitions);
        showMessage('Widget definition deleted successfully');
        setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
      }
    });
  };

  const handleSave = async () => {
    try {
      // Convert array back to object for saving
      const definitionsObject = widgetDefinitions.reduce((obj, widget) => {
        obj[widget.name] = widget;
        return obj;
      }, {});
      await writeWidgetDefinitions(definitionsObject);
      const snapshot = JSON.stringify(widgetDefinitions);
      setInitialSnapshot(snapshot);
      setIsDirty(false);
      showMessage('Widget definitions saved successfully');
    } catch (err) {
      console.error('Error saving widget definitions:', err);
      showMessage('Failed to save widget definitions', 'error');
    }
  };

  const handleReset = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Widget Definitions',
      message: 'Are you sure you want to reset to default widget definitions? All custom widgets will be lost.',
      onConfirm: () => {
        // Convert initial definitions object to array
        const initialArray = Object.values(initialWidgetDefinitions);
        setWidgetDefinitions(initialArray);
        showMessage('Widget definitions reset to defaults');
        setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
      }
    });
  };

  const openEditModal = (widget) => {
    setEditingWidget(widget);
    setFormData({
      name: widget.name,
      displayName: widget.displayName,
      description: widget.description || '',
      allowMultiple: widget.allowMultiple || false,
      hasConfig: widget.hasConfig || false,
      configTemplate: widget.configTemplate || '',
      defaultConfig: widget.defaultConfig ? JSON.stringify(widget.defaultConfig, null, 2) : ''
    });
    setShowEditWidgetModal(true);
  };

  // Group widgets by allowMultiple property
  const allowMultipleWidgets = widgetDefinitions.filter(w => w.allowMultiple);
  const allowOnceWidgets = widgetDefinitions.filter(w => !w.allowMultiple);

  // Get the settings location
  const defaultPath = getSetting('files.defaultPath', '~/Documents/strava-config-tool/');
  const settingsLocation = `${defaultPath}settings`;

  return (
    <Box p={6} bg="pageBg" minH="100vh">
      <VStack align="stretch" gap={4}>
        <Flex justify="space-between" align="center">
          <Heading as="h3" size="xl" color="text">Widget Definitions</Heading>
          <HStack>
            <Button
              onClick={() => setShowAddWidgetModal(true)}
              bg="primary"
              color="white"
              _hover={{ bg: "primaryHover" }}
              leftIcon={<Icon><MdAdd /></Icon>}
            >
              Add Widget
            </Button>
          </HStack>
        </Flex>

        <Flex
          align="center"
          gap={3}
          px={4}
          py={3}
          bg="infoBg"
          color="infoText"
          borderRadius="md"
          border="1px solid"
          borderColor="infoBorder"
        >
          <Icon fontSize="2xl"><MdDescription /></Icon>
          <VStack align="flex-start" gap={0} flex={1}>
            <Text fontWeight="bold" fontSize="sm">
              File Location: {settingsLocation}/widget-definitions.yaml
            </Text>
            <HStack gap={1} align="center">
              <Icon fontSize="sm"><MdLightbulb /></Icon>
              <Text fontSize="xs">
                Changes are in-memory only until you click "Save Changes"
              </Text>
            </HStack>
          </VStack>
        </Flex>

        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
          <HStack gap={2}>
            <Button onClick={collapseAll} variant="outline" size="sm">Collapse All</Button>
            <Button onClick={expandAll} variant="outline" size="sm">Expand All</Button>
            <Button onClick={handleReset} variant="outline" colorPalette="orange" size="sm" leftIcon={<Icon><MdRefresh /></Icon>}>
              Reset to Defaults
            </Button>
          </HStack>

          <Button
            onClick={handleSave}
            disabled={!isDirty}
            title={isDirty ? 'Save changes to widget definitions' : 'No changes to save'}
            bg="primary"
            color="white"
            _hover={{ bg: "primaryHover" }}
            border={isDirty ? "3px solid" : "none"}
            borderColor="primaryHover"
            boxShadow={isDirty ? { base: "0 0 8px rgba(252, 82, 0, 0.5)", _dark: "0 0 12px rgba(255, 127, 63, 0.8)" } : "none"}
            leftIcon={<Icon><MdSave /></Icon>}
          >
            Save Changes{isDirty ? ' *' : ''}
          </Button>
        </Flex>

        {message && (
          <Box
            p={3}
            mb={4}
            borderRadius="md"
            fontWeight="medium"
            bg={messageType === 'success' ? { base: "#d4edda", _dark: "#1e4620" } : { base: "#f8d7da", _dark: "#5a1a1a" }}
            color={messageType === 'success' ? { base: "#155724", _dark: "#86efac" } : { base: "#721c24", _dark: "#fca5a5" }}
            border="1px solid"
            borderColor={messageType === 'success' ? { base: "#c3e6cb", _dark: "#166534" } : { base: "#f5c6cb", _dark: "#991b1b" }}
          >
            {message}
          </Box>
        )}

        <Box p={3} bg="panelBg" borderRadius="md" border="1px solid" borderColor="border" mb={5}>
          <Text fontSize="sm" color="text">
            Widget definitions determine what widgets are available in the Dashboard editor. 
            Custom widgets can be added for future-proofing.
          </Text>
        </Box>

        {/* Widgets that allow multiple instances */}
        <VStack align="stretch" gap={5}>
          <Box>
            <Heading as="h4" size="md" color="text" mb={3}>
              Widgets that can be added multiple times ({allowMultipleWidgets.length})
            </Heading>
            <VStack gap={2} align="stretch">
              {allowMultipleWidgets.map(widget => (
                <WidgetListItem
                  key={widget.name}
                  widget={widget}
                  isExpanded={expandedWidgets[widget.name]}
                  onToggle={toggleWidget}
                  onEdit={openEditModal}
                  onDelete={handleDeleteWidget}
                />
              ))}
            </VStack>
          </Box>

          <Box>
            <Heading as="h4" size="md" color="text" mb={3}>
              Widgets that can be added once ({allowOnceWidgets.length})
            </Heading>
            <VStack gap={2} align="stretch">
              {allowOnceWidgets.map(widget => (
                <WidgetListItem
                  key={widget.name}
                  widget={widget}
                  isExpanded={expandedWidgets[widget.name]}
                  onToggle={toggleWidget}
                  onEdit={openEditModal}
                  onDelete={handleDeleteWidget}
                />
              ))}
            </VStack>
          </Box>
        </VStack>
      </VStack>

      {/* Add Widget Modal */}
      <WidgetFormModal
        isOpen={showAddWidgetModal}
        mode="add"
        formData={formData}
        onChange={handleFormChange}
        onSubmit={handleAddWidget}
        onClose={() => { setShowAddWidgetModal(false); resetForm(); }}
        error={modalError}
      />

      {/* Edit Widget Modal */}
      <WidgetFormModal
        isOpen={showEditWidgetModal}
        mode="edit"
        formData={formData}
        onChange={handleFormChange}
        onSubmit={handleEditWidget}
        onClose={() => { setShowEditWidgetModal(false); setEditingWidget(null); resetForm(); }}
        error={modalError}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.title === 'Reset Widget Definitions' ? 'Reset' : 'Delete'}
        confirmColorPalette="red"
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' })}
      />
    </Box>
  );
}
