import React from 'react';
import { Box, Table, Icon } from '@chakra-ui/react';
import { MdWarning } from 'react-icons/md';

/**
 * SectionMappingTable - Displays the mapping of configuration sections to files
 */
const SectionMappingTable = ({ sectionToFileMap }) => {
  const sortedEntries = Array.from(sectionToFileMap.entries());
  
  return (
    <Box p={4} pt={0} overflowX="auto">
      <Table.Root size="sm" variant="outline">
        <Table.Header>
          <Table.Row bg="tableHeaderBg">
            <Table.ColumnHeader color="tableHeaderText" fontWeight="bold">
              Section
            </Table.ColumnHeader>
            <Table.ColumnHeader color="tableHeaderText" fontWeight="bold">
              File(s)
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sortedEntries.map(([section, fileInfo]) => {
            const isMultiple = Array.isArray(fileInfo);
            const files = isMultiple ? fileInfo : [fileInfo];
            
            return (
              <Table.Row key={section}>
                <Table.Cell fontWeight="medium" color="text">
                  {section}
                </Table.Cell>
                <Table.Cell 
                  color={isMultiple ? "orange.600" : "textMuted"} 
                  _dark={{ color: isMultiple ? "orange.400" : "textMuted" }}
                >
                  {files.map((f, idx) => (
                    <Box key={idx}>
                      {isMultiple && (
                        <Icon color="orange.500" mr={1}>
                          <MdWarning />
                        </Icon>
                      )}
                      {typeof f === 'string' ? f : f.fileName}
                    </Box>
                  ))}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default SectionMappingTable;
