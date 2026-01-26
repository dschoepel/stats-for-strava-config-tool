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
  DialogBackdrop,
  DialogPositioner,
  Portal,
  Alert,
  Checkbox
} from '@chakra-ui/react';
import { MdDelete, MdDownload, MdClose, MdVisibility } from 'react-icons/md';
import { ConfirmDialog } from '../../../_components/ui/ConfirmDialog';

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
  canView = false,
  downloadUrlGenerator,
  onView = null,
  onFilesLoaded = null,
  onFilesChanged = null
}) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [metadata, setMetadata] = useState({});
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(apiEndpoint);
      const data = await res.json();
      if (data.success) {
        const loadedFiles = data.files || data.logs || [];
        setFiles(loadedFiles);
        setMetadata({
          totalSize: data.totalSize,
          totalCount: data.totalCount || loadedFiles.length || 0
        });
        if (onFilesLoaded) {
          onFilesLoaded(loadedFiles);
        }
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

  const handleDeleteClick = () => {
    if (selectedFiles.size === 0) return;
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmDelete(false);
    setIsLoading(true);
    setError(null);
    setDeleteResult(null);
    
    try {
      const filesToDelete = Array.from(selectedFiles);
      
      const res = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filenames: filesToDelete,
          files: filesToDelete
        })
      });
      
      const data = await res.json();
      
      if (data.success || data.deletedCount > 0) {
        setDeleteResult({
          success: true,
          message: `Successfully deleted ${data.deletedCount} file(s)`
        });
        setSelectedFiles(new Set());
        await loadFiles();
        
        // Notify parent that files have changed
        if (onFilesChanged) {
          onFilesChanged();
        }
        
        setTimeout(() => setDeleteResult(null), 3000);
      } else {
        const errorMsg = data.error || 
          (data.errors && data.errors.length > 0 
            ? `Failed to delete ${data.errors.length} file(s): ${data.errors.map(e => e.error).join(', ')}`
            : 'Delete failed');
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Delete operation failed:', err);
      setError(`Network error: ${err.message}`);
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
    <>
      <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="xl">
        <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent 
            maxW="800px" 
            bg="cardBg"
            borderRadius="lg"
            boxShadow="xl"
          >
            <DialogHeader 
              bg="#E2E8F0" 
              _dark={{ bg: "#334155" }}
              borderTopRadius="lg"
            >
              <DialogTitle color="#1a202c" _dark={{ color: "#f7fafc" }}>
                {title}
              </DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                position="absolute"
                top={2}
                right={2}
                color="fg.muted"
                _hover={{ 
                  color: "fg", 
                  bg: "gray.100", 
                  _dark: { bg: "gray.700" } 
                }}
              >
                <Icon as={MdClose} />
              </Button>
            </DialogCloseTrigger>
        
        <DialogBody>
          <VStack align="stretch" gap={4}>            {/* Success Message */}
            {deleteResult?.success && (
              <Alert.Root status="success">
                <Alert.Title>{deleteResult.message}</Alert.Title>
              </Alert.Root>
            )}
            {/* Summary */}
            <Box p={3} bg="gray.50" _dark={{ bg: 'gray.800' }} borderRadius="md">
              {formatSummary ? (
                formatSummary(metadata, files)
              ) : (
                <Flex justify="space-between" direction={{ base: "column", sm: "row" }} gap={{ base: 1, sm: 0 }}>
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.700" _dark={{ color: "gray.200" }}>
                    Total: {metadata.totalCount} files
                  </Text>
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.700" _dark={{ color: "gray.200" }}>
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
              <HStack>
                <Checkbox.Root
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label fontSize={{ base: "xs", sm: "sm" }}>
                    Select All
                  </Checkbox.Label>
                </Checkbox.Root>
              </HStack>
              {canDelete && (
                <Button
                  size="sm"
                  colorPalette="red"
                  onClick={handleDeleteClick}
                  disabled={selectedFiles.size === 0 || isLoading}
                  w={{ base: "100%", sm: "auto" }}
                >
                  <Icon as={MdDelete} />
                  Delete ({selectedFiles.size})
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
                          <Table.ColumnHeader 
                            key={idx} 
                            width={col.width}
                            color="gray.700"
                            _dark={{ color: "gray.200" }}
                            fontWeight="semibold"
                          >
                            {col.header}
                          </Table.ColumnHeader>
                        ))}
                        <Table.ColumnHeader 
                          width="80px"
                          color="gray.700"
                          _dark={{ color: "gray.200" }}
                          fontWeight="semibold"
                        >
                          Actions
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {files.map((file) => {
                        const fileId = file.filename || file.name;
                        return (
                          <Table.Row key={fileId}>
                            <Table.Cell>
                              <Checkbox.Root
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
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                              </Checkbox.Root>
                            </Table.Cell>
                            {renderRow(file, columns, false)}
                            <Table.Cell>
                              <HStack gap={1}>
                                {canView && onView && (
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => onView(file)}
                                    title="View"
                                  >
                                    <Icon as={MdVisibility} />
                                  </Button>
                                )}
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
                          <Checkbox.Root
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
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                          <HStack gap={1}>
                            {canView && onView && (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => onView(file)}
                                title="View"
                              >
                                <Icon as={MdVisibility} boxSize={3} />
                              </Button>
                            )}
                            {canDownload && (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDownload(file)}
                                title="Download"
                              >
                                <Icon as={MdDownload} boxSize={3} />
                              </Button>
                            )}
                          </HStack>
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

        <DialogFooter
          bg="#E2E8F0" 
          _dark={{ bg: "#334155" }}
          borderBottomRadius="lg"
        >
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogPositioner>
  </Portal>
</DialogRoot>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Selected Files?"
        message={`Are you sure you want to delete ${selectedFiles.size} file(s)? This action cannot be undone.`}
        confirmText="Delete"
        confirmColorPalette="red"
      />
    </>
  );
}
