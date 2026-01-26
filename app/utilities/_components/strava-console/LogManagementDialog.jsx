'use client';

import { useState } from 'react';
import { Badge, Icon, Text, Table, HStack, Box, Dialog, Portal, Button, VStack } from '@chakra-ui/react';
import { MdCheckCircle, MdError, MdClose } from 'react-icons/md';
import FileManagerDialog from '../common/FileManagerDialog';
import { formatBytes } from './utils/formatters';

export default function LogManagementDialog({ isOpen, onClose, onLogsChanged }) {
  const [logCount, setLogCount] = useState(0);
  const [viewingLog, setViewingLog] = useState(null);

  const handleLogsChanged = () => {
    // Notify parent that logs have changed (deleted/modified)
    if (onLogsChanged) {
      onLogsChanged();
    }
  };

  const handleViewLog = async (log) => {
    try {
      const url = `/api/download-log?path=${encodeURIComponent(log.path)}`;
      const response = await fetch(url);
      const content = await response.text();
      setViewingLog({ ...log, content });
    } catch (error) {
      console.error('Failed to load log:', error);
    }
  };

  const columns = [
    { header: 'Date/Time', width: 'auto' },
    { header: 'Command', width: 'auto' },
    { header: 'Status', width: '120px' },
    { header: 'Size', width: '100px' }
  ];

  const renderRow = (log, columns, isMobile = false) => {
    const statusBadge = log.exitCode === 0 ? (
      <Badge colorPalette="green" size="sm">
        <Icon as={MdCheckCircle} />
        <Text ml={1}>Success</Text>
      </Badge>
    ) : (
      <Badge colorPalette="red" size="sm">
        <Icon as={MdError} />
        <Text ml={1}>Failed ({log.exitCode})</Text>
      </Badge>
    );

    // Mobile card layout
    if (isMobile) {
      return (
        <>
          <HStack justify="space-between" flexWrap="wrap">
            <Text fontSize="xs" fontFamily="mono" color="fg" fontWeight="medium">
              {log.command}
            </Text>
            {statusBadge}
          </HStack>
          <HStack justify="space-between" fontSize="xs" color="fg.muted">
            <Text>{log.timestamp}</Text>
            <Text>{formatBytes(log.size)}</Text>
          </HStack>
        </>
      );
    }

    // Desktop table layout
    return (
      <>
        <Table.Cell>
          <Text 
            fontSize="xs" 
            fontFamily="mono" 
            color="gray.900" 
            _dark={{ color: "gray.100" }}
          >
            {log.timestamp}
          </Text>
        </Table.Cell>
        <Table.Cell>
          <Text 
            fontSize="xs" 
            fontFamily="mono" 
            color="gray.900" 
            _dark={{ color: "gray.100" }}
          >
            {log.command}
          </Text>
        </Table.Cell>
        <Table.Cell>
          {statusBadge}
        </Table.Cell>
        <Table.Cell>
          <Text fontSize="xs" color="fg.muted">{formatBytes(log.size)}</Text>
        </Table.Cell>
      </>
    );
  };

  return (
    <>
      <FileManagerDialog
        isOpen={isOpen}
        onClose={onClose}
        title={`Manage Command Logs${logCount > 0 ? ` (${logCount})` : ''}`}
        apiEndpoint="/api/console-logs"
        columns={columns}
        renderRow={renderRow}
        canDownload={true}
        canDelete={true}
        canView={true}
        onView={handleViewLog}
        onFilesLoaded={(files) => setLogCount(files.length)}
        onFilesChanged={handleLogsChanged}
        downloadUrlGenerator={(log) => 
          `/api/download-log?path=${encodeURIComponent(log.path)}`
        }
      />

      {/* Log Viewer Dialog */}
      {viewingLog && (
        <Dialog.Root open={!!viewingLog} onOpenChange={(e) => !e.open && setViewingLog(null)} size="xl">
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="900px" maxH="80vh" bg="cardBg">
                <Dialog.Header
                  bg="#E2E8F0"
                  _dark={{ bg: "#334155" }}
                >
                  <Dialog.Title color="#1a202c" _dark={{ color: "#f7fafc" }}>
                    Log: {viewingLog.command} - {viewingLog.timestamp}
                  </Dialog.Title>
                </Dialog.Header>
                <Dialog.CloseTrigger
                  asChild
                  position="absolute"
                  top={3}
                  right={3}
                >
                  <Button variant="ghost" size="sm">
                    <Icon as={MdClose} />
                  </Button>
                </Dialog.CloseTrigger>
                <Dialog.Body>
                  <VStack align="stretch" gap={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium">Status:</Text>
                      {viewingLog.exitCode === 0 ? (
                        <Badge colorPalette="green">
                          <Icon as={MdCheckCircle} /> Success
                        </Badge>
                      ) : (
                        <Badge colorPalette="red">
                          <Icon as={MdError} /> Failed (Exit Code: {viewingLog.exitCode})
                        </Badge>
                      )}
                    </HStack>
                    <Box
                      p={4}
                      bg="gray.100"
                      _dark={{ bg: "gray.900" }}
                      borderRadius="md"
                      fontFamily="mono"
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                      overflowY="auto"
                      maxH="60vh"
                    >
                      {viewingLog.content}
                    </Box>
                  </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button onClick={() => setViewingLog(null)}>Close</Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </>
  );
}
