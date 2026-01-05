import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Flex,
  Icon,
  IconButton,
  Spinner
} from '@chakra-ui/react';
import { MdFolder, MdArrowUpward, MdHome, MdCheck, MdClose } from 'react-icons/md';

/**
 * ServerFolderBrowser - Browse and select a folder on the server
 */
const ServerFolderBrowser = ({ isOpen, onClose, onFolderSelected, initialPath = '' }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parentPath, setParentPath] = useState(null);

  // Load directory contents
  const loadDirectory = async (dirPath = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = dirPath 
        ? `/api/browse-files?path=${encodeURIComponent(dirPath)}`
        : '/api/browse-files';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setCurrentPath(result.currentPath);
        setFolders(result.folders);
        setParentPath(result.parentPath);
      } else {
        setError(result.error || 'Failed to load directory');
      }
    } catch (err) {
      setError('Failed to browse folders: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial directory on mount
  useEffect(() => {
    if (isOpen) {
      loadDirectory(initialPath);
    }
  }, [isOpen, initialPath]);

  const handleFolderClick = (folder) => {
    loadDirectory(folder.fullPath);
  };

  const handleGoUp = () => {
    if (parentPath) {
      loadDirectory(parentPath);
    }
  };

  const handleGoHome = () => {
    loadDirectory('');
  };

  const handleSelectFolder = () => {
    onFolderSelected(currentPath);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
      bg="rgba(0, 0, 0, 0.6)"
      zIndex="10000"
      align="center"
      justify="center"
      onClick={onClose}
    >
      <Box
        bg="cardBg"
        borderRadius="lg"
        boxShadow="dark-lg"
        width={{ base: "95%", sm: "600px" }}
        maxWidth="600px"
        maxHeight="80vh"
        overflow="hidden"
        onClick={(e) => e.stopPropagation()}
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Flex
          bg="primary"
          color="white"
          p={4}
          align="center"
          justify="space-between"
        >
          <Heading size="md">Select Server Folder</Heading>
          <IconButton
            onClick={onClose}
            size="sm"
            variant="ghost"
            colorPalette="whiteAlpha"
            aria-label="Close"
          >
            <Icon><MdClose /></Icon>
          </IconButton>
        </Flex>

        {/* Current Path */}
        <Box p={3} bg="gray.100" _dark={{ bg: "gray.800" }} borderBottomWidth="1px" borderColor="border">
          <HStack gap={2} mb={2}>
            <IconButton
              onClick={handleGoHome}
              size="sm"
              variant="ghost"
              title="Go to home directory"
              isDisabled={!currentPath}
            >
              <Icon><MdHome /></Icon>
            </IconButton>
            <IconButton
              onClick={handleGoUp}
              size="sm"
              variant="ghost"
              title="Go up one level"
              isDisabled={!parentPath}
            >
              <Icon><MdArrowUpward /></Icon>
            </IconButton>
          </HStack>
          <Text fontSize="sm" fontFamily="mono" color="text" wordBreak="break-all">
            {currentPath || '/'}
          </Text>
        </Box>

        {/* Folder List */}
        <Box flex={1} overflow="auto" p={3}>
          {isLoading ? (
            <Flex justify="center" align="center" height="200px">
              <Spinner size="lg" color="primary" />
            </Flex>
          ) : error ? (
            <Box p={4} bg="red.50" _dark={{ bg: "red.900/30" }} borderRadius="md" borderWidth="1px" borderColor="red.200">
              <Text color="red.700" _dark={{ color: "red.300" }}>{error}</Text>
            </Box>
          ) : folders.length === 0 ? (
            <Box p={4} textAlign="center" color="gray.500">
              <Text>No folders in this directory</Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={1}>
              {folders.map((folder) => (
                <Flex
                  key={folder.fullPath}
                  align="center"
                  gap={3}
                  p={3}
                  bg="transparent"
                  _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => handleFolderClick(folder)}
                >
                  <Icon color="blue.500" fontSize="xl"><MdFolder /></Icon>
                  <Text flex={1} fontSize="sm" color="text">{folder.name}</Text>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>

        {/* Footer */}
        <Flex
          p={4}
          bg="gray.50"
          _dark={{ bg: "gray.800" }}
          borderTopWidth="1px"
          borderColor="border"
          gap={3}
          justify="flex-end"
        >
          <Button
            onClick={onClose}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelectFolder}
            colorPalette="green"
            leftIcon={<MdCheck />}
            isDisabled={isLoading}
          >
            Select This Folder
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

ServerFolderBrowser.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onFolderSelected: PropTypes.func.isRequired,
  initialPath: PropTypes.string
};

export default ServerFolderBrowser;
