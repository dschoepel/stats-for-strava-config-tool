import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Heading, Text, VStack, HStack, Input, Grid, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import { readWidgetDefinitions } from '../utils/widgetDefinitionsManager';

export default function DashboardEditor({ dashboardLayout, onClose, onSave }) {
  const [widgetDefinitions, setWidgetDefinitions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [layout, setLayout] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [expandedConfigs, setExpandedConfigs] = useState({});
  const [expandedWidgets, setExpandedWidgets] = useState({});

  useEffect(() => {
    async function loadDefinitions() {
      try {
        const definitions = await readWidgetDefinitions();
        setWidgetDefinitions(definitions);
      } catch (error) {
        console.error('Error loading widget definitions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDefinitions();
  }, []);

  useEffect(() => {
    // Initialize layout from props
    setLayout(dashboardLayout || []);
  }, [dashboardLayout]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  // Move widget up in the list
  const moveUp = (index) => {
    if (index === 0) return;
    const newLayout = [...layout];
    [newLayout[index - 1], newLayout[index]] = [newLayout[index], newLayout[index - 1]];
    setLayout(newLayout);
    setIsDirty(true);
  };

  // Move widget down in the list
  const moveDown = (index) => {
    if (index === layout.length - 1) return;
    const newLayout = [...layout];
    [newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
    setLayout(newLayout);
    setIsDirty(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newLayout = [...layout];
    const draggedItem = newLayout[draggedIndex];
    newLayout.splice(draggedIndex, 1);
    newLayout.splice(index, 0, draggedItem);
    
    setLayout(newLayout);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(layout);
    setIsDirty(false);
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard them?')) {
        setLayout(dashboardLayout || []);
        setIsDirty(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Delete widget from layout
  const handleDeleteWidget = (index) => {
    if (window.confirm('Remove this widget from the dashboard?')) {
      const newLayout = layout.filter((_, i) => i !== index);
      setLayout(newLayout);
      setIsDirty(true);
    }
  };

  // Update widget width
  const handleWidthChange = (index, newWidth) => {
    const newLayout = [...layout];
    newLayout[index] = { ...newLayout[index], width: Number(newWidth) };
    setLayout(newLayout);
    setIsDirty(true);
  };

  // Toggle widget enabled state
  const handleEnabledToggle = (index) => {
    const newLayout = [...layout];
    newLayout[index] = { ...newLayout[index], enabled: !newLayout[index].enabled };
    setLayout(newLayout);
    setIsDirty(true);
  };

  // Toggle widget expansion (show/hide details)
  const toggleWidgetExpansion = (index) => {
    setExpandedWidgets(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Toggle config editor expansion
  const toggleConfigEditor = (index) => {
    setExpandedConfigs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Update a config value
  const handleConfigChange = (index, configKey, value) => {
    const newLayout = [...layout];
    newLayout[index] = {
      ...newLayout[index],
      config: {
        ...newLayout[index].config,
        [configKey]: value
      }
    };
    setLayout(newLayout);
    setIsDirty(true);
  };

  // Add widget to layout
  const handleAddWidget = (widgetName) => {
    const widgetDef = widgetDefinitions[widgetName];
    if (!widgetDef) return;

    const newWidget = {
      name: widgetName,
      width: 100,
      enabled: true
    };

    // Add default config if widget has config options
    if (widgetDef.hasConfig && widgetDef.defaultConfig) {
      newWidget.config = { ...widgetDef.defaultConfig };
    }

    setLayout([...layout, newWidget]);
    setIsDirty(true);
  };

  // Get available widgets for the add dropdown
  const getAvailableWidgets = () => {
    const widgetsInLayout = layout.map(w => w.name);
    
    return Object.values(widgetDefinitions).filter(def => {
      // If widget allows multiple instances, always show it
      if (def.allowMultiple) return true;
      
      // If widget doesn't allow multiple instances, only show if not already in layout
      return !widgetsInLayout.includes(def.name);
    }).sort((a, b) => a.displayName.localeCompare(b.displayName));
  };

  // Get widget display name from definitions
  const getWidgetDisplayName = (widgetName) => {
    const def = widgetDefinitions[widgetName];
    return def ? def.displayName : widgetName;
  };

  // Get widget description from definitions
  const getWidgetDescription = (widgetName) => {
    const def = widgetDefinitions[widgetName];
    return def ? def.description : '';
  };

  // Convert config object to YAML string for display
  const configToYAML = (config, indent = 0) => {
    const spaces = '  '.repeat(indent);
    const lines = [];
    
    for (const [key, value] of Object.entries(config)) {
      // Check if this is a single-key nested object with the same key (flatten it)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const valueKeys = Object.keys(value);
        if (valueKeys.length === 1 && valueKeys[0] === key) {
          // Flatten: use the nested value directly
          const flatValue = value[key];
          if (Array.isArray(flatValue)) {
            if (flatValue.length === 0) {
              lines.push(`${spaces}${key}: []`);
            } else {
              lines.push(`${spaces}${key}:`);
              flatValue.forEach(item => {
                lines.push(`${spaces}  - ${item}`);
              });
            }
          } else {
            lines.push(`${spaces}${key}: ${flatValue}`);
          }
          continue;
        }
      }
      
      if (Array.isArray(value)) {
        if (value.length === 0) {
          lines.push(`${spaces}${key}: []`);
        } else {
          lines.push(`${spaces}${key}:`);
          value.forEach(item => {
            if (typeof item === 'string') {
              lines.push(`${spaces}  - ${item}`);
            } else {
              lines.push(`${spaces}  - ${item}`);
            }
          });
        }
      } else if (typeof value === 'object' && value !== null) {
        lines.push(`${spaces}${key}:`);
        lines.push(configToYAML(value, indent + 1));
      } else if (typeof value === 'string') {
        lines.push(`${spaces}${key}: "${value}"`);
      } else {
        lines.push(`${spaces}${key}: ${value}`);
      }
    }
    
    return lines.join('\n');
  };

  // Render appropriate input control based on config value type
  const renderConfigInput = (widgetIndex, configKey, configValue) => {
    // Handle number inputs
    if (typeof configValue === 'number') {
      const minValue = 0;
      const maxValue = configKey === 'enableLastXYearsByDefault' ? 50 : 100;
      
      return (
        <Input
          type="number"
          value={configValue}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (!isNaN(val) && val >= minValue && val <= maxValue) {
              handleConfigChange(widgetIndex, configKey, val);
            }
          }}
          min={minValue}
          max={maxValue}
          title={`Enter a number between ${minValue} and ${maxValue}`}
          bg="inputBg"
          width="150px"
          size="sm"
        />
      );
    }
    
    // Handle boolean inputs
    if (typeof configValue === 'boolean') {
      return (
        <Flex align="center" gap={2}>
          <Input
            type="checkbox"
            checked={configValue}
            onChange={(e) => handleConfigChange(widgetIndex, configKey, e.target.checked)}
            width="auto"
            height="auto"
            cursor="pointer"
            accentColor="green.500"
          />
          <Text fontSize="sm">{configValue ? 'Yes' : 'No'}</Text>
        </Flex>
      );
    }
    
    // Handle array inputs (simple tag/multi-select)
    if (Array.isArray(configValue)) {
      const availableOptions = ['distance', 'movingTime', 'elevation', 'activities'];
      
      return (
        <VStack align="stretch" gap={2} flex="1">
          <Flex wrap="wrap" gap={2} minH="32px">
            {configValue.map((item, itemIndex) => (
              <Flex
                key={itemIndex}
                align="center"
                gap={1}
                px={2}
                py={1}
                bg="cardBg"
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                fontSize="sm"
              >
                <Text>{item}</Text>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    const newArray = configValue.filter((_, i) => i !== itemIndex);
                    handleConfigChange(widgetIndex, configKey, newArray);
                  }}
                  title="Remove item"
                  px={1}
                  minW="auto"
                  h="auto"
                >
                  ✕
                </Button>
              </Flex>
            ))}
          </Flex>
          <NativeSelectRoot maxW="200px">
            <NativeSelectField
              value=""
              onChange={(e) => {
                if (e.target.value && !configValue.includes(e.target.value)) {
                  handleConfigChange(widgetIndex, configKey, [...configValue, e.target.value]);
                }
              }}
              bg="inputBg"
              size="sm"
            >
              <option value="">+ Add item...</option>
              {availableOptions.filter(opt => !configValue.includes(opt)).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        </VStack>
      );
    }
    
    // Handle nested objects (show as read-only for now)
    if (typeof configValue === 'object' && configValue !== null) {
      return (
        <Text fontSize="sm" color="textMuted" fontStyle="italic">
          Complex configuration - use Widget Definitions Editor in Settings
        </Text>
      );
    }
    
    // Fallback for string or other types
    return (
      <Input
        type="text"
        value={configValue}
        onChange={(e) => handleConfigChange(widgetIndex, configKey, e.target.value)}
        bg="inputBg"
        flex="1"
        maxW="200px"
        size="sm"
      />
    );
  };

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
      onClick={handleOverlayClick}
    >
      <Box
        bg="bg"
        borderRadius="lg"
        boxShadow="lg"
        maxW={{ base: "95%", sm: "90%", md: "800px" }}
        w="full"
        maxH="85vh"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          p={{ base: 3, sm: 4 }}
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Heading size={{ base: "md", sm: "lg" }}>Dashboard Layout Editor</Heading>
          <Button
            onClick={onClose}
            variant="ghost"
            size={{ base: "xs", sm: "sm" }}
            title="Close"
          >
            ✕
          </Button>
        </Flex>

        {isLoading ? (
          <Box p={{ base: 8, sm: 10 }} textAlign="center" color="textMuted">
            <Text>Loading widget definitions...</Text>
          </Box>
        ) : (
          <>
            {/* Info Section */}
            <Box
              p={{ base: 3, sm: 3 }}
              bg="blue.500/10"
              borderLeftWidth="4px"
              borderLeftColor="blue.500"
              borderRadius="md"
              mx={{ base: 3, sm: 4 }}
              mt={{ base: 3, sm: 4 }}
            >
              <Flex
                direction={{ base: "column", sm: "row" }}
                justify="space-between"
                align={{ base: "stretch", sm: "center" }}
                gap={3}
              >
                <Text fontSize={{ base: "sm", sm: "md" }}>
                  {layout && layout.length > 0 
                    ? `${layout.length} widget${layout.length !== 1 ? 's' : ''} in dashboard layout`
                    : 'No widgets configured in dashboard'}
                </Text>
                {layout && layout.length > 0 && (
                  <Button
                    onClick={() => {
                      if (window.confirm('Reset to default layout? This will remove all widgets and cannot be undone.')) {
                        setLayout([]);
                        setIsDirty(true);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    colorPalette="orange"
                    title="Clear all widgets"
                  >
                    🔄 Reset
                  </Button>
                )}
              </Flex>
              {isDirty && (
                <Text fontSize="sm" color="orange.500" fontWeight="600" mt={2}>
                  ⚠️ You have unsaved changes
                </Text>
              )}
            </Box>

            {/* Widgets List */}
            <VStack
              align="stretch"
              gap={1}
              flex="1"
              overflowY="auto"
              p={{ base: 3, sm: 4 }}
              minH="300px"
            >
              {!layout || layout.length === 0 ? (
                <Box textAlign="center" py={{ base: 8, sm: 12 }} px={4} color="textMuted">
                  <Text fontSize="3xl" mb={4} opacity={0.5}>📊</Text>
                  <Heading size="sm" mb={2} color="text">No widgets in dashboard</Heading>
                  <Text fontSize="sm" mb={2}>Add widgets using the dropdown below to customize your dashboard layout.</Text>
                  <Box
                    mt={5}
                    p={2}
                    bg="blue.500/10"
                    borderRadius="md"
                    display="inline-block"
                  >
                    <Text fontSize="xs" fontStyle="italic">
                      💡 Tip: You can reorder widgets by dragging them or using the arrow buttons.
                    </Text>
                  </Box>
                </Box>
              ) : (
                layout.map((widget, index) => (
                  <Box
                    key={index}
                    bg="cardBg"
                    borderWidth="1px"
                    borderColor={draggedIndex === index ? "blue.500" : "border"}
                    borderRadius="md"
                    p={{ base: 2, sm: expandedWidgets[index] ? 4 : 2 }}
                    opacity={draggedIndex === index ? 0.5 : 1}
                    transition="all 0.2s"
                    cursor="grab"
                    _hover={{
                      borderColor: "borderHover",
                      boxShadow: "md"
                    }}
                    _active={{ cursor: "grabbing" }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    {/* Widget Header */}
                    <Flex
                      align="center"
                      gap={{ base: 2, sm: 3 }}
                      mb={expandedWidgets[index] ? 3 : 0}
                    >
                      <Text fontSize="xl" color="textMuted" cursor="grab" userSelect="none" title="Drag to reorder">
                        ⋮⋮
                      </Text>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => toggleWidgetExpansion(index)}
                        title={expandedWidgets[index] ? "Collapse" : "Expand"}
                        px={1}
                        minW="auto"
                      >
                        {expandedWidgets[index] ? '▼' : '▶'}
                      </Button>
                      <Box flex="1" minH="32px" display="flex" alignItems="center">
                        <Flex align="center" gap={2} wrap="wrap">
                          <Text
                            fontSize={{ base: "md", sm: "lg" }}
                            fontWeight="600"
                            title={getWidgetDescription(widget.name)}
                          >
                            {getWidgetDisplayName(widget.name)}
                          </Text>
                          <Text fontSize="sm" color="textMuted" fontFamily="mono">
                            ({widget.name})
                          </Text>
                        </Flex>
                      </Box>
                      <Flex gap={{ base: 0, sm: 1 }} flexShrink={0}>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          title="Move up"
                          minW={{ base: "24px", sm: "32px" }}
                          px={{ base: 0, sm: 1 }}
                          fontSize={{ base: "10px", sm: "sm" }}
                          h={{ base: "24px", sm: "auto" }}
                        >
                          ▲
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => moveDown(index)}
                          disabled={index === layout.length - 1}
                          title="Move down"
                          minW={{ base: "24px", sm: "32px" }}
                          px={{ base: 0, sm: 1 }}
                          fontSize={{ base: "10px", sm: "sm" }}
                          h={{ base: "24px", sm: "auto" }}
                        >
                          ▼
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          colorPalette="red"
                          onClick={() => handleDeleteWidget(index)}
                          title="Remove widget"
                          minW={{ base: "24px", sm: "32px" }}
                          px={{ base: 0, sm: 1 }}
                          fontSize={{ base: "10px", sm: "sm" }}
                          h={{ base: "24px", sm: "auto" }}
                        >
                          🗑️
                        </Button>
                      </Flex>
                    </Flex>

                    {/* Widget Properties (when expanded) */}
                    {expandedWidgets[index] && (
                      <>
                        <Flex
                          wrap="wrap"
                          gap={4}
                          align="center"
                          pt={3}
                          borderTopWidth="1px"
                          borderColor="border"
                        >
                          {/* Width */}
                          <Flex align="center" gap={2} fontSize="sm">
                            <Text fontWeight="500" color="textSecondary" minW="80px">Width:</Text>
                            <NativeSelectRoot width="120px">
                              <NativeSelectField
                                value={widget.width}
                                onChange={(e) => handleWidthChange(index, e.target.value)}
                                title="Widget width as percentage"
                                bg="inputBg"
                                size="sm"
                              >
                                <option value="33">33%</option>
                                <option value="50">50%</option>
                                <option value="66">66%</option>
                                <option value="100">100%</option>
                              </NativeSelectField>
                            </NativeSelectRoot>
                          </Flex>

                          {/* Enabled Toggle */}
                          <Flex align="center" gap={2} fontSize="sm">
                            <Text fontWeight="500" color="textSecondary" minW="80px">Enabled:</Text>
                            <Button
                              onClick={() => handleEnabledToggle(index)}
                              size="sm"
                              variant="solid"
                              colorPalette={widget.enabled ? "green" : "orange"}
                              title={widget.enabled ? 'Click to disable' : 'Click to enable'}
                              minW="90px"
                            >
                              {widget.enabled ? 'Yes' : 'No'}
                            </Button>
                          </Flex>

                          {/* Config Info */}
                          {widget.config && Object.keys(widget.config).length > 0 && (
                            <Flex align="center" gap={2} fontSize="sm" position="relative">
                              <Text fontWeight="500" color="textSecondary">Config:</Text>
                              <Text
                                color="text"
                                fontFamily="mono"
                                fontSize="xs"
                                borderBottomWidth="1px"
                                borderBottomStyle="dashed"
                                borderBottomColor="textMuted"
                                cursor="help"
                                title={configToYAML(widget.config)}
                              >
                                ✓ {Object.keys(widget.config).length} setting{Object.keys(widget.config).length !== 1 ? 's' : ''}
                              </Text>
                              <Button
                                onClick={() => toggleConfigEditor(index)}
                                size="xs"
                                variant="outline"
                                title="Edit configuration"
                              >
                                {expandedConfigs[index] ? '▼' : '▶'} Edit
                              </Button>
                            </Flex>
                          )}
                        </Flex>

                        {/* Expandable Config Editor */}
                        {expandedConfigs[index] && widget.config && (
                          <Box
                            mt={3}
                            p={4}
                            bg="blue.500/5"
                            borderWidth="1px"
                            borderColor="blue.500/20"
                            borderRadius="md"
                          >
                            <Text fontWeight="600" mb={3} fontSize="sm">
                              Configuration Settings
                            </Text>
                            <VStack align="stretch" gap={3}>
                              {Object.entries(widget.config).map(([configKey, configValue]) => (
                                <Flex key={configKey} align="flex-start" gap={3} fontSize="sm">
                                  <Text
                                    fontWeight="500"
                                    color="textSecondary"
                                    minW="180px"
                                    pt={1.5}
                                  >
                                    {configKey}:
                                  </Text>
                                  {renderConfigInput(index, configKey, configValue)}
                                </Flex>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                ))
              )}
            </VStack>

            {/* Add Widget Section */}
            <Flex
              align="center"
              gap={3}
              p={4}
              mx={{ base: 3, sm: 4 }}
              mb={{ base: 3, sm: 4 }}
              bg="cardBg"
              borderWidth="2px"
              borderStyle="dashed"
              borderColor="border"
              borderRadius="md"
            >
              <Text fontWeight="600" fontSize="sm" whiteSpace="nowrap">
                Add Widget:
              </Text>
              <NativeSelectRoot flex="1">
                <NativeSelectField
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddWidget(e.target.value);
                      e.target.value = ''; // Reset dropdown
                    }
                  }}
                  defaultValue=""
                  bg="inputBg"
                  fontSize="sm"
                >
                  <option value="" disabled>Select a widget to add...</option>
                  {getAvailableWidgets().map(def => (
                    <option key={def.name} value={def.name}>
                      {def.displayName}
                      {def.allowMultiple ? ' (can add multiple)' : ''}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </Flex>

            {/* Footer Actions */}
            <Flex
              direction={{ base: "column-reverse", sm: "row" }}
              justify="flex-end"
              gap={3}
              p={{ base: 3, sm: 4 }}
              borderTopWidth="1px"
              borderColor="border"
            >
              <Button
                onClick={handleCancel}
                variant="outline"
                width={{ base: "100%", sm: "auto" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty}
                colorPalette="blue"
                width={{ base: "100%", sm: "auto" }}
              >
                💾 Save Changes{isDirty ? ' *' : ''}
              </Button>
            </Flex>
          </>
        )}
      </Box>
    </Box>
  );
}
