import React from 'react';
import {
  Box, Flex, HStack, VStack, Text, Field, Input, Switch,
  Checkbox, Badge, IconButton, Icon, NativeSelectRoot, NativeSelectField
} from '@chakra-ui/react';
import { MdExpandMore, MdChevronRight, MdArrowUpward, MdArrowDownward, MdDelete } from 'react-icons/md';
import SportTypeMultiSelect from '../../../../app/(config)/_components/appearance/SportTypeMultiSelect';
import {
  GOAL_TYPES, UNIT_TYPES, UNIT_NOT_APPLICABLE,
  GOAL_TYPE_LABELS, UNIT_LABELS
} from '../../../utils/trainingGoalsValidation';

const TYPE_COLORS = {
  distance: 'blue',
  elevation: 'green',
  movingTime: 'purple',
  numberOfActivities: 'orange',
  calories: 'red',
};

const TrainingGoalEntryEditor = ({
  goal,
  index,
  periodKey,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  errors = {},
  sportsList = {},
}) => {
  const handleFieldUpdate = (field, value) => {
    onUpdate(index, { ...goal, [field]: value });
  };

  const handleTypeChange = (newType) => {
    const update = { ...goal, type: newType };
    if (UNIT_NOT_APPLICABLE.includes(newType)) {
      delete update.unit;
    } else if (!update.unit) {
      update.unit = 'km';
    }
    onUpdate(index, update);
  };

  const handleDateRangeToggle = (checked) => {
    if (checked) {
      handleFieldUpdate('restrictToDateRange', { from: '', to: '' });
    } else {
      const updated = { ...goal };
      delete updated.restrictToDateRange;
      onUpdate(index, updated);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  const showUnit = goal.type && !UNIT_NOT_APPLICABLE.includes(goal.type);

  return (
    <Box
      border="1px solid"
      borderColor={hasErrors ? 'red.500' : 'border'}
      borderRadius="md"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        bg="panelBg"
        px={3}
        py={2}
        align="center"
        gap={2}
        cursor="pointer"
        onClick={onToggleExpand}
        _hover={{ bg: { base: '#e9ecef', _dark: '#334155' } }}
      >
        <Icon fontSize="lg" color="textMuted" flexShrink={0}>
          {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
        </Icon>
        <Text flex={1} fontWeight="600" fontSize="sm" color="text" noOfLines={1}>
          {goal.label || `Goal ${index + 1}`}
        </Text>
        {goal.type && (
          <Badge colorPalette={TYPE_COLORS[goal.type] || 'gray'} size="sm" flexShrink={0}>
            {GOAL_TYPE_LABELS[goal.type] || goal.type}
          </Badge>
        )}
        <Badge
          colorPalette={goal.enabled !== false ? 'green' : 'orange'}
          variant="subtle"
          size="sm"
          flexShrink={0}
        >
          {goal.enabled !== false ? 'Enabled' : 'Disabled'}
        </Badge>
        <HStack gap={0.5} onClick={e => e.stopPropagation()} flexShrink={0}>
          <IconButton
            size="xs"
            variant="ghost"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            aria-label="Move up"
          >
            <Icon><MdArrowUpward /></Icon>
          </IconButton>
          <IconButton
            size="xs"
            variant="ghost"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            aria-label="Move down"
          >
            <Icon><MdArrowDownward /></Icon>
          </IconButton>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={onRemove}
            aria-label="Remove goal"
          >
            <Icon><MdDelete /></Icon>
          </IconButton>
        </HStack>
      </Flex>

      {/* Expanded body */}
      {isExpanded && (
        <Box p={4} bg="cardBg" borderTop="1px solid" borderColor="border">
          <VStack align="stretch" gap={4}>
            {/* Label + Enabled toggle */}
            <Flex gap={3} align="flex-end">
              <Field.Root flex={1} invalid={!!errors.label}>
                <Field.Label color="text" fontSize="sm">Label*</Field.Label>
                <Input
                  placeholder="e.g. Cycling"
                  value={goal.label || ''}
                  onChange={e => handleFieldUpdate('label', e.target.value)}
                  bg="inputBg"
                  size="sm"
                />
                {errors.label && <Field.ErrorText>{errors.label}</Field.ErrorText>}
              </Field.Root>
              <Box pb={1}>
                <Switch.Root
                  checked={goal.enabled !== false}
                  onCheckedChange={e => handleFieldUpdate('enabled', e.checked)}
                  colorPalette="green"
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Label fontSize="sm" color="text">Enabled</Switch.Label>
                </Switch.Root>
              </Box>
            </Flex>

            {/* Type + Unit */}
            <Flex gap={3}>
              <Field.Root flex={1} invalid={!!errors.type}>
                <Field.Label color="text" fontSize="sm">Goal Type*</Field.Label>
                <NativeSelectRoot size="sm">
                  <NativeSelectField
                    value={goal.type || ''}
                    onChange={e => handleTypeChange(e.target.value)}
                    bg="inputBg"
                  >
                    <option value="" disabled>Select type...</option>
                    {GOAL_TYPES.map(t => (
                      <option key={t} value={t}>{GOAL_TYPE_LABELS[t]}</option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
                {errors.type && <Field.ErrorText>{errors.type}</Field.ErrorText>}
              </Field.Root>

              {showUnit && (
                <Field.Root flex={1} invalid={!!errors.unit}>
                  <Field.Label color="text" fontSize="sm">Unit*</Field.Label>
                  <NativeSelectRoot size="sm">
                    <NativeSelectField
                      value={goal.unit || ''}
                      onChange={e => handleFieldUpdate('unit', e.target.value)}
                      bg="inputBg"
                    >
                      <option value="" disabled>Select unit...</option>
                      {UNIT_TYPES.map(u => (
                        <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                  {errors.unit && <Field.ErrorText>{errors.unit}</Field.ErrorText>}
                </Field.Root>
              )}
            </Flex>

            {/* Goal value */}
            <Field.Root invalid={!!errors.goal}>
              <Field.Label color="text" fontSize="sm">Goal Value*</Field.Label>
              <Input
                type="number"
                min={0}
                step={showUnit && ['km', 'mi', 'm', 'ft'].includes(goal.unit) ? 0.1 : 1}
                placeholder="e.g. 200"
                value={goal.goal === 0 ? '0' : (goal.goal || '')}
                onChange={e => handleFieldUpdate('goal', e.target.value === '' ? '' : Number(e.target.value))}
                bg="inputBg"
                size="sm"
              />
              {errors.goal && <Field.ErrorText>{errors.goal}</Field.ErrorText>}
            </Field.Root>

            {/* Sport types */}
            {Object.keys(sportsList).length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>Sport Types to Include</Text>
                <SportTypeMultiSelect
                  fieldName="sportTypesToInclude"
                  fieldSchema={{ title: 'Sport Types to Include', description: 'Count only these sport types toward the goal' }}
                  fieldPath={`${periodKey}[${index}].sportTypesToInclude`}
                  value={goal.sportTypesToInclude || []}
                  onChange={(_, newArr) => handleFieldUpdate('sportTypesToInclude', newArr)}
                  sportsList={sportsList}
                  subsectionKey={`${periodKey}-${index}`}
                />
              </Box>
            )}

            {/* Date range restriction */}
            <Box>
              <Checkbox.Root
                checked={!!goal.restrictToDateRange}
                onCheckedChange={e => handleDateRangeToggle(e.checked)}
                mb={goal.restrictToDateRange ? 3 : 0}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label fontSize="sm" color="text">Restrict to date range (optional)</Checkbox.Label>
              </Checkbox.Root>

              {goal.restrictToDateRange && (
                <Flex gap={3} mt={2}>
                  <Field.Root flex={1} invalid={!!errors['restrictToDateRange.from']}>
                    <Field.Label color="text" fontSize="sm">From</Field.Label>
                    <Input
                      type="date"
                      value={goal.restrictToDateRange.from || ''}
                      onChange={e => handleFieldUpdate('restrictToDateRange', {
                        ...goal.restrictToDateRange,
                        from: e.target.value
                      })}
                      bg="inputBg"
                      size="sm"
                    />
                    {errors['restrictToDateRange.from'] && (
                      <Field.ErrorText>{errors['restrictToDateRange.from']}</Field.ErrorText>
                    )}
                  </Field.Root>
                  <Field.Root flex={1} invalid={!!errors['restrictToDateRange.to']}>
                    <Field.Label color="text" fontSize="sm">To</Field.Label>
                    <Input
                      type="date"
                      value={goal.restrictToDateRange.to || ''}
                      min={goal.restrictToDateRange.from || undefined}
                      onChange={e => handleFieldUpdate('restrictToDateRange', {
                        ...goal.restrictToDateRange,
                        to: e.target.value
                      })}
                      bg="inputBg"
                      size="sm"
                    />
                    {errors['restrictToDateRange.to'] && (
                      <Field.ErrorText>{errors['restrictToDateRange.to']}</Field.ErrorText>
                    )}
                  </Field.Root>
                </Flex>
              )}
            </Box>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default TrainingGoalEntryEditor;
