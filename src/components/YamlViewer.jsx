import React, { useState } from 'react';
import { Box, VStack, HStack, Flex, Heading, Text, Button, IconButton } from '@chakra-ui/react';
import { MdClose, MdFolder } from 'react-icons/md';
import { formatFileSize } from '../utils/yamlFileHandler';
import CombineFilesModal from './CombineFilesModal';
import MonacoYamlViewer from './MonacoYamlViewer';

const YamlViewer = ({ files, onClose, onClearFiles, onLoadMoreFiles, onFilesUpdated }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [showCombineModal, setShowCombineModal] = useState(false);
  const [allFiles, setAllFiles] = useState(files);

  // Sync allFiles with files prop when it changes
  React.useEffect(() => {
    setAllFiles(files);
  }, [files]);

  if (!allFiles || allFiles.length === 0) {
    return null;
  }

  const currentFile = allFiles[selectedFileIndex];
  
  // Custom download and copy handlers for the current file
  const handleDownloadFile = () => {
    handleDownload(currentFile);
  };

  const handleCopyFile = async () => {
    await copyToClipboard(currentFile.content);
  };



  const handleDownload = (file) => {
    const blob = new Blob([file.content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleCombineFiles = (combinedFile) => {
    // Add the combined file to the list and select it
    const updatedFiles = [...allFiles, combinedFile];
    setAllFiles(updatedFiles);
    setSelectedFileIndex(updatedFiles.length - 1);
    setShowCombineModal(false);
    // Notify parent component to update and save to localStorage
    if (onFilesUpdated) {
      onFilesUpdated(updatedFiles);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    const updatedFiles = allFiles.filter((_, index) => index !== indexToRemove);
    setAllFiles(updatedFiles);
    // Notify parent component to update and save to localStorage
    if (onFilesUpdated) {
      onFilesUpdated(updatedFiles);
    }
    
    // Adjust selected index if necessary
    if (selectedFileIndex >= indexToRemove && selectedFileIndex > 0) {
      setSelectedFileIndex(selectedFileIndex - 1);
    } else if (updatedFiles.length === 0) {
      onClose();
    } else if (selectedFileIndex >= updatedFiles.length) {
      setSelectedFileIndex(updatedFiles.length - 1);
    }
  };

  const handleLoadMoreFiles = () => {
    onLoadMoreFiles(() => {
      // Don't update local state here - the parent will update via props
      // This prevents double-adding and state sync issues
    });
  };

  return (
    <VStack
      align="stretch"
      gap={0}
      bg="cardBg"
      borderRadius="md"
      border="1px solid"
      borderColor="border"
      overflow="hidden"
      h="calc(100vh - 200px)"
    >
      <Flex
        p={4}
        bg="panelBg"
        borderBottom="1px solid"
        borderColor="border"
        align="center"
        justify="space-between"
        gap={4}
        minH="60px"
      >
        <HStack gap={3}>
          <Heading as="h3" size="md" color="text">
            📄 Config YAML Viewer
          </Heading>
          <Text fontSize="sm" color="textMuted">
            {allFiles.length} file{allFiles.length > 1 ? 's' : ''} loaded
          </Text>
        </HStack>
        <HStack gap={3}>
          <Button
            onClick={handleLoadMoreFiles}
            title="Load additional YAML files"
            leftIcon={<MdFolder />}
            size="sm"
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            _hover={{ bg: "primaryHover", color: "white" }}
          >
            Load More
          </Button>
          {allFiles.length > 1 && (
            <Button
              onClick={() => setShowCombineModal(true)}
              title="Combine multiple files into one"
              size="sm"
              variant="outline"
              colorPalette="gray"
              borderColor="border"
              _hover={{ bg: "primaryHover", color: "white" }}
            >
              🔗 Combine Files
            </Button>
          )}
          <Button
            onClick={onClearFiles}
            size="sm"
            variant="outline"
            colorPalette="gray"
            borderColor="border"
          >
            Clear All
          </Button>
          <IconButton
            onClick={onClose}
            aria-label="Close viewer"
            size="sm"
            variant="ghost"
            colorPalette="gray"
          >
            <MdClose />
          </IconButton>
        </HStack>
      </Flex>

      <Flex
        p={2}
        bg="panelBg"
        borderBottom="1px solid"
        borderColor="border"
        overflowX="auto"
        gap={2}
      >
        {allFiles.map((file, index) => (
          <HStack
            key={index}
            bg={selectedFileIndex === index ? "cardBg" : "transparent"}
            border="1px solid"
            borderColor={selectedFileIndex === index ? "primary" : "border"}
            borderRadius="md"
            px={3}
            py={2}
            cursor="pointer"
            onClick={() => setSelectedFileIndex(index)}
            position="relative"
            minW="fit-content"
            _hover={{ bg: "cardBg" }}
            transition="all 0.2s"
          >
            <VStack align="start" gap={0} flex={1}>
              <Text
                fontSize="sm"
                fontWeight={selectedFileIndex === index ? "semibold" : "normal"}
                color="text"
              >
                {file.name.startsWith('combined_') ? '🔗 ' : ''}{file.name}
              </Text>
              <Text fontSize="xs" color="textMuted">
                ({formatFileSize(file.size)})
              </Text>
            </VStack>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile(index);
              }}
              aria-label={`Remove ${file.name}`}
              title={`Remove ${file.name}`}
              size="xs"
              variant="ghost"
              colorPalette="red"
            >
              <MdClose />
            </IconButton>
          </HStack>
        ))}
      </Flex>

      <Box flex={1} overflow="hidden">
        <MonacoYamlViewer
          fileName={currentFile.name}
          fileContent={currentFile.content}
          fileSize={currentFile.size}
          lastModified={currentFile.lastModified}
          showFileInfo={true}
          showActions={true}
          onDownload={handleDownloadFile}
          onCopy={handleCopyFile}
          className="page-viewer"
          height="100%"
        />
      </Box>
      
      <CombineFilesModal
        files={allFiles}
        isOpen={showCombineModal}
        onClose={() => setShowCombineModal(false)}
        onCombine={handleCombineFiles}
      />
    </VStack>
  );
};

export default YamlViewer;