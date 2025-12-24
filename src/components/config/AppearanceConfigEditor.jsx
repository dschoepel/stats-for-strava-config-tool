import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Input, Flex, Text, Grid, VStack, HStack, Code, Checkbox } from '@chakra-ui/react';
import { MdExpandMore, MdChevronRight, MdAdd, MdClose, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import BaseConfigEditor from './BaseConfigEditor';
import { readSportsList, initialSportsList } from '../../utils/sportsListManager';
import CountrySelector from '../config-fields/CountrySelector';
import DashboardEditor from '../DashboardEditor';

/**
 * AppearanceConfigEditor - Handles appearance-specific configuration fields
 * Uses BaseConfigEditor for most fields with custom rendering for complex types
 */
const AppearanceConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  const [sportsList, setSportsList] = useState(initialSportsList);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [showDashboardEditor, setShowDashboardEditor] = useState(false);
  const [dashboardJustSaved, setDashboardJustSaved] = useState(false);
  const countryChangeHandlerRef = useRef(null);
  const formDataRef = useRef(null);
  const [expandedGroups, setExpandedGroups] = useState({
    globalSettings: false,
    dateFormat: false,
    dashboard: false,
    heatmap: false,
    photos: false,
    sportTypesSortingOrder: false
  });
  const [expandedSportCategories, setExpandedSportCategories] = useState({});

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const collapseAll = () => {
    setExpandedGroups({
      globalSettings: false,
      dateFormat: false,
      dashboard: false,
      heatmap: false,
      photos: false,
      sportTypesSortingOrder: false
    });
  };

  const expandAll = () => {
    setExpandedGroups({
      globalSettings: true,
      dateFormat: true,
      dashboard: true,
      heatmap: true,
      photos: true,
      sportTypesSortingOrder: true
    });
  };

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

  // Get flat array of all sport types
  const getAllSportTypes = () => {
    const allSports = [];
    Object.values(sportsList).forEach(categoryArray => {
      if (Array.isArray(categoryArray)) {
        allSports.push(...categoryArray);
      }
    });
    return allSports;
  };

  // Custom validation for appearance fields
  const validateAppearanceFields = (formData, getNestedValue) => {
    const errors = {};
    
    // Validate polyline color format
    const polylineColor = getNestedValue(formData, 'heatmap.polylineColor');
    if (polylineColor && !polylineColor.match(/^(#[0-9A-Fa-f]{3,6}|rgb|rgba|hsl|hsla|[a-z]+)/)) {
      errors['heatmap.polylineColor'] = 'Must be a valid CSS color (e.g., #fc6719, red, rgb(252, 103, 25))';
    }

    // Validate country code format if provided
    const countryCode = getNestedValue(formData, 'photos.defaultEnabledFilters.countryCode');
    if (countryCode && countryCode !== null && !countryCode.match(/^[A-Z]{2}$/)) {
      errors['photos.defaultEnabledFilters.countryCode'] = 'Must be a 2-letter uppercase ISO2 country code (e.g., US, GB, FR)';
    }

    return errors;
  };

  // Render sport type multi-select
  const renderSportTypeMultiSelect = (fieldName, fieldSchema, fieldPath, value, handleFieldChange, hasError) => {
    const selectedSports = Array.isArray(value) ? value : [];

    const handleSportToggle = (sport) => {
      const newSelection = selectedSports.includes(sport)
        ? selectedSports.filter(s => s !== sport)
        : [...selectedSports, sport];
      handleFieldChange(fieldPath, newSelection);
    };

    const toggleSportCategory = (category) => {
      setExpandedSportCategories(prev => ({
        ...prev,
        [category]: !prev[category]
      }));
    };

    return (
      <Box key={fieldPath} mb={4}>
        <Text fontWeight="500" mb={1}>
          {fieldSchema.title || fieldName}
        </Text>
        {fieldSchema.description && (
          <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
        )}
        <Box>
          {Object.keys(sportsList).length === 0 ? (
            <Text fontSize="sm" color="textMuted">
              No sports configured. Add sports in Settings → Sports List.
            </Text>
          ) : (
            <VStack align="stretch" gap={2}>
              {Object.entries(sportsList).map(([category, sports]) => (
                <Box key={category} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleSportCategory(category)}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    size="sm"
                    bg="cardBg"
                    color="text"
                  >
                    <Box as={expandedSportCategories[category] !== false ? MdExpandMore : MdChevronRight} mr={2} />
                    {category}
                  </Button>
                  {expandedSportCategories[category] !== false && (
                    <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={2} p={3}>
                      {sports.map(sport => (
                        <Checkbox.Root
                          key={sport}
                          checked={selectedSports.includes(sport)}
                          onCheckedChange={() => handleSportToggle(sport)}
                          colorPalette="orange"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Label fontSize="sm">
                            {sport}
                          </Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </Grid>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </Box>
        {hasError && <Text color="red.500" fontSize="sm" mt={1}>{hasError}</Text>}
      </Box>
    );
  };

  // Render sport type sorting order (drag and drop or list)
  const renderSportTypeSortingOrder = (fieldName, fieldSchema, fieldPath, value, handleFieldChange, hasError) => {
    const allSports = getAllSportTypes();
    const sortingOrder = Array.isArray(value) ? value : [];

    const handleAddSport = (sport) => {
      if (!sortingOrder.includes(sport)) {
        handleFieldChange(fieldPath, [...sortingOrder, sport]);
      }
    };

    const handleRemoveSport = (sport) => {
      handleFieldChange(fieldPath, sortingOrder.filter(s => s !== sport));
    };

    const handleMoveUp = (index) => {
      if (index > 0) {
        const newOrder = [...sortingOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        handleFieldChange(fieldPath, newOrder);
      }
    };

    const handleMoveDown = (index) => {
      if (index < sortingOrder.length - 1) {
        const newOrder = [...sortingOrder];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        handleFieldChange(fieldPath, newOrder);
      }
    };

    const availableSports = allSports.filter(sport => !sortingOrder.includes(sport));

    return (
      <Box key={fieldPath} mb={4}>
        <Text fontWeight="500" mb={1}>
          {fieldSchema.title || fieldName}
        </Text>
        {fieldSchema.description && (
          <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
        )}
        
        <VStack align="stretch" gap={4}>
          {sortingOrder.length > 0 && (
            <Box>
              <Text fontWeight="500" fontSize="sm" mb={2}>Current Sort Order:</Text>
              <VStack align="stretch" gap={1}>
                {sortingOrder.map((sport, index) => (
                  <Flex
                    key={sport}
                    direction={{ base: "column", sm: "row" }}
                    align={{ base: "stretch", sm: "center" }}
                    gap={2}
                    p={2}
                    bg="cardBg"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="md"
                  >
                    <Flex align="center" gap={2} flex="1">
                      <Text fontSize="sm" fontWeight="500" minWidth="30px">
                        {index + 1}.
                      </Text>
                      <Text flex="1" fontSize="sm">{sport}</Text>
                    </Flex>
                    <HStack gap={{ base: 0.5, sm: 1 }} justifyContent={{ base: "center", sm: "flex-end" }}>
                      <Button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        size={{ base: "xs", sm: "sm" }}
                        variant="ghost"
                        title="Move up"
                        minW={{ base: "24px", sm: "auto" }}
                        h={{ base: "24px", sm: "auto" }}
                        p={{ base: 1, sm: 2 }}
                      >
                        <Box as={MdArrowUpward} boxSize={{ base: "14px", sm: "16px" }} />
                      </Button>
                      <Button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sortingOrder.length - 1}
                        size={{ base: "xs", sm: "sm" }}
                        variant="ghost"
                        title="Move down"
                        minW={{ base: "24px", sm: "auto" }}
                        h={{ base: "24px", sm: "auto" }}
                        p={{ base: 1, sm: 2 }}
                      >
                        <Box as={MdArrowDownward} boxSize={{ base: "14px", sm: "16px" }} />
                      </Button>
                      <Button
                        onClick={() => handleRemoveSport(sport)}
                        size={{ base: "xs", sm: "sm" }}
                        variant="ghost"
                        colorPalette="red"
                        title="Remove"
                        minW={{ base: "24px", sm: "auto" }}
                        h={{ base: "24px", sm: "auto" }}
                        p={{ base: 1, sm: 2 }}
                      >
                        <Box as={MdClose} boxSize={{ base: "14px", sm: "16px" }} />
                      </Button>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            </Box>
          )}

          {availableSports.length > 0 && (
            <Box>
              <Text fontWeight="500" fontSize="sm" mb={2}>Add Sport to Order:</Text>
              <VStack align="stretch" gap={2}>
                {Object.entries(sportsList).map(([category, categoryArray]) => {
                  const availableInCategory = categoryArray.filter(sport => !sortingOrder.includes(sport));
                  if (availableInCategory.length === 0) return null;
                  
                  return (
                    <Box key={category} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                      <Button
                        onClick={() => setExpandedSportCategories(prev => ({
                          ...prev,
                          [`sorting_${category}`]: !prev[`sorting_${category}`]
                        }))}
                        width="100%"
                        justifyContent="flex-start"
                        variant="ghost"
                        size="sm"
                        bg="cardBg"
                        color="text"
                        whiteSpace="normal"
                        textAlign="left"
                        height="auto"
                        py={2}
                        wordBreak="break-word"
                      >
                        <Box as={expandedSportCategories[`sorting_${category}`] !== false ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                        {category}
                      </Button>
                      {expandedSportCategories[`sorting_${category}`] !== false && (
                        <Grid templateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap={2} p={3}>
                          {availableInCategory.map(sport => (
                            <Button
                              key={sport}
                              onClick={() => handleAddSport(sport)}
                              size={{ base: "xs", sm: "sm" }}
                              variant="outline"
                              whiteSpace="normal"
                              wordBreak="break-word"
                              height="auto"
                              py={{ base: 1, sm: 2 }}
                              px={{ base: 1.5, sm: 2 }}
                              fontSize={{ base: "xs", sm: "sm" }}
                              lineHeight="1.3"
                              textAlign="left"
                            >
                              <Box as={MdAdd} boxSize={{ base: "12px", sm: "16px" }} mr={1} flexShrink={0} /> {sport}
                            </Button>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          )}
        </VStack>
        {hasError && <Text color="red.500" fontSize="sm" mt={1}>{hasError}</Text>}
      </Box>
    );
  };

  return (
    <>
      <BaseConfigEditor
        sectionName="appearance"
        initialData={initialData}
        onSave={onSave}
        onCancel={onCancel}
        isLoading={isLoading}
        onDirtyChange={onDirtyChange}
        customValidation={validateAppearanceFields}
      >
        {({ formData, errors, schema, handleFieldChange, getNestedValue, renderBasicField, renderObjectField }) => {
          // Store the change handler and formData in refs for use in modals
          countryChangeHandlerRef.current = handleFieldChange;
          formDataRef.current = formData;
          
          return (
            <>
              {/* Collapse/Expand All Controls */}
              <Flex mb={4} gap={2} wrap="wrap">
                <Button 
                  onClick={expandAll} 
                  size={{ base: "xs", sm: "sm" }} 
                  variant="outline"
                  flex={{ base: "1", sm: "0" }}
                  minW={{ base: "auto", sm: "100px" }}
                >
                  Expand All
                </Button>
                <Button 
                  onClick={collapseAll} 
                  size={{ base: "xs", sm: "sm" }} 
                  variant="outline"
                  flex={{ base: "1", sm: "0" }}
                  minW={{ base: "auto", sm: "100px" }}
                >
                  Collapse All
                </Button>
              </Flex>

          {/* Global Appearance Settings Group */}
          {schema?.properties && (
            <Box mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
              <Button
                onClick={() => toggleGroup('globalSettings')}
                width="100%"
                justifyContent="flex-start"
                variant="ghost"
                fontWeight="600"
                bg="cardBg"
                color="text"
                whiteSpace="normal"
                textAlign="left"
                height="auto"
                py={2}
                wordBreak="break-word"
              >
                <Box as={expandedGroups.globalSettings ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                Global Appearance Settings
              </Button>
              {expandedGroups.globalSettings && (
                <Box p={4}>
                  {schema.properties.locale && renderBasicField('locale', schema.properties.locale)}
                  {schema.properties.unitSystem && renderBasicField('unitSystem', schema.properties.unitSystem)}
                  {schema.properties.timeFormat && renderBasicField('timeFormat', schema.properties.timeFormat)}
                </Box>
              )}
            </Box>
          )}

          {schema?.properties && Object.entries(schema.properties).map(([fieldName, fieldSchema]) => {
            const value = getNestedValue(formData, fieldName);
            const hasError = errors[fieldName];

            // Skip fields that are in the Global Appearance Settings group
            if (fieldName === 'locale' || fieldName === 'unitSystem' || fieldName === 'timeFormat') {
              return null;
            }

            // Special handling for dateFormat - wrap in visual group
            if (fieldName === 'dateFormat') {
              return (
                <Box key={fieldName} mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleGroup('dateFormat')}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    fontWeight="600"
                    bg="cardBg"
                    color="text"
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    py={2}
                    wordBreak="break-word"
                  >
                    <Box as={expandedGroups.dateFormat ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                    {fieldSchema.title}
                  </Button>
                  {expandedGroups.dateFormat && (
                    <Box p={4}>
                      {fieldSchema.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
                      )}
                      {renderBasicField('dateFormat.short', fieldSchema.properties.short)}
                      {renderBasicField('dateFormat.normal', fieldSchema.properties.normal)}
                    </Box>
                  )}
                </Box>
              );
            }

            // Special handling for dashboard - wrap in visual group
            if (fieldName === 'dashboard') {
              return (
                <Box key={fieldName} mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleGroup('dashboard')}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    fontWeight="600"
                    bg="cardBg"
                    color="text"
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    py={2}
                    wordBreak="break-word"
                  >
                    <Box as={expandedGroups.dashboard ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                    {fieldSchema.title}
                  </Button>
                  {expandedGroups.dashboard && (
                    <Box p={4}>
                      {fieldSchema.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
                      )}
                      <Flex
                        align="flex-start"
                        gap={2}
                        p={3}
                        bg="blue.50"
                        _dark={{ bg: 'blue.900/30' }}
                        borderRadius="md"
                        mb={3}
                      >
                        <Text fontSize="lg">ℹ️</Text>
                        <Text fontSize="sm">
                          Dashboard layout is a complex nested structure. 
                          Use the Dashboard Editor below to view and manage your widgets.
                          Leave as <Code fontSize="sm">null</Code> to use the default layout.
                        </Text>
                      </Flex>
                      {dashboardJustSaved && (
                        <Flex
                          align="flex-start"
                          gap={2}
                          p={3}
                          bg="orange.50"
                          _dark={{ bg: 'orange.900/30' }}
                          borderRadius="md"
                          mb={3}
                        >
                          <Text fontSize="lg">⚠️</Text>
                          <Text fontSize="sm">
                            Dashboard changes saved to form. <Text as="strong">Click the main Save button below to persist these changes to your config file.</Text>
                          </Text>
                        </Flex>
                      )}
                      <Button 
                        onClick={() => setShowDashboardEditor(true)}
                        size={{ base: "xs", sm: "sm" }}
                        width={{ base: "100%", sm: "auto" }}
                        whiteSpace="normal"
                        height="auto"
                        py={2}
                      >
                        📊 Edit Dashboard Layout
                      </Button>
                    </Box>
                  )}
                </Box>
              );
            }

            // Special handling for sport type sorting - wrap in visual group
            if (fieldName === 'sportTypesSortingOrder') {
              return (
                <Box key={fieldName} mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleGroup('sportTypesSortingOrder')}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    fontWeight="600"
                    bg="cardBg"
                    color="text"
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    py={2}
                    wordBreak="break-word"
                  >
                    <Box as={expandedGroups.sportTypesSortingOrder ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                    {fieldSchema.title}
                  </Button>
                  {expandedGroups.sportTypesSortingOrder && (
                    <Box p={4}>
                      {fieldSchema.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
                      )}
                      {renderSportTypeSortingOrder(
                        fieldName, 
                        fieldSchema, 
                        fieldName, 
                        value, 
                        handleFieldChange, 
                        hasError
                      )}
                    </Box>
                  )}
                </Box>
              );
            }

            // Handle heatmap with special tileLayerUrl rendering
            if (fieldName === 'heatmap') {
              const tileLayerValue = getNestedValue(formData, 'heatmap.tileLayerUrl');
              const isArray = Array.isArray(tileLayerValue);
              
              return (
                <Box key={fieldName} mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleGroup('heatmap')}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    fontWeight="600"
                    bg="cardBg"
                    color="text"
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    py={2}
                    wordBreak="break-word"
                  >
                    <Box as={expandedGroups.heatmap ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                    {fieldSchema.title}
                  </Button>
                  {expandedGroups.heatmap && (
                    <Box p={4}>
                      {fieldSchema.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
                      )}
                      
                      {/* polylineColor */}
                      {renderBasicField('heatmap.polylineColor', fieldSchema.properties.polylineColor)}
                  
                  {/* tileLayerUrl - special handling for oneOf (string or array) */}
                  <Box mb={4}>
                    <Text fontWeight="500" mb={1} htmlFor="heatmap.tileLayerUrl">
                      {fieldSchema.properties.tileLayerUrl.oneOf[0].title || 'Tile Layer URL'}
                    </Text>
                    <Text fontSize="sm" color="textMuted" mb={2}>
                      URL template for map tiles. Can be a single URL or multiple URLs for layered maps.
                    </Text>
                    
                    {!isArray ? (
                      <>
                        <Input
                          id="heatmap.tileLayerUrl"
                          value={tileLayerValue || ''}
                          onChange={(e) => handleFieldChange('heatmap.tileLayerUrl', e.target.value)}
                          borderColor={errors['heatmap.tileLayerUrl'] ? 'red.500' : 'border'}
                          placeholder="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                          mb={2}
                        />
                        <Button
                          onClick={() => handleFieldChange('heatmap.tileLayerUrl', [tileLayerValue || ''])}
                          size={{ base: "xs", sm: "sm" }}
                          variant="outline"
                          width={{ base: "100%", sm: "auto" }}
                          whiteSpace="normal"
                          height="auto"
                          py={{ base: 1.5, sm: 2 }}
                        >
                          Convert to Multiple Layers
                        </Button>
                      </>
                    ) : (
                      <>
                        <VStack align="stretch" gap={2} mb={2}>
                          {tileLayerValue.map((url, index) => (
                            <Flex key={index} gap={2}>
                              <Input
                                value={url}
                                onChange={(e) => {
                                  const newArray = [...tileLayerValue];
                                  newArray[index] = e.target.value;
                                  handleFieldChange('heatmap.tileLayerUrl', newArray);
                                }}
                                placeholder={`Layer ${index + 1} URL`}
                                flex="1"
                              />
                              <Button
                                onClick={() => {
                                  const newArray = tileLayerValue.filter((_, i) => i !== index);
                                  handleFieldChange('heatmap.tileLayerUrl', newArray.length === 1 ? newArray[0] : newArray);
                                }}
                                size={{ base: "xs", sm: "sm" }}
                                variant="outline"
                                colorPalette="red"
                                minW={{ base: "28px", sm: "auto" }}
                                p={{ base: 1, sm: 2 }}
                              >
                                <Box as={MdClose} boxSize={{ base: "14px", sm: "16px" }} />
                              </Button>
                            </Flex>
                          ))}
                        </VStack>
                        <Button
                          onClick={() => handleFieldChange('heatmap.tileLayerUrl', [...tileLayerValue, ''])}
                          size={{ base: "xs", sm: "sm" }}
                          variant="outline"
                          width={{ base: "100%", sm: "auto" }}
                        >
                          <Box as={MdAdd} boxSize={{ base: "14px", sm: "16px" }} mr={1} /> Add Layer
                        </Button>
                      </>
                    )}
                    {errors['heatmap.tileLayerUrl'] && <Text color="red.500" fontSize="sm" mt={1}>{errors['heatmap.tileLayerUrl']}</Text>}
                  </Box>
                  
                  {/* enableGreyScale */}
                  {renderBasicField('heatmap.enableGreyScale', fieldSchema.properties.enableGreyScale)}
                    </Box>
                  )}
                </Box>
              );
            }

            // Handle nested sport type arrays in photos
            if (fieldName === 'photos') {
              return (
                <Box key={fieldName} mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                  <Button
                    onClick={() => toggleGroup('photos')}
                    width="100%"
                    justifyContent="flex-start"
                    variant="ghost"
                    fontWeight="600"
                    bg="cardBg"
                    color="text"
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    py={2}
                    wordBreak="break-word"
                  >
                    <Box as={expandedGroups.photos ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                    {fieldSchema.title}
                  </Button>
                  {expandedGroups.photos && (
                    <Box p={4}>
                      {fieldSchema.description && (
                        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
                      )}
                  
                  {/* hidePhotosForSportTypes */}
                  {renderSportTypeMultiSelect(
                    'hidePhotosForSportTypes',
                    fieldSchema.properties.hidePhotosForSportTypes,
                    'photos.hidePhotosForSportTypes',
                    getNestedValue(formData, 'photos.hidePhotosForSportTypes'),
                    handleFieldChange,
                    errors['photos.hidePhotosForSportTypes']
                  )}

                  {/* defaultEnabledFilters.sportTypes */}
                  {renderSportTypeMultiSelect(
                    'sportTypes',
                    fieldSchema.properties.defaultEnabledFilters.properties.sportTypes,
                    'photos.defaultEnabledFilters.sportTypes',
                    getNestedValue(formData, 'photos.defaultEnabledFilters.sportTypes'),
                    handleFieldChange,
                    errors['photos.defaultEnabledFilters.sportTypes']
                  )}

                  {/* defaultEnabledFilters.countryCode */}
                  <Box mb={4}>
                    <Text fontWeight="500" mb={1}>
                      Country Code
                    </Text>
                    {fieldSchema.properties.defaultEnabledFilters.properties.countryCode.description && (
                      <Text fontSize="sm" color="textMuted" mb={2}>
                        {fieldSchema.properties.defaultEnabledFilters.properties.countryCode.description}
                      </Text>
                    )}
                    <Flex gap={2} direction={{ base: "column", sm: "row" }}>
                      <Input
                        value={getNestedValue(formData, 'photos.defaultEnabledFilters.countryCode') || ''}
                        readOnly
                        placeholder="Click button to select country"
                        flex="1"
                        borderColor={errors['photos.defaultEnabledFilters.countryCode'] ? 'red.500' : 'border'}
                      />
                      <Button
                        onClick={() => setShowCountrySelector(true)}
                        size={{ base: "xs", sm: "md" }}
                        width={{ base: "100%", sm: "auto" }}
                        whiteSpace="normal"
                      >
                        Select Country
                      </Button>
                    </Flex>
                    {errors['photos.defaultEnabledFilters.countryCode'] && (
                      <Text color="red.500" fontSize="sm" mt={1}>{errors['photos.defaultEnabledFilters.countryCode']}</Text>
                    )}
                  </Box>
                    </Box>
                  )}
                </Box>
              );
            }

            // Handle object types (but skip dashboard and dateFormat as they're already handled above)
            if ((fieldSchema.type === 'object' || (Array.isArray(fieldSchema.type) && fieldSchema.type.includes('object'))) 
                && fieldName !== 'dashboard' && fieldName !== 'dateFormat') {
              return renderObjectField(fieldName, fieldSchema);
            }

            // Default to basic field rendering
            return renderBasicField(fieldName, fieldSchema);
          })}
            </>
          );
        }}
      </BaseConfigEditor>
      
      {showCountrySelector && (
        <CountrySelector
          value={initialData?.photos?.defaultEnabledFilters?.countryCode}
          onChange={(countryCode) => {
            if (countryChangeHandlerRef.current) {
              countryChangeHandlerRef.current('photos.defaultEnabledFilters.countryCode', countryCode);
            }
          }}
          onClose={() => setShowCountrySelector(false)}
        />
      )}

      {showDashboardEditor && (
        <DashboardEditor
          dashboardLayout={formDataRef.current?.dashboard?.layout || []}
          onClose={() => setShowDashboardEditor(false)}
          onSave={(updatedLayout) => {
            // Update the dashboard.layout in the form data
            // This will trigger the dirty state in BaseConfigEditor
            if (countryChangeHandlerRef.current) {
              countryChangeHandlerRef.current('dashboard.layout', updatedLayout);
            }
            setShowDashboardEditor(false);
            setDashboardJustSaved(true);
            // Clear the indicator after 8 seconds
            setTimeout(() => setDashboardJustSaved(false), 8000);
          }}
        />
      )}
    </>
  );
};

export default AppearanceConfigEditor;
