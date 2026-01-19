import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Text, Table, Heading, Field, NumberInput, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import { MdAdd, MdDelete } from 'react-icons/md';
import { DateInput } from './DateInput';

/**
 * RestingHeartRateEditor - Editor for resting heart rate formula configuration
 * Supports three modes:
 * 1. Formula mode: 'heuristicAgeBased' string
 * 2. Fixed mode: A single integer value (BPM)
 * 3. Date range mode: Object with date keys mapping to integer values
 */
const RestingHeartRateEditor = ({
  value,
  onChange,
  errors = {}
}) => {
  // Determine mode from value type
  const getMode = (val) => {
    if (typeof val === 'number' || (typeof val === 'string' && !isNaN(parseInt(val)) && val !== 'heuristicAgeBased')) {
      return 'fixed';
    }
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return 'dateRange';
    }
    return 'formula'; // default: string 'heuristicAgeBased' or undefined
  };

  const [mode, setMode] = useState(() => getMode(value));
  const [editingDate, setEditingDate] = useState(null);

  // Sync mode when external value changes
  useEffect(() => {
    const newMode = getMode(value);
    if (newMode !== mode) {
      setMode(newMode);
    }
  }, [value]);

  // Handle mode change
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setEditingDate(null);

    // Convert value to appropriate type for new mode
    if (newMode === 'formula') {
      onChange('heuristicAgeBased');
    } else if (newMode === 'fixed') {
      // Use existing fixed value if available, or default to 60
      if (typeof value === 'number') {
        onChange(value);
      } else {
        onChange(60);
      }
    } else if (newMode === 'dateRange') {
      // Convert to object format
      if (typeof value === 'object' && value !== null) {
        onChange(value);
      } else {
        onChange({});
      }
    }
  };

  // Fixed mode handlers
  const handleFixedChange = (newValue) => {
    const numValue = parseInt(newValue);
    onChange(isNaN(numValue) ? 60 : Math.max(30, Math.min(120, numValue)));
  };

  // Date range mode handlers
  const handleAddEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentValue = typeof value === 'object' && value !== null ? value : {};

    if (currentValue[today]) {
      alert('An entry for today already exists.');
      return;
    }

    const updated = { ...currentValue, [today]: 60 };
    onChange(updated);
    setEditingDate(today);
  };

  const handleRemoveEntry = (date) => {
    const currentValue = typeof value === 'object' && value !== null ? value : {};
    const updated = { ...currentValue };
    delete updated[date];
    onChange(updated);
  };

  const handleDateChange = (oldDate, newDateStr) => {
    if (!newDateStr || newDateStr === oldDate) return;

    const currentValue = typeof value === 'object' && value !== null ? value : {};

    if (currentValue[newDateStr]) {
      alert('An entry for this date already exists.');
      return;
    }

    const updated = { ...currentValue };
    updated[newDateStr] = updated[oldDate];
    delete updated[oldDate];
    onChange(updated);
    setEditingDate(null);
  };

  const handleValueChange = (date, newValue) => {
    const currentValue = typeof value === 'object' && value !== null ? value : {};
    const numValue = parseInt(newValue);
    const updated = { ...currentValue };
    updated[date] = isNaN(numValue) ? 60 : Math.max(30, Math.min(120, numValue));
    onChange(updated);
  };

  // Render date range table
  const renderDateRangeTable = () => {
    const entries = typeof value === 'object' && value !== null ? value : {};
    const sortedEntries = Object.entries(entries).sort(([dateA], [dateB]) =>
      new Date(dateB) - new Date(dateA)
    );

    return (
      <Box mt={3}>
        <Flex justify="space-between" align="center" mb={3} gap={2} flexWrap="wrap">
          <Text fontSize="sm" color="textMuted">
            {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
          <Button onClick={handleAddEntry} size="sm" variant="outline" flexShrink={0}>
            <MdAdd /> Add Entry
          </Button>
        </Flex>

        {sortedEntries.length === 0 ? (
          <Text fontSize="sm" color="textMuted">
            No resting heart rate entries. Click "Add Entry" to start tracking.
          </Text>
        ) : (
          <Box overflowX="auto" borderWidth="1px" borderColor="border" borderRadius="md">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row bg="tableHeaderBg">
                  <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Date</Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Resting HR (BPM)</Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sortedEntries.map(([date, hr]) => (
                  <Table.Row key={date}>
                    <Table.Cell>
                      {editingDate === date ? (
                        <Field.Root width="150px">
                          <Field.Label srOnly>Date</Field.Label>
                          <DateInput
                            value={date}
                            onChange={(newDate) => handleDateChange(date, newDate)}
                            bg="inputBg"
                            size="sm"
                          />
                        </Field.Root>
                      ) : (
                        <Text
                          cursor="pointer"
                          _hover={{ textDecoration: 'underline' }}
                          onClick={() => setEditingDate(date)}
                          title="Click to change date"
                        >
                          {date}
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <NumberInput.Root
                        value={String(hr)}
                        onValueChange={(e) => handleValueChange(date, e.value)}
                        min={30}
                        max={120}
                        step={1}
                        width="120px"
                        size="sm"
                      >
                        <NumberInput.Input bg="inputBg" />
                        <NumberInput.Control css={{
                          '& button': {
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--chakra-colors-text)',
                            fontSize: '12px',
                            minHeight: '14px',
                            height: '14px',
                            width: '20px',
                            padding: '0',
                            borderRadius: '0'
                          },
                          '& button:hover': {
                            backgroundColor: 'transparent',
                            opacity: '0.7'
                          },
                          '& svg': {
                            width: '12px',
                            height: '12px',
                            stroke: 'var(--chakra-colors-text)',
                            strokeWidth: '2px'
                          }
                        }} />
                      </NumberInput.Root>
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        onClick={() => handleRemoveEntry(date)}
                        size="sm"
                        variant="outline"
                        colorPalette="red"
                        title="Remove entry"
                      >
                        <MdDelete />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box mb={4}>
      <Heading size={{ base: "sm", md: "md" }} mb={1} lineHeight="1.2" wordBreak="break-word">
        Resting Heart Rate Formula
      </Heading>
      <Text fontSize="sm" color="textMuted" mb={3}>
        The formula used to calculate your resting heart rate. Choose a formula, set a fixed value, or define values for specific date ranges.
      </Text>

      {errors['restingHeartRateFormula'] && (
        <Text color="red.500" fontSize="sm" mb={2}>
          {errors['restingHeartRateFormula']}
        </Text>
      )}

      {/* Mode selector */}
      <Box mb={3}>
        <Field.Root>
          <Field.Label fontWeight="500" fontSize="sm">Input Type</Field.Label>
          <NativeSelectRoot width={{ base: "100%", sm: "250px" }}>
            <NativeSelectField
              value={mode}
              onChange={(e) => handleModeChange(e.target.value)}
              bg="inputBg"
            >
              <option value="formula">Formula (Heuristic Age-Based)</option>
              <option value="fixed">Fixed Value (BPM)</option>
              <option value="dateRange">Date-Based Values</option>
            </NativeSelectField>
          </NativeSelectRoot>
        </Field.Root>
      </Box>

      {/* Mode-specific content */}
      {mode === 'formula' && (
        <Box
          p={3}
          bg="blue.50"
          _dark={{ bg: 'blue.900/30' }}
          borderRadius="md"
        >
          <Text fontSize="sm" color="blue.800" _dark={{ color: 'blue.200' }}>
            Using the heuristic age-based formula to estimate resting heart rate.
          </Text>
        </Box>
      )}

      {mode === 'fixed' && (
        <Box>
          <Field.Root>
            <Field.Label fontWeight="500" fontSize="sm">Resting Heart Rate (BPM)</Field.Label>
            <NumberInput.Root
              value={String(typeof value === 'number' ? value : 60)}
              onValueChange={(e) => handleFixedChange(e.value)}
              min={30}
              max={120}
              step={1}
              width={{ base: "100%", sm: "150px" }}
            >
              <NumberInput.Input bg="inputBg" />
              <NumberInput.Control css={{
                '& button': {
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--chakra-colors-text)',
                  fontSize: '12px',
                  minHeight: '14px',
                  height: '14px',
                  width: '20px',
                  padding: '0',
                  borderRadius: '0'
                },
                '& button:hover': {
                  backgroundColor: 'transparent',
                  opacity: '0.7'
                },
                '& svg': {
                  width: '12px',
                  height: '12px',
                  stroke: 'var(--chakra-colors-text)',
                  strokeWidth: '2px'
                }
              }} />
            </NumberInput.Root>
            <Field.HelperText fontSize="xs" color="textMuted">
              Enter a value between 30 and 120 BPM
            </Field.HelperText>
          </Field.Root>
        </Box>
      )}

      {mode === 'dateRange' && renderDateRangeTable()}
    </Box>
  );
};

export default RestingHeartRateEditor;
