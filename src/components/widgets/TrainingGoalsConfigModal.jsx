import React, { useState } from 'react';
import {
  Box, Flex, Heading, VStack, Button, Field, Input, Textarea, Text, Tabs, Badge, Icon
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { useSportsList } from '../../contexts/SportsListContext';
import GoalPeriodList from './training-goals/GoalPeriodList';
import { validateTrainingGoalsConfig, PERIODS } from '../../utils/trainingGoalsValidation';

const PERIOD_LABELS = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  lifetime: 'Lifetime',
};

const TrainingGoalsConfigModal = ({ isOpen, widget, onSave, onClose }) => {
  const { sportsList } = useSportsList();

  const [displayName, setDisplayName] = useState(widget?.displayName || '');
  const [description, setDescription] = useState(widget?.description || '');
  const [goalsConfig, setGoalsConfig] = useState(() => {
    const base = { goals: { weekly: [], monthly: [], yearly: [], lifetime: [] } };
    if (!widget?.defaultConfig) return base;
    return JSON.parse(JSON.stringify(widget.defaultConfig));
  });
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  if (!isOpen) return null;

  const getGoals = period => goalsConfig?.goals?.[period] || [];

  const handlePeriodChange = (period, newArray) => {
    const updated = {
      ...goalsConfig,
      goals: { ...goalsConfig.goals, [period]: newArray }
    };
    setGoalsConfig(updated);
    if (submitAttempted) {
      setErrors(validateTrainingGoalsConfig(updated));
    }
  };

  const handleSave = () => {
    setSubmitAttempted(true);

    const newErrors = {};
    if (!displayName.trim()) {
      newErrors._displayName = 'Display name is required';
    }

    const configErrors = validateTrainingGoalsConfig(goalsConfig);
    Object.assign(newErrors, configErrors);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...widget,
      displayName: displayName.trim(),
      description: description.trim(),
      defaultConfig: goalsConfig,
    });
  };

  const hasConfigErrors = submitAttempted && Object.keys(errors).filter(k => k !== '_displayName').length > 0;

  return (
    <Flex
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.7)"
      align="center"
      justify="center"
      zIndex={1000}
      onClick={onClose}
    >
      <Flex
        direction="column"
        bg="cardBg"
        border="2px solid"
        borderColor="border"
        borderRadius="lg"
        boxShadow="xl"
        w="95%"
        maxW="800px"
        maxH="92vh"
        overflow="hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          px={6}
          py={4}
          bg="panelBg"
          borderBottom="1px solid"
          borderColor="border"
        >
          <Heading as="h4" size="lg" color="text">Edit Training Goals Widget</Heading>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <Icon><MdClose /></Icon>
          </Button>
        </Flex>

        {/* Body */}
        <Box px={6} py={4} overflowY="auto" flex={1}>
          <VStack align="stretch" gap={5}>
            {/* Display name + description */}
            <Field.Root invalid={!!errors._displayName}>
              <Field.Label color="text">Display Name*</Field.Label>
              <Input
                placeholder="e.g. Cycling Goals 2026"
                value={displayName}
                onChange={e => {
                  setDisplayName(e.target.value);
                  if (submitAttempted && e.target.value.trim()) {
                    setErrors(prev => { const n = { ...prev }; delete n._displayName; return n; });
                  }
                }}
                bg="inputBg"
              />
              <Field.HelperText fontSize="xs" color="textMuted">
                Must be unique — used to distinguish multiple Training Goals widgets
              </Field.HelperText>
              {errors._displayName && <Field.ErrorText>{errors._displayName}</Field.ErrorText>}
            </Field.Root>

            <Field.Root>
              <Field.Label color="text">Description</Field.Label>
              <Textarea
                placeholder="Describe what this training goals widget tracks..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                bg="inputBg"
              />
            </Field.Root>

            {/* Info banner */}
            <Box p={3} bg="infoBg" borderRadius="md" border="1px solid" borderColor="infoBorder">
              <Text fontSize="xs" color="infoText">
                Configure goals for each time period. Each goal defines a target (distance, elevation, etc.)
                that Stats for Strava will track on your dashboard.
              </Text>
            </Box>

            {/* Tabs for periods */}
            <Tabs.Root defaultValue="weekly">
              <Tabs.List
                borderBottom="1px solid"
                borderColor="border"
                bg="panelBg"
              >
                {PERIODS.map(period => {
                  const count = getGoals(period).length;
                  const periodErrors = Object.keys(errors).filter(k => k.startsWith(`${period}[`)).length;
                  return (
                    <Tabs.Trigger key={period} value={period}>
                      <Flex align="center" gap={1}>
                        {PERIOD_LABELS[period]}
                        <Badge
                          colorPalette={periodErrors > 0 ? 'red' : 'gray'}
                          variant="subtle"
                          size="sm"
                        >
                          {count}
                        </Badge>
                      </Flex>
                    </Tabs.Trigger>
                  );
                })}
              </Tabs.List>

              {PERIODS.map(period => (
                <Tabs.Content key={period} value={period} pt={3} px={0}>
                  <GoalPeriodList
                    periodKey={period}
                    goals={getGoals(period)}
                    onChange={arr => handlePeriodChange(period, arr)}
                    errors={errors}
                    sportsList={sportsList}
                  />
                </Tabs.Content>
              ))}
            </Tabs.Root>

            {/* Validation error summary */}
            {hasConfigErrors && (
              <Box
                p={3}
                bg={{ base: '#f8d7da', _dark: '#7f1d1d' }}
                border="1px solid"
                borderColor={{ base: '#f5c6cb', _dark: '#991b1b' }}
                borderRadius="md"
              >
                <Text fontSize="sm" color={{ base: '#721c24', _dark: '#fca5a5' }}>
                  Please fix the validation errors above before saving.
                </Text>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Footer */}
        <Flex
          justify="flex-end"
          gap={3}
          px={6}
          py={4}
          bg="panelBg"
          borderTop="1px solid"
          borderColor="border"
        >
          <Button onClick={onClose} variant="outline" colorPalette="gray">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            bg="primary"
            color="white"
            _hover={{ bg: 'primaryHover' }}
          >
            Save Changes
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default TrainingGoalsConfigModal;
