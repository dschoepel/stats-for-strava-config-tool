import React, { useState } from 'react';
import { Box, Button, Input, Flex, Text, VStack, Table, Heading } from '@chakra-ui/react';
import { MdAdd } from 'react-icons/md';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  
  const handleDateChange = (oldDate, selectedDate) => {
    const newDate = selectedDate.toISOString().split('T')[0];
    
    if (newDate === oldDate) return;
    
    const today = new Date();
    if (selectedDate > today) {
      alert('Date cannot be in the future. Please select today\'s date or a past date.');
      return;
    }
    
    if (history[newDate]) {
      alert('An entry for this date already exists.');
      return;
    }
    
    const updated = { ...history };
    updated[newDate] = updated[oldDate];
    delete updated[oldDate];
    onChange(updated);
    setEditingDate(null);
  };
  
  const handleWeightChange = (date, value) => {
    const updated = { ...history };
    const numValue = parseFloat(value);
    updated[date] = isNaN(numValue) ? 0 : numValue;
    onChange(updated);
  };
  
  const sortedEntries = Object.entries(history).sort(([dateA], [dateB]) => 
    new Date(dateB) - new Date(dateA)
  );
  
  return (
    <Box mb={6}>
      <Flex justify="space-between" align="center" mb={3}>
        <Box>
          <Heading size="md" mb={1} lineHeight="1.2" wordBreak="break-word">Weight History</Heading>
          <Text fontSize="sm" color="textMuted">
            Track your weight over time. Weight values depend on your unit system setting (kg or lbs).
          </Text>
        </Box>
        <Button onClick={handleAddEntry} size="sm" variant="outline">
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
                      <Box className="react-datepicker-wrapper" width="150px">
                        <DatePicker
                          selected={new Date(date)}
                          onChange={(selectedDate) => handleDateChange(date, selectedDate)}
                          onClickOutside={() => setEditingDate(null)}
                          maxDate={new Date()}
                          dateFormat="yyyy-MM-dd"
                          className="date-range-input"
                          showPopperArrow={true}
                          popperPlacement="bottom-start"
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          yearDropdownItemNumber={50}
                          withPortal
                        />
                      </Box>
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
                    <Input
                      type="number"
                      value={weight}
                      onChange={(e) => handleWeightChange(date, e.target.value)}
                      size="sm"
                      width="120px"
                      min="0"
                      step="0.1"
                      bg="inputBg"
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      onClick={() => handleRemoveEntry(date)}
                      size="sm"
                      variant="outline"
                      colorPalette="red"
                    >
                      Remove
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
