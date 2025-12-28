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
  Flex,
  Grid,
  Portal,
  Switch,
  NumberInput,
  Checkbox,
} from '@chakra-ui/react';
import { MdAdd, MdDelete, MdArrowUpward, MdArrowDownward, MdExpandMore, MdChevronRight, MdInfo, MdDirectionsBike, MdWarning, MdBuild } from 'react-icons/md';
import BaseConfigEditor from './BaseConfigEditor';

// Locale to currency mapping
const localeToCurrency = {
  'en_US': 'USD',
  'fr_FR': 'EUR',
  'it_IT': 'EUR',
  'nl_BE': 'EUR',
  'de_DE': 'EUR',
  'pt_BR': 'BRL',
  'pt_PT': 'EUR',
  'sv_SE': 'SEK',
  'zh_CN': 'CNY'
};

/**
 * GearConfigEditor - Handles gear configuration fields
 * Manages Strava gear enrichment and custom gear tracking
 */
const GearConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  const [expandedStravaGear, setExpandedStravaGear] = useState({});
  const [expandedCustomGear, setExpandedCustomGear] = useState({});
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  // Load appearance config to get locale and derive currency
  useEffect(() => {
    const loadAppearanceConfig = async () => {
      try {
        const response = await fetch('/api/config-files');
        const configFiles = await response.json();
        
        // Find the file containing appearance section
        const appearanceFile = configFiles.files.find(file => 
          file.sections && file.sections.some(s => s.name === 'appearance')
        );
        
        if (appearanceFile) {
          const contentResponse = await fetch(`/api/file-content?file=${encodeURIComponent(appearanceFile.path)}`);
          const fileData = await contentResponse.json();
          
          const parseSectionsResponse = await fetch('/api/parse-sections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ yamlContent: fileData.content })
          });
          const sections = await parseSectionsResponse.json();
          
          if (sections.appearance) {
            const locale = sections.appearance.locale || 'en_US';
            const currency = localeToCurrency[locale] || 'USD';
            setDefaultCurrency(currency);
          }
        }
      } catch (error) {
        console.error('Failed to load appearance config:', error);
        setDefaultCurrency('USD');
      }
    };

    loadAppearanceConfig();
  }, []);

  // Custom validation for gear fields
  const validateGearFields = (formData, getNestedValue) => {
    const errors = {};
    
    const stravaGearArray = getNestedValue(formData, 'stravaGear') || [];
    
    stravaGearArray.forEach((gear, index) => {
      // Validate gear ID
      if (!gear.gearId || gear.gearId.trim() === '') {
        errors[`stravaGear[${index}].gearId`] = 'Gear ID is required';
      }
      
      // Validate purchase price if provided
      if (gear.purchasePrice) {
        if (gear.purchasePrice.amountInCents === undefined || gear.purchasePrice.amountInCents === null) {
          errors[`stravaGear[${index}].purchasePrice.amountInCents`] = 'Amount is required when purchase price is specified';
        } else if (gear.purchasePrice.amountInCents < 0) {
          errors[`stravaGear[${index}].purchasePrice.amountInCents`] = 'Amount must be positive';
        }
        
        if (!gear.purchasePrice.currency || gear.purchasePrice.currency.trim() === '') {
          errors[`stravaGear[${index}].purchasePrice.currency`] = 'Currency is required when purchase price is specified';
        } else if (!/^[A-Z]{3}$/.test(gear.purchasePrice.currency)) {
          errors[`stravaGear[${index}].purchasePrice.currency`] = 'Currency must be a 3-letter ISO code (e.g., USD, EUR, GBP)';
        }
      }
    });
    
    // Validate custom gear
    const customGearConfig = getNestedValue(formData, 'customGear') || {};
    const customGearsArray = customGearConfig.customGears || [];
    
    // Validate hashtag prefix if custom gear is enabled
    if (customGearConfig.enabled) {
      if (!customGearConfig.hashtagPrefix || customGearConfig.hashtagPrefix.trim() === '') {
        errors['customGear.hashtagPrefix'] = 'Hashtag prefix is required when custom gear is enabled';
      } else if (!/^[a-z0-9-]+$/i.test(customGearConfig.hashtagPrefix)) {
        errors['customGear.hashtagPrefix'] = 'Hashtag prefix should only contain letters, numbers, and hyphens';
      }
    }
    
    // Track unique tags
    const tags = new Set();
    
    customGearsArray.forEach((gear, index) => {
      // Validate tag
      if (!gear.tag || gear.tag.trim() === '') {
        errors[`customGear.customGears[${index}].tag`] = 'Tag is required';
      } else if (!/^[a-z0-9-]+$/i.test(gear.tag)) {
        errors[`customGear.customGears[${index}].tag`] = 'Tag should only contain letters, numbers, and hyphens (no spaces)';
      } else if (tags.has(gear.tag)) {
        errors[`customGear.customGears[${index}].tag`] = 'Tag must be unique';
      } else {
        tags.add(gear.tag);
      }
      
      // Validate label
      if (!gear.label || gear.label.trim() === '') {
        errors[`customGear.customGears[${index}].label`] = 'Label is required';
      }
      
      // Validate purchase price if provided
      if (gear.purchasePrice) {
        if (gear.purchasePrice.amountInCents === undefined || gear.purchasePrice.amountInCents === null) {
          errors[`customGear.customGears[${index}].purchasePrice.amountInCents`] = 'Amount is required when purchase price is specified';
        } else if (gear.purchasePrice.amountInCents < 0) {
          errors[`customGear.customGears[${index}].purchasePrice.amountInCents`] = 'Amount must be positive';
        }
        
        if (!gear.purchasePrice.currency || gear.purchasePrice.currency.trim() === '') {
          errors[`customGear.customGears[${index}].purchasePrice.currency`] = 'Currency is required when purchase price is specified';
        } else if (!/^[A-Z]{3}$/.test(gear.purchasePrice.currency)) {
          errors[`customGear.customGears[${index}].purchasePrice.currency`] = 'Currency must be a 3-letter ISO code (e.g., USD, EUR, GBP)';
        }
      }
    });
    
    return errors;
  };

  return (
    <BaseConfigEditor
      sectionName="gear"
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
      isLoading={isLoading}
      onDirtyChange={onDirtyChange}
      customValidation={validateGearFields}
    >
      {({ formData, handleFieldChange, getNestedValue, errors }) => {
        const stravaGearArray = getNestedValue(formData, 'stravaGear') || [];
        const customGearConfig = getNestedValue(formData, 'customGear') || { enabled: false, hashtagPrefix: 'sfs', customGears: [] };
        const customGearsArray = customGearConfig.customGears || [];

        // Strava Gear Handlers
        const handleAddStravaGear = () => {
          const newGear = {
            gearId: '',
            purchasePrice: {
              amountInCents: 0,
              currency: defaultCurrency
            }
          };
          handleFieldChange('stravaGear', [...stravaGearArray, newGear]);
          setExpandedStravaGear(prev => ({ ...prev, [stravaGearArray.length]: true }));
        };

        const handleRemoveStravaGear = (index) => {
          const updated = stravaGearArray.filter((_, i) => i !== index);
          handleFieldChange('stravaGear', updated);
          
          const newExpanded = {};
          Object.keys(expandedStravaGear).forEach(key => {
            const keyIndex = parseInt(key);
            if (keyIndex < index) {
              newExpanded[keyIndex] = expandedStravaGear[key];
            } else if (keyIndex > index) {
              newExpanded[keyIndex - 1] = expandedStravaGear[key];
            }
          });
          setExpandedStravaGear(newExpanded);
        };

        const handleMoveStravaGear = (fromIndex, toIndex) => {
          if (toIndex < 0 || toIndex >= stravaGearArray.length) return;
          
          const updated = [...stravaGearArray];
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          handleFieldChange('stravaGear', updated);
        };

        const toggleStravaGearExpansion = (index) => {
          setExpandedStravaGear(prev => ({ ...prev, [index]: !prev[index] }));
        };

        const handleUpdateStravaGear = (index, field, value) => {
          const updated = [...stravaGearArray];
          if (field.includes('.')) {
            // Nested field like purchasePrice.amountInCents
            const [parent, child] = field.split('.');
            updated[index] = {
              ...updated[index],
              [parent]: {
                ...updated[index][parent],
                [child]: value
              }
            };
          } else {
            updated[index] = { ...updated[index], [field]: value };
          }
          handleFieldChange('stravaGear', updated);
        };

        // Custom Gear Handlers
        const handleToggleCustomGear = (enabled) => {
          handleFieldChange('customGear', {
            ...customGearConfig,
            enabled
          });
        };

        const handleUpdateHashtagPrefix = (prefix) => {
          handleFieldChange('customGear', {
            ...customGearConfig,
            hashtagPrefix: prefix
          });
        };

        const handleAddCustomGear = () => {
          const newGear = {
            tag: '',
            label: '',
            isRetired: false,
            purchasePrice: {
              amountInCents: 0,
              currency: defaultCurrency
            }
          };
          handleFieldChange('customGear', {
            ...customGearConfig,
            customGears: [...customGearsArray, newGear]
          });
          setExpandedCustomGear(prev => ({ ...prev, [customGearsArray.length]: true }));
        };

        const handleRemoveCustomGear = (index) => {
          const updated = customGearsArray.filter((_, i) => i !== index);
          handleFieldChange('customGear', {
            ...customGearConfig,
            customGears: updated
          });
          
          const newExpanded = {};
          Object.keys(expandedCustomGear).forEach(key => {
            const keyIndex = parseInt(key);
            if (keyIndex < index) {
              newExpanded[keyIndex] = expandedCustomGear[key];
            } else if (keyIndex > index) {
              newExpanded[keyIndex - 1] = expandedCustomGear[key];
            }
          });
          setExpandedCustomGear(newExpanded);
        };

        const handleMoveCustomGear = (fromIndex, toIndex) => {
          if (toIndex < 0 || toIndex >= customGearsArray.length) return;
          
          const updated = [...customGearsArray];
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          handleFieldChange('customGear', {
            ...customGearConfig,
            customGears: updated
          });
        };

        const toggleCustomGearExpansion = (index) => {
          setExpandedCustomGear(prev => ({ ...prev, [index]: !prev[index] }));
        };

        const handleUpdateCustomGear = (index, field, value) => {
          const updated = [...customGearsArray];
          if (field.includes('.')) {
            // Nested field like purchasePrice.amountInCents
            const [parent, child] = field.split('.');
            updated[index] = {
              ...updated[index],
              [parent]: {
                ...updated[index][parent],
                [child]: value
              }
            };
          } else {
            updated[index] = { ...updated[index], [field]: value };
          }
          handleFieldChange('customGear', {
            ...customGearConfig,
            customGears: updated
          });
        };

        return (
          <VStack align="stretch" gap={6}>
            {/* Introduction */}
            <Box 
              p={4} 
              bg="infoBg"
              _dark={{ bg: "infoBg" }}
              borderRadius="md" 
              border="1px solid" 
              borderColor="border"
            >
              <HStack gap={2} mb={2}>
                <Box as={MdInfo} color="infoText" boxSize="20px" />
                <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="semibold" color="text">
                  About Gear Tracking
                </Text>
              </HStack>
              <Text fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9}>
                Enrich your Strava gear with additional data like purchase prices to calculate cost per workout. 
                You can also track custom gear that Strava doesn't support (like heart rate monitors, power meters, etc.).
              </Text>
            </Box>

            {/* Strava Gear Section */}
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
                    <HStack gap={2}>
                      <Box as={MdDirectionsBike} color="primary" boxSize="20px" />
                      <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="semibold" color="text">
                        Strava Gear
                      </Text>
                    </HStack>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
                      {stravaGearArray.length} {stravaGearArray.length === 1 ? 'item' : 'items'}
                    </Text>
                  </Box>
                  <Button
                    onClick={handleAddStravaGear}
                    colorPalette="blue"
                    size={{ base: "sm", sm: "sm" }}
                    width={{ base: "100%", sm: "auto" }}
                    leftIcon={<MdAdd />}
                  >
                    Add Strava Gear
                  </Button>
                </Flex>

                {stravaGearArray.length === 0 ? (
                  <Box
                    p={8}
                    textAlign="center"
                    bg="panelBg"
                    borderRadius="md"
                    border="2px dashed"
                    borderColor="border"
                  >
                    <Text fontSize="sm" color="textMuted" mb={3}>
                      No Strava gear configured yet. Add gear to track purchase prices and calculate costs.
                    </Text>
                    <Button
                      onClick={handleAddStravaGear}
                      colorPalette="blue"
                      size="sm"
                      leftIcon={<MdAdd />}
                    >
                      Add Your First Gear
                    </Button>
                  </Box>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {stravaGearArray.map((gear, index) => {
                      const isExpanded = expandedStravaGear[index];
                      const hasErrors = Object.keys(errors).some(key => key.startsWith(`stravaGear[${index}]`));

                      return (
                        <Box
                          key={index}
                          borderWidth="1px"
                          borderColor={hasErrors ? "warningBorder" : "border"}
                          _dark={{ borderColor: hasErrors ? "warningBorder" : "border" }}
                          borderRadius="md"
                          overflow="hidden"
                        >
                          {/* Header */}
                          <Flex
                            p={{ base: 2, sm: 3 }}
                            bg={hasErrors ? "warningBg" : "panelBg"}
                            _dark={{ bg: hasErrors ? "warningBg" : "panelBg" }}
                            align="center"
                            gap={{ base: 1, sm: 2 }}
                            cursor="pointer"
                            onClick={() => toggleStravaGearExpansion(index)}
                            _hover={{ opacity: 0.8 }}
                            wrap="wrap"
                          >
                            <Box as={isExpanded ? MdExpandMore : MdChevronRight} boxSize={{ base: "16px", sm: "20px" }} flexShrink={0} />
                            <Text fontWeight="600" color="text" flex="1" fontSize={{ base: "sm", sm: "md" }} minW="120px">
                              {gear.gearId || `Gear ${index + 1}`}
                            </Text>
                            <HStack gap={{ base: 0.5, sm: 1 }} flexShrink={0}>
                              <IconButton
                                size={{ base: "xs", sm: "sm" }}
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStravaGear(index, index - 1);
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
                                  handleMoveStravaGear(index, index + 1);
                                }}
                                isDisabled={index === stravaGearArray.length - 1}
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
                                  handleRemoveStravaGear(index);
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
                            <Box p={{ base: 3, sm: 4 }} bg="cardBg">
                              <VStack align="stretch" gap={4}>
                                {/* Gear ID */}
                                <Field.Root invalid={!!errors[`stravaGear[${index}].gearId`]}>
                                  <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Gear ID</Field.Label>
                                  <Input
                                    value={gear.gearId || ''}
                                    onChange={(e) => handleUpdateStravaGear(index, 'gearId', e.target.value)}
                                    placeholder="e.g., g12337767"
                                    bg="inputBg"
                                    size={{ base: "sm", sm: "md" }}
                                  />
                                  <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                    Get this from the gear details popup in Strava (NOT from the URL)
                                  </Field.HelperText>
                                  {errors[`stravaGear[${index}].gearId`] && (
                                    <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                      {errors[`stravaGear[${index}].gearId`]}
                                    </Field.ErrorText>
                                  )}
                                </Field.Root>

                                {/* Purchase Price */}
                                <Box>
                                  <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="medium" mb={2} color="text">
                                    Purchase Price (Optional)
                                  </Text>
                                  <Grid templateColumns={{ base: "1fr", sm: "2fr 1fr" }} gap={3}>
                                    <Field.Root invalid={!!errors[`stravaGear[${index}].purchasePrice.amountInCents`]}>
                                      <Field.Label fontSize={{ base: "xs", sm: "sm" }}>
                                        Amount
                                      </Field.Label>
                                      <NumberInput.Root
                                        value={String((gear.purchasePrice?.amountInCents ?? 0) / 100)}
                                        onValueChange={(details) => {
                                          const numValue = details.valueAsNumber;
                                          if (!isNaN(numValue)) {
                                            handleUpdateStravaGear(index, 'purchasePrice.amountInCents', Math.round(numValue * 100));
                                          }
                                        }}
                                        formatOptions={{
                                          style: "currency",
                                          currency: gear.purchasePrice?.currency || defaultCurrency,
                                          currencyDisplay: "symbol",
                                        }}
                                        min={0}
                                        step={0.01}
                                      >
                                        <NumberInput.Input
                                          bg="inputBg"
                                          size={{ base: "sm", sm: "md" }}
                                        />
                                      </NumberInput.Root>
                                      <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                        Enter price with currency formatting
                                      </Field.HelperText>
                                      {errors[`stravaGear[${index}].purchasePrice.amountInCents`] && (
                                        <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                          {errors[`stravaGear[${index}].purchasePrice.amountInCents`]}
                                        </Field.ErrorText>
                                      )}
                                    </Field.Root>

                                    <Field.Root invalid={!!errors[`stravaGear[${index}].purchasePrice.currency`]}>
                                      <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Currency</Field.Label>
                                      <Input
                                        value={gear.purchasePrice?.currency || defaultCurrency}
                                        onChange={(e) => handleUpdateStravaGear(index, 'purchasePrice.currency', e.target.value.toUpperCase())}
                                        placeholder={defaultCurrency}
                                        maxLength={3}
                                        bg="inputBg"
                                        size={{ base: "sm", sm: "md" }}
                                      />
                                      <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                        ISO code (from locale: {defaultCurrency})
                                      </Field.HelperText>
                                      {errors[`stravaGear[${index}].purchasePrice.currency`] && (
                                        <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                          {errors[`stravaGear[${index}].purchasePrice.currency`]}
                                        </Field.ErrorText>
                                      )}
                                    </Field.Root>
                                  </Grid>
                                </Box>
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

            {/* Custom Gear Section */}
            <Box 
              p={4} 
              bg="cardBg" 
              borderRadius="md" 
              border="1px solid" 
              borderColor="border"
              boxShadow="sm"
            >
              <VStack align="stretch" gap={4}>
                {/* Header */}
                <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                  <Box flex="1" minW={{ base: "100%", sm: "auto" }}>
                    <HStack gap={2}>
                      <Box as={MdBuild} color="primary" boxSize="20px" />
                      <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="semibold" color="text">
                        Custom Gear
                      </Text>
                    </HStack>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
                      {customGearsArray.length} {customGearsArray.length === 1 ? 'item' : 'items'}
                    </Text>
                  </Box>
                  <HStack gap={2} width={{ base: "100%", sm: "auto" }}>
                    <Checkbox.Root
                      checked={customGearConfig.enabled}
                      onCheckedChange={(e) => handleToggleCustomGear(e.checked)}
                      colorPalette="green"
                      size={{ base: "sm", sm: "md" }}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label fontSize={{ base: "xs", sm: "sm" }}>
                        Enable Custom Gear
                      </Checkbox.Label>
                    </Checkbox.Root>
                  </HStack>
                </Flex>

                {/* Information Box */}
                <Box 
                  p={3} 
                  bg="infoBg"
                  _dark={{ bg: "infoBg" }}
                  borderRadius="md" 
                  border="1px solid" 
                  borderColor="border"
                >
                  <HStack gap={2} mb={2} align="flex-start">
                    <Box as={MdInfo} color="infoText" boxSize="16px" flexShrink={0} mt={0.5} />
                    <VStack align="stretch" gap={1} flex={1}>
                      <Text fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9}>
                        Track gear that Strava doesn't support by adding hashtags to your activity titles.
                        For example: <code>#sfs-peddle-board</code> or <code>#sfs-workout-shoes</code>
                      </Text>
                      <Text fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9}>
                        <strong>Note:</strong> Each activity can only have one gear. If both Strava gear and custom gear are present, 
                        Strava gear takes precedence.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {/* Warning if enabled but no prefix */}
                {customGearConfig.enabled && (!customGearConfig.hashtagPrefix || customGearConfig.hashtagPrefix.trim() === '') && (
                  <Box 
                    p={3} 
                    bg="warningBg"
                    _dark={{ bg: "warningBg" }}
                    borderRadius="md" 
                    border="1px solid" 
                    borderColor="warningBorder"
                  >
                    <HStack gap={2}>
                      <Box as={MdWarning} color="warningText" boxSize="16px" />
                      <Text fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9}>
                        <strong>Warning:</strong> Custom gear is enabled but no hashtag prefix is set. Please configure a prefix below.
                      </Text>
                    </HStack>
                  </Box>
                )}

                {/* Hashtag Prefix Configuration */}
                {customGearConfig.enabled && (
                  <Box 
                    p={4} 
                    bg="panelBg" 
                    borderRadius="md"
                    border="1px solid"
                    borderColor="border"
                  >
                    <VStack align="stretch" gap={3}>
                      <Field.Root invalid={!!errors['customGear.hashtagPrefix']}>
                        <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Hashtag Prefix</Field.Label>
                        <Input
                          value={customGearConfig.hashtagPrefix || ''}
                          onChange={(e) => handleUpdateHashtagPrefix(e.target.value)}
                          placeholder="sfs"
                          bg="inputBg"
                          size={{ base: "sm", sm: "md" }}
                        />
                        <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                          Short prefix for hashtags (e.g., "sfs" creates tags like #sfs-peddle-board). 
                          Use only letters, numbers, and hyphens.
                        </Field.HelperText>
                        {errors['customGear.hashtagPrefix'] && (
                          <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                            {errors['customGear.hashtagPrefix']}
                          </Field.ErrorText>
                        )}
                      </Field.Root>

                      <Box>
                        <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="medium" mb={2} color="text">
                          Example hashtag format:
                        </Text>
                        <Box 
                          p={2} 
                          bg="cardBg" 
                          borderRadius="sm" 
                          fontFamily="mono" 
                          fontSize={{ base: "xs", sm: "sm" }}
                          color="text"
                        >
                          #{customGearConfig.hashtagPrefix || 'prefix'}-gear-tag
                        </Box>
                      </Box>
                    </VStack>
                  </Box>
                )}

                {/* Add Button */}
                {customGearConfig.enabled && (
                  <Button
                    onClick={handleAddCustomGear}
                    colorPalette="green"
                    size={{ base: "sm", sm: "sm" }}
                    width={{ base: "100%", sm: "auto" }}
                    leftIcon={<MdAdd />}
                    alignSelf={{ base: "stretch", sm: "flex-end" }}
                  >
                    Add Custom Gear
                  </Button>
                )}

                {/* Gear List */}
                {customGearConfig.enabled ? (
                  <>
                    {customGearsArray.length === 0 ? (
                      <Box
                        p={8}
                        textAlign="center"
                        bg="panelBg"
                        borderRadius="md"
                        border="2px dashed"
                        borderColor="border"
                      >
                        <Text fontSize="sm" color="textMuted" mb={3}>
                          No custom gear configured yet. Add your first gear item to start tracking.
                        </Text>
                        <Button
                          onClick={handleAddCustomGear}
                          colorPalette="green"
                          size="sm"
                          leftIcon={<MdAdd />}
                        >
                          Add Your First Gear
                        </Button>
                      </Box>
                    ) : (
                      <VStack align="stretch" gap={3}>
                        {customGearsArray.map((gear, index) => {
                          const isExpanded = expandedCustomGear[index];
                          const hasErrors = Object.keys(errors).some(key => key.startsWith(`customGear.customGears[${index}]`));
                          const fullHashtag = `#${customGearConfig.hashtagPrefix || 'prefix'}-${gear.tag || 'tag'}`;

                          return (
                            <Box
                              key={index}
                              borderWidth="1px"
                              borderColor={hasErrors ? "warningBorder" : "border"}
                              _dark={{ borderColor: hasErrors ? "warningBorder" : "border" }}
                              borderRadius="md"
                              overflow="hidden"
                            >
                              {/* Header */}
                              <Flex
                                p={{ base: 2, sm: 3 }}
                                bg={hasErrors ? "warningBg" : "panelBg"}
                                _dark={{ bg: hasErrors ? "warningBg" : "panelBg" }}
                                align="center"
                                gap={{ base: 1, sm: 2 }}
                                cursor="pointer"
                                onClick={() => toggleCustomGearExpansion(index)}
                                _hover={{ opacity: 0.8 }}
                                wrap="wrap"
                              >
                                <Box as={isExpanded ? MdExpandMore : MdChevronRight} boxSize={{ base: "16px", sm: "20px" }} flexShrink={0} />
                                <VStack align="flex-start" flex="1" gap={0} minW="120px">
                                  <Text fontWeight="600" color="text" fontSize={{ base: "sm", sm: "md" }}>
                                    {gear.label || `Gear ${index + 1}`}
                                  </Text>
                                  <Text fontSize={{ base: "xs", sm: "xs" }} color="textMuted" fontFamily="mono">
                                    {fullHashtag}
                                  </Text>
                                </VStack>
                                {gear.isRetired && (
                                  <Box
                                    px={2}
                                    py={0.5}
                                    bg="mutedBg"
                                    _dark={{ bg: "mutedBg" }}
                                    borderRadius="sm"
                                    fontSize="xs"
                                    color="textMuted"
                                  >
                                    Retired
                                  </Box>
                                )}
                                <HStack gap={{ base: 0.5, sm: 1 }} flexShrink={0}>
                                  <IconButton
                                    size={{ base: "xs", sm: "sm" }}
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveCustomGear(index, index - 1);
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
                                      handleMoveCustomGear(index, index + 1);
                                    }}
                                    isDisabled={index === customGearsArray.length - 1}
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
                                      handleRemoveCustomGear(index);
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
                                <Box p={{ base: 3, sm: 4 }} bg="cardBg">
                                  <VStack align="stretch" gap={4}>
                                    {/* Tag */}
                                    <Field.Root invalid={!!errors[`customGear.customGears[${index}].tag`]}>
                                      <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Tag</Field.Label>
                                      <Input
                                        value={gear.tag || ''}
                                        onChange={(e) => handleUpdateCustomGear(index, 'tag', e.target.value)}
                                        placeholder="peddle-board"
                                        bg="inputBg"
                                        size={{ base: "sm", sm: "md" }}
                                      />
                                      <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                        Unique identifier for hashtag. Use only letters, numbers, and hyphens (no spaces).
                                        Will create: {fullHashtag}
                                      </Field.HelperText>
                                      {errors[`customGear.customGears[${index}].tag`] && (
                                        <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                          {errors[`customGear.customGears[${index}].tag`]}
                                        </Field.ErrorText>
                                      )}
                                    </Field.Root>

                                    {/* Label */}
                                    <Field.Root invalid={!!errors[`customGear.customGears[${index}].label`]}>
                                      <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Label</Field.Label>
                                      <Input
                                        value={gear.label || ''}
                                        onChange={(e) => handleUpdateCustomGear(index, 'label', e.target.value)}
                                        placeholder="Peddle Board"
                                        bg="inputBg"
                                        size={{ base: "sm", sm: "md" }}
                                      />
                                      <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                        Display name shown in the UI
                                      </Field.HelperText>
                                      {errors[`customGear.customGears[${index}].label`] && (
                                        <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                          {errors[`customGear.customGears[${index}].label`]}
                                        </Field.ErrorText>
                                      )}
                                    </Field.Root>

                                    {/* Is Retired */}
                                    <Checkbox.Root
                                      checked={gear.isRetired || false}
                                      onCheckedChange={(e) => handleUpdateCustomGear(index, 'isRetired', e.checked)}
                                      colorPalette="gray"
                                      size={{ base: "sm", sm: "md" }}
                                    >
                                      <Checkbox.HiddenInput />
                                      <Checkbox.Control>
                                        <Checkbox.Indicator />
                                      </Checkbox.Control>
                                      <Checkbox.Label fontSize={{ base: "xs", sm: "sm" }}>
                                        Mark as retired
                                      </Checkbox.Label>
                                    </Checkbox.Root>

                                    {/* Purchase Price */}
                                    <Box>
                                      <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="medium" mb={2} color="text">
                                        Purchase Price (Optional)
                                      </Text>
                                      <Grid templateColumns={{ base: "1fr", sm: "2fr 1fr" }} gap={3}>
                                        <Field.Root invalid={!!errors[`customGear.customGears[${index}].purchasePrice.amountInCents`]}>
                                          <Field.Label fontSize={{ base: "xs", sm: "sm" }}>
                                            Amount
                                          </Field.Label>
                                          <NumberInput.Root
                                            value={String((gear.purchasePrice?.amountInCents ?? 0) / 100)}
                                            onValueChange={(details) => {
                                              const numValue = details.valueAsNumber;
                                              if (!isNaN(numValue)) {
                                                handleUpdateCustomGear(index, 'purchasePrice.amountInCents', Math.round(numValue * 100));
                                              }
                                            }}
                                            formatOptions={{
                                              style: "currency",
                                              currency: gear.purchasePrice?.currency || defaultCurrency,
                                              currencyDisplay: "symbol",
                                            }}
                                            min={0}
                                            step={0.01}
                                          >
                                            <NumberInput.Input
                                              bg="inputBg"
                                              size={{ base: "sm", sm: "md" }}
                                            />
                                          </NumberInput.Root>
                                          <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                            Enter price with currency formatting
                                          </Field.HelperText>
                                          {errors[`customGear.customGears[${index}].purchasePrice.amountInCents`] && (
                                            <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                              {errors[`customGear.customGears[${index}].purchasePrice.amountInCents`]}
                                            </Field.ErrorText>
                                          )}
                                        </Field.Root>

                                        <Field.Root invalid={!!errors[`customGear.customGears[${index}].purchasePrice.currency`]}>
                                          <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Currency</Field.Label>
                                          <Input
                                            value={gear.purchasePrice?.currency || defaultCurrency}
                                            onChange={(e) => handleUpdateCustomGear(index, 'purchasePrice.currency', e.target.value.toUpperCase())}
                                            placeholder={defaultCurrency}
                                            maxLength={3}
                                            bg="inputBg"
                                            size={{ base: "sm", sm: "md" }}
                                          />
                                          <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                            ISO code (from locale: {defaultCurrency})
                                          </Field.HelperText>
                                          {errors[`customGear.customGears[${index}].purchasePrice.currency`] && (
                                            <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                              {errors[`customGear.customGears[${index}].purchasePrice.currency`]}
                                            </Field.ErrorText>
                                          )}
                                        </Field.Root>
                                      </Grid>
                                    </Box>
                                  </VStack>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </VStack>
                    )}
                  </>
                ) : (
                  <Box
                    p={8}
                    textAlign="center"
                    bg="panelBg"
                    borderRadius="md"
                    border="2px dashed"
                    borderColor="border"
                  >
                    <Text fontSize="sm" color="textMuted" mb={3}>
                      Custom gear is currently disabled. Enable it using the toggle above to start tracking custom gear with hashtags.
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          </VStack>
        );
      }}
    </BaseConfigEditor>
  );
};

export default GearConfigEditor;
