'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Text,
  Button,
  Icon,
  Spinner,
  Table,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogTitle,
  Alert,
  Checkbox
} from '@chakra-ui/react';
import { MdDelete, MdDownload } from 'react-icons/md';

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default function FileManagerDialog({
  isOpen,
  onClose,
  title,
  apiEndpoint,
  columns = [],
  renderRow,
  formatSummary,
  canDownload = true,
  canDelete = true,
  downloadUrlGenerator
}) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [metadata, setMetadata] = useState({});
  const [error, setError] = useState(null);

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(apiEndpoint);
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || data.logs || []);
        setMetadata({
          totalSize: data.totalSize,
          totalCount: data.totalCount || data.files?.length || data.logs?.length || 0
        });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filenames: Array.from(selectedFiles),
          files: Array.from(selectedFiles)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedFiles(new Set());
        await loadFiles();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.checked) {
      setSelectedFiles(new Set(files.map(f => f.filename || f.name)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleDownload = (file) => {
    const url = downloadUrlGenerator 
      ? downloadUrlGenerator(file) 
      : `/api/download-log?path=${encodeURIComponent(file.path || file.filename)}`;
    window.open(url, '_blank');
  };

  const allSelected = selectedFiles.size === files.length && files.length > 0;
  const someSelected = selectedFiles.size > 0 && selectedFiles.size < files.length;

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="xl">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />
        
        <DialogBody>
          <VStack align="stretch" gap={4}>
            {/* Summary */}
            <Box p={3} bg="gray.50" _dark={{ bg: 'gray.800' }} borderRadius="md">
              {formatSummary ? (
                formatSummary(metadata, files)
              ) : (
                <Flex justify="space-between" direction={{ base: "column", sm: "row" }} gap={{ base: 1, sm: 0 }}>
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="fg.muted">
                    Total: {metadata.totalCount} files
                  </Text>
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="fg.muted">
                    Storage: {formatBytes(metadata.totalSize || 0)}
                  </Text>
                </Flex>
              )}
            </Box>

            {error && (
              <Alert.Root status="error">
                <Alert.Title>Error</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Root>
            )}

            {/* Bulk Actions */}
            <Flex gap={2} direction={{ base: "column", sm: "row" }} align="stretch">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={handleSelectAll}
              >
                <Text fontSize={{ base: "xs", sm: "sm" }}>Select All</Text>
              </Checkbox>
              {canDelete && (
                <Button
                  size="sm"
                  colorPalette="red"
                  onClick={handleDelete}
                  disabled={selectedFiles.size === 0 || isLoading}
                  w={{ base: "100%", sm: "auto" }}
                >
                  <Icon as={MdDelete} />
                  <Text ml={1}>Delete ({selectedFiles.size})</Text>
                </Button>
              )}
            </Flex>

            {/* File List */}
            {isLoading ? (
              <HStack justify="center" py={8}>
                <Spinner size="sm" />
                <Text color="fg.muted">Loading...</Text>
              </HStack>
            ) : files.length === 0 ? (
              <Box py={8} textAlign="center">
                <Text color="fg.muted">No files found</Text>
              </Box>
            ) : (
              <>
                {/* Desktop table view */}
                <Box 
                  maxH="400px" 
                  overflowY="auto" 
                  borderWidth="1px" 
                  borderRadius="md"
                  display={{ base: "none", sm: "block" }}
                >
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader width="40px"></Table.ColumnHeader>
                        {columns.map((col, idx) => (
                          <Table.ColumnHeader key={idx} width={col.width}>
                            {col.header}
                          </Table.ColumnHeader>
                        ))}
                        <Table.ColumnHeader width="80px">Actions</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {files.map((file) => {
                        const fileId = file.filename || file.name;
                        return (
                          <Table.Row key={fileId}>
                            <Table.Cell>
                              <Checkbox
                                checked={selectedFiles.has(fileId)}
                                onCheckedChange={(e) => {
                                  const newSet = new Set(selectedFiles);
                                  if (e.checked) {
                                    newSet.add(fileId);
                                  } else {
                                    newSet.delete(fileId);
                                  }
                                  setSelectedFiles(newSet);
                                }}
                              />
                            </Table.Cell>
                            {renderRow(file, columns, false)}
                            <Table.Cell>
                              {canDownload && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => handleDownload(file)}
                                  title="Download"
                                >
                                  <Icon as={MdDownload} />
                                </Button>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                </Box>

                {/* Mobile card view */}
                <VStack 
                  align="stretch" 
                  gap={2}
                  maxH="400px"
                  overflowY="auto"
                  display={{ base: "flex", sm: "none" }}
                >
                  {files.map((file) => {
                    const fileId = file.filename || file.name;
                    return (
                      <Box
                        key={fileId}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        bg="bg"
                      >
                        <HStack justify="space-between" mb={2}>
                          <Checkbox
                            checked={selectedFiles.has(fileId)}
                            onCheckedChange={(e) => {
                              const newSet = new Set(selectedFiles);
                              if (e.checked) {
                                newSet.add(fileId);
                              } else {
                                newSet.delete(fileId);
                              }
                              setSelectedFiles(newSet);
                            }}
                          />
                          {canDownload && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => handleDownload(file)}
                              title="Download"
                            >
                              <Icon as={MdDownload} />
                            </Button>
                          )}
                        </HStack>
                        <VStack align="stretch" gap={1}>
                          {renderRow(file, columns, true)}
                        </VStack>
                      </Box>
                    );
                  })}
                </VStack>
              </>
            )}
          </VStack>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
