import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, VStack, Heading, Text, Button, Flex, HStack, Spinner, Icon } from '@chakra-ui/react';
import { MdFolder, MdDescription, MdInfo, MdLock } from 'react-icons/md';
import { processYamlFiles } from '../utils/yamlFileHandler';

const FileSelector = ({ onFilesSelected, onError }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) {
      return;
    }

    setIsProcessing(true);
    
    try {
      const processedFiles = await processYamlFiles(files);
      
      if (processedFiles.length === 0) {
        onError('No config YAML files found. Please select files that start with "config" and have .yaml or .yml extension.');
        return;
      }
      
      onFilesSelected(processedFiles);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (event) => {
    handleFileSelect(event.target.files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <VStack align="stretch" gap={4}>
      <HStack gap={2}>
        <Icon as={MdFolder} boxSize={5} color="primary" />
        <Heading as="h3" size="md" color="text">
          Select Config YAML Files
        </Heading>
      </HStack>
      <Text color="textMuted" fontSize="sm" mt={-2}>
        Choose one or more files that start with "config" and end with .yaml or .yml
      </Text>
      
      <Box
        p={8}
        bg="cardBg"
        border="2px dashed"
        borderColor={isDragOver ? "primary" : "border"}
        borderRadius="md"
        cursor="pointer"
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        textAlign="center"
        transition="all 0.2s"
        _hover={{ borderColor: "primary", bg: "panelBg" }}
        opacity={isProcessing ? 0.6 : 1}
        pointerEvents={isProcessing ? "none" : "auto"}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".yaml,.yml"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        
        {isProcessing ? (
          <VStack gap={3}>
            <Spinner size="xl" color="primary" />
            <Text color="text" fontWeight="medium">Processing files...</Text>
          </VStack>
        ) : (
          <VStack gap={4}>
            <Icon as={MdDescription} boxSize={16} color="primary" />
            <Heading as="h4" size="sm" color="text">
              Drop files here or click to select
            </Heading>
            <Text color="textMuted" fontSize="sm">
              Supports: config*.yaml, config*.yml files
            </Text>
            <Button
              type="button"
              bg="primary"
              color="white"
              _hover={{ bg: "primaryHover" }}
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              Select Files
            </Button>
          </VStack>
        )}
      </Box>
      
      <VStack align="stretch" gap={2}>
        <HStack gap={2}>
          <Icon as={MdInfo} boxSize={4} color="primary" />
          <Text color="textMuted" fontSize="sm">
            Only files starting with "config" will be processed
          </Text>
        </HStack>
        <HStack gap={2}>
          <Icon as={MdDescription} boxSize={4} color="primary" />
          <Text color="textMuted" fontSize="sm">
            YAML and YML extensions are supported
          </Text>
        </HStack>
        <HStack gap={2}>
          <Icon as={MdLock} boxSize={4} color="primary" />
          <Text color="textMuted" fontSize="sm">
            Files are processed locally in your browser
          </Text>
        </HStack>
      </VStack>
    </VStack>
  );
};

FileSelector.propTypes = {
  onFilesSelected: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired
};

export default FileSelector;