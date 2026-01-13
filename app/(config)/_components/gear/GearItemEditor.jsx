import React from 'react';
import PropTypes from 'prop-types';
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
  Switch,
  NumberInput,
  Checkbox,
} from '@chakra-ui/react';
import { MdDelete, MdArrowUpward, MdArrowDownward, MdExpandMore, MdChevronRight } from 'react-icons/md';

/**
 * GearItemEditor - Reusable component for editing a single gear item
 * Used for both Strava gear and custom gear
 */
const GearItemEditor = ({
  gear,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  errors = {},
  defaultCurrency = 'USD',
  isCustomGear = false,
}) => {
  const handleFieldUpdate = (field, value) => {
    onUpdate(index, { ...gear, [field]: value });
  };

  const handlePurchasePriceUpdate = (field, value) => {
    const currentPrice = gear.purchasePrice || { amountInCents: 0, currency: defaultCurrency };
    onUpdate(index, {
      ...gear,
      purchasePrice: { ...currentPrice, [field]: value }
    });
  };

  const toggleRetired = () => {
    handleFieldUpdate('retired', !gear.retired);
  };

  const prefix = isCustomGear ? 'customGear.customGears' : 'stravaGear';
  const gearError = errors[`${prefix}[${index}]`];

  return (
    <Box
      borderWidth="1px"
      borderColor={gearError ? "red.500" : "border"}
      borderRadius="md"
      overflow="hidden"
      mb={2}
    >
      {/* Header */}
      <Flex
        bg="cardBg"
        p={{ base: 2, sm: 3 }}
        align="center"
        gap={{ base: 1, sm: 2 }}
        cursor="pointer"
        onClick={onToggleExpand}
        _hover={{ bg: "panelBg" }}
      >
        <Box as={isExpanded ? MdExpandMore : MdChevronRight} flexShrink={0} fontSize={{ base: "sm", sm: "md" }} />
        <Text flex={1} fontWeight="500" fontSize={{ base: "xs", sm: "sm" }} noOfLines={1} overflow="hidden" textOverflow="ellipsis">
          {isCustomGear ? gear.label || gear.tag || `Gear ${index + 1}` : gear.gearId || `Gear ${index + 1}`}
        </Text>
        {gear.retired && (
          <Text fontSize="xs" color="textMuted" fontStyle="italic" flexShrink={0} display={{ base: "none", sm: "block" }}>
            Retired
          </Text>
        )}
        <HStack gap={{ base: 0.5, sm: 1 }} onClick={(e) => e.stopPropagation()} flexShrink={0}>
          <IconButton
            size="xs"
            variant="ghost"
            onClick={onMoveUp}
            isDisabled={!canMoveUp}
            aria-label="Move up"
            minW={{ base: "20px", sm: "auto" }}
            h={{ base: "20px", sm: "auto" }}
            px={{ base: 0, sm: 2 }}
            fontSize={{ base: "xs", sm: "sm" }}
          >
            <MdArrowUpward />
          </IconButton>
          <IconButton
            size="xs"
            variant="ghost"
            onClick={onMoveDown}
            isDisabled={!canMoveDown}
            aria-label="Move down"
            minW={{ base: "20px", sm: "auto" }}
            h={{ base: "20px", sm: "auto" }}
            px={{ base: 0, sm: 2 }}
            fontSize={{ base: "xs", sm: "sm" }}
          >
            <MdArrowDownward />
          </IconButton>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={onRemove}
            aria-label="Remove"
            minW={{ base: "20px", sm: "auto" }}
            h={{ base: "20px", sm: "auto" }}
            px={{ base: 0, sm: 2 }}
            fontSize={{ base: "xs", sm: "sm" }}
          >
            <MdDelete />
          </IconButton>
        </HStack>
      </Flex>

      {/* Expanded Content */}
      {isExpanded && (
        <Box p={4} borderTopWidth="1px" borderColor="border">
          <VStack align="stretch" gap={4}>
            {/* Gear ID or Tag */}
            <Field.Root invalid={!!errors[`${prefix}[${index}].${isCustomGear ? 'tag' : 'gearId'}`]}>
              <Field.Label fontSize="sm">
                {isCustomGear ? 'Tag (no spaces)' : 'Gear ID'}
              </Field.Label>
              <Input
                value={isCustomGear ? gear.tag || '' : gear.gearId || ''}
                onChange={(e) => handleFieldUpdate(isCustomGear ? 'tag' : 'gearId', e.target.value)}
                placeholder={isCustomGear ? 'e.g., bike-1, shoes-racing' : 'e.g., b12345678'}
                size="sm"
              />
              {errors[`${prefix}[${index}].${isCustomGear ? 'tag' : 'gearId'}`] && (
                <Field.ErrorText fontSize="xs">
                  {errors[`${prefix}[${index}].${isCustomGear ? 'tag' : 'gearId'}`]}
                </Field.ErrorText>
              )}
            </Field.Root>

            {/* Label (custom gear only) */}
            {isCustomGear && (
              <Field.Root invalid={!!errors[`${prefix}[${index}].label`]}>
                <Field.Label fontSize="sm">Label</Field.Label>
                <Input
                  value={gear.label || ''}
                  onChange={(e) => handleFieldUpdate('label', e.target.value)}
                  placeholder="e.g., Canyon Aeroad, Nike Vaporfly"
                  size="sm"
                />
                {errors[`${prefix}[${index}].label`] && (
                  <Field.ErrorText fontSize="xs">
                    {errors[`${prefix}[${index}].label`]}
                  </Field.ErrorText>
                )}
              </Field.Root>
            )}

            {/* Purchase Price */}
            <Box>
              <Text fontSize="sm" fontWeight="500" mb={2}>
                Purchase Price (optional)
              </Text>
              <HStack>
                <Field.Root
                  flex={2}
                  invalid={!!errors[`${prefix}[${index}].purchasePrice.amountInCents`]}
                >
                  <Field.Label fontSize="sm">Amount (cents)</Field.Label>
                  <NumberInput.Root
                    value={gear.purchasePrice?.amountInCents ?? ''}
                    onValueChange={(details) =>
                      handlePurchasePriceUpdate('amountInCents', details.valueAsNumber)
                    }
                    min={0}
                    size="sm"
                  >
                    <NumberInput.Input placeholder="e.g., 50000 for $500.00" />
                  </NumberInput.Root>
                  {errors[`${prefix}[${index}].purchasePrice.amountInCents`] && (
                    <Field.ErrorText fontSize="xs">
                      {errors[`${prefix}[${index}].purchasePrice.amountInCents`]}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root
                  flex={1}
                  invalid={!!errors[`${prefix}[${index}].purchasePrice.currency`]}
                >
                  <Field.Label fontSize="sm">Currency</Field.Label>
                  <Input
                    value={gear.purchasePrice?.currency || defaultCurrency}
                    onChange={(e) =>
                      handlePurchasePriceUpdate('currency', e.target.value.toUpperCase())
                    }
                    placeholder="USD"
                    maxLength={3}
                    size="sm"
                  />
                  {errors[`${prefix}[${index}].purchasePrice.currency`] && (
                    <Field.ErrorText fontSize="xs">
                      {errors[`${prefix}[${index}].purchasePrice.currency`]}
                    </Field.ErrorText>
                  )}
                </Field.Root>
              </HStack>
            </Box>

            {/* Retired Toggle */}
            <HStack>
              <Switch.Root
                checked={gear.retired || false}
                onCheckedChange={toggleRetired}
                colorPalette="orange"
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Label>Mark as Retired</Switch.Label>
              </Switch.Root>
            </HStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

GearItemEditor.propTypes = {
  gear: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  canMoveUp: PropTypes.bool.isRequired,
  canMoveDown: PropTypes.bool.isRequired,
  error: PropTypes.object,
  isCustomGear: PropTypes.bool
};

export default GearItemEditor;
