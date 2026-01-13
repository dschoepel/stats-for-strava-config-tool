import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  Flex,
  Icon,
  IconButton,
  Spinner,
  Badge
} from '@chakra-ui/react';
import { MdFolder, MdFolderOpen, MdDescription, MdArrowUpward, MdHome, MdCheck, MdClose } from 'react-icons/md';
import { browseFiles, readFile } from '../../../src/services';

const ServerFileBrowser = ({ isOpen, onClose, onFilesSelected }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parentPath, setParentPath] = useState(null);

  // Memoize selected files count to avoid recomputing
  const selectedCount = useMemo(() => selectedFiles.size, [selectedFiles]);

  // Load directory contents
  const loadDirectory = useCallback(async (dirPath = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await browseFiles(dirPath);
      
      if (result.success) {
        setCurrentPath(result.currentPath);
        setFolders(result.folders);
        setFiles(result.files);
        setParentPath(result.parentPath);
      } else {
        setError(result.error || 'Failed to load directory');
      }
    } catch (err) {
      setError('Failed to browse files: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load home directory on mount
  useEffect(() => {
    if (isOpen) {
      loadDirectory();
      setSelectedFiles(new Set());
    }
  }, [isOpen, loadDirectory]);

  const handleFolderClick = useCallback((folder) => {
    loadDirectory(folder.fullPath);
  }, [loadDirectory]);

  const handleGoUp = useCallback(() => {
    if (parentPath) {
      loadDirectory(parentPath);
    }
  }, [parentPath, loadDirectory]);

  const handleGoHome = useCallback(() => {
    loadDirectory('');
  }, [loadDirectory]);

  const handleFileToggle = useCallback((file) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(file.fullPath)) {
        newSet.delete(file.fullPath);
      } else {
        newSet.add(file.fullPath);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedFiles(new Set(files.map(f => f.fullPath)));
  }, [files]);

  const handleDeselectAll = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const handleConfirm = useCallback(async () => {
    if (selectedFiles.size === 0) {
      setError('Please select at least one file');
      return;
    }

    // Load content for selected files
    const filesToLoad = files.filter(f => selectedFiles.has(f.fullPath));
    
    try {
      const filesWithContent = await Promise.all(
        filesToLoad.map(async (file) => {
          const result = await readFile(file.fullPath);
          
          if (result.success) {
            return {
              name: file.name,
              path: file.fullPath,
              content: result.content,
              size: file.size,
              lastModified: new Date(file.modified)
            };
          }
          return null;
        })
      );

      const validFiles = filesWithContent.filter(f => f !== null);
      
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
        onClose();
      } else {
        setError('Failed to load file contents');
      }
    } catch (err) {
      setError('Failed to load files: ' + err.message);
    }
  }, [selectedFiles, files, onFilesSelected, onClose]);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.600"
      zIndex="1000"
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg="bg"
        borderRadius="lg"
        boxShadow="xl"
        maxW="800px"
        w="95%"
        maxH="80vh"
        display="flex"
        flexDirection="column"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          p={4}
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Heading size="lg" display="flex" alignItems="center" gap={2}>
            <Icon color="primary"><MdFolderOpen /></Icon>
            Browse Server Files
          </Heading>
          <IconButton
            onClick={onClose}
            size="sm"
            variant="ghost"
            aria-label="Close"
          >
            <Icon><MdClose /></Icon>
          </IconButton>
        </Flex>

        {/* Path navigation */}
        <Box p={4} borderBottomWidth="1px" borderColor="border">
          <HStack gap={2} mb={2}>
            <IconButton
              size="sm"
              onClick={handleGoHome}
              title="Go to home directory"
              variant="outline"
              disabled={isLoading}
            >
              <Icon><MdHome /></Icon>
            </IconButton>
            <IconButton
              size="sm"
              onClick={handleGoUp}
              title="Go up one level"
              variant="outline"
              disabled={!parentPath || isLoading}
            >
              <Icon><MdArrowUpward /></Icon>
            </IconButton>
            <Text fontSize="sm" color="text" fontFamily="mono" flex="1" isTruncated>
              {currentPath || 'Loading...'}
            </Text>
          </HStack>
          
          {selectedCount > 0 && (
            <HStack gap={2}>
              <Badge colorPalette="blue">{selectedCount} file{selectedCount !== 1 ? 's' : ''} selected</Badge>
              <Button size="xs" onClick={handleSelectAll} variant="outline">Select All</Button>
              <Button size="xs" onClick={handleDeselectAll} variant="outline">Deselect All</Button>
            </HStack>
          )}
        </Box>

        {/* Content area */}
        <Box flex="1" overflowY="auto" p={4}>
          {isLoading ? (
            <Flex justify="center" align="center" h="200px">
              <Spinner size="lg" color="primary" />
            </Flex>
          ) : error ? (
            <Box p={4} bg="red.50" _dark={{ bg: "red.950" }} borderRadius="md">
              <Text color="red.900" _dark={{ color: "red.100" }}>{error}</Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={1}>
              {/* Folders */}
              {folders.map((folder) => (
                <Flex
                  key={folder.fullPath}
                  p={3}
                  bg="cardBg"
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
                  onClick={() => handleFolderClick(folder)}
                  align="center"
                  gap={3}
                >
                  <Icon color="blue.500" fontSize="xl"><MdFolder /></Icon>
                  <Text color="text" fontWeight="medium">{folder.name}</Text>
                </Flex>
              ))}

              {/* Files */}
              {files.map((file) => {
                const isSelected = selectedFiles.has(file.fullPath);
                return (
                  <Flex
                    key={file.fullPath}
                    p={3}
                    bg={isSelected ? "blue.50" : "cardBg"}
                    _dark={{ bg: isSelected ? "blue.950" : "cardBg" }}
                    borderRadius="md"
                    cursor="pointer"
                    border="2px solid"
                    borderColor={isSelected ? "blue.500" : "transparent"}
                    _hover={{ bg: isSelected ? "blue.100" : "gray.100", _dark: { bg: isSelected ? "blue.900" : "gray.700" } }}
                    onClick={() => handleFileToggle(file)}
                    align="center"
                    gap={3}
                  >
                    {isSelected && <Icon color="blue.500" fontSize="xl"><MdCheck /></Icon>}
                    <Icon color="green.500" fontSize="xl"><MdDescription /></Icon>
                    <VStack align="start" gap={0} flex="1">
                      <Text color="text" fontWeight="medium">{file.name}</Text>
                      <Text color="textMuted" fontSize="xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </Text>
                    </VStack>
                  </Flex>
                );
              })}

              {folders.length === 0 && files.length === 0 && (
                <Text color="textMuted" textAlign="center" py={8}>
                  No folders or YAML files in this directory
                </Text>
              )}
            </VStack>
          )}
        </Box>

        {/* Footer */}
        <Flex
          justify="flex-end"
          gap={3}
          p={4}
          borderTopWidth="1px"
          borderColor="border"
        >
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            colorPalette="blue"
            disabled={selectedCount === 0}
          >
            Load {selectedCount > 0 ? `${selectedCount} File${selectedCount !== 1 ? 's' : ''}` : 'Files'}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

ServerFileBrowser.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onFilesSelected: PropTypes.func.isRequired
};

export default memo(ServerFileBrowser);
