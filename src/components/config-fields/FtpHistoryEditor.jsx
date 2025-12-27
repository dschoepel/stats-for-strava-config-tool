import React, { useState } from 'react';
import { Box, Button, Input, Flex, Text, VStack, Table, Heading, Tabs } from '@chakra-ui/react';
import { MdAdd } from 'react-icons/md';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * FtpHistoryEditor - Inline editor for FTP (Functional Threshold Power) history
 * Supports separate tracking for cycling and running
 */
const FtpHistoryEditor = ({
  history = {},
  onChange,
  errors = {}
}) => {
  const [editingDate, setEditingDate] = useState(null);
  const [editingSport, setEditingSport] = useState(null);
  
  const cyclingHistory = history?.cycling || {};
  const runningHistory = history?.running || {};
  
  const handleAddEntry = (sport) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...history };
    
    if (!updated[sport]) {
      updated[sport] = {};
    }
    
    if (updated[sport][today]) {
      alert(`An ${sport} FTP entry for today already exists.`);
      return;
    }
    
    updated[sport][today] = 0;
    onChange(updated);
    setEditingDate(today);
    setEditingSport(sport);
  };
  
  const handleRemoveEntry = (sport, date) => {
    const updated = { ...history };
    delete updated[sport][date];
    onChange(updated);
  };
  
  const handleDateChange = (sport, oldDate, selectedDate) => {
    const newDate = selectedDate.toISOString().split('T')[0];
    
    if (newDate === oldDate) return;
    
    const today = new Date();
    if (selectedDate > today) {
      alert('Date cannot be in the future. Please select today\'s date or a past date.');
      return;
    }
    
    if (history[sport]?.[newDate]) {
      alert('An entry for this date already exists.');
      return;
    }
    
    const updated = { ...history };
    if (!updated[sport]) {
      updated[sport] = {};
    }
    updated[sport][newDate] = updated[sport][oldDate];
    delete updated[sport][oldDate];
    onChange(updated);
    setEditingDate(null);
    setEditingSport(null);
  };
  
  const handleFtpChange = (sport, date, value) => {
    const updated = { ...history };
    if (!updated[sport]) {
      updated[sport] = {};
    }
    const numValue = parseInt(value);
    updated[sport][date] = isNaN(numValue) ? 0 : numValue;
    onChange(updated);
  };
  
  const renderTable = (sport, sportHistory) => {
    const sortedEntries = Object.entries(sportHistory).sort(([dateA], [dateB]) => 
      new Date(dateB) - new Date(dateA)
    );
    
    return (
      <Box>
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="sm" color="textMuted">
            {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
          <Button onClick={() => handleAddEntry(sport)} size="sm" variant="outline">
            <MdAdd /> Add Entry
          </Button>
        </Flex>
        
        {sortedEntries.length === 0 ? (
          <Text fontSize="sm" color="textMuted">
            No {sport} FTP history. Click "Add Entry" to start tracking.
          </Text>
        ) : (
          <Box overflowX="auto" borderWidth="1px" borderColor="border" borderRadius="md">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row bg="tableHeaderBg">
                  <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Date</Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="600" color="tableHeaderText">FTP (Watts)</Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="600" color="tableHeaderText">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sortedEntries.map(([date, ftp]) => (
                  <Table.Row key={date}>
                    <Table.Cell>
                      {editingDate === date && editingSport === sport ? (
                        <Box className="react-datepicker-wrapper" width="150px">
                          <DatePicker
                            selected={new Date(date)}
                            onChange={(selectedDate) => handleDateChange(sport, date, selectedDate)}
                            onClickOutside={() => {
                              setEditingDate(null);
                              setEditingSport(null);
                            }}
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
                          onClick={() => {
                            setEditingDate(date);
                            setEditingSport(sport);
                          }}
                          title="Click to change date"
                        >
                          {date}
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Input
                        type="number"
                        value={ftp}
                        onChange={(e) => handleFtpChange(sport, date, e.target.value)}
                        size="sm"
                        width="120px"
                        min="0"
                        step="1"
                        bg="inputBg"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        onClick={() => handleRemoveEntry(sport, date)}
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
  
  return (
    <Box mb={6}>
      <Box mb={3}>
        <Heading size="md" mb={1} lineHeight="1.2" wordBreak="break-word">FTP History</Heading>
        <Text fontSize="sm" color="textMuted">
          Track your Functional Threshold Power over time. Used to calculate activity stress levels.
        </Text>
      </Box>
      
      {errors['ftpHistory'] && (
        <Text color="red.500" fontSize="sm" mb={2}>
          {errors['ftpHistory']}
        </Text>
      )}
      
      <Tabs.Root defaultValue="cycling">
        <Tabs.List>
          <Tabs.Trigger value="cycling">Cycling</Tabs.Trigger>
          <Tabs.Trigger value="running">Running</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="cycling" pt={4}>
          {renderTable('cycling', cyclingHistory)}
        </Tabs.Content>
        
        <Tabs.Content value="running" pt={4}>
          {renderTable('running', runningHistory)}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default FtpHistoryEditor;
