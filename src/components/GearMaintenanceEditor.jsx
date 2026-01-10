import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Stack,
  Text,
  Button,
  Input,
  Switch,
  IconButton,
  Accordion,
  Select,
  Spinner,
  Flex,
  Grid,
  createListCollection,
  Checkbox
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { MdAdd, MdDelete, MdImage, MdExpandMore, MdChevronRight, MdSave, MdClose } from 'react-icons/md';
import { useToast } from '../hooks/useToast';
import { getSetting } from '../utils/settingsManager';
import { gearMaintenanceSchema, validateGearMaintenanceConfig } from '../schemas/gearMaintenanceSchema';
import { loadGearMaintenance, saveGearMaintenance } from '../services';
import ImagePicker from './gear-maintenance/ImagePicker';
import ImageThumbnail from './gear-maintenance/ImageThumbnail';
import { Tooltip } from './Tooltip';
import { ConfirmDialog } from './ConfirmDialog';

// Create list collections for Select components
const resetModeCollection = createListCollection({
  items: [
    { label: 'Next Activity Onwards', value: 'nextActivityOnwards' },
    { label: 'Current Activity Onwards', value: 'currentActivityOnwards' }
  ]
});

const intervalUnitCollection = createListCollection({
  items: [
    { label: 'Kilometers', value: 'km' },
    { label: 'Miles', value: 'mi' },
    { label: 'Hours', value: 'hours' },
    { label: 'Days', value: 'days' }
  ]
});

