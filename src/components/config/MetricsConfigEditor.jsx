import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Field,
  Input,
  IconButton,
  Badge,
  Flex,
  Checkbox,
  Grid,
  Select,
  createListCollection,
  Portal,
} from '@chakra-ui/react';
import { MdAdd, MdDelete, MdArrowUpward, MdArrowDownward, MdExpandMore, MdChevronRight, MdInfo, MdWarning } from 'react-icons/md';
import BaseConfigEditor from './BaseConfigEditor';
import { readSportsList, initialSportsList } from '../../utils/sportsListManager';

/**
 * MetricsConfigEditor - Handles metrics configuration fields
 * Focuses on Eddington score configuration with array of sport groupings
 */
const MetricsConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  const [sportsList, setSportsList] = useState(initialSportsList);
  const [expandedEddington, setExpandedEddington] = useState({});

  // Load sports list for sport type selection
  useEffect(() => {
    async function loadSports() {
      try {
        const settings = JSON.parse(localStorage.getItem('config-tool-settings') || '{}');
        const list = await readSportsList(settings);
        setSportsList(list);
      } catch (error) {
        console.error('Error loading sports list:', error);
      }
    }
    loadSports();
  }, []);

  // Custom validation for metrics fields
  const validateMetricsFields = (formData, getNestedValue) => {
    const errors = {};
    
    const eddingtonArray = getNestedValue(formData, 'eddington') || [];
    
    // Count how many are enabled for nav bar and dashboard
    let navBarCount = 0;
    let dashboardCount = 0;
    
    eddingtonArray.forEach((config, index) => {
      // Validate required fields
      if (!config.label || config.label.trim() === '') {
        errors[`eddington[${index}].label`] = 'Label is required';
      }
      
      if (!config.sportTypesToInclude || config.sportTypesToInclude.length === 0) {
        errors[`eddington[${index}].sportTypesToInclude`] = 'At least one sport type is required';
      }
      
      // Count enabled features
      if (config.showInNavBar) navBarCount++;
      if (config.showInDashboardWidget) dashboardCount++;
    });
    
    // Validate max 2 enabled for nav bar and dashboard
    if (navBarCount > 2) {
      errors['eddington.navBar'] = 'Maximum of 2 Eddington scores can be shown in the navigation bar';
    }
    
    if (dashboardCount > 2) {
      errors['eddington.dashboard'] = 'Maximum of 2 Eddington scores can be shown in the dashboard widget';
    }
    
    return errors;
  };

  return (
    <BaseConfigEditor
      sectionName="metrics"
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
      isLoading={isLoading}
      onDirtyChange={onDirtyChange}
      customValidation={validateMetricsFields}
    >
      {({ schema, formData, handleFieldChange, getNestedValue, errors }) => {
        const eddingtonArray = getNestedValue(formData, 'eddington') || [];

        const handleAddEddington = () => {
          const newConfig = {
            label: 'New Score',
            showInNavBar: false,
            showInDashboardWidget: false,
            sportTypesToInclude: []
          };
          handleFieldChange('eddington', [...eddingtonArray, newConfig]);
          setExpandedEddington(prev => ({ ...prev, [eddingtonArray.length]: true }));
        };

        const handleRemoveEddington = (index) => {
          const updated = eddingtonArray.filter((_, i) => i !== index);
          handleFieldChange('eddington', updated);
          
          // Clean up expanded state
          const newExpanded = {};
          Object.keys(expandedEddington).forEach(key => {
            const keyIndex = parseInt(key);
            if (keyIndex < index) {
              newExpanded[keyIndex] = expandedEddington[key];
            } else if (keyIndex > index) {
              newExpanded[keyIndex - 1] = expandedEddington[key];
            }
          });
          setExpandedEddington(newExpanded);
        };

        const handleMoveEddington = (fromIndex, toIndex) => {
          if (toIndex < 0 || toIndex >= eddingtonArray.length) return;
          
          const updated = [...eddingtonArray];
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          handleFieldChange('eddington', updated);
        };

        const toggleEddingtonExpansion = (index) => {
          setExpandedEddington(prev => ({ ...prev, [index]: !prev[index] }));
        };

        const handleUpdateEddington = (index, field, value) => {
          const updated = [...eddingtonArray];
          updated[index] = { ...updated[index], [field]: value };
          handleFieldChange('eddington', updated);
        };

        const handleAddSportType = (index, sportType) => {
          const updated = [...eddingtonArray];
          const currentSports = updated[index].sportTypesToInclude || [];
          if (!currentSports.includes(sportType)) {
            updated[index] = {
              ...updated[index],
              sportTypesToInclude: [...currentSports, sportType]
            };
            handleFieldChange('eddington', updated);
          }
        };

        const handleRemoveSportType = (index, sportType) => {
          const updated = [...eddingtonArray];
          updated[index] = {
            ...updated[index],
            sportTypesToInclude: updated[index].sportTypesToInclude.filter(s => s !== sportType)
          };
          handleFieldChange('eddington', updated);
        };

        // Count enabled features
        const navBarCount = eddingtonArray.filter(c => c.showInNavBar).length;
        const dashboardCount = eddingtonArray.filter(c => c.showInDashboardWidget).length;

        return (
          <VStack align="stretch" gap={6}>
            {/* Introduction */}
            <Box 
              p={4} 
              bg="blue.50"
              _dark={{ 
                bg: "blue.900/20",
                borderColor: "blue.800" 
              }}
              borderRadius="md" 
              border="1px solid" 
              borderColor="blue.200"
            >
              <HStack gap={2} mb={2}>
                <Box as={MdInfo} color="blue.500" boxSize="20px" />
                <Text fontSize="md" fontWeight="semibold" color="text">
                  About Eddington Scores
                </Text>
              </HStack>
              <Text fontSize="sm" color="text" opacity={0.9}>
                The Eddington score is a metric that measures consistency in athletic performance. 
                For cycling, an Eddington number of 70 means you've cycled at least 70 km on 70 different days.
              </Text>
              <Text fontSize="sm" color="text" opacity={0.9} mt={2}>
                You can configure multiple Eddington scores by grouping different sport types together. 
                For example, group all cycling activities (Ride, Mountain Bike, Gravel) or all running activities (Run, Trail Run).
              </Text>
            </Box>

            {/* Validation Warnings */}
            {(errors['eddington.navBar'] || errors['eddington.dashboard']) && (
              <Box 
                p={4} 
                bg="orange.50"
                _dark={{ 
                  bg: "orange.900/20",
                  borderColor: "orange.700" 
                }}
                borderRadius="md" 
                border="1px solid" 
                borderColor="orange.300"
              >
                <HStack gap={2} align="flex-start">
                  <Box as={MdWarning} color="orange.500" boxSize="20px" mt={0.5} />
                  <VStack align="stretch" gap={1} flex={1}>
                    {errors['eddington.navBar'] && (
                      <Text fontSize="sm" color="orange.800" _dark={{ color: "orange.200" }}>
                        {errors['eddington.navBar']}
                      </Text>
                    )}
                    {errors['eddington.dashboard'] && (
                      <Text fontSize="sm" color="orange.800" _dark={{ color: "orange.200" }}>
                        {errors['eddington.dashboard']}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Box>
            )}

            {/* Display Limits Info */}
            <Box 
              p={4} 
              bg="cardBg" 
              borderRadius="md" 
              border="1px solid" 
              borderColor="border"
              boxShadow="sm"
            >
              <VStack align="stretch" gap={2}>
                <Text fontSize="md" fontWeight="semibold" color="text">
                  Display Status
                </Text>
                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} gap={3}>
                  <Box
                    p={3}
                    bg={navBarCount > 2 ? "orange.50" : "green.50"}
                    _dark={{ 
                      bg: navBarCount > 2 ? "orange.900/20" : "green.900/20",
                      borderColor: navBarCount > 2 ? "orange.700" : "green.700" 
                    }}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={navBarCount > 2 ? "orange.300" : "green.300"}
                  >
                    <Text 
                      fontSize="sm" 
                      fontWeight="medium" 
                      color={{ base: navBarCount > 2 ? "orange.900" : "green.900", _dark: navBarCount > 2 ? "orange.100" : "green.100" }}
                    >
                      Navigation Bar
                    </Text>
                    <Text 
                      fontSize="lg" 
                      fontWeight="bold" 
                      color={navBarCount > 2 ? "orange.600" : "green.600"}
                      _dark={{ color: navBarCount > 2 ? "orange.400" : "green.400" }}
                    >
                      {navBarCount} / 2
                    </Text>
                  </Box>
                  <Box
                    p={3}
                    bg={dashboardCount > 2 ? "orange.50" : "green.50"}
                    _dark={{ 
                      bg: dashboardCount > 2 ? "orange.900/20" : "green.900/20",
                      borderColor: dashboardCount > 2 ? "orange.700" : "green.700" 
                    }}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={dashboardCount > 2 ? "orange.300" : "green.300"}
                  >
                    <Text 
                      fontSize="sm" 
                      fontWeight="medium" 
                      color={{ base: dashboardCount > 2 ? "orange.900" : "green.900", _dark: dashboardCount > 2 ? "orange.100" : "green.100" }}
                    >
                      Dashboard Widget
                    </Text>
                    <Text 
                      fontSize="lg" 
                      fontWeight="bold" 
                      color={dashboardCount > 2 ? "orange.600" : "green.600"}
                      _dark={{ color: dashboardCount > 2 ? "orange.400" : "green.400" }}
                    >
                      {dashboardCount} / 2
                    </Text>
                  </Box>
                </Grid>
              </VStack>
            </Box>

            {/* Eddington Configurations */}
            <Box 
              p={4} 
              bg="cardBg" 
              borderRadius="md" 
              border="1px solid" 
              borderColor="border"
              boxShadow="sm"
            >
              <VStack align="stretch" gap={4}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                  <Box flex="1" minW={{ base: "100%", sm: "auto" }}>
                    <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="semibold" color="text">
                      Eddington Score Configurations
                    </Text>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
                      {eddingtonArray.length} {eddingtonArray.length === 1 ? 'configuration' : 'configurations'}
                    </Text>
                  </Box>
                  <Button
                    onClick={handleAddEddington}
                    colorPalette="blue"
                    size={{ base: "sm", sm: "sm" }}
                    width={{ base: "100%", sm: "auto" }}
                    leftIcon={<MdAdd />}
                  >
                    Add Configuration
                  </Button>
                </Flex>

                {eddingtonArray.length === 0 ? (
                  <Box
                    p={8}
                    textAlign="center"
                    bg="panelBg"
                    borderRadius="md"
                    border="2px dashed"
                    borderColor="border"
                  >
                    <Text fontSize="sm" color="textMuted" mb={3}>
                      No Eddington configurations yet. Add one to get started.
                    </Text>
                    <Button
                      onClick={handleAddEddington}
                      colorPalette="blue"
                      size="sm"
                      leftIcon={<MdAdd />}
                    >
                      Add Your First Configuration
                    </Button>
                  </Box>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {eddingtonArray.map((config, index) => {
                      const isExpanded = expandedEddington[index];
                      const hasErrors = Object.keys(errors).some(key => key.startsWith(`eddington[${index}]`));

                      return (
                        <Box
                          key={index}
                          borderWidth="1px"
                          borderColor={hasErrors ? "orange.300" : "border"}
                          _dark={{ borderColor: hasErrors ? "orange.700" : "border" }}
                          borderRadius="md"
                          overflow="hidden"
                        >
                          {/* Header */}
                          <Flex
                            p={{ base: 2, sm: 3 }}
                            bg={hasErrors ? "orange.50" : "panelBg"}
                            _dark={{ bg: hasErrors ? "orange.900/20" : "panelBg" }}
                            align="center"
                            gap={{ base: 1, sm: 2 }}
                            cursor="pointer"
                            onClick={() => toggleEddingtonExpansion(index)}
                            _hover={{ opacity: 0.8 }}
                            wrap="wrap"
                          >
                            <Box as={isExpanded ? MdExpandMore : MdChevronRight} boxSize={{ base: "16px", sm: "20px" }} flexShrink={0} />
                            <Text fontWeight="600" color="text" flex="1" fontSize={{ base: "sm", sm: "md" }} minW="120px">
                              {config.label || `Configuration ${index + 1}`}
                            </Text>
                            <HStack gap={{ base: 1, sm: 2 }} flexWrap="wrap">
                              {config.showInNavBar && (
                                <Badge colorPalette="blue" size={{ base: "xs", sm: "sm" }}>Nav</Badge>
                              )}
                              {config.showInDashboardWidget && (
                                <Badge colorPalette="green" size={{ base: "xs", sm: "sm" }}>Dashboard</Badge>
                              )}
                              <Badge colorPalette="gray" size={{ base: "xs", sm: "sm" }}>
                                {config.sportTypesToInclude?.length || 0} sports
                              </Badge>
                            </HStack>
                            <HStack gap={{ base: 0.5, sm: 1 }} flexShrink={0}>
                              <IconButton
                                size={{ base: "xs", sm: "sm" }}
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveEddington(index, index - 1);
                                }}
                                isDisabled={index === 0}
                                aria-label="Move up"
                                minW={{ base: "24px", sm: "32px" }}
                                h={{ base: "24px", sm: "32px" }}
                                p={0}
                              >
                                <MdArrowUpward />
                              </IconButton>
                              <IconButton
                                size={{ base: "xs", sm: "sm" }}
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveEddington(index, index + 1);
                                }}
                                isDisabled={index === eddingtonArray.length - 1}
                                aria-label="Move down"
                                minW={{ base: "24px", sm: "32px" }}
                                h={{ base: "24px", sm: "32px" }}
                                p={0}
                              >
                                <MdArrowDownward />
                              </IconButton>
                              <IconButton
                                size={{ base: "xs", sm: "sm" }}
                                variant="ghost"
                                colorPalette="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveEddington(index);
                                }}
                                aria-label="Remove"
                                minW={{ base: "24px", sm: "32px" }}
                                h={{ base: "24px", sm: "32px" }}
                                p={0}
                              >
                                <MdDelete />
                              </IconButton>
                            </HStack>
                          </Flex>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <Box p={4} bg="cardBg">
                              <VStack align="stretch" gap={4}>
                                {/* Label */}
                                <Field.Root invalid={!!errors[`eddington[${index}].label`]}>
                                  <Field.Label>Label</Field.Label>
                                  <Input
                                    value={config.label || ''}
                                    onChange={(e) => handleUpdateEddington(index, 'label', e.target.value)}
                                    placeholder="e.g., Ride, Run, Walk"
                                    bg="inputBg"
                                  />
                                  <Field.HelperText>
                                    The label to be used for the tabs on the Eddington page
                                  </Field.HelperText>
                                  {errors[`eddington[${index}].label`] && (
                                    <Field.ErrorText>
                                      {errors[`eddington[${index}].label`]}
                                    </Field.ErrorText>
                                  )}
                                </Field.Root>

                                {/* Display Options */}
                                <Box>
                                  <Text fontSize="sm" fontWeight="medium" mb={2} color="text">
                                    Display Options
                                  </Text>
                                  <VStack align="stretch" gap={2}>
                                    <Checkbox.Root
                                      checked={config.showInNavBar || false}
                                      onCheckedChange={(e) => handleUpdateEddington(index, 'showInNavBar', e.checked)}
                                      colorPalette="orange"
                                    >
                                      <Checkbox.HiddenInput />
                                      <Checkbox.Control>
                                        <Checkbox.Indicator />
                                      </Checkbox.Control>
                                      <Checkbox.Label fontSize="sm">
                                        Show in Navigation Bar
                                      </Checkbox.Label>
                                    </Checkbox.Root>

                                    <Checkbox.Root
                                      checked={config.showInDashboardWidget || false}
                                      onCheckedChange={(e) => handleUpdateEddington(index, 'showInDashboardWidget', e.checked)}
                                      colorPalette="orange"
                                    >
                                      <Checkbox.HiddenInput />
                                      <Checkbox.Control>
                                        <Checkbox.Indicator />
                                      </Checkbox.Control>
                                      <Checkbox.Label fontSize="sm">
                                        Show in Dashboard Widget
                                      </Checkbox.Label>
                                    </Checkbox.Root>
                                  </VStack>
                                </Box>

                                {/* Sport Types */}
                                <Field.Root invalid={!!errors[`eddington[${index}].sportTypesToInclude`]}>
                                  <Field.Label>Sport Types to Include</Field.Label>
                                  <Text fontSize="xs" color="textMuted" mb={2}>
                                    Only sport types from the same activity category can be combined
                                  </Text>

                                  {/* Selected sports */}
                                  {config.sportTypesToInclude && config.sportTypesToInclude.length > 0 && (
                                    <Grid 
                                      templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }}
                                      gap={2} 
                                      mb={3}
                                    >
                                      {config.sportTypesToInclude.map((sport) => (
                                        <Flex
                                          key={sport}
                                          p={{ base: 1.5, sm: 2 }}
                                          px={{ base: 2, sm: 3 }}
                                          bg="panelBg"
                                          border="1px solid"
                                          borderColor="border"
                                          borderRadius="md"
                                          align="center"
                                          justify="space-between"
                                          gap={2}
                                          _hover={{ borderColor: "primary" }}
                                        >
                                          <Text fontSize={{ base: "xs", sm: "sm" }} color="text" flex="1" noOfLines={1}>
                                            {sport}
                                          </Text>
                                          <IconButton
                                            size={{ base: "xs", sm: "sm" }}
                                            variant="ghost"
                                            colorPalette="red"
                                            onClick={() => handleRemoveSportType(index, sport)}
                                            aria-label="Remove sport"
                                            flexShrink={0}
                                            minW={{ base: "24px", sm: "32px" }}
                                            h={{ base: "24px", sm: "32px" }}
                                            p={0}
                                          >
                                            <MdDelete />
                                          </IconButton>
                                        </Flex>
                                      ))}
                                    </Grid>
                                  )}

                                  {/* Select dropdown */}
                                  <Select.Root
                                    collection={createListCollection({
                                      items: Object.entries(sportsList).flatMap(([category, sports]) =>
                                        sports
                                          .filter(sport => !config.sportTypesToInclude?.includes(sport))
                                          .map(sport => ({ label: sport, value: sport, category }))
                                      )
                                    })}
                                    size="sm"
                                    onValueChange={(details) => {
                                      if (details.value && details.value.length > 0) {
                                        handleAddSportType(index, details.value[0]);
                                      }
                                    }}
                                    positioning={{ sameWidth: true }}
                                  >
                                    <Select.HiddenSelect />
                                    <Select.Control>
                                      <Select.Trigger>
                                        <Select.ValueText placeholder="Select a sport type to add" />
                                      </Select.Trigger>
                                      <Select.IndicatorGroup>
                                        <Select.Indicator />
                                      </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                      <Select.Positioner>
                                        <Select.Content 
                                          bg="cardBg" 
                                          borderRadius="md" 
                                          boxShadow="lg" 
                                          border="1px solid" 
                                          borderColor="border"
                                          maxH="300px"
                                          overflowY="auto"
                                        >
                                          {Object.entries(sportsList).map(([category, sports]) => {
                                            const availableSports = sports.filter(sport => !config.sportTypesToInclude?.includes(sport));
                                            if (availableSports.length === 0) return null;
                                            
                                            return (
                                              <Select.ItemGroup key={category}>
                                                <Select.ItemGroupLabel 
                                                  color="textMuted"
                                                  fontWeight="600"
                                                  fontSize="xs"
                                                >
                                                  {category}
                                                </Select.ItemGroupLabel>
                                                {availableSports.map((sport) => (
                                                  <Select.Item 
                                                    item={{ label: sport, value: sport }} 
                                                    key={sport} 
                                                    color="text"
                                                    pl={6}
                                                  >
                                                    {sport}
                                                    <Select.ItemIndicator />
                                                  </Select.Item>
                                                ))}
                                              </Select.ItemGroup>
                                            );
                                          })}
                                        </Select.Content>
                                      </Select.Positioner>
                                    </Portal>
                                  </Select.Root>

                                  {errors[`eddington[${index}].sportTypesToInclude`] && (
                                    <Field.ErrorText>
                                      {errors[`eddington[${index}].sportTypesToInclude`]}
                                    </Field.ErrorText>
                                  )}
                                </Field.Root>
                              </VStack>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </VStack>
            </Box>
          </VStack>
        );
      }}
    </BaseConfigEditor>
  );
};

export default MetricsConfigEditor;
