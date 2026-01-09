import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Switch,
  IconButton,
  Accordion,
  Select,
  Spinner,
  Flex,
  Grid
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { MdAdd, MdDelete, MdImage, MdExpandMore, MdChevronRight, MdSave, MdClose } from 'react-icons/md';
import { useToast } from '../hooks/useToast';
import { gearMaintenanceSchema, validateGearMaintenanceConfig } from '../schemas/gearMaintenanceSchema';
import ImagePicker from './gear-maintenance/ImagePicker';
import ImageThumbnail from './gear-maintenance/ImageThumbnail';

const GearMaintenanceEditor = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState(null);
  const [expandedComponents, setExpandedComponents] = useState({});
  const toast = useToast();

  const loadConfig = async () => {
    setLoading(true);
    try {
      // Get settings for default path
      const settingsStr = localStorage.getItem('stats-for-strava-settings');
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      const defaultPath = settings.files?.defaultPath || '';

      const response = await fetch(`/api/gear-maintenance?defaultPath=${encodeURIComponent(defaultPath)}`);
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
      } else {
        throw new Error(data.error || 'Failed to load configuration');
      }
    } catch (error) {
      toast({
        title: 'Error loading configuration',
        description: error.message,
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    // Validate
    const validation = validateGearMaintenanceConfig(config);
    if (!validation.valid) {
      toast({
        title: 'Validation error',
        description: validation.errors.join(', '),
        status: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      const settingsStr = localStorage.getItem('stats-for-strava-settings');
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      const defaultPath = settings.files?.defaultPath || '';

      const response = await fetch('/api/gear-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultPath, config })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Configuration saved',
          description: 'Gear maintenance configuration updated successfully',
          status: 'success'
        });
        setIsDirty(false);
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      toast({
        title: 'Error saving configuration',
        description: error.message,
        status: 'error'
      });
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

  // Component CRUD operations
  const addComponent = () => {
    const newComponent = {
      tag: '',
      label: '',
      attachedTo: [],
      maintenance: []
    };
    setConfig(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));
    setIsDirty(true);
  };

  const deleteComponent = (index) => {
    if (!confirm('Delete this component?')) return;
    setConfig(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const updateComponent = (index, field, value) => {
    setConfig(prev => {
      const newComponents = [...prev.components];
      newComponents[index] = { ...newComponents[index], [field]: value };
      return { ...prev, components: newComponents };
    });
    setIsDirty(true);
  };

  // Maintenance task operations
  const addMaintenanceTask = (componentIndex) => {
    const newTask = {
      tag: '',
      label: '',
      interval: { value: 1000, unit: 'km' }
    };
    setConfig(prev => {
      const newComponents = [...prev.components];
      newComponents[componentIndex].maintenance = [
        ...(newComponents[componentIndex].maintenance || []),
        newTask
      ];
      return { ...prev, components: newComponents };
    });
    setIsDirty(true);
  };

  const deleteMaintenanceTask = (componentIndex, taskIndex) => {
    setConfig(prev => {
      const newComponents = [...prev.components];
      newComponents[componentIndex].maintenance = newComponents[componentIndex].maintenance.filter((_, i) => i !== taskIndex);
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

  // Gear operations
  const addGear = () => {
    const newGear = { gearId: '', imgSrc: '' };
    setConfig(prev => ({
      ...prev,
      gears: [...prev.gears, newGear]
    }));
    setIsDirty(true);
  };

  const deleteGear = (index) => {
    setConfig(prev => ({
      ...prev,
      gears: prev.gears.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const updateGear = (index, field, value) => {
    setConfig(prev => {
      const newGears = [...prev.gears];
      newGears[index] = { ...newGears[index], [field]: value };
      return { ...prev, gears: newGears };
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
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="2xl" fontWeight="bold">
              Gear Maintenance Configuration
            </Text>
            <Text fontSize="sm" color="textMuted">
              Track gear usage and maintenance intervals
            </Text>
          </Box>
          <HStack>
            <Button
              onClick={loadConfig}
              variant="ghost"
              disabled={loading || saving}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              colorPalette="blue"
              disabled={!isDirty || saving}
              loading={saving}
            >
              <MdSave />
              Save Changes
            </Button>
          </HStack>
        </Flex>

        {/* Basic Settings */}
        <Box p={4} borderWidth={1} borderColor="border" borderRadius="md" bg="cardBg">
          <Text fontSize="lg" fontWeight="semibold" mb={4}>
            Basic Settings
          </Text>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            <Field.Root>
              <Field.Label>Enable Gear Maintenance</Field.Label>
              <Switch
                checked={config.enabled}
                onCheckedChange={(e) => handleFieldChange('enabled', e.checked)}
              />
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
                value={[config.countersResetMode]}
                onValueChange={(e) => handleFieldChange('countersResetMode', e.value[0])}
              >
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="nextActivityOnwards">
                    Next Activity Onwards
                  </Select.Item>
                  <Select.Item value="currentActivityOnwards">
                    Current Activity Onwards
                  </Select.Item>
                </Select.Content>
              </Select.Root>
              <Field.HelperText>
                {gearMaintenanceSchema.properties.countersResetMode.description}
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Ignore Retired Gear</Field.Label>
              <Switch
                checked={config.ignoreRetiredGear}
                onCheckedChange={(e) => handleFieldChange('ignoreRetiredGear', e.checked)}
              />
              <Field.HelperText>
                {gearMaintenanceSchema.properties.ignoreRetiredGear.description}
              </Field.HelperText>
            </Field.Root>
          </Grid>
        </Box>

        {/* Components Section */}
        <Box p={4} borderWidth={1} borderColor="border" borderRadius="md" bg="cardBg">
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              <Text fontSize="lg" fontWeight="semibold">
                Components ({config.components.length})
              </Text>
              <Text fontSize="sm" color="textMuted">
                Define components for your equipment
              </Text>
            </Box>
            <Button onClick={addComponent} size="sm" colorPalette="blue">
              <MdAdd />
              Add Component
            </Button>
          </Flex>

          {config.components.length === 0 ? (
            <Text color="textMuted" textAlign="center" py={4}>
              No components defined yet. Click "Add Component" to get started.
            </Text>
          ) : (
            <VStack gap={3} align="stretch">
              {config.components.map((component, componentIndex) => (
                <ComponentEditor
                  key={componentIndex}
                  component={component}
                  componentIndex={componentIndex}
                  hashtagPrefix={config.hashtagPrefix}
                  onUpdate={updateComponent}
                  onDelete={deleteComponent}
                  onAddTask={addMaintenanceTask}
                  onUpdateTask={updateMaintenanceTask}
                  onDeleteTask={deleteMaintenanceTask}
                  onSelectImage={() => openImagePicker({ type: 'component', componentIndex })}
                  expanded={expandedComponents[componentIndex]}
                  onToggleExpand={() => setExpandedComponents(prev => ({
                    ...prev,
                    [componentIndex]: !prev[componentIndex]
                  }))}
                />
              ))}
            </VStack>
          )}
        </Box>

        {/* Gears Section */}
        <Box p={4} borderWidth={1} borderColor="border" borderRadius="md" bg="cardBg">
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              <Text fontSize="lg" fontWeight="semibold">
                Gears ({config.gears.length})
              </Text>
              <Text fontSize="sm" color="textMuted">
                Associate images with your Strava gear
              </Text>
            </Box>
            <Button onClick={addGear} size="sm" colorPalette="blue">
              <MdAdd />
              Add Gear
            </Button>
          </Flex>

          {config.gears.length === 0 ? (
            <Text color="textMuted" textAlign="center" py={4}>
              No gears defined. This is optional.
            </Text>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              {config.gears.map((gear, gearIndex) => (
                <Box key={gearIndex} p={3} borderWidth={1} borderColor="border" borderRadius="md">
                  <Flex justify="space-between" align="start" mb={3}>
                    <Text fontWeight="medium">Gear {gearIndex + 1}</Text>
                    <IconButton
                      aria-label="Delete gear"
                      size="xs"
                      colorPalette="red"
                      variant="ghost"
                      onClick={() => deleteGear(gearIndex)}
                    >
                      <MdDelete />
                    </IconButton>
                  </Flex>

                  <VStack gap={3} align="stretch">
                    <Field.Root>
                      <Field.Label>Gear ID</Field.Label>
                      <Input
                        value={gear.gearId}
                        onChange={(e) => updateGear(gearIndex, 'gearId', e.target.value)}
                        placeholder="b7546092"
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Image</Field.Label>
                      <HStack>
                        {gear.imgSrc && (
                          <ImageThumbnail
                            src={`/api/gear-maintenance-images/${encodeURIComponent(gear.imgSrc)}`}
                            alt={gear.gearId}
                            size="sm"
                          />
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openImagePicker({ type: 'gear', gearIndex })}
                          flex={1}
                        >
                          <MdImage />
                          {gear.imgSrc ? 'Change Image' : 'Select Image'}
                        </Button>
                      </HStack>
                    </Field.Root>
                  </VStack>
                </Box>
              ))}
            </Grid>
          )}
        </Box>
      </VStack>

      {/* Image Picker Modal */}
      <ImagePicker
        isOpen={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={handleImageSelect}
      />
    </Box>
  );
};

// Component Editor Sub-component
const ComponentEditor = ({
  component,
  componentIndex,
  hashtagPrefix,
  onUpdate,
  onDelete,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSelectImage,
  expanded,
  onToggleExpand
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
                    src={`/api/gear-maintenance-images/${encodeURIComponent(component.imgSrc)}`}
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
              <Field.Label>Attached To (Gear IDs)</Field.Label>
              <Input
                value={(component.attachedTo || []).join(', ')}
                onChange={(e) => onUpdate(componentIndex, 'attachedTo', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="b7546092, g1234567"
              />
              <Field.HelperText>Comma-separated list of gear IDs</Field.HelperText>
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
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="medium">
                  Maintenance Tasks ({component.maintenance?.length || 0})
                </Text>
                <Button
                  size="xs"
                  colorPalette="blue"
                  onClick={() => onAddTask(componentIndex)}
                >
                  <MdAdd />
                  Add Task
                </Button>
              </Flex>

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
                          Task {taskIndex + 1}
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
                            size="sm"
                            value={[task.interval.unit]}
                            onValueChange={(e) => onUpdateTask(componentIndex, taskIndex, 'interval.unit', e.value[0])}
                          >
                            <Select.Trigger>
                              <Select.ValueText />
                            </Select.Trigger>
                            <Select.Content>
                              <Select.Item value="km">Kilometers</Select.Item>
                              <Select.Item value="mi">Miles</Select.Item>
                              <Select.Item value="hours">Hours</Select.Item>
                              <Select.Item value="days">Days</Select.Item>
                            </Select.Content>
                          </Select.Root>
                        </Field.Root>
                      </Grid>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default GearMaintenanceEditor;
