import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Box, Button, Flex, Heading, Text, VStack, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import { MdClose, MdSave, MdBarChart, MdLightbulb } from 'react-icons/md';
import { readWidgetDefinitions } from '../../../src/utils/widgetDefinitionsManager';
import { ConfirmDialog } from '../../_components/ui/ConfirmDialog';
import DashboardWidgetItem from './dashboard/DashboardWidgetItem';
import { useDragAndDrop } from '../../../src/hooks/useDragAndDrop';

// Generate unique ID for widgets
let widgetIdCounter = 0;
const generateWidgetId = () => `widget-${Date.now()}-${++widgetIdCounter}`;

function DashboardEditor({ dashboardLayout, onClose, onSave }) {
  const [widgetDefinitions, setWidgetDefinitions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [layout, setLayout] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [expandedConfigs, setExpandedConfigs] = useState({});
  const [expandedWidgets, setExpandedWidgets] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, data: null });

  // Drag and drop reorder callback
  const handleReorder = useCallback((oldIndex, newIndex) => {
    setLayout(prevLayout => {
      const newLayout = [...prevLayout];
      const [movedItem] = newLayout.splice(oldIndex, 1);
      newLayout.splice(newIndex, 0, movedItem);
      return newLayout;
    });
    setIsDirty(true);
  }, []);

  // Initialize drag and drop hook
  const {
    draggedIndex,
    isPendingDrag,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDragAndDrop(handleReorder);

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
    // Add unique IDs to widgets if they don't have them
    const layoutWithIds = (dashboardLayout || []).map(widget => ({
      ...widget,
      _id: widget._id || generateWidgetId()
    }));
    setLayout(layoutWithIds);
  }, [dashboardLayout]);

  const moveUp = useCallback((index) => {
    if (index === 0) return;
    setLayout(prevLayout => {
      const newLayout = [...prevLayout];
      [newLayout[index - 1], newLayout[index]] = [newLayout[index], newLayout[index - 1]];
      return newLayout;
    });
    setIsDirty(true);
  }, []);

  const moveDown = useCallback((index) => {
    setLayout(prevLayout => {
      if (index === prevLayout.length - 1) return prevLayout;
      const newLayout = [...prevLayout];
      [newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
      return newLayout;
    });
    setIsDirty(true);
  }, []);



  const handleSave = useCallback(() => {
    // Remove _id before saving as it's only for internal tracking
    const layoutToSave = layout.map(({ _id, ...widget }) => widget);
    onSave(layoutToSave);
    setIsDirty(false);
  }, [layout, onSave]);

  const handleConfirmUnsavedChanges = useCallback(() => {
    setLayout(dashboardLayout || []);
    setIsDirty(false);
    onClose();
  }, [dashboardLayout, onClose]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        type: 'unsavedChanges',
        data: null
      });
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }, [handleCancel]);

  const handleDeleteWidget = useCallback((index) => {
    setConfirmDialog({
      isOpen: true,
      type: 'deleteWidget',
      data: index
    });
  }, []);

  const handleConfirmDeleteWidget = useCallback(() => {
    const newLayout = layout.filter((_, i) => i !== confirmDialog.data);
    setLayout(newLayout);
    setIsDirty(true);
    setConfirmDialog({ isOpen: false, type: null, data: null });
  }, [layout, confirmDialog.data]);

  const handleWidthChange = useCallback((index, newWidth) => {
    setLayout(prevLayout => {
      const newLayout = [...prevLayout];
      newLayout[index] = { ...newLayout[index], width: Number(newWidth) };
      return newLayout;
    });
    setIsDirty(true);
  }, []);

  const handleEnabledToggle = useCallback((index) => {
    setLayout(prevLayout => {
      const newLayout = [...prevLayout];
      newLayout[index] = { ...newLayout[index], enabled: !newLayout[index].enabled };
      return newLayout;
    });
    setIsDirty(true);
  }, []);

  const toggleWidgetExpansion = useCallback((index) => {
    setExpandedWidgets(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  const toggleConfigEditor = useCallback((index) => {
    setExpandedConfigs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  const handleConfigChange = useCallback((index, configKey, value) => {
    setLayout(prevLayout => {
      const newLayout = [...prevLayout];
      newLayout[index] = {
        ...newLayout[index],
        config: {
          ...newLayout[index].config,
          [configKey]: value
        }
      };
      return newLayout;
    });
    setIsDirty(true);
  }, []);

  const handleAddWidget = useCallback((widgetName) => {
    const widgetDef = widgetDefinitions[widgetName];
    if (!widgetDef) return;

    const newWidget = {
      _id: generateWidgetId(),
      widget: widgetName,
      width: 100,
      enabled: true
    };

    if (widgetDef.hasConfig) {
      newWidget.config = widgetDef.defaultConfig ? { ...widgetDef.defaultConfig } : {};
    }

    setLayout(prevLayout => [...prevLayout, newWidget]);
    setIsDirty(true);
  }, [widgetDefinitions]);

  // Memoize available widgets to avoid filtering/sorting on every render
  const availableWidgets = useMemo(() => {
    const widgetsInLayout = layout.map(w => w.widget);

    return Object.values(widgetDefinitions).filter(def => {
      if (def.allowMultiple) return true;
      return !widgetsInLayout.includes(def.name);
    }).sort((a, b) => {
      const nameA = a.displayName || a.name || '';
      const nameB = b.displayName || b.name || '';
      return nameA.localeCompare(nameB);
    });
  }, [layout, widgetDefinitions]);

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
            <MdClose />
          </Button>
        </Flex>

        {isLoading ? (
          <Box p={{ base: 8, sm: 10 }} textAlign="center" color="textMuted">
            <Text>Loading widget definitions...</Text>
          </Box>
        ) : (
          <>
            <VStack
              align="stretch"
              gap={3}
              flex="1"
              overflowY="auto"
              p={{ base: 3, sm: 4 }}
              minH="300px"
            >
              {!layout || layout.length === 0 ? (
                <Box textAlign="center" py={{ base: 8, sm: 12 }} px={4} color="textMuted">
                  <Box display="flex" justifyContent="center" mb={4}>
                    <MdBarChart size="48px" opacity={0.5} />
                  </Box>
                  <Heading size="sm" mb={2} color="text">No widgets in dashboard</Heading>
                  <Text fontSize="sm" mb={2}>Add widgets using the dropdown below to customize your dashboard layout.</Text>
                  <Flex
                    mt={5}
                    p={2}
                    bg="blue.500/10"
                    borderRadius="md"
                    display="inline-flex"
                    align="center"
                    gap={2}
                  >
                    <MdLightbulb />
                    <Text fontSize="xs" fontStyle="italic">
                      Tip: You can reorder widgets by dragging them or using the arrow buttons.
                    </Text>
                  </Flex>
                </Box>
              ) : (
                layout.map((widget, index) => (
                  <DashboardWidgetItem
                    key={widget._id}
                    widget={widget}
                    index={index}
                    isExpanded={expandedWidgets[index]}
                    isDragged={draggedIndex === index}
                    isPendingDrag={isPendingDrag}
                    isFirst={index === 0}
                    isLast={index === layout.length - 1}
                    widgetDefinitions={widgetDefinitions}
                    expandedConfigs={expandedConfigs}
                    onToggleExpansion={toggleWidgetExpansion}
                    onMoveUp={moveUp}
                    onMoveDown={moveDown}
                    onDelete={handleDeleteWidget}
                    onWidthChange={handleWidthChange}
                    onEnabledToggle={handleEnabledToggle}
                    onConfigChange={handleConfigChange}
                    onToggleConfigEditor={toggleConfigEditor}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onTouchStart={handleTouchStart}
                    onTouchMove={(e) => handleTouchMove(e, layout)}
                    onTouchEnd={handleTouchEnd}
                  />
                ))
              )}
            </VStack>

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
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  bg="inputBg"
                  fontSize="sm"
                >
                  <option value="" disabled>Select a widget to add...</option>
                  {availableWidgets.map(def => (
                    <option key={def.name} value={def.name}>
                      {def.displayName}
                      {def.allowMultiple ? ' (can add multiple)' : ''}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </Flex>

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
                <MdSave /> Save Changes{isDirty ? ' *' : ''}
              </Button>
            </Flex>
          </>
        )}

        <ConfirmDialog
          isOpen={confirmDialog.isOpen && confirmDialog.type === 'unsavedChanges'}
          onClose={() => setConfirmDialog({ isOpen: false, type: null, data: null })}
          onConfirm={handleConfirmUnsavedChanges}
          title="Unsaved Changes"
          message="You have unsaved changes. Discard them?"
          confirmText="Discard"
          cancelText="Keep Editing"
          confirmColorPalette="orange"
        />
        <ConfirmDialog
          isOpen={confirmDialog.isOpen && confirmDialog.type === 'deleteWidget'}
          onClose={() => setConfirmDialog({ isOpen: false, type: null, data: null })}
          onConfirm={handleConfirmDeleteWidget}
          title="Remove Widget"
          message={confirmDialog.type === 'deleteWidget' && confirmDialog.data !== null
            ? `Remove the ${widgetDefinitions[layout[confirmDialog.data]?.widget]?.displayName || layout[confirmDialog.data]?.widget || 'widget'} from the dashboard?`
            : 'Remove this widget from the dashboard?'}
          confirmText="Remove"
          cancelText="Cancel"
          confirmColorPalette="red"
        />
      </Box>
    </Box>
  );
}

export default memo(DashboardEditor);
