import React, { useState, useCallback } from 'react';
import { Box, VStack, Text, Button, Icon } from '@chakra-ui/react';
import { MdAdd } from 'react-icons/md';
import TrainingGoalEntryEditor from './TrainingGoalEntryEditor';

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

const DEFAULT_GOAL = {
  label: '',
  enabled: true,
  type: 'distance',
  unit: 'km',
  goal: 0,
  sportTypesToInclude: [],
};

const GoalPeriodList = ({ periodKey, goals = [], onChange, errors = {}, sportsList = {} }) => {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleAdd = useCallback(() => {
    const newGoal = { ...DEFAULT_GOAL };
    onChange([...goals, newGoal]);
    setExpandedItems(prev => ({ ...prev, [goals.length]: true }));
  }, [goals, onChange]);

  const handleRemove = useCallback((index) => {
    onChange(goals.filter((_, i) => i !== index));
    setExpandedItems(prev => {
      const next = {};
      Object.keys(prev).forEach(key => {
        const k = parseInt(key);
        if (k < index) next[k] = prev[key];
        else if (k > index) next[k - 1] = prev[key];
      });
      return next;
    });
  }, [goals, onChange]);

  const handleUpdate = useCallback((index, updatedGoal) => {
    const updated = goals.map((g, i) => i === index ? updatedGoal : g);
    onChange(updated);
  }, [goals, onChange]);

  const handleMoveUp = useCallback((index) => {
    if (index === 0) return;
    const updated = [...goals];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
    setExpandedItems(prev => {
      const next = { ...prev };
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }, [goals, onChange]);

  const handleMoveDown = useCallback((index) => {
    if (index >= goals.length - 1) return;
    const updated = [...goals];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
    setExpandedItems(prev => {
      const next = { ...prev };
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }, [goals, onChange]);

  const getEntryErrors = (index) => {
    const prefix = `${periodKey}[${index}].`;
    const entryErrors = {};
    Object.entries(errors).forEach(([key, val]) => {
      if (key.startsWith(prefix)) entryErrors[key.slice(prefix.length)] = val;
    });
    return entryErrors;
  };

  return (
    <VStack align="stretch" gap={2}>
      {goals.length === 0 ? (
        <Box
          p={6}
          textAlign="center"
          bg="panelBg"
          borderRadius="md"
          border="2px dashed"
          borderColor="border"
        >
          <Text fontSize="sm" color="textMuted">
            No {periodKey} goals yet. Click &ldquo;Add {capitalize(periodKey)} Goal&rdquo; to get started.
          </Text>
        </Box>
      ) : (
        goals.map((goal, index) => (
          <TrainingGoalEntryEditor
            key={index}
            goal={goal}
            index={index}
            periodKey={periodKey}
            isExpanded={expandedItems[index] || false}
            onToggleExpand={() => toggleExpand(index)}
            onUpdate={handleUpdate}
            onRemove={() => handleRemove(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            canMoveUp={index > 0}
            canMoveDown={index < goals.length - 1}
            errors={getEntryErrors(index)}
            sportsList={sportsList}
          />
        ))
      )}
      <Button onClick={handleAdd} size="sm" variant="outline" width="full" mt={1}>
        <Icon><MdAdd /></Icon>
        Add {capitalize(periodKey)} Goal
      </Button>
    </VStack>
  );
};

export default GoalPeriodList;
