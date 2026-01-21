import React, { useState } from 'react';
import { Box, Button, Flex, Text, Table, Heading, Field } from '@chakra-ui/react';
import { MdAdd, MdDelete } from 'react-icons/md';
import { DateInput } from './DateInput';
import SafeNumberInput from '../../../src/components/ui/SafeNumberInput';

/**
 * WeightHistoryEditor - Inline editor for weight history tracking
 * Allows adding/removing/editing weight entries by date
 */
const WeightHistoryEditor = ({
  history = {},
  onChange,
  errors = {}
}) => {
  const [editingDate, setEditingDate] = useState(null);

  const handleAddEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...history };
    
    if (updated[today]) {
      alert('An entry for today already exists.');
      return;
    }
    
    updated[today] = 0;
    onChange(updated);
    setEditingDate(today);
  };
  
  const handleRemoveEntry = (date) => {
    const updated = { ...history };
    delete updated[date];
    onChange(updated);
  };
  
  const handleDateChange = (oldDate, newDateStr) => {
    if (!newDateStr || newDateStr === oldDate) return;
    
    if (history[newDateStr]) {
      alert('An entry for this date already exists.');
      return;
    }
    
    const updated = { ...history };
    updated[newDateStr] = updated[oldDate];
    delete updated[oldDate];
    onChange(updated);
    setEditingDate(null);
  };

  const handleWeightChange = (date, newWeight) => {
    const updated = { ...history };
    updated[date] = newWeight;
    onChange(updated);
  };

  const sortedEntries = Object.entries(history).sort(([dateA], [dateB]) =>
    new Date(dateB) - new Date(dateA)
  );
  
  return (
    <Box mb={6}>
      <Flex justify="space-between" align="center" mb={3} gap={2} flexWrap="wrap">
        <Box flex="1" minW={{ base: "100%", sm: "200px" }}>
          <Heading size={{ base: "sm", md: "md" }} mb={1} lineHeight="1.2" wordBreak="break-word">Weight History</Heading>
          <Text fontSize="sm" color="textMuted">
            Track your weight over time. Weight values depend on your unit system setting (kg or lbs).
          </Text>
        </Box>
        <Button onClick={handleAddEntry} size="sm" variant="outline" flexShrink={0}>
          <MdAdd /> Add Entry
        </Button>
      </Flex>
      
      {errors['weightHistory'] && (
        <Text color="red.500" fontSize="sm" mb={2}>
          {errors['weightHistory']}
        </Text>
      )}
      
      {sortedEntries.length === 0 ? (
        <Text fontSize="sm" color="textMuted">No weight history entries. Click "Add Entry" to start tracking.</Text>
      ) : (
        <Box overflowX="auto" borderWidth="1px" borderColor="border" borderRadius="md">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row bg="tableHeaderBg">
                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Date</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Weight</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sortedEntries.map(([date, weight]) => (
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
                    <SafeNumberInput
                      value={history[date] || 0}
                      onChange={(newWeight) => handleWeightChange(date, newWeight)}
                      min={0}
                      step={0.1}
                      width="120px"
                      size="sm"
                      allowDecimal={true}
                    />
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

export default WeightHistoryEditor;
