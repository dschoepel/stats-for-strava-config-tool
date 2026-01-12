import { useCallback, memo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Field,
  Input,
  Flex,
  Checkbox,
} from '@chakra-ui/react';
import { MdInfo, MdDirectionsBike, MdWarning, MdBuild } from 'react-icons/md';
import BaseConfigEditor from './BaseConfigEditor';
import GearList from './gear/GearList';
import { useGearConfig } from './gear/useGearConfig';

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
  const { defaultCurrency, validateGearFields } = useGearConfig();

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
        const customGearConfig = getNestedValue(formData, 'customGear') || { 
          enabled: false, 
          hashtagPrefix: 'sfs', 
          customGears: [] 
        };
        const customGearsArray = customGearConfig.customGears || [];

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleStravaGearChange = useCallback((gears) => {
          handleFieldChange('stravaGear', gears);
        }, [handleFieldChange]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleCustomGearsChange = useCallback((gears) => {
          handleFieldChange('customGear', {
            ...customGearConfig,
            customGears: gears
          });
        }, [handleFieldChange, customGearConfig]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleToggleCustomGear = useCallback((checked) => {
          handleFieldChange('customGear', {
            ...customGearConfig,
            enabled: checked
          });
        }, [handleFieldChange, customGearConfig]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleUpdateHashtagPrefix = useCallback((prefix) => {
          handleFieldChange('customGear', {
            ...customGearConfig,
            hashtagPrefix: prefix
          });
        }, [handleFieldChange, customGearConfig]);

        return (
          <VStack align="stretch" gap={6}>
            {/* Introduction */}
            <Box 
              p={4} 
              bg="infoBg"
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
                </Flex>

                <GearList
                  gears={stravaGearArray}
                  onChange={handleStravaGearChange}
                  errors={errors}
                  defaultCurrency={defaultCurrency}
                  isCustomGear={false}
                  title=""
                />
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

                {/* Gear List */}
                {customGearConfig.enabled ? (
                  <GearList
                    gears={customGearsArray}
                    onChange={handleCustomGearsChange}
                    errors={errors}
                    defaultCurrency={defaultCurrency}
                    isCustomGear={true}
                    title=""
                  />
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

// Wrap with memo to prevent unnecessary re-renders
export default memo(GearConfigEditor);
