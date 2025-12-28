import React, { useState } from 'react';
import { Box, VStack, HStack, Flex, Heading, Text, Button, IconButton, Icon } from '@chakra-ui/react';
import { MdClose, MdFolder, MdDescription, MdDownload } from 'react-icons/md';
import { PiArrowsSplitFill, PiLinkSimpleHorizontalBold } from 'react-icons/pi';
import { formatFileSize } from '../utils/yamlFileHandler';
import CombineFilesModal from './CombineFilesModal';
import SplitConfigModal from './SplitConfigModal';
import DownloadFilesModal from './DownloadFilesModal';
import YamlEditorModal from './YamlEditorModal';
import MonacoYamlViewer from './MonacoYamlViewer';

const YamlViewer = ({ files, onClose, onClearFiles, onLoadMoreFiles, onFilesUpdated }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [showCombineModal, setShowCombineModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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

  const handleEditFile = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedContent) => {
    // Update the file content in memory
    const updatedFiles = [...allFiles];
    updatedFiles[selectedFileIndex] = {
      ...updatedFiles[selectedFileIndex],
      content: updatedContent,
      size: new Blob([updatedContent]).size
    };
    setAllFiles(updatedFiles);
    setShowEditModal(false);
    // Notify parent component to update
    if (onFilesUpdated) {
      onFilesUpdated(updatedFiles);
    }
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

  const handleSplitConfig = (splitFiles) => {
    // Add the split files to the list
    const updatedFiles = [...allFiles, ...splitFiles];
    setAllFiles(updatedFiles);
    // Select the first split file
    setSelectedFileIndex(allFiles.length);
    setShowSplitModal(false);
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
        p={{ base: 2, sm: 4 }}
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
        <Flex direction={{ base: "column", sm: "row" }} gap={{ base: 0.5, sm: 3 }} align={{ base: "flex-start", sm: "center" }}>
          <Heading as="h3" size={{ base: "xs", sm: "md" }} color="text" lineHeight="1.2" wordBreak="break-word" display="flex" alignItems="center" gap={1.5}>
            <Icon color="primary" boxSize={{ base: 4, sm: 5 }}><MdDescription /></Icon> 
            <Text display={{ base: "none", sm: "inline" }}>Config YAML Viewer</Text>
            <Text display={{ base: "inline", sm: "none" }}>YAML Viewer</Text>
          </Heading>
          <Text fontSize="2xs" color="textMuted">
            {allFiles.length} file{allFiles.length > 1 ? 's' : ''}
          </Text>
        </Flex>
        <Flex gap={{ base: 1, sm: 3 }} wrap="wrap" justify={{ base: "flex-start", sm: "flex-end" }} align="center">
          <Button
            onClick={handleLoadMoreFiles}
            title="Load additional YAML files"
            leftIcon={<MdFolder />}
            size={{ base: "xs", sm: "sm" }}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            _hover={{ bg: "primaryHover", color: "white" }}
            fontSize={{ base: "2xs", sm: "sm" }}
            px={{ base: 1.5, sm: 3 }}
            h={{ base: "24px", sm: "auto" }}
            minW={{ base: "auto", sm: "auto" }}
          >
            <Text display={{ base: "none", sm: "inline" }}>Load More</Text>
            <Text display={{ base: "inline", sm: "none" }}>Load</Text>
          </Button>
          <Button
            onClick={() => setShowDownloadModal(true)}
            title="Download selected files"
            size={{ base: "xs", sm: "sm" }}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            _hover={{ bg: "primaryHover", color: "white" }}
            fontSize={{ base: "2xs", sm: "sm" }}
            px={{ base: 1.5, sm: 3 }}
            h={{ base: "24px", sm: "auto" }}
            minW={{ base: "auto", sm: "auto" }}
          >
            <Icon fontSize={{ base: "xs", sm: "sm" }}><MdDownload /></Icon>
            <Text ml={0.5} display={{ base: "none", sm: "inline" }}>Download</Text>
          </Button>
          <Button
            onClick={() => setShowSplitModal(true)}
            title="Split config file into separate sections"
            size={{ base: "xs", sm: "sm" }}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            _hover={{ bg: "primaryHover", color: "white" }}
            fontSize={{ base: "2xs", sm: "sm" }}
            px={{ base: 1.5, sm: 3 }}
            h={{ base: "24px", sm: "auto" }}
            minW={{ base: "auto", sm: "auto" }}
          >
            <Icon fontSize={{ base: "xs", sm: "sm" }}><PiArrowsSplitFill /></Icon>
            <Text ml={0.5} display={{ base: "none", sm: "inline" }}>Split</Text>
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
              fontSize={{ base: "2xs", sm: "sm" }}
              px={{ base: 1.5, sm: 3 }}
              h={{ base: "24px", sm: "auto" }}
              minW={{ base: "auto", sm: "auto" }}
            >
              <Icon fontSize={{ base: "xs", sm: "sm" }}><PiLinkSimpleHorizontalBold /></Icon>
              <Text ml={0.5} display={{ base: "none", sm: "inline" }}>Combine</Text>
            </Button>
          )}
          <Button
            onClick={onClearFiles}
            size={{ base: "xs", sm: "sm" }}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            fontSize={{ base: "2xs", sm: "sm" }}
            px={{ base: 1.5, sm: 3 }}
            h={{ base: "24px", sm: "auto" }}
            minW={{ base: "auto", sm: "auto" }}
          >
            <Text display={{ base: "none", sm: "inline" }}>Clear All</Text>
            <Text display={{ base: "inline", sm: "none" }}>Clear</Text>
          </Button>
          <IconButton
            onClick={onClose}
            aria-label="Close viewer"
            size={{ base: "xs", sm: "sm" }}
            variant="ghost"
            colorPalette="gray"
            minW={{ base: "24px", sm: "auto" }}
            h={{ base: "24px", sm: "auto" }}
            p={{ base: 0.5, sm: 2 }}
            fontSize={{ base: "sm", sm: "md" }}
          >
            <MdClose />
          </IconButton>
        </Flex>
      </Flex>

      <Flex
        p={{ base: 1, sm: 2 }}
        bg="#E2E8F0"
        _dark={{ bg: "#334155" }}
        borderBottomWidth="1px"
        borderColor="border"
        overflowX="auto"
        gap={{ base: 1, sm: 2 }}
      >
        {allFiles.map((file, index) => (
          <Flex
            key={index}
            bg={selectedFileIndex === index ? "cardBg" : "transparent"}
            borderWidth="1px"
            borderColor={selectedFileIndex === index ? "primary" : "border"}
            borderRadius="md"
            px={{ base: 1.5, sm: 3 }}
            py={{ base: 1, sm: 2 }}
            cursor="pointer"
            onClick={() => setSelectedFileIndex(index)}
            position="relative"
            minW="fit-content"
            _hover={{ bg: "cardBg" }}
            transition="all 0.2s"
            align="center"
            gap={{ base: 1, sm: 2 }}
          >
            <VStack align="start" gap={0} flex={1}>
              <Flex align="center" gap={0.5}>
                {file.name.startsWith('combined_') && <Icon boxSize={{ base: 2.5, sm: 3 }} color="primary"><PiLinkSimpleHorizontalBold /></Icon>}
                <Text
                  fontSize="2xs"
                  fontWeight={selectedFileIndex === index ? "semibold" : "normal"}
                  color="text"
                  lineHeight="1.2"
                  wordBreak="break-word"
                  noOfLines={1}
                >
                  {file.name}
                </Text>
              </Flex>
              <Text fontSize="2xs" color="textMuted" lineHeight="1.2">
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
              size="2xs"
              variant="ghost"
              colorPalette="red"
              minW={{ base: "16px", sm: "auto" }}
              h={{ base: "16px", sm: "auto" }}
              p={{ base: 0, sm: 1 }}
              fontSize={{ base: "xs", sm: "sm" }}
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
          onEdit={handleEditFile}
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
      
      <SplitConfigModal
        file={currentFile}
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        onSplit={handleSplitConfig}
      />
      
      <DownloadFilesModal
        files={allFiles}
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />

      <YamlEditorModal
        fileName={currentFile.name}
        fileContent={currentFile.content}
        filePath={currentFile.path}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        skipValidation={true}
      />
    </VStack>
  );
};

export default YamlViewer;