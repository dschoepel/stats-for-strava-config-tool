import React, { useState } from 'react';
import { Box, Button, Input, Flex, Text, VStack, Table, Heading, Tabs, Field } from '@chakra-ui/react';
import { MdAdd, MdDelete } from 'react-icons/md';
import { DateInput } from '../DateInput';

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
  
  const handleDateChange = (sport, oldDate, newDateStr) => {
    if (!newDateStr || newDateStr === oldDate) return;
    
    if (history[sport]?.[newDateStr]) {
      alert('An entry for this date already exists.');
      return;
    }
    
    const updated = { ...history };
    if (!updated[sport]) {
      updated[sport] = {};
    }
    updated[sport][newDateStr] = updated[sport][oldDate];
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
        <Flex justify="space-between" align="center" mb={3} gap={2} flexWrap="wrap">
          <Text fontSize="sm" color="textMuted">
            {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
          <Button 
            onClick={() => handleAddEntry(sport)} 
            size={{ base: "xs", sm: "sm" }} 
            variant="outline"
            flexShrink={0}
            fontSize={{ base: "xs", sm: "sm" }}
            px={{ base: 2, sm: 3 }}
          >
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
                        <Field.Root width="150px">
                          <Field.Label srOnly>Date</Field.Label>
                          <DateInput
                            value={date}
                            onChange={(newDate) => handleDateChange(sport, date, newDate)}
                            bg="inputBg"
                            size="sm"
                          />
                        </Field.Root>
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
                        size={{ base: "xs", sm: "sm" }}
                        variant="outline"
                        colorPalette="red"
                        fontSize={{ base: "xs", sm: "sm" }}
                        px={{ base: 2, sm: 3 }}
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
    <Box mb={6}>
      <Box mb={3}>
        <Heading size={{ base: "sm", md: "md" }} mb={1} lineHeight="1.2" wordBreak="break-word">FTP History</Heading>
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
        <Tabs.List size={{ base: "sm", md: "md" }}>
          <Tabs.Trigger value="cycling" px={{ base: 3, md: 4 }} fontSize={{ base: "sm", md: "md" }}>Cycling</Tabs.Trigger>
          <Tabs.Trigger value="running" px={{ base: 3, md: 4 }} fontSize={{ base: "sm", md: "md" }}>Running</Tabs.Trigger>
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
