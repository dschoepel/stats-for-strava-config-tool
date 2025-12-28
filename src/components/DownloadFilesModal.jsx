import React, { useState, useEffect } from 'react';
import { Box, Flex, VStack, Heading, Text, Button, IconButton, Badge, Checkbox, Icon } from '@chakra-ui/react';
import { MdClose, MdCheckCircle, MdDownload, MdFolder } from 'react-icons/md';
import { PiCircleFill, PiFileFill } from 'react-icons/pi';
import { Tooltip } from './Tooltip';
import { getSetting } from '../utils/settingsManager';

const DownloadFilesModal = ({ files, isOpen, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [savePath, setSavePath] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Select all files by default
      setSelectedFiles(new Set(files.map((_, index) => index)));
      setError(null);
      
      // Load save path from settings
      const defaultPath = getSetting('files.defaultPath', '~/Documents/strava-config-tool/');
      setSavePath(defaultPath);
    }
  }, [isOpen, files]);

  if (!isOpen || !files || files.length === 0) return null;

  const handleToggleFile = (index) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedFiles(new Set(files.map((_, index) => index)));
  };

  const handleDeselectAll = () => {
    setSelectedFiles(new Set());
  };

  const handleSaveFiles = async () => {
    if (selectedFiles.size === 0) {
      setError('Please select at least one file to save');
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const results = [];
      
      // Save each selected file via API
      for (const index of selectedFiles) {
        const file = files[index];
        
        // Construct full file path
        const cleanPath = savePath.replace(/\/$/, '');
        const fullPath = `${cleanPath}/${file.name}`;
        
        const response = await fetch('/api/save-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            path: fullPath, 
            content: file.content 
          })
        });
        
        const result = await response.json();
        results.push({ filename: file.name, success: result.success, error: result.error });
      }
      
      // Check for failures
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        setError(`Failed to save ${failures.length} file(s): ${failures.map(f => f.filename).join(', ')}`);
      } else {
        // Close modal on success
        onClose();
      }
    } catch (err) {
      console.error('Error saving files:', err);
      setError(err.message || 'Failed to save files');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
      bg="blackAlpha.800"
      justify="center"
      align="center"
      zIndex="9999"
      p={{ base: 0, md: 4 }}
      onClick={onClose}
    >
      <Flex
        bg="cardBg"
        borderWidth={{ base: 0, md: "1px" }}
        borderColor="border"
        borderRadius={{ base: 0, md: "xl" }}
        maxW={{ base: "100vw", md: "600px" }}
        maxH={{ base: "100vh", md: "90vh" }}
        w="100%"
        h={{ base: "100%", md: "auto" }}
        direction="column"
        boxShadow="0 20px 60px rgba(0, 0, 0, 0.3)"
        overflow="hidden"
        shadows="xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Flex
          bg="#E2E8F0"
          _dark={{ bg: "#334155" }}
          borderBottomWidth="1px"
          borderColor="border"
          p={{ base: 3, sm: 4 }}
          justify="space-between"
          align="center"
          flexShrink={0}
          gap={2}
        >
          <VStack align="flex-start" gap={0} flex={1} minW={0}>
            <Heading 
              size={{ base: "sm", sm: "md" }} 
              color="text" 
              lineHeight="1.2"
              wordBreak="break-word"
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Icon color="primary" boxSize={5}><MdDownload /></Icon> Save Files
            </Heading>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
              Select files to save to server
            </Text>
          </VStack>
          <IconButton
            onClick={onClose}
            aria-label="Close modal"
            variant="ghost"
            size={{ base: "sm", sm: "md" }}
            colorPalette="gray"
            minW={{ base: "32px", sm: "auto" }}
            h={{ base: "32px", sm: "auto" }}
            p={{ base: 1, sm: 2 }}
            flexShrink={0}
          >
            <MdClose />
          </IconButton>
        </Flex>

        {/* Body */}
        <Box flex={1} overflow="auto" p={{ base: 3, sm: 4 }}>
          <VStack align="stretch" gap={{ base: 4, sm: 5 }}>
            {/* Save Path Info */}
            <Box
              p={{ base: 3, sm: 4 }}
              bg="blue.50"
              _dark={{ bg: "blue.900/30", borderColor: "blue.700" }}
              borderRadius="md"
              borderWidth="1px"
              borderColor="blue.200"
            >
              <VStack align="stretch" gap={2}>
                <Flex align="start" gap={2}>
                  <Icon boxSize={5} color="blue.600" _dark={{ color: "blue.400" }}><MdFolder /></Icon>
                  <Box flex={1}>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="blue.700" _dark={{ color: "blue.300" }} mb={1}>
                      Files will be saved to:
                    </Text>
                    <Text fontSize="sm" fontFamily="mono" color="blue.800" _dark={{ color: "blue.200" }} fontWeight="medium">
                      {savePath}
                    </Text>
                  </Box>
                </Flex>
                <Text fontSize="xs" color="blue.600" _dark={{ color: "blue.400" }}>
                  Change this path in Settings → Files → Default file path
                </Text>
              </VStack>
            </Box>

            {/* Error Display */}
            {error && (
              <Box
                p={{ base: 3, sm: 4 }}
                bg="red.50"
                _dark={{ bg: "red.900/30", borderColor: "red.700" }}
                borderRadius="md"
                borderWidth="1px"
                borderColor="red.200"
              >
                <Text fontSize={{ base: "xs", sm: "sm" }} color="red.700" _dark={{ color: "red.300" }} fontWeight="600">
                  ⚠️ {error}
                </Text>
              </Box>
            )}

            {/* File Selection */}
            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <Heading size={{ base: "sm", sm: "md" }} lineHeight="1.2">
                  Select Files ({selectedFiles.size} of {files.length})
                </Heading>
                <Flex gap={2}>
                  <Button
                    onClick={handleSelectAll}
                    size="xs"
                    variant="ghost"
                    colorPalette="blue"
                  >
                    All
                  </Button>
                  <Button
                    onClick={handleDeselectAll}
                    size="xs"
                    variant="ghost"
                    colorPalette="gray"
                  >
                    None
                  </Button>
                </Flex>
              </Flex>

              <VStack align="stretch" gap={2}>
                {files.map((file, index) => {
                  const isSelected = selectedFiles.has(index);
                  const fileSize = (file.size / 1024).toFixed(1);

                  return (
                    <Flex
                      key={index}
                      p={{ base: 2, sm: 3 }}
                      bg={isSelected ? "blue.50" : "cardBg"}
                      _dark={{ bg: isSelected ? "blue.900/20" : "panelBg" }}
                      borderWidth="1px"
                      borderColor={isSelected ? "primary" : "border"}
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => handleToggleFile(index)}
                      _hover={{ 
                        bg: isSelected ? "blue.100" : "panelBg", 
                        _dark: { bg: isSelected ? "blue.900/30" : "gray.700" } 
                      }}
                      align="center"
                      gap={{ base: 2, sm: 3 }}
                      transition="all 0.2s"
                    >
                      <Checkbox.Root
                        checked={isSelected}
                        onCheckedChange={() => handleToggleFile(index)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                      
                      <Icon color="primary" boxSize={5}><PiFileFill /></Icon>
                      
                      <VStack align="flex-start" gap={0} flex={1} minW={0}>
                        <Text 
                          fontSize={{ base: "xs", sm: "sm" }} 
                          fontWeight={isSelected ? "600" : "500"}
                          color="text"
                          noOfLines={1}
                        >
                          {file.name}
                        </Text>
                        <Text fontSize="xs" color="textMuted">
                          {fileSize} KB
                        </Text>
                      </VStack>

                      <Tooltip content={isSelected ? "Deselect file" : "Select file"} showArrow>
                        <Icon
                          boxSize={4}
                          color={isSelected ? "blue.600" : "gray.500"}
                          _dark={{ color: isSelected ? "blue.400" : "gray.500" }}
                          cursor="help"
                        >
                          {isSelected ? <MdCheckCircle /> : <PiCircleFill />}
                        </Icon>
                      </Tooltip>
                    </Flex>
                  );
                })}
              </VStack>
            </Box>

            {/* Summary */}
            {selectedFiles.size > 0 && (
              <Box
                p={3}
                bg="green.50"
                _dark={{ bg: "green.900/30", borderColor: "green.700" }}
                borderRadius="md"
                borderWidth="1px"
                borderColor="green.200"
              >
                <Flex gap={2} wrap="wrap" fontSize={{ base: "xs", sm: "sm" }}>
                  <Badge colorPalette="green">
                    {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
                  </Badge>
                  <Badge colorPalette="blue">
                    Total: {(Array.from(selectedFiles).reduce((sum, idx) => sum + files[idx].size, 0) / 1024).toFixed(1)} KB
                  </Badge>
                </Flex>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Footer */}
        <Flex
          bg="#E2E8F0"
          _dark={{ bg: "#334155" }}
          borderTopWidth="1px"
          borderColor="border"
          p={{ base: 2, sm: 3 }}
          gap={{ base: 2, sm: 3 }}
          justify="flex-end"
          flexShrink={0}
        >
          <Button
            onClick={onClose}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            size={{ base: "sm", sm: "md" }}
            fontSize={{ base: "xs", sm: "sm" }}
            isDisabled={downloading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveFiles}
            bg="primary"
            color="white"
            _hover={{ bg: "primaryHover" }}
            size={{ base: "sm", sm: "md" }}
            fontSize={{ base: "xs", sm: "sm" }}
            isDisabled={selectedFiles.size === 0 || downloading}
            loading={downloading}
          >
            <Icon mr={1}><MdDownload /></Icon>
            {downloading ? 'Saving...' : 'Save Files'}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default DownloadFilesModal;