const GearMaintenanceEditor = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState(null);
  const [expandedComponents, setExpandedComponents] = useState({});
  const [expandedMaintenanceTasks, setExpandedMaintenanceTasks] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, data: null });
  const addTaskTimerRef = useRef(null);
  const { showSuccess, showError } = useToast();

  // Get gear maintenance path from settings
  const gearMaintenancePath = getSetting('files.gearMaintenancePath', '/data/statistics-for-strava/storage/gear-maintenance');

  const loadConfig = async () => {
    setLoading(true);
    try {
      // Get settings for default path
      const settingsStr = localStorage.getItem('stats-for-strava-settings');
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      const defaultPath = settings.files?.defaultPath || '';

      const data = await loadGearMaintenance(defaultPath);

      if (data.success) {
        // Ensure config has the correct structure
        const normalizedConfig = {
          enabled: data.config.enabled ?? true,
          hashtagPrefix: data.config.hashtagPrefix ?? 'sfs',
          countersResetMode: data.config.countersResetMode ?? 'nextActivityOnwards',
          ignoreRetiredGear: data.config.ignoreRetiredGear ?? false,
          components: data.config.components || [],
          gears: data.config.gears || []
        };

        setConfig(normalizedConfig);
      } else {
        throw new Error(data.error || 'Failed to load configuration');
      }
    } catch (error) {
      showError(`Error loading configuration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    // Validate that all components have at least one gear attached
    const componentsWithoutGear = config.components.filter(c => !c.attachedTo || c.attachedTo.length === 0);
    if (componentsWithoutGear.length > 0) {
      const componentNames = componentsWithoutGear.map(c => c.label || 'Unnamed Component').join(', ');
      showError(`The following components must be attached to at least one gear: ${componentNames}`);
      return;
    }

    // Validate schema
    const validation = validateGearMaintenanceConfig(config);
    if (!validation.valid) {
      showError(`Validation error: ${validation.errors.join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      const settingsStr = localStorage.getItem('stats-for-strava-settings');
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      const defaultPath = settings.files?.defaultPath || '';

      const data = await saveGearMaintenance({ defaultPath, config });

      if (data.success) {
        showSuccess('Gear maintenance configuration saved successfully');
        setIsDirty(false);

        // Reload config from file to ensure we have the saved version
        await loadConfig();
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      showError(`Error saving configuration: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const openImagePicker = (target) => {
    setImagePickerTarget(target);
    setImagePickerOpen(true);
  };

  const handleImageSelect = (filename) => {
    if (!imagePickerTarget) return;

    const { type, componentIndex, gearIndex } = imagePickerTarget;

    if (type === 'component') {
      setConfig(prev => {
        const newComponents = [...prev.components];
        newComponents[componentIndex].imgSrc = filename;
        return { ...prev, components: newComponents };
      });
    } else if (type === 'gear') {
      setConfig(prev => {
        const newGears = [...prev.gears];
        newGears[gearIndex].imgSrc = filename;
        return { ...prev, gears: newGears };
      });
    }

    setIsDirty(true);
  };

  // Gear CRUD operations
  const addGear = () => {
    const newGear = { gearId: '', imgSrc: '' };
    setConfig(prev => ({
      ...prev,
      gears: [...prev.gears, newGear]
    }));
    setIsDirty(true);
  };

  const deleteGear = (gearIndex) => {
    const gear = config.gears[gearIndex];
    // Count components attached to this gear
    const componentCount = config.components.filter(c =>
      c.attachedTo && c.attachedTo.includes(gear.gearId)
    ).length;
    setConfirmDialog({
      isOpen: true,
      type: 'deleteGear',
      data: { gearIndex, gearId: gear.gearId || 'Unnamed Gear', componentCount }
    });
  };

  const handleConfirmDeleteGear = () => {
    const { gearIndex } = confirmDialog.data;
    setConfig(prev => ({
      ...prev,
      gears: prev.gears.filter((_, i) => i !== gearIndex)
    }));
    setIsDirty(true);
    setConfirmDialog({ isOpen: false, type: null, data: null });
  };

  const updateGear = (gearIndex, field, value) => {
    setConfig(prev => {
      const newGears = [...prev.gears];
      newGears[gearIndex] = { ...newGears[gearIndex], [field]: value };
      return { ...prev, gears: newGears };
    });
    setIsDirty(true);
  };

  // Component CRUD operations (top-level components with attachedTo field)
  const addComponent = (gearId) => {
    const newComponent = {
      tag: '',
      label: '',
      attachedTo: gearId ? [gearId] : [],
      maintenance: []
    };
    setConfig(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));
    setIsDirty(true);
  };

  const deleteComponent = (componentIndex) => {
    const component = config.components[componentIndex];
    setConfirmDialog({
      isOpen: true,
      type: 'deleteComponent',
      data: { componentIndex, name: component.label || 'Unnamed Component' }
    });
  };

  const handleConfirmDeleteComponent = () => {
    const { componentIndex } = confirmDialog.data;
    setConfig(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== componentIndex)
    }));
    setIsDirty(true);
    setConfirmDialog({ isOpen: false, type: null, data: null });
  };

  const updateComponent = (componentIndex, field, value) => {
    setConfig(prev => {
      const newComponents = [...prev.components];
      newComponents[componentIndex] = {
        ...newComponents[componentIndex],
        [field]: value
      };
      return { ...prev, components: newComponents };
    });
    setIsDirty(true);
  };

  // Maintenance task operations
  const addMaintenanceTask = useCallback((componentIndex) => {
    // Clear any pending timer to prevent duplicate additions
    if (addTaskTimerRef.current) {
      clearTimeout(addTaskTimerRef.current);
    }

    // Debounce the state update to prevent React Strict Mode double-invocation issues
    addTaskTimerRef.current = setTimeout(() => {
      setConfig(prev => {
        const newComponents = [...prev.components];
        newComponents[componentIndex] = {
          ...newComponents[componentIndex],
          maintenance: [
            ...(newComponents[componentIndex].maintenance || []),
            {
              tag: '',
              label: '',
              interval: { value: 1000, unit: 'km' }
            }
          ]
        };
        return { ...prev, components: newComponents };
      });

      // Auto-expand the maintenance tasks section
      setExpandedMaintenanceTasks(prev => ({
        ...prev,
        [componentIndex]: true
      }));

      setIsDirty(true);
      addTaskTimerRef.current = null;
    }, 0);
  }, []);

  const deleteMaintenanceTask = (componentIndex, taskIndex) => {
    setConfig(prev => {
      const newComponents = [...prev.components];
      newComponents[componentIndex].maintenance =
        newComponents[componentIndex].maintenance.filter((_, i) => i !== taskIndex);
      return { ...prev, components: newComponents };
    });
    setIsDirty(true);
  };

  const updateMaintenanceTask = (componentIndex, taskIndex, field, value) => {
    setConfig(prev => {
      const newComponents = [...prev.components];
      if (field.startsWith('interval.')) {
        const intervalField = field.split('.')[1];
        newComponents[componentIndex].maintenance[taskIndex].interval[intervalField] = value;
      } else {
        newComponents[componentIndex].maintenance[taskIndex][field] = value;
      }
      return { ...prev, components: newComponents };
    });
    setIsDirty(true);
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading configuration...</Text>
      </Box>
    );
  }

  if (!config) {
    return (
      <Box p={6} textAlign="center">
        <Text color="red.500">Failed to load configuration</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align={{ base: "stretch", sm: "center" }} direction={{ base: "column", sm: "row" }} gap={{ base: 3, sm: 0 }}>
          <Box>
            <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="bold">
              Gear Maintenance Configuration
            </Text>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
              Track gear usage and maintenance intervals
            </Text>
          </Box>
          <Stack direction={{ base: "column", sm: "row" }} justify={{ base: "stretch", sm: "flex-end" }} gap={2} w={{ base: "full", sm: "auto" }}>
            <Tooltip content="Discard all unsaved changes and reload from file">
              <Button
                onClick={loadConfig}
                variant="ghost"
                disabled={loading || saving}
                size="sm"
                w={{ base: "full", sm: "auto" }}
              >
                Reset
              </Button>
            </Tooltip>
            <Button
              onClick={handleSave}
              colorPalette="blue"
              disabled={!isDirty || saving}
              size="sm"
              w={{ base: "full", sm: "auto" }}
            >
              <MdSave />
              {saving ? 'Saving...' : (isDirty ? 'Save *' : 'Save')}
            </Button>
          </Stack>
        </Flex>

        {/* Basic Settings */}
        <Box p={{ base: 3, sm: 4 }} borderWidth={1} borderColor="border" borderRadius="md" bg="cardBg">
          <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="semibold" mb={4}>
            Basic Settings
          </Text>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            <Field.Root>
              <Field.Label>Enable Gear Maintenance</Field.Label>
              <Switch.Root
                checked={config.enabled}
                onCheckedChange={(e) => handleFieldChange('enabled', e.checked)}
                colorPalette="blue"
              >
                <Switch.HiddenInput />
                <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
              <Field.HelperText>
                {gearMaintenanceSchema.properties.enabled.description}
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Hashtag Prefix</Field.Label>
              <Input
                value={config.hashtagPrefix}
                onChange={(e) => handleFieldChange('hashtagPrefix', e.target.value)}
                placeholder="sfs"
              />
              <Field.HelperText>
                {gearMaintenanceSchema.properties.hashtagPrefix.description}
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Counters Reset Mode</Field.Label>
              <Select.Root
                collection={resetModeCollection}
                value={[config.countersResetMode]}
                onValueChange={(e) => handleFieldChange('countersResetMode', e.value[0])}
              >
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Select.Content>
                  {resetModeCollection.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Field.HelperText>
                {gearMaintenanceSchema.properties.countersResetMode.description}
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Ignore Retired Gear</Field.Label>
              <Switch.Root
                checked={config.ignoreRetiredGear}
                onCheckedChange={(e) => handleFieldChange('ignoreRetiredGear', e.checked)}
                colorPalette="blue"
              >
                <Switch.HiddenInput />
                <Switch.Control bg="gray.300" _dark={{ bg: "gray.600" }} _checked={{ bg: "blue.500", _dark: { bg: "blue.600" } }}>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
              <Field.HelperText>
                {gearMaintenanceSchema.properties.ignoreRetiredGear.description}
              </Field.HelperText>
            </Field.Root>
          </Grid>
        </Box>

        {/* Gears Section with nested Components */}
        <Box p={{ base: 3, sm: 4 }} borderWidth={1} borderColor="border" borderRadius="md" bg="cardBg">
          <Flex justify="space-between" align="center" mb={4} direction={{ base: "column", sm: "row" }} gap={{ base: 2, sm: 0 }}>
            <Box flex={1}>
              <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="semibold">
                Gears ({config.gears.length})
              </Text>
              <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
                Define your Strava gear and their components
              </Text>
            </Box>
            <Button onClick={addGear} size="sm" colorPalette="blue" w={{ base: "full", sm: "auto" }}>
              <MdAdd />
              Add Gear
            </Button>
          </Flex>

          {config.gears.length === 0 ? (
            <Text color="textMuted" textAlign="center" py={4}>
              No gears defined yet. Click "Add Gear" to get started.
            </Text>
          ) : (
            <VStack gap={4} align="stretch">
              {config.gears.map((gear, gearIndex) => (
                <Box key={gearIndex} p={{ base: 3, sm: 4 }} borderWidth={2} borderColor="border" borderRadius="lg" bg="bg.muted">
                  {/* Gear Header */}
                  <Flex justify="space-between" align="start" mb={4} direction={{ base: "column", sm: "row" }} gap={{ base: 3, sm: 0 }}>
                    <VStack flex={1} align="stretch" gap={3} w={{ base: "full", sm: "auto" }}>
                      {/* Gear Image */}
                      {gear.imgSrc && (
                        <Box>
                          <ImageThumbnail
                            src={`/api/gear-maintenance-images/${gear.imgSrc}?path=${encodeURIComponent(gearMaintenancePath)}`}
                            alt={gear.gearId || 'Gear'}
                            onDelete={() => updateGear(gearIndex, 'imgSrc', '')}
                            size="md"
                          />
                        </Box>
                      )}
                      
                      {/* Gear Info */}
                      <VStack flex={1} align="stretch" gap={2}>
                        <Field.Root>
                          <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Gear ID (from Strava)</Field.Label>
                          <Input
                            value={gear.gearId}
                            onChange={(e) => updateGear(gearIndex, 'gearId', e.target.value)}
                            placeholder="b7546092"
                            size="sm"
                          />
                        </Field.Root>
                        
                        <HStack w="full">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => openImagePicker({ type: 'gear', gearIndex })}
                            flex={1}
                          >
                            <MdImage />
                            {gear.imgSrc ? 'Change Image' : 'Add Image'}
                          </Button>
                        </HStack>
                      </VStack>
                    </VStack>

                    <IconButton
                      aria-label="Delete gear"
                      size="sm"
                      colorPalette="red"
                      variant="ghost"
                      onClick={() => deleteGear(gearIndex)}
                      alignSelf={{ base: "flex-end", sm: "flex-start" }}
                    >
                      <MdDelete />
                    </IconButton>
                  </Flex>

                  {/* Components within this Gear */}
                  {(() => {
                    // Filter components attached to this gear
                    const gearComponents = config.components
                      .map((component, idx) => ({ component, globalIndex: idx }))
                      .filter(({ component }) =>
                        component.attachedTo && component.attachedTo.includes(gear.gearId)
                      );

                    return (
                      <Box mt={4} pt={4} borderTopWidth={1} borderTopColor="border">
                        <Flex justify="space-between" align="center" mb={3} direction={{ base: "column", sm: "row" }} gap={{ base: 2, sm: 0 }}>
                          <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="semibold" flex={1}>
                            Components ({gearComponents.length})
                          </Text>
                          <Button
                            onClick={() => addComponent(gear.gearId)}
                            size="xs"
                            colorPalette="blue"
                            variant="outline"
                            w={{ base: "full", sm: "auto" }}
                            disabled={!gear.gearId}
                          >
                            <MdAdd />
                            Add Component
                          </Button>
                        </Flex>

                        {!gear.gearId && (
                          <Text color="orange.500" fontSize="xs" mb={2}>
                            Please enter a Gear ID above before adding components
                          </Text>
                        )}

                        {gearComponents.length === 0 ? (
                          <Text color="textMuted" fontSize="sm" textAlign="center" py={2}>
                            No components. Click "Add Component" to add one.
                          </Text>
                        ) : (
                          <VStack gap={2} align="stretch">
                            {gearComponents.map(({ component, globalIndex }) => (
                              <ComponentEditor
                                key={globalIndex}
                                component={component}
                                componentIndex={globalIndex}
                                hashtagPrefix={config.hashtagPrefix}
                                gearMaintenancePath={gearMaintenancePath}
                                availableGears={config.gears.filter(g => g.gearId)}
                                onUpdate={(idx, field, value) => updateComponent(idx, field, value)}
                                onDelete={(idx) => deleteComponent(idx)}
                                onAddTask={(idx) => addMaintenanceTask(idx)}
                                onUpdateTask={(idx, taskIdx, field, value) => updateMaintenanceTask(idx, taskIdx, field, value)}
                                onDeleteTask={(idx, taskIdx) => deleteMaintenanceTask(idx, taskIdx)}
                                onSelectImage={() => openImagePicker({ type: 'component', gearIndex, componentIndex: globalIndex })}
                                expanded={expandedComponents[globalIndex]}
                                onToggleExpand={() => setExpandedComponents(prev => ({
                                  ...prev,
                                  [globalIndex]: !prev[globalIndex]
                                }))}
                                maintenanceTasksExpanded={expandedMaintenanceTasks[globalIndex]}
                                onToggleMaintenanceTasks={() => setExpandedMaintenanceTasks(prev => ({
                                  ...prev,
                                  [globalIndex]: !prev[globalIndex]
                                }))}
                              />
                            ))}
                          </VStack>
                        )}
                      </Box>
                    );
                  })()}
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>

      {/* Image Picker Modal */}
      <ImagePicker
        isOpen={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={handleImageSelect}
        customPath={gearMaintenancePath}
      />

      {/* Confirm Delete Component Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'deleteComponent'}
        onClose={() => setConfirmDialog({ isOpen: false, type: null, data: null })}
        onConfirm={handleConfirmDeleteComponent}
        title="Delete Component"
        message={`Are you sure you want to delete "${confirmDialog.data?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColorPalette="red"
      />

      {/* Confirm Delete Gear Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'deleteGear'}
        onClose={() => setConfirmDialog({ isOpen: false, type: null, data: null })}
        onConfirm={handleConfirmDeleteGear}
        title="Delete Gear"
        message={`Are you sure you want to delete gear "${confirmDialog.data?.gearId}"${confirmDialog.data?.componentCount > 0 ? ` and its ${confirmDialog.data.componentCount} component(s)` : ''}?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColorPalette="red"
      />
    </Box>
  );
};

// Component Editor Sub-component
const ComponentEditor = ({
  component,
  componentIndex,
  hashtagPrefix,
  gearMaintenancePath,
  availableGears,
  onUpdate,
  onDelete,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSelectImage,
  expanded,
  onToggleExpand,
  maintenanceTasksExpanded,
  onToggleMaintenanceTasks
}) => {
  return (
    <Box borderWidth={1} borderColor="border" borderRadius="md" overflow="hidden">
      <Flex
        p={3}
        bg="bg"
        justify="space-between"
        align="center"
        cursor="pointer"
        onClick={onToggleExpand}
        _hover={{ bg: 'cardBg' }}
      >
        <HStack>
          <Box as={expanded ? MdExpandMore : MdChevronRight} />
          <Text fontWeight="medium">
            {component.label || 'Unnamed Component'}
          </Text>
          {component.tag && (
            <Text fontSize="xs" color="textMuted">
              #{hashtagPrefix}-{component.tag}
            </Text>
          )}
        </HStack>
        <IconButton
          aria-label="Delete component"
          size="xs"
          colorPalette="red"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(componentIndex);
          }}
        >
          <MdDelete />
        </IconButton>
      </Flex>

      {expanded && (
        <Box p={4}>
          <VStack gap={4} align="stretch">
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              <Field.Root>
                <Field.Label>Tag *</Field.Label>
                <Input
                  value={component.tag}
                  onChange={(e) => onUpdate(componentIndex, 'tag', e.target.value)}
                  placeholder="chain"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Label *</Field.Label>
                <Input
                  value={component.label}
                  onChange={(e) => onUpdate(componentIndex, 'label', e.target.value)}
                  placeholder="Chain"
                />
              </Field.Root>
            </Grid>

            <Field.Root>
              <Field.Label>Image</Field.Label>
              <HStack>
                {component.imgSrc && (
                  <ImageThumbnail
                    src={`/api/gear-maintenance-images/${encodeURIComponent(component.imgSrc)}?path=${encodeURIComponent(gearMaintenancePath)}`}
                    alt={component.label}
                    size="sm"
                  />
                )}
                <Button size="sm" variant="outline" onClick={onSelectImage}>
                  <MdImage />
                  {component.imgSrc ? 'Change Image' : 'Select Image'}
                </Button>
              </HStack>
            </Field.Root>

            <Field.Root>
              <Field.Label>Attached To (Select Gear)</Field.Label>
              <Box borderWidth={1} borderColor="border" borderRadius="md" p={3}>
                {availableGears.length === 0 ? (
                  <Text color="textMuted" fontSize="sm">No gears available. Add gears first.</Text>
                ) : (
                  <VStack align="stretch" gap={2}>
                    {availableGears.map((gear) => {
                      const isChecked = (component.attachedTo || []).includes(gear.gearId);
                      return (
                        <Checkbox.Root
                          key={gear.gearId}
                          checked={isChecked}
                          onCheckedChange={(e) => {
                            const currentAttached = component.attachedTo || [];
                            const newAttached = e.checked
                              ? [...currentAttached, gear.gearId]
                              : currentAttached.filter(id => id !== gear.gearId);
                            onUpdate(componentIndex, 'attachedTo', newAttached);
                          }}
                          colorPalette="blue"
                          size="sm"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Label fontSize="sm">
                            {gear.gearId}
                          </Checkbox.Label>
                        </Checkbox.Root>
                      );
                    })}
                  </VStack>
                )}
              </Box>
              <Field.HelperText>
                {(component.attachedTo || []).length === 0 && (
                  <Text color="orange.500">⚠ Component must be attached to at least one gear</Text>
                )}
              </Field.HelperText>
            </Field.Root>

            {/* Purchase Price */}
            <Box>
              <Text fontWeight="medium" mb={2}>
                Purchase Price (Optional)
              </Text>
              <Grid templateColumns="2fr 1fr" gap={3}>
                <Field.Root>
                  <Field.Label>Amount (cents)</Field.Label>
                  <Input
                    type="number"
                    value={component.purchasePrice?.amountInCents || ''}
                    onChange={(e) => onUpdate(componentIndex, 'purchasePrice', {
                      ...component.purchasePrice,
                      amountInCents: parseInt(e.target.value) || 0
                    })}
                    placeholder="69000"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Currency</Field.Label>
                  <Input
                    value={component.purchasePrice?.currency || 'USD'}
                    onChange={(e) => onUpdate(componentIndex, 'purchasePrice', {
                      ...component.purchasePrice,
                      currency: e.target.value.toUpperCase()
                    })}
                    placeholder="USD"
                    maxLength={3}
                  />
                </Field.Root>
              </Grid>
            </Box>

            {/* Maintenance Tasks */}
            <Box>
              <Flex
                justify="space-between"
                align="center"
                mb={2}
              >
                <HStack
                  flex={1}
                  cursor="pointer"
                  onClick={onToggleMaintenanceTasks}
                  p={2}
                  borderRadius="md"
                  _hover={{ bg: 'bg.muted' }}
                >
                  <Box as={maintenanceTasksExpanded ? MdExpandMore : MdChevronRight} />
                  <Text fontWeight="medium">
                    Maintenance Tasks ({component.maintenance?.length || 0})
                  </Text>
                </HStack>
                <Button
                  size="xs"
                  colorPalette="blue"
                  onClick={() => onAddTask(componentIndex)}
                >
                  <MdAdd />
                  Add Task
                </Button>
              </Flex>

              {maintenanceTasksExpanded && (
                <Box>
                  {(!component.maintenance || component.maintenance.length === 0) ? (
                    <Text color="textMuted" fontSize="sm">
                      No maintenance tasks defined
                    </Text>
                  ) : (
                    <VStack gap={2} align="stretch">
                  {component.maintenance.map((task, taskIndex) => (
                    <Box key={taskIndex} p={3} borderWidth={1} borderColor="border" borderRadius="md">
                      <Flex justify="space-between" align="start" mb={2}>
                        <Text fontSize="sm" fontWeight="medium">
                          Task {taskIndex + 1}{task.label ? ` - ${task.label}` : ''}
                        </Text>
                        <IconButton
                          aria-label="Delete task"
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => onDeleteTask(componentIndex, taskIndex)}
                        >
                          <MdClose />
                        </IconButton>
                      </Flex>

                      <Grid templateColumns="1fr 1fr" gap={2}>
                        <Field.Root>
                          <Field.Label fontSize="xs">Tag</Field.Label>
                          <Input
                            size="sm"
                            value={task.tag}
                            onChange={(e) => onUpdateTask(componentIndex, taskIndex, 'tag', e.target.value)}
                            placeholder="replaced"
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label fontSize="xs">Label</Field.Label>
                          <Input
                            size="sm"
                            value={task.label}
                            onChange={(e) => onUpdateTask(componentIndex, taskIndex, 'label', e.target.value)}
                            placeholder="Replaced"
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label fontSize="xs">Interval Value</Field.Label>
                          <Input
                            size="sm"
                            type="number"
                            value={task.interval.value}
                            onChange={(e) => onUpdateTask(componentIndex, taskIndex, 'interval.value', parseInt(e.target.value) || 0)}
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label fontSize="xs">Unit</Field.Label>
                          <Select.Root
                            collection={intervalUnitCollection}
                            size="sm"
                            value={[task.interval.unit]}
                            onValueChange={(e) => onUpdateTask(componentIndex, taskIndex, 'interval.unit', e.value[0])}
                          >
                            <Select.Trigger>
                              <Select.ValueText />
                            </Select.Trigger>
                            <Select.Content>
                              {intervalUnitCollection.items.map((item) => (
                                <Select.Item item={item} key={item.value}>
                                  {item.label}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Root>
                        </Field.Root>
                      </Grid>
                    </Box>
                  ))}
                </VStack>
              )}
                </Box>
              )}
            </Box>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default GearMaintenanceEditor;
