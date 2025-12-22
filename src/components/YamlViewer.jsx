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
      borderWidth="1px"
      borderColor="border"
      overflow="hidden"
      h={{ base: "calc(100vh - 150px)", md: "calc(100vh - 200px)" }}
      shadows="md"
    >
      <Flex
        p={{ base: 3, sm: 4 }}
        bg="#E2E8F0"
        _dark={{ bg: "#334155" }}
        borderBottomWidth="1px"
        borderColor="border"
        align={{ base: "flex-start", sm: "center" }}
        justify="space-between"
        gap={{ base: 2, sm: 4 }}
        minH={{ base: "auto", sm: "60px" }}
        direction={{ base: "column", sm: "row" }}
      >
        <Flex direction={{ base: "column", sm: "row" }} gap={{ base: 1, sm: 3 }} align={{ base: "flex-start", sm: "center" }}>
          <Heading as="h3" size={{ base: "sm", sm: "md" }} color="text" lineHeight="1.2" wordBreak="break-word">
            📄 Config YAML Viewer
          </Heading>
          <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
            {allFiles.length} file{allFiles.length > 1 ? 's' : ''} loaded
          </Text>
        </Flex>
        <Flex gap={{ base: 1, sm: 3 }} wrap="wrap" justify={{ base: "flex-start", sm: "flex-end" }}>
          <Button
            onClick={handleLoadMoreFiles}
            title="Load additional YAML files"
            leftIcon={<MdFolder />}
            size={{ base: "xs", sm: "sm" }}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            _hover={{ bg: "primaryHover", color: "white" }}
            fontSize={{ base: "xs", sm: "sm" }}
            px={{ base: 2, sm: 3 }}
            h={{ base: "28px", sm: "auto" }}
          >
            Load More
          </Button>
          {allFiles.length > 1 && (
            <Button
              onClick={() => setShowCombineModal(true)}
              title="Combine multiple files into one"
              size={{ base: "xs", sm: "sm" }}
              variant="outline"
              colorPalette="gray"
              borderColor="border"
              _hover={{ bg: "primaryHover", color: "white" }}
              fontSize={{ base: "xs", sm: "sm" }}
              px={{ base: 2, sm: 3 }}
              h={{ base: "28px", sm: "auto" }}
            >
              🔗 Combine
            </Button>
          )}
          <Button
            onClick={onClearFiles}
            size={{ base: "xs", sm: "sm" }}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            px={{ base: 2, sm: 3 }}
            h={{ base: "28px", sm: "auto" }}
          >
            Clear All
          </Button>
          <IconButton
            onClick={onClose}
            aria-label="Close viewer"
            size={{ base: "xs", sm: "sm" }}
            variant="ghost"
            colorPalette="gray"
            minW={{ base: "28px", sm: "auto" }}
            h={{ base: "28px", sm: "auto" }}
            p={{ base: 1, sm: 2 }}
          >
            <MdClose />
          </IconButton>
        </Flex>
      </Flex>

      <Flex
        p={2}
        bg="#E2E8F0"
        _dark={{ bg: "#334155" }}
        borderBottomWidth="1px"
        borderColor="border"
        overflowX="auto"
        gap={2}
      >
        {allFiles.map((file, index) => (
          <Flex
            key={index}
            bg={selectedFileIndex === index ? "cardBg" : "transparent"}
            borderWidth="1px"
            borderColor={selectedFileIndex === index ? "primary" : "border"}
            borderRadius="md"
            px={{ base: 2, sm: 3 }}
            py={{ base: 1.5, sm: 2 }}
            cursor="pointer"
            onClick={() => setSelectedFileIndex(index)}
            position="relative"
            minW="fit-content"
            _hover={{ bg: "cardBg" }}
            transition="all 0.2s"
            align="center"
            gap={2}
          >
            <VStack align="start" gap={0} flex={1}>
              <Text
                fontSize={{ base: "xs", sm: "sm" }}
                fontWeight={selectedFileIndex === index ? "semibold" : "normal"}
                color="text"
                lineHeight="1.3"
                wordBreak="break-word"
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
              minW={{ base: "20px", sm: "auto" }}
              h={{ base: "20px", sm: "auto" }}
              p={{ base: 0.5, sm: 1 }}
            >
              <MdClose />
            </IconButton>
          </Flex>
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