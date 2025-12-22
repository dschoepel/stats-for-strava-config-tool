import React, { useEffect, useState } from 'react';
import { Box, VStack, HStack, Flex, Heading, Text, Button, Input, Textarea, Icon, IconButton, Code, Field } from '@chakra-ui/react';
import { Checkbox } from '@chakra-ui/react';
import { MdExpandMore, MdChevronRight, MdAdd, MdDelete, MdEdit, MdSave, MdRefresh } from 'react-icons/md';
import { 
  readWidgetDefinitions, 
  writeWidgetDefinitions, 
  initialWidgetDefinitions
} from '../utils/widgetDefinitionsManager';
import { getSetting } from '../utils/settingsManager';

export default function WidgetDefinitionsEditor({ settings, onDirtyChange }) {
  const [widgetDefinitions, setWidgetDefinitions] = useState(initialWidgetDefinitions);
  const [expandedWidgets, setExpandedWidgets] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [isDirty, setIsDirty] = useState(false);
  
  // Modal states
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [showEditWidgetModal, setShowEditWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [modalError, setModalError] = useState('');
  
  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    allowMultiple: false,
    hasConfig: false,
    configTemplate: ''
  });

  useEffect(() => {
    async function load() {
      const definitions = await readWidgetDefinitions(settings);
      setWidgetDefinitions(definitions);
      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
    }
    load();
  }, [settings, onDirtyChange]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleWidget = (widgetName) => {
    setExpandedWidgets(prev => ({
      ...prev,
      [widgetName]: !prev[widgetName]
    }));
  };

  const collapseAll = () => {
    setExpandedWidgets({});
  };

  const expandAll = () => {
    const expanded = {};
    Object.keys(widgetDefinitions).forEach(name => expanded[name] = true);
    setExpandedWidgets(expanded);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setModalError('Widget name cannot be empty');
      return false;
    }
    
    // Check camelCase format
    if (!/^[a-z][a-zA-Z0-9]*$/.test(formData.name)) {
      setModalError('Widget name must be in camelCase (start with lowercase, no spaces)');
      return false;
    }
    
    if (!formData.displayName.trim()) {
      setModalError('Display name cannot be empty');
      return false;
    }
    
    // Check for duplicate name (only if adding or changing name)
    if (!editingWidget || editingWidget.name !== formData.name) {
      if (widgetDefinitions[formData.name]) {
        setModalError('Widget name already exists');
        return false;
      }
    }
    
    return true;
  };

  const handleAddWidget = () => {
    if (!validateForm()) return;
    
    const newDefinition = {
      name: formData.name.trim(),
      displayName: formData.displayName.trim(),
      description: formData.description.trim(),
      allowMultiple: formData.allowMultiple,
      hasConfig: formData.hasConfig,
      ...(formData.hasConfig && { configTemplate: formData.configTemplate.trim() })
    };
    
    setWidgetDefinitions({
      ...widgetDefinitions,
      [newDefinition.name]: newDefinition
    });
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
    setShowAddWidgetModal(false);
    resetForm();
    showMessage(`Widget "${newDefinition.displayName}" added`, 'success');
  };

  const handleEditWidget = () => {
    if (!validateForm()) return;
    
    const updatedDefinition = {
      name: formData.name.trim(),
      displayName: formData.displayName.trim(),
      description: formData.description.trim(),
      allowMultiple: formData.allowMultiple,
      hasConfig: formData.hasConfig,
      ...(formData.hasConfig && { configTemplate: formData.configTemplate.trim() })
    };
    
    const updated = { ...widgetDefinitions };
    
    // If name changed, remove old entry
    if (editingWidget.name !== updatedDefinition.name) {
      delete updated[editingWidget.name];
    }
    
    updated[updatedDefinition.name] = updatedDefinition;
    
    setWidgetDefinitions(updated);
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
    setShowEditWidgetModal(false);
    setEditingWidget(null);
    resetForm();
    showMessage('Widget definition updated', 'success');
  };

  const handleDeleteWidget = async (widgetName) => {
    if (window.confirm(`Delete widget "${widgetDefinitions[widgetName].displayName}"?`)) {
      const updated = { ...widgetDefinitions };
      delete updated[widgetName];
      setWidgetDefinitions(updated);
      setIsDirty(true);
      if (onDirtyChange) onDirtyChange(true);
      showMessage(`Widget "${widgetDefinitions[widgetName].displayName}" deleted`, 'success');
    }
  };

  const handleSave = async () => {
    try {
      await writeWidgetDefinitions(widgetDefinitions);
      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
      showMessage('✅ Saved successfully!', 'success');
    } catch (err) {
      showMessage(`❌ Error saving: ${err.message}`, 'error');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all widget definitions to defaults? This will delete any custom widgets you have added.')) {
      setWidgetDefinitions(initialWidgetDefinitions);
      setIsDirty(true);
      if (onDirtyChange) onDirtyChange(true);
      showMessage('Widget definitions reset to defaults', 'success');
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddWidgetModal(true);
  };

  const openEditModal = (widget) => {
    setEditingWidget(widget);
    setFormData({
      name: widget.name,
      displayName: widget.displayName,
      description: widget.description || '',
      allowMultiple: widget.allowMultiple || false,
      hasConfig: widget.hasConfig || false,
      configTemplate: widget.configTemplate || ''
    });
    setShowEditWidgetModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      allowMultiple: false,
      hasConfig: false,
      configTemplate: ''
    });
    setModalError('');
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setModalError('');
  };

  // Group widgets by type
  const allowMultipleWidgets = Object.values(widgetDefinitions).filter(w => w.allowMultiple);
  const allowOnceWidgets = Object.values(widgetDefinitions).filter(w => !w.allowMultiple);

  return (
    <Box p={5} bg="cardBg" border="1px solid" borderColor="border" borderRadius="md" w="100%" h="100%">
      <VStack align="stretch" gap={4} mb={5}>
        <Box p={3} bg="panelBg" borderRadius="md" border="1px solid" borderColor="border">
          <Text fontSize="sm" color="text" mb={2}>
            📄 Widget definitions are saved to: <Code bg="inputBg" px={2} py={1} borderRadius="sm">{getSetting('files.defaultPath', '~/Documents/strava-config-tool/')}settings/widget-definitions.yaml</Code>
          </Text>
          <Text fontSize="sm" color="textMuted">
            💡 <Text as="strong" color="text">Note:</Text> Changes to individual widgets are saved in memory. Click the <Text as="strong" color="text">Save</Text> button below to write all changes to the file.
          </Text>
        </Box>
      </VStack>
      
      <Flex
        justify="space-between"
        align="center"
        mb={5}
        pb={4}
        borderBottom="2px solid"
        borderColor="border"
      >
        <Heading as="h3" size="lg" color="text">
          Widget Definitions
        </Heading>
        <HStack gap={3}>
          <Button
            onClick={collapseAll}
            title="Collapse all widgets"
            size="sm"
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            leftIcon={<Icon><MdChevronRight /></Icon>}
          >
            Collapse
          </Button>
          <Button
            onClick={expandAll}
            title="Expand all widgets"
            size="sm"
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            leftIcon={<Icon><MdExpandMore /></Icon>}
          >
            Expand
          </Button>
          <Button
            onClick={handleReset}
            title="Reset to default widget definitions"
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            leftIcon={<Icon><MdRefresh /></Icon>}
          >
            Reset
          </Button>
          <Button
            onClick={openAddModal}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            leftIcon={<Icon><MdAdd /></Icon>}
          >
            Widget
          </Button>
          <Button
            onClick={handleSave}
            isDisabled={!isDirty}
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
        </HStack>
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
              <Box
                key={widget.name}
                border="1px solid"
                borderColor="border"
                borderRadius="md"
                overflow="hidden"
                bg="cardBg"
              >
                <Flex
                  justify="space-between"
                  align="center"
                  bg="panelBg"
                >
                  <Button
                    onClick={() => toggleWidget(widget.name)}
                    variant="ghost"
                    flex={1}
                    justifyContent="flex-start"
                    px={4}
                    py={3}
                    borderRadius={0}
                    _hover={{ bg: { base: "#e9ecef", _dark: "#334155" } }}
                  >
                    <HStack gap={3} flex={1}>
                      <Icon fontSize="xl">
                        {expandedWidgets[widget.name] ? <MdExpandMore /> : <MdChevronRight />}
                      </Icon>
                      <Text fontWeight="semibold" fontSize="md" color="text">
                        {widget.displayName}
                      </Text>
                      <Box
                        px={2}
                        py={1}
                        borderRadius="md"
                        bg={widget.hasConfig ? "primary" : "panelBg"}
                        color={widget.hasConfig ? "white" : "textMuted"}
                        fontSize="xs"
                        fontWeight="medium"
                      >
                        {widget.hasConfig ? 'Config' : 'No Config'}
                      </Box>
                    </HStack>
                  </Button>
                  <HStack gap={1} px={2}>
                    <IconButton
                      onClick={() => openEditModal(widget)}
                      title="Edit widget definition"
                      aria-label="Edit widget"
                      size="sm"
                      variant="ghost"
                      colorPalette="gray"
                    >
                      <Icon><MdEdit /></Icon>
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteWidget(widget.name)}
                      title="Delete widget definition"
                      aria-label="Delete widget"
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                    >
                      <Icon><MdDelete /></Icon>
                    </IconButton>
                  </HStack>
                </Flex>

                {expandedWidgets[widget.name] && (
                  <Box px={4} py={3} bg={{ base: "#f8f9fa", _dark: "#0f172a" }}>
                    <VStack align="stretch" gap={2}>
                      <HStack>
                        <Text fontWeight="bold" color="text">Name:</Text>
                        <Code bg="inputBg" px={2} py={1} borderRadius="sm">{widget.name}</Code>
                      </HStack>
                      <HStack align="flex-start">
                        <Text fontWeight="bold" color="text">Description:</Text>
                        <Text color="text">{widget.description}</Text>
                      </HStack>
                      {widget.hasConfig && widget.configTemplate && (
                        <Box>
                          <Text fontWeight="bold" color="text" mb={2}>Config Template:</Text>
                          <Box
                            as="pre"
                            bg="inputBg"
                            p={3}
                            borderRadius="md"
                            border="1px solid"
                            borderColor="border"
                            fontSize="sm"
                            overflowX="auto"
                            color="text"
                          >
                            {widget.configTemplate}
                          </Box>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Widgets that allow only one instance */}
        <Box>
          <Heading as="h4" size="md" color="text" mb={3}>
            Widgets that can be added once only ({allowOnceWidgets.length})
          </Heading>
          <VStack gap={2} align="stretch">
            {allowOnceWidgets.map(widget => (
              <Box
                key={widget.name}
                border="1px solid"
                borderColor="border"
                borderRadius="md"
                overflow="hidden"
                bg="cardBg"
              >
                <Flex
                  justify="space-between"
                  align="center"
                  bg="panelBg"
                >
                  <Button
                    onClick={() => toggleWidget(widget.name)}
                    variant="ghost"
                    flex={1}
                    justifyContent="flex-start"
                    px={4}
                    py={3}
                    borderRadius={0}
                    _hover={{ bg: { base: "#e9ecef", _dark: "#334155" } }}
                  >
                    <HStack gap={3} flex={1}>
                      <Icon fontSize="xl">
                        {expandedWidgets[widget.name] ? <MdExpandMore /> : <MdChevronRight />}
                      </Icon>
                      <Text fontWeight="semibold" fontSize="md" color="text">
                        {widget.displayName}
                      </Text>
                      <Box
                        px={2}
                        py={1}
                        borderRadius="md"
                        bg={widget.hasConfig ? "primary" : "panelBg"}
                        color={widget.hasConfig ? "white" : "textMuted"}
                        fontSize="xs"
                        fontWeight="medium"
                      >
                        {widget.hasConfig ? 'Config' : 'No Config'}
                      </Box>
                    </HStack>
                  </Button>
                  <HStack gap={1} px={2}>
                    <IconButton
                      onClick={() => openEditModal(widget)}
                      title="Edit widget definition"
                      aria-label="Edit widget"
                      size="sm"
                      variant="ghost"
                      colorPalette="gray"
                    >
                      <Icon><MdEdit /></Icon>
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteWidget(widget.name)}
                      title="Delete widget definition"
                      aria-label="Delete widget"
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                    >
                      <Icon><MdDelete /></Icon>
                    </IconButton>
                  </HStack>
                </Flex>

                {expandedWidgets[widget.name] && (
                  <Box px={4} py={3} bg={{ base: "#f8f9fa", _dark: "#0f172a" }}>
                    <VStack align="stretch" gap={2}>
                      <HStack>
                        <Text fontWeight="bold" color="text">Name:</Text>
                        <Code bg="inputBg" px={2} py={1} borderRadius="sm">{widget.name}</Code>
                      </HStack>
                      <HStack align="flex-start">
                        <Text fontWeight="bold" color="text">Description:</Text>
                        <Text color="text">{widget.description}</Text>
                      </HStack>
                      {widget.hasConfig && widget.configTemplate && (
                        <Box>
                          <Text fontWeight="bold" color="text" mb={2}>Config Template:</Text>
                          <Box
                            as="pre"
                            bg="inputBg"
                            p={3}
                            borderRadius="md"
                            border="1px solid"
                            borderColor="border"
                            fontSize="sm"
                            overflowX="auto"
                            color="text"
                          >
                            {widget.configTemplate}
                          </Box>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>

      {/* Add Widget Modal */}
      {showAddWidgetModal && (
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
          onClick={() => { setShowAddWidgetModal(false); resetForm(); }}
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
                Add Custom Widget
              </Heading>
            </Flex>

            <Box px={6} py={4} overflowY="auto" bg="cardBg">
              {modalError && (
                <Box
                  mb={4}
                  p={3}
                  borderRadius="md"
                  bg={{ base: "#f8d7da", _dark: "#7f1d1d" }}
                  color={{ base: "#721c24", _dark: "#fca5a5" }}
                  border="1px solid"
                  borderColor={{ base: "#f5c6cb", _dark: "#991b1b" }}
                >
                  {modalError}
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
                onClick={() => { setShowAddWidgetModal(false); resetForm(); }}
                variant="outline"
                colorPalette="gray"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddWidget}
                bg="primary"
                color="white"
                _hover={{ bg: "primaryHover" }}
              >
                Add Widget
              </Button>
            </Flex>
          </Flex>
        </Flex>
      )}

      {/* Edit Widget Modal */}
      {showEditWidgetModal && editingWidget && (
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
          onClick={() => { setShowEditWidgetModal(false); setEditingWidget(null); resetForm(); }}
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
                Edit Widget Definition
              </Heading>
            </Flex>

            <Box px={6} py={4} overflowY="auto" bg="cardBg">
              {modalError && (
                <Box
                  mb={4}
                  p={3}
                  borderRadius="md"
                  bg={{ base: "#f8d7da", _dark: "#7f1d1d" }}
                  color={{ base: "#721c24", _dark: "#fca5a5" }}
                  border="1px solid"
                  borderColor={{ base: "#f5c6cb", _dark: "#991b1b" }}
                >
                  {modalError}
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
                onClick={() => { setShowEditWidgetModal(false); setEditingWidget(null); resetForm(); }}
                variant="outline"
                colorPalette="gray"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditWidget}
                bg="primary"
                color="white"
                _hover={{ bg: "primaryHover" }}
              >
                Save Changes
              </Button>
            </Flex>
          </Flex>
        </Flex>
      )}
    </Box>
  );
}
