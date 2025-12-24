import React, { useState } from 'react';
import { Box, VStack, Heading, Text, Button, Flex, HStack, IconButton, SimpleGrid, Icon, Input, Dialog, Portal } from '@chakra-ui/react';
import { MdClose, MdSettings, MdWarning, MdRocket, MdStars, MdSearch, MdEdit, MdDownload, MdContentCopy, MdPalette, MdLock, MdInfo, MdAdd } from 'react-icons/md';
import FileSelector from './FileSelector';
import YamlViewer from './YamlViewer';
import YamlEditorModal from './YamlEditorModal';
import Toast from './Toast';
import { processYamlFiles } from '../utils/yamlFileHandler';
import { getSetting } from '../utils/settingsManager';

const YamlUtility = ({ setBreadcrumbs, breadcrumbs }) => {
  const [selectedFiles, setSelectedFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('yaml-utility-files');
      if (saved) {
        const files = JSON.parse(saved);
        // Reconstruct Date objects for lastModified property
        return files.map(file => ({
          ...file,
          lastModified: new Date(file.lastModified)
        }));
      }
      return [];
    } catch (err) {
      console.error('Error loading saved files:', err);
      return [];
    }
  });
  const [error, setError] = useState(null);
  const [showViewer, setShowViewer] = useState(() => {
    try {
      const saved = localStorage.getItem('yaml-utility-viewer-open');
      const savedFiles = localStorage.getItem('yaml-utility-files');
      return saved === 'true' && savedFiles && JSON.parse(savedFiles).length > 0;
    } catch {
      return false;
    }
  });
  const [showNewFileEditor, setShowNewFileEditor] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showFileNameDialog, setShowFileNameDialog] = useState(false);
  const [fileNameInput, setFileNameInput] = useState('');
  const [fileNameError, setFileNameError] = useState('');
  const [showFileExistsDialog, setShowFileExistsDialog] = useState(false);
  const [existingFilePath, setExistingFilePath] = useState('');
  const [existingFileContent, setExistingFileContent] = useState('');
  const [toast, setToast] = useState(null);
  const existingFilePathRef = React.useRef('');
  const prevBreadcrumbsRef = React.useRef(breadcrumbs);

  // Save files to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('yaml-utility-files', JSON.stringify(selectedFiles));
      localStorage.setItem('yaml-utility-viewer-open', showViewer.toString());
    } catch (err) {
      console.error('Error saving files to localStorage:', err);
    }
  }, [selectedFiles, showViewer]);

  // Update breadcrumbs based on viewer state
  React.useEffect(() => {
    if (setBreadcrumbs) {
      if (showViewer) {
        setBreadcrumbs(['YAML Utility', 'File Viewer']);
      } else {
        setBreadcrumbs(['YAML Utility']);
      }
    }
  }, [showViewer, setBreadcrumbs]);

  // Reset viewer when navigating back via breadcrumb
  React.useEffect(() => {
    if (breadcrumbs && prevBreadcrumbsRef.current) {
      // Only reset if breadcrumbs were shortened from 2 to 1 (user clicked back)
      if (prevBreadcrumbsRef.current.length === 2 && breadcrumbs.length === 1 && 
          breadcrumbs[0] === 'YAML Utility' && showViewer) {
        setShowViewer(false);
      }
    }
    
    prevBreadcrumbsRef.current = breadcrumbs;
  }, [breadcrumbs, showViewer]);

  const handleFilesSelected = (files) => {
    setSelectedFiles(prevFiles => {
      // Create a map of existing files by name to avoid duplicates
      const existingFiles = new Map(prevFiles.map(file => [file.name, file]));
      
      // Add new files, replacing any with the same name
      files.forEach(file => {
        existingFiles.set(file.name, file);
      });
      
      const result = Array.from(existingFiles.values());
      
      // Force immediate save to localStorage
      try {
        localStorage.setItem('yaml-utility-files', JSON.stringify(result));
        localStorage.setItem('yaml-utility-viewer-open', 'true');
      } catch (err) {
        console.error('Error in force save:', err);
      }
      
      return result;
    });
    setShowViewer(true);
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setSelectedFiles([]);
    setShowViewer(false);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    setShowViewer(false);
    setError(null);
    // Clear localStorage
    try {
      localStorage.removeItem('yaml-utility-files');
      localStorage.removeItem('yaml-utility-viewer-open');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  const handleLoadMoreFiles = (callback) => {
    // Create a temporary file input
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.yaml,.yml';
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      
      try {
        const processedFiles = await processYamlFiles(files);
        // Use the existing handleFilesSelected to properly merge and save
        handleFilesSelected(processedFiles);
        // Also call the callback for YamlViewer compatibility
        callback(processedFiles);
      } catch (error) {
        console.error('Error processing additional files:', error);
        alert('Error loading additional files. Please try again.');
      }
    };
    
    input.click();
  };

  const handleCreateNewFile = () => {
    // Reset all file-related state for a fresh start
    setExistingFilePath('');
    setExistingFileContent('');
    setNewFileName('');
    existingFilePathRef.current = '';
    
    const defaultPath = getSetting('files.defaultPath', '');
    if (!defaultPath) {
      alert('Please set a default file path in Settings before creating new files.');
      return;
    }
    
    setFileNameInput('config-new.yaml');
    setFileNameError('');
    setShowFileNameDialog(true);
  };

  const validateAndOpenEditor = async () => {
    const trimmedName = fileNameInput.trim();
    
    if (!trimmedName) {
      setFileNameError('Filename cannot be empty');
      return;
    }

    // Ensure .yaml extension
    let finalName = trimmedName;
    if (!finalName.endsWith('.yaml') && !finalName.endsWith('.yml')) {
      finalName = `${finalName}.yaml`;
    }

    // Validate naming convention
    const isValidName = finalName === 'config.yaml' || 
                       (finalName.startsWith('config-') && finalName.endsWith('.yaml'));
    
    if (!isValidName) {
      setFileNameError('Filename must be "config.yaml" or start with "config-" and end with ".yaml"');
      return;
    }

    // Check if file already exists
    const defaultPath = getSetting('files.defaultPath', '');
    const filePath = `${defaultPath}/${finalName}`;
    
    try {
      const response = await fetch('/api/check-file-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      
      const result = await response.json();
      
      if (result.exists) {
        // File already exists, show conflict dialog
        console.log('[YamlUtility] File exists, showing conflict dialog. Path:', filePath);
        setExistingFilePath(filePath);
        existingFilePathRef.current = filePath;
        setNewFileName(finalName);
        setExistingFileContent(''); // Reset content
        setShowFileExistsDialog(true);
        return;
      }
    } catch (error) {
      console.error('Error checking file existence:', error);
    }

    // All validations passed and file doesn't exist, open editor for new file
    setNewFileName(finalName);
    setShowFileNameDialog(false);
    setShowNewFileEditor(true);
  };

  const handleSaveNewFile = async (apiResult) => {
    try {
      console.log('handleSaveNewFile called with:', apiResult);
      
      if (apiResult && apiResult.success) {
        // Use the content from the editor directly (no need to re-read the file)
        if (!apiResult.content) {
          console.error('No content in API result');
          alert('File was saved but content is missing. Please reload it manually.');
          setShowNewFileEditor(false);
          setNewFileName('');
          return;
        }
        
        // Create a file object and add it to the file list
        const newFile = {
          name: newFileName,
          size: new Blob([apiResult.content]).size,
          lastModified: new Date(),
          content: apiResult.content
        };

        handleFilesSelected([newFile]);
        setShowNewFileEditor(false);
        setNewFileName('');
      } else {
        throw new Error('Save failed or returned no result');
      }
    } catch (error) {
      console.error('Error in handleSaveNewFile:', error);
      alert('File was saved but could not be added to viewer. Please reload it manually.');
      setShowNewFileEditor(false);
      setNewFileName('');
    }
  };

  const handleCloseNewFileEditor = () => {
    setShowNewFileEditor(false);
    setNewFileName('');
    setExistingFileContent('');
    setExistingFilePath('');
    existingFilePathRef.current = '';
  };

  const handleOpenExistingFile = async () => {
    console.log('[YamlUtility] handleOpenExistingFile called');
    console.log('[YamlUtility] existingFilePathRef.current:', existingFilePathRef.current);
    console.log('[YamlUtility] existingFilePath state:', existingFilePath);
    
    setShowFileExistsDialog(false);
    setShowFileNameDialog(false);
    
    const filePathToLoad = existingFilePathRef.current;
    console.log('[YamlUtility] Loading existing file:', filePathToLoad);
    
    if (!filePathToLoad) {
      console.error('[YamlUtility] No file path to load');
      setToast({ message: 'File path is missing', type: 'error' });
      return;
    }
    
    // Fetch the existing file content
    try {
      const response = await fetch('/api/file-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePathToLoad })
      });
      
      const result = await response.json();
      console.log('[YamlUtility] Fetch result:', result);
      
      if (result.content) {
        // Store the existing file content and open editor (not a new file)
        setExistingFileContent(result.content);
        setShowNewFileEditor(true);
      } else {
        setToast({ message: 'Failed to load existing file', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading existing file:', error);
      setToast({ message: 'Failed to load existing file', type: 'error' });
    }
  };

  const handleChooseDifferentName = () => {
    setShowFileExistsDialog(false);
    setExistingFilePath('');
    setExistingFileContent('');
    setNewFileName('');
    existingFilePathRef.current = '';
    // Keep filename dialog open so user can enter different name
  };

  const handleCancelFileCreation = () => {
    setShowFileExistsDialog(false);
    setShowFileNameDialog(false);
    setFileNameInput('config-new.yaml');
    setFileNameError('');
    setExistingFilePath('');
    setExistingFileContent('');
    existingFilePathRef.current = '';
  };

  return (
    <Box p={6} minH="100vh" bg="bg">
      <VStack align="stretch" gap={6} maxW="1200px" mx="auto">
        <Flex justify="space-between" align="center" gap={4} wrap="wrap">
          <HStack gap={2}>
            <Icon as={MdSettings} boxSize={6} color="primary" />
            <Heading as="h2" size="lg" color="text">
              YAML Config File Utility
            </Heading>
          </HStack>
          {!showViewer && (
            <Button
              onClick={handleCreateNewFile}
              colorPalette="blue"
              size={{ base: "sm", sm: "md" }}
              leftIcon={<MdAdd />}
            >
              Create New File
            </Button>
          )}
        </Flex>
        <Text color="textMuted" mt={-4}>
          Upload and view your Strava configuration YAML files. This tool helps you inspect 
          config files that start with "config" and have .yaml or .yml extensions.
        </Text>

        {error && (
          <Flex
            p={4}
            bg="red.50"
            borderRadius="md"
            border="1px solid"
            borderColor="red.200"
            align="center"
            gap={3}
            _dark={{ bg: "red.900", borderColor: "red.700" }}
          >
            <Icon as={MdWarning} boxSize={5} color="red.600" _dark={{ color: "red.300" }} />
            <Box flex={1}>
              <Text color="red.800" _dark={{ color: "red.100" }}>
                <Text as="span" fontWeight="bold">Error:</Text> {error}
              </Text>
            </Box>
            <IconButton
              onClick={() => setError(null)}
              aria-label="Close error"
              size="sm"
              variant="ghost"
              colorPalette="red"
            >
              <MdClose />
            </IconButton>
          </Flex>
        )}

        {!showViewer && (
          <FileSelector 
            onFilesSelected={handleFilesSelected}
            onError={handleError}
          />
        )}

        {showViewer && selectedFiles.length > 0 && (
          <YamlViewer 
            files={selectedFiles}
            onClose={handleCloseViewer}
            onClearFiles={handleClearFiles}
            onLoadMoreFiles={handleLoadMoreFiles}
            onFilesUpdated={setSelectedFiles}
          />
        )}

        {selectedFiles.length === 0 && !showViewer && (
          <VStack align="stretch" gap={6}>
            <Box p={6} bg="cardBg" borderRadius="md" border="1px solid" borderColor="border">
              <VStack align="stretch" gap={4}>
                <HStack gap={2}>
                  <Icon as={MdRocket} boxSize={5} color="primary" />
                  <Heading as="h3" size="md" color="text">
                    Getting Started
                  </Heading>
                </HStack>
                <VStack align="stretch" gap={4}>
                  <Flex align="start" gap={4}>
                    <Flex
                      minW="40px"
                      h="40px"
                      align="center"
                      justify="center"
                      bg="primary"
                      color="white"
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      1
                    </Flex>
                    <Box flex={1}>
                      <Heading as="h4" size="sm" color="text" mb={1}>
                        Select Files
                      </Heading>
                      <Text color="textMuted" fontSize="sm">
                        Choose config YAML files from your local directory
                      </Text>
                    </Box>
                  </Flex>
                  <Flex align="start" gap={4}>
                    <Flex
                      minW="40px"
                      h="40px"
                      align="center"
                      justify="center"
                      bg="primary"
                      color="white"
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      2
                    </Flex>
                    <Box flex={1}>
                      <Heading as="h4" size="sm" color="text" mb={1}>
                        View Content
                      </Heading>
                      <Text color="textMuted" fontSize="sm">
                        Inspect the YAML content with syntax validation
                      </Text>
                    </Box>
                  </Flex>
                  <Flex align="start" gap={4}>
                    <Flex
                      minW="40px"
                      h="40px"
                      align="center"
                      justify="center"
                      bg="primary"
                      color="white"
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      3
                    </Flex>
                    <Box flex={1}>
                      <Heading as="h4" size="sm" color="text" mb={1}>
                        Search & Export
                      </Heading>
                      <Text color="textMuted" fontSize="sm">
                        Search within files and download individual configs
                      </Text>
                    </Box>
                  </Flex>
                </VStack>
              </VStack>
            </Box>
            
            <Box p={6} bg="cardBg" borderRadius="md" border="1px solid" borderColor="border">
              <HStack gap={2} mb={4}>
                <Icon as={MdStars} boxSize={5} color="primary" />
                <Heading as="h4" size="sm" color="text">
                  Features
                </Heading>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                <HStack align="start" gap={2}>
                  <Icon as={MdSearch} boxSize={4} color="primary" mt={0.5} />
                  <Text color="textMuted" fontSize="sm">Multi-file support with tabbed interface</Text>
                </HStack>
                <HStack align="start" gap={2}>
                  <Icon as={MdEdit} boxSize={4} color="primary" mt={0.5} />
                  <Text color="textMuted" fontSize="sm">Real-time YAML validation</Text>
                </HStack>
                <HStack align="start" gap={2}>
                  <Icon as={MdSearch} boxSize={4} color="primary" mt={0.5} />
                  <Text color="textMuted" fontSize="sm">Content search functionality</Text>
                </HStack>
                <HStack align="start" gap={2}>
                  <Icon as={MdDownload} boxSize={4} color="primary" mt={0.5} />
                  <Text color="textMuted" fontSize="sm">Download individual files</Text>
                </HStack>
                <HStack align="start" gap={2}>
                  <Icon as={MdContentCopy} boxSize={4} color="primary" mt={0.5} />
                  <Text color="textMuted" fontSize="sm">Copy to clipboard</Text>
                </HStack>
                <HStack align="start" gap={2}>
                  <Icon as={MdPalette} boxSize={4} color="primary" mt={0.5} />
                  <Text color="textMuted" fontSize="sm">Responsive design</Text>
                </HStack>
                <HStack align="start" gap={2}>
                  <Icon as={MdLock} boxSize={4} color="primary" mt={0.5} />
                  <Text color="textMuted" fontSize="sm">Secure local processing</Text>
                </HStack>
              </SimpleGrid>
            </Box>
          </VStack>
        )}
      </VStack>

      {/* Filename Dialog */}
      <Dialog.Root 
        open={showFileNameDialog} 
        onOpenChange={(e) => !e.open && setShowFileNameDialog(false)}
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.700" />
          <Dialog.Positioner>
            <Dialog.Content
              maxW="500px"
              borderRadius="lg"
              boxShadow="xl"
              bg="cardBg"
            >
              <Dialog.Header
                bg="#E2E8F0"
                _dark={{ bg: "#334155" }}
                borderTopRadius="lg"
              >
                <Dialog.Title 
                  fontSize={{ base: "md", sm: "lg" }}
                  color="#1a202c"
                  _dark={{ color: "#f7fafc" }}
                >
                  Create New Configuration File
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body p={{ base: 4, sm: 6 }} bg="cardBg">
                <VStack align="stretch" gap={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" mb={2}>
                      Filename:
                    </Text>
                    <Input
                      value={fileNameInput}
                      onChange={(e) => {
                        setFileNameInput(e.target.value);
                        setFileNameError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          validateAndOpenEditor();
                        }
                      }}
                      placeholder="config-new.yaml"
                      bg="inputBg"
                      color="text"
                      autoFocus
                    />
                  </Box>
                  {fileNameError && (
                    <Text fontSize="xs" color="red.600" _dark={{ color: "red.400" }}>
                      {fileNameError}
                    </Text>
                  )}
                  <Box
                    p={3}
                    bg="blue.50"
                    _dark={{ bg: "blue.900/30", borderColor: "blue.700" }}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="blue.200"
                  >
                    <Text fontSize="xs" color="blue.700" _dark={{ color: "blue.300" }}>
                      <Text as="strong">Naming Convention:</Text><br />
                      • Use "config.yaml" for main configuration<br />
                      • Or start with "config-" for additional files<br />
                      • All files must end with ".yaml"<br />
                      <Text as="em" mt={1} display="block">Examples: config.yaml, config-athlete.yaml, config-webhooks.yaml</Text>
                    </Text>
                  </Box>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer
                gap={3}
                justify="flex-end"
                p={{ base: 3, sm: 4 }}
                bg="#E2E8F0"
                _dark={{ bg: "#334155" }}
                borderBottomRadius="lg"
              >
                <Dialog.ActionTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => setShowFileNameDialog(false)}
                    size={{ base: "sm", sm: "md" }}
                    fontSize={{ base: "xs", sm: "sm" }}
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="blue"
                  onClick={validateAndOpenEditor}
                  size={{ base: "sm", sm: "md" }}
                  fontSize={{ base: "xs", sm: "sm" }}
                >
                  Create File
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger
                asChild
                position="absolute"
                top={{ base: 2, sm: 3 }}
                right={{ base: 2, sm: 3 }}
              >
                <Button
                  variant="ghost"
                  size={{ base: "xs", sm: "sm" }}
                  minW={{ base: "28px", sm: "32px" }}
                  h={{ base: "28px", sm: "32px" }}
                  p={0}
                >
                  <MdClose />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* File Exists Conflict Dialog */}
      <Dialog.Root open={showFileExistsDialog} onOpenChange={(e) => setShowFileExistsDialog(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="500px" bg="cardBg">
              <Dialog.Header>
                <Dialog.Title color={{ base: '#1a202c', _dark: '#f7fafc' }}>File Already Exists</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body bg="cardBg">
                <VStack align="stretch" gap={4}>
                  <Text color={{ base: '#2d3748', _dark: '#e2e8f0' }}>
                    A file named <strong>{newFileName}</strong> already exists at this location.
                  </Text>
                  <Text color={{ base: '#2d3748', _dark: '#e2e8f0' }}>
                    You can edit this file on the Configuration page, or you can:
                  </Text>
                  <VStack align="stretch" gap={2} pl={4}>
                    <Text fontSize="sm" color={{ base: '#4a5568', _dark: '#cbd5e0' }}>
                      • Choose a different name for your new file
                    </Text>
                    <Text fontSize="sm" color={{ base: '#4a5568', _dark: '#cbd5e0' }}>
                      • Open the existing file for editing here
                    </Text>
                  </VStack>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer gap={3}>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" onClick={handleCancelFileCreation}>
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="blue" onClick={handleChooseDifferentName}>
                  Choose Different Name
                </Button>
                <Button colorPalette="green" onClick={handleOpenExistingFile}>
                  Open for Editing
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* New File Editor Modal */}
      <YamlEditorModal
        isOpen={showNewFileEditor}
        onClose={handleCloseNewFileEditor}
        fileName={newFileName}
        fileContent={existingFileContent || "# New YAML Configuration File\n# Add your configuration below\n\n"}
        filePath={existingFilePath || `${getSetting('files.defaultPath', '')}/${newFileName}`}
        onSave={handleSaveNewFile}
        isNewFile={!existingFileContent}
      />

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Box>
  );
};

export default YamlUtility;