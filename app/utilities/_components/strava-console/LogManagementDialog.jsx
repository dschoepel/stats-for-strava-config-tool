'use client';

import { Badge, Icon, Text, Table, HStack, Box } from '@chakra-ui/react';
import { MdCheckCircle, MdError } from 'react-icons/md';
import FileManagerDialog from '../common/FileManagerDialog';

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default function LogManagementDialog({ isOpen, onClose }) {
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
    <FileManagerDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Command Logs"
      apiEndpoint="/api/console-logs"
      columns={columns}
      renderRow={renderRow}
      canDownload={true}
      canDelete={true}
      downloadUrlGenerator={(log) => 
        `/api/download-log?path=${encodeURIComponent(log.path)}`
      }
    />
  );
}
