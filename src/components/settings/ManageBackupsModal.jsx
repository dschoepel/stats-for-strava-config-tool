'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,
  Table,
  Checkbox
} from '@chakra-ui/react';
import { MdFolder, MdDelete, MdRefresh, MdArrowUpward, MdArrowDownward, MdVisibility, MdFolderOpen } from 'react-icons/md';
import { ConfirmDialog } from '../../../app/_components/ui/ConfirmDialog';
import BackupViewerDrawer from './BackupViewerDrawer';

/**
 * ManageBackupsModal Component
 * 
 * Modal for viewing, sorting, and bulk-deleting backup files.
 * Features:
 * - Sortable table by date (newest-first/oldest-first)
 * - Checkbox selection (Select All, individual selection)
 * - Keyboard navigation (ArrowUp/Down, Spacebar)
 * - Skeleton loaders during fetch
 * - YAML viewer drawer for file contents
 * - Bulk delete with confirmation (max 50 files)
 * - Auto-refresh after delete
 * - Inline error messages
 * - Empty state handling
 * - Focus management with blue focus indicator
 */
export default function ManageBackupsModal({ isOpen, onClose, backupDir }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const tableRef = useRef(null);
  const rowRefs = useRef([]);

  // Fetch backups from API
  const fetchBackups = useCallback(async () => {
    if (!backupDir) {
      console.log('[ManageBackupsModal] No backupDir provided');
      return;
    }
    
    console.log('[ManageBackupsModal] Fetching backups from directory:', backupDir);
    
    setLoading(true);
    setError('');
    
    try {
      const queryUrl = `/api/backup-config?directory=${encodeURIComponent(backupDir)}`;
      console.log('[ManageBackupsModal] Query URL:', queryUrl);
      const response = await fetch(queryUrl);
      
      if (!response.ok) {
        throw new Error('Failed to load backup files');
      }
      
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (err) {
      setError(err.message || 'Failed to load backups');
      setBackups([]);
    } finally {
      setLoading(false);
    }
  }, [backupDir]);

  // Load backups when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFiles(new Set()); // Clear selection on open
      setFocusedIndex(-1);
      fetchBackups();
    }
  }, [isOpen, fetchBackups]);

  // Sort backups by date
  const sortedBackups = [...backups].sort((a, b) => {
    const dateA = new Date(a.modifiedTime);
    const dateB = new Date(b.modifiedTime);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Toggle sort order
  const toggleSort = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  };

  // Toggle selection for a single file
  const toggleSelection = (filePath) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  };

  // Toggle Select All
  const toggleSelectAll = () => {
    if (selectedFiles.size === sortedBackups.length && sortedBackups.length > 0) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(sortedBackups.map(b => b.path)));
    }
  };

  // Calculate total size
  const totalSize = sortedBackups
    .filter(b => selectedFiles.has(b.path))
    .reduce((sum, b) => sum + b.size, 0);

  // Format size (KB/MB)
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle delete
  const handleDelete = async () => {
    setShowConfirmDelete(false);
    setDeleting(true);
    setError('');
    setSuccessMessage('');

    try {
      const filePaths = Array.from(selectedFiles);
      
      if (filePaths.length > 50) {
        throw new Error('Cannot delete more than 50 files at once');
      }

      const response = await fetch('/api/backup-config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete backups');
      }

      const data = await response.json();
      
      // Show success message
      setSuccessMessage(`Successfully deleted ${data.deletedCount} backup file(s)`);
      setTimeout(() => setSuccessMessage(''), 3000);

      // Clear selection and refresh
      setSelectedFiles(new Set());
      setFocusedIndex(-1);
      await fetchBackups();
    } catch (err) {
      setError(err.message || 'Failed to delete backups');
    } finally {
      setDeleting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || sortedBackups.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, sortedBackups.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === ' ' && focusedIndex >= 0) {
        e.preventDefault();
        toggleSelection(sortedBackups[focusedIndex].path);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sortedBackups, focusedIndex]);

  // Focus management
  useEffect(() => {
    if (focusedIndex >= 0 && rowRefs.current[focusedIndex]) {
      rowRefs.current[focusedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={1000}
        display="flex"
        alignItems="center"
        justifyContent="center"
        onClick={onClose}
      >
        {/* Modal Content */}
        <Box
          bg="bg"
          borderRadius="lg"
          maxW="900px"
          maxH="80vh"
          width="90vw"
          display="flex"
          flexDirection="column"
          overflow="hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <Flex
            justify="space-between"
            align="center"
            p={4}
            borderBottomWidth="1px"
            borderColor="border"
          >
            <Heading size="lg" display="flex" alignItems="center" gap={2}>
              <Box as={MdFolder} color="blue.500" /> Manage Backups
            </Heading>
            <HStack gap={2}>
              <Button
                onClick={fetchBackups}
                size="sm"
                variant="outline"
                colorPalette="blue"
                disabled={loading}
              >
                <MdRefresh />
              </Button>
              <Button onClick={onClose} size="sm" variant="ghost">
                ✕
              </Button>
            </HStack>
          </Flex>

          {/* Modal Body */}
          <VStack align="stretch" gap={3} p={4} flex={1} overflowY="auto">
            {/* Error Message */}
            {error && (
              <Box 
                bg="red.50" 
                _dark={{ bg: "red.900", borderColor: "red.700" }} 
                p={3} 
                borderRadius="md" 
                borderWidth="1px" 
                borderColor="red.200"
              >
                <Text color="red.700" _dark={{ color: "red.200" }} fontSize="sm" fontWeight="500">
                  {error}
                </Text>
              </Box>
            )}

            {/* Success Message */}
            {successMessage && (
              <Box 
                bg="green.50" 
                _dark={{ bg: "green.900", borderColor: "green.700" }} 
                p={3} 
                borderRadius="md" 
                borderWidth="1px" 
                borderColor="green.200"
              >
                <Text color="green.700" _dark={{ color: "green.200" }} fontSize="sm" fontWeight="500">
                  {successMessage}
                </Text>
              </Box>
            )}

            {/* Summary Badges */}
            {!loading && sortedBackups.length > 0 && (
              <Flex gap={2} flexWrap="wrap">
                <Badge colorPalette="blue" size="lg">
                  {selectedFiles.size} of {sortedBackups.length} selected
                </Badge>
                {selectedFiles.size > 0 && (
                  <Badge colorPalette="blue" size="lg" variant="outline">
                    Total: {formatSize(totalSize)}
                  </Badge>
                )}
              </Flex>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <Stack gap={3}>
                {[...Array(5)].map((_, i) => (
                  <HStack key={i} gap={3} p={3} borderWidth="1px" borderRadius="md" borderColor="border">
                    <SkeletonCircle size="6" />
                    <Stack flex={1} gap={2}>
                      <SkeletonText noOfLines={1} width="60%" />
                      <SkeletonText noOfLines={1} width="40%" />
                    </Stack>
                  </HStack>
                ))}
              </Stack>
            )}

            {/* Empty State */}
            {!loading && sortedBackups.length === 0 && (
              <Flex direction="column" align="center" justify="center" py={10} gap={3}>
                <Box as={MdFolderOpen} color="gray.400" fontSize="4xl" />
                <Text color="gray.500" fontSize="lg">No backup files found</Text>
              </Flex>
            )}

            {/* Backups Table */}
            {!loading && sortedBackups.length > 0 && (
              <Box overflowX="auto" ref={tableRef}>
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader width="50px">
                        <Checkbox.Root
                          checked={selectedFiles.size === sortedBackups.length && sortedBackups.length > 0}
                          onCheckedChange={toggleSelectAll}
                          colorPalette="blue"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Filename</Table.ColumnHeader>
                      <Table.ColumnHeader cursor="pointer" onClick={toggleSort}>
                        <Flex align="center" gap={1}>
                          Date
                          <Box as={sortOrder === 'newest' ? MdArrowDownward : MdArrowUpward} color="blue.500" />
                        </Flex>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Size</Table.ColumnHeader>
                      <Table.ColumnHeader width="80px">Actions</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {sortedBackups.map((backup, index) => (
                      <Table.Row
                        key={backup.path}
                        ref={el => rowRefs.current[index] = el}
                        bg={focusedIndex === index ? 'blue.50' : undefined}
                        _dark={{ bg: focusedIndex === index ? 'blue.900' : undefined }}
                        outline={focusedIndex === index ? '2px solid' : undefined}
                        outlineColor={focusedIndex === index ? 'blue.500' : undefined}
                        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                        cursor="pointer"
                      >
                        <Table.Cell>
                          <Checkbox.Root
                            checked={selectedFiles.has(backup.path)}
                            onCheckedChange={() => toggleSelection(backup.path)}
                            colorPalette="blue"
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" fontFamily="mono" wordBreak="break-all">
                            {backup.name}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm">
                            {new Date(backup.modifiedTime).toLocaleString()}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm">{formatSize(backup.size)}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="blue"
                            onClick={() => setViewerFile(backup)}
                            title="View file contents"
                          >
                            <MdVisibility />
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </VStack>

          {/* Modal Footer */}
          {!loading && sortedBackups.length > 0 && (
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderTopWidth="1px"
              borderColor="border"
            >
              <Text fontSize="sm" color="gray.500">
                {selectedFiles.size > 50 && (
                  <Text as="span" color="red.500">
                    Maximum 50 files can be deleted at once
                  </Text>
                )}
              </Text>
              <Button
                onClick={() => setShowConfirmDelete(true)}
                colorPalette="red"
                variant="solid"
                disabled={selectedFiles.size === 0 || selectedFiles.size > 50 || deleting}
                isLoading={deleting}
                loadingText="Deleting..."
              >
                <MdDelete /> Delete Selected ({selectedFiles.size})
              </Button>
            </Flex>
          )}
        </Box>
      </Box>

      {/* Confirm Delete Dialog */}
      {showConfirmDelete && (
        <ConfirmDialog
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={handleDelete}
          title="Delete Backup Files"
          message={`Are you sure you want to delete ${selectedFiles.size} backup file(s)? This action cannot be undone.`}
          confirmText="Delete"
          colorScheme="red"
        />
      )}

      {/* Backup Viewer Drawer */}
      {viewerFile && (
        <BackupViewerDrawer
          isOpen={!!viewerFile}
          onClose={() => setViewerFile(null)}
          file={viewerFile}
        />
      )}
    </>
  );
}
