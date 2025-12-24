import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, VStack, HStack, Heading, Text, Button, SimpleGrid, Flex, Spinner, Code, IconButton, Table, Icon } from '@chakra-ui/react';
import { MdFolder, MdRefresh, MdVisibility, MdEdit, MdClose, MdExpandMore, MdChevronRight, MdDescription, MdSettings, MdWarning, MdLightbulb, MdError } from 'react-icons/md';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import FileViewerModal from './FileViewerModal';
import YamlEditorModal from './YamlEditorModal';

const NextConfigFileList = forwardRef((props, ref) => {
  const { 
    fileCache, 
    setFileCache, 
    hasConfigInitialized, 
    setHasConfigInitialized,
    configMode,
    sectionToFileMap,
    setSectionToFileMap
  } = props;
  const [configFiles, setConfigFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [defaultPath, setDefaultPath] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFileName, setModalFileName] = useState('');
  const [modalFileContent, setModalFileContent] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorFileName, setEditorFileName] = useState('');
  const [editorFileContent, setEditorFileContent] = useState('');
  const [editorFilePath, setEditorFilePath] = useState('');
  const [isSectionMappingExpanded, setIsSectionMappingExpanded] = useState(false);

  const { toasts, removeToast, showInfo, showWarning, showError, showSuccess } = useToast();

  // Parse sections from loaded files
  const parseSections = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    try {
      const response = await fetch('/api/parse-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Use detailed mapping instead of simple section mapping for full section info
        const mappingToUse = result.detailedMapping || result.sectionMapping;
        const newMapping = new Map(Object.entries(mappingToUse));
        setSectionToFileMap(newMapping);
        
        console.log('Section mapping (using detailed):', mappingToUse);
        if (result.conflicts.length > 0) {
          console.warn('Section conflicts detected:', result.conflicts);
          const conflictDetails = result.conflicts.map(c => 
            `${c.section} (${c.files.join(', ')})`
          ).join('; ');
          showWarning(`Duplicate sections found: ${conflictDetails}`);
        } else {
          showSuccess(`Mapped ${result.totalSections} configuration sections`);
        }
      } else {
        console.warn('Failed to parse sections:', result.error);
      }
    } catch (error) {
      console.warn('Section parsing failed:', error.message);
    }
  }, [setSectionToFileMap, showWarning, showSuccess]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    checkForUpdates: async () => {
      if (!hasConfigInitialized || !selectedDirectory) {
        return;
      }
      await checkForFileChanges();
    },
    forceRefresh: async () => {
      if (!selectedDirectory) return;
      showInfo('Force refreshing files...', 2000);
      await scanDirectory(selectedDirectory, true);
    }
  }));

  // Check for file changes without full reload by comparing content hashes
  const checkForFileChanges = async () => {
    if (!selectedDirectory || fileCache.fileHashes.size === 0) {
      return;
    }
    
    try {
      const response = await fetch('/api/config-files');
      const result = await response.json();
      
      if (result.success && result.files.length > 0) {
        // Check if any files have different content hashes
        let hasChanges = false;
        
        // Check if file count changed
        if (result.files.length !== fileCache.files.length) {
          hasChanges = true;
        } else {
          // Compare content hashes for each file
          for (const file of result.files) {
            const cachedHash = fileCache.fileHashes.get(file.name);
            if (!cachedHash || cachedHash !== file.hash) {
              hasChanges = true;
              break;
            }
          }
        }
        
        if (hasChanges) {
          showInfo('File content changes detected, refreshing...', 2000);
          await scanDirectory(selectedDirectory, false);
        }
      }
    } catch (error) {
      // Silently fail for background checks
      console.warn('Background file check failed:', error.message);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        showInfo('Checking default configuration directory...', 3000);
        
        // Try to load files from default directory
        const response = await fetch('/api/config-files');
        const result = await response.json();
        
        if (result.success) {
          // Create hash map for quick lookup
          const fileHashes = new Map();
          result.files.forEach(file => {
            if (file.hash) {
              fileHashes.set(file.name, file.hash);
            }
          });
            
          setConfigFiles(result.files);
          setSelectedDirectory(result.directory);
          setDefaultPath(result.directory);
          setFileCache({
            files: result.files,
            fileHashes: fileHashes,
            directory: result.directory
          });
          setHasConfigInitialized(true);
          
          // Parse sections to build mapping
          await parseSections(result.files);
          
          if (result.files.length === 0) {
            showWarning(`Default directory found but no config files present: ${result.directory}`);
            setError('No configuration files found in the default directory.');
          } else {
            showSuccess(`Automatically loaded ${result.files.length} file${result.files.length > 1 ? 's' : ''} from: ${result.directory}`);
          }
        } else {
          setDefaultPath(result.directory || 'Not configured');
          showWarning(`Default directory not accessible: ${result.directory}. Use "Browse Directory" to select another location.`);
          setError(result.error);
          setHasConfigInitialized(true);
        }
      } catch (error) {
        showError(`Failed to initialize: ${error.message}`);
        setError(`Initialization failed: ${error.message}`);
      }
    };

    // Only initialize if we don't have cached data and haven't initialized yet
    if (!hasConfigInitialized || fileCache.files.length === 0) {
      initializeApp();
    } else {
      // Use cached data
      console.log('Using cached configuration data');
      setConfigFiles(fileCache.files);
      setSelectedDirectory(fileCache.directory);
      setDefaultPath(fileCache.directory);
    }
  }, [showInfo, showWarning, showError, showSuccess, hasConfigInitialized, fileCache, parseSections, setFileCache, setHasConfigInitialized]);



  const scanDirectory = async (dirPath, forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first if not forcing refresh
      if (!forceRefresh && fileCache.directory === dirPath && fileCache.files.length > 0 && fileCache.fileHashes.size > 0) {
        const response = await fetch('/api/config-files');
        const result = await response.json();
        
        if (result.success && result.files.length > 0) {
          // Compare file content hashes
          let hasChanges = false;
          
          // Check if file count changed
          if (result.files.length !== fileCache.files.length) {
            hasChanges = true;
          } else {
            // Compare hashes for each file
            for (const file of result.files) {
              const cachedHash = fileCache.fileHashes.get(file.name);
              if (!cachedHash || cachedHash !== file.hash) {
                hasChanges = true;
                break;
              }
            }
          }
          
          if (!hasChanges) {
            // No content changes detected, use cached data
            setConfigFiles(fileCache.files);
            setSelectedDirectory(fileCache.directory);
            setIsLoading(false);
            return;
          }
        }
      }
      
      const response = await fetch('/api/config-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ directory: dirPath }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Create hash map for quick lookup
        const fileHashes = new Map();
        result.files.forEach(file => {
          if (file.hash) {
            fileHashes.set(file.name, file.hash);
          }
        });
          
        setConfigFiles(result.files);
        setSelectedDirectory(result.directory);
        setFileCache({
          files: result.files,
          fileHashes: fileHashes,
          directory: result.directory
        });
        
        // Parse sections to build mapping
        await parseSections(result.files);
        
        if (result.files.length === 0) {
          showWarning('No configuration files found. Looking for config.yaml and config-*.yaml files.');
          setError('No configuration files found in the selected directory.');
        } else {
          showSuccess(`Found ${result.files.length} configuration file${result.files.length > 1 ? 's' : ''}`);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showError(`Failed to scan directory: ${error.message}`);
      setError(`Failed to scan directory: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseDirectory = async () => {
    const directoryPath = prompt('Enter the full path to your configuration directory:', defaultPath || '/home/user/Documents/config');
    
    if (directoryPath && directoryPath.trim()) {
      showInfo(`Scanning directory: ${directoryPath}`, 3000);
      await scanDirectory(directoryPath.trim());
    }
  };

  const handleRefreshFiles = async () => {
    if (!selectedDirectory) return;
    
    showInfo('Refreshing files...', 2000);
    await scanDirectory(selectedDirectory, true); // Force refresh
  };

  const handleViewFile = async (fileInfo) => {
    try {
      showInfo(`Loading ${fileInfo.name}...`, 2000);
      
      const response = await fetch(`/api/file-content?path=${encodeURIComponent(fileInfo.path)}`);
      const result = await response.json();
      
      if (result.success) {
        setModalFileName(fileInfo.name);
        setModalFileContent(result.content);
        setIsModalOpen(true);
        showSuccess(`${fileInfo.name} loaded successfully`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showError(`Failed to load file: ${error.message}`);
      setError(`Failed to load file: ${error.message}`);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalFileName('');
    setModalFileContent('');
  };

  const handleEditFile = async (fileInfo) => {
    try {
      showInfo(`Loading ${fileInfo.name} for editing...`, 2000);
      
      const response = await fetch(`/api/file-content?path=${encodeURIComponent(fileInfo.path)}`);
      const result = await response.json();
      
      if (result.success) {
        setEditorFileName(fileInfo.name);
        setEditorFileContent(result.content);
        setEditorFilePath(fileInfo.path);
        setIsEditorOpen(true);
        showSuccess(`${fileInfo.name} loaded in editor`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showError(`Failed to load file: ${error.message}`);
    }
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditorFileName('');
    setEditorFileContent('');
    setEditorFilePath('');
  };

  const handleSaveFile = async () => {
    showSuccess(`${editorFileName} saved successfully`);
    // Refresh the file list to show updated file info
    await handleRefreshFiles();
    handleCloseEditor();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading as="h3" size="lg" color="text" mb={2}>
            <Icon color="primary" mr={2}><MdFolder /></Icon> Configuration Files
          </Heading>
          <Text color="textMuted">
            Server-side file system access to Stats for Strava configuration files from:{' '}
            <Code bg="panelBg" px={2} py={1} borderRadius="md" color="text">
              {defaultPath || 'Loading...'}
            </Code>
          </Text>
        </Box>

        {configMode && (
          <Box
            p={4}
            bg="cardBg"
            borderRadius="md"
            border="1px solid"
            borderColor="border"
            boxShadow="sm"
          >
            <Flex align="center" gap={3} mb={configMode === 'single-file' || configMode === 'multi-file' ? 2 : 0}>
              <Icon color="primary"><MdSettings /></Icon>
              <Text fontWeight="semibold" color="text">Configuration Mode</Text>
              <Box
                px={3}
                py={1}
                borderRadius="full"
                bg={
                  configMode === 'single-file' ? 'blue.100' :
                  configMode === 'multi-file' ? 'green.100' :
                  configMode === 'invalid' ? 'red.100' :
                  'gray.100'
                }
                color={
                  configMode === 'single-file' ? 'blue.800' :
                  configMode === 'multi-file' ? 'green.800' :
                  configMode === 'invalid' ? 'red.800' :
                  'gray.800'
                }
                fontSize="sm"
                fontWeight="medium"
              >
                <Flex align="center" gap={1}>
                  {configMode === 'single-file' ? <><Icon><MdDescription /></Icon> Single File</> : 
                   configMode === 'multi-file' ? <><Icon><MdFolder /></Icon> Multi-File</> : 
                   configMode === 'invalid' ? <><Icon color="red.500"><MdError /></Icon> Invalid</> :
                   '❓ Unknown'}
                </Flex>
              </Box>
            </Flex>
            {configMode === 'single-file' && (
              <Text color="textMuted" fontSize="sm">
                All configuration sections managed in a single config.yaml file
              </Text>
            )}
            {configMode === 'multi-file' && (
              <Text color="textMuted" fontSize="sm">
                Configuration distributed across multiple specialized files with config.yaml as the base
              </Text>
            )}
            {configMode === 'invalid' && (
              <Text color="red.500" fontSize="sm">
                Missing required config.yaml file - configuration editing is disabled
              </Text>
            )}
          </Box>
        )}

        {sectionToFileMap && sectionToFileMap.size > 0 && (
          <Box
            bg="cardBg"
            borderRadius="md"
            border="1px solid"
            borderColor="border"
            boxShadow="sm"
          >
            <Flex
              as="button"
              w="full"
              p={4}
              align="center"
              gap={3}
              cursor="pointer"
              onClick={() => setIsSectionMappingExpanded(!isSectionMappingExpanded)}
              _hover={{ bg: "primaryHover", color: "white" }}
              transition="background 0.2s"
            >
              <Icon color="text"><MdDescription /></Icon>
              <Text fontWeight="semibold" color="text" flex={1} textAlign="left">
                Section Mapping
              </Text>
              <Text color="textMuted" fontSize="sm">
                ({sectionToFileMap.size} sections)
              </Text>
              <Box as={isSectionMappingExpanded ? MdExpandMore : MdChevronRight} fontSize="20px" color="text" />
            </Flex>
            {isSectionMappingExpanded && (
              <Box p={4} pt={0} overflowX="auto">
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row bg="tableHeaderBg">
                      <Table.ColumnHeader color="tableHeaderText" fontWeight="bold">Section</Table.ColumnHeader>
                      <Table.ColumnHeader color="tableHeaderText" fontWeight="bold">File(s)</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {Array.from(sectionToFileMap.entries()).map(([section, fileInfo]) => {
                      // Check if this is an array (multiple files)
                      const isMultiple = Array.isArray(fileInfo);
                      const files = isMultiple ? fileInfo : [fileInfo];
                      
                      return (
                        <Table.Row key={section}>
                          <Table.Cell fontWeight="medium" color="text">{section}</Table.Cell>
                          <Table.Cell color={isMultiple ? "orange.600" : "textMuted"} _dark={{ color: isMultiple ? "orange.400" : "textMuted" }}>
                            {files.map((f, idx) => (
                              <Box key={idx}>
                                {isMultiple && <Icon color="orange.500" mr={1}><MdWarning /></Icon>}
                                {typeof f === 'string' ? f : f.fileName}
                              </Box>
                            ))}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>
        )}
      </VStack>

      <HStack mt={6} mb={3} gap={3}>
        <Button
          leftIcon={<MdFolder />}
          onClick={handleBrowseDirectory}
          bg="primary"
          color="white"
          _hover={{ bg: "primaryHover" }}
          isDisabled={isLoading}
        >
          Browse Directory
        </Button>
        
        {selectedDirectory && (
          <Button
            leftIcon={<MdRefresh />}
            onClick={handleRefreshFiles}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            _hover={{ bg: "primaryHover", color: "white" }}
            isDisabled={isLoading}
          >
            Refresh Files
          </Button>
        )}
      </HStack>

      {error && (
        <Box
          p={4}
          bg={error.includes('not found') ? 'blue.50' : 'red.50'}
          borderRadius="md"
          border="1px solid"
          borderColor={error.includes('not found') ? 'blue.200' : 'red.200'}
        >
          <Flex align="center" gap={3}>
            <Icon fontSize="2xl" color={error.includes('not found') ? 'blue.500' : 'red.500'}>
              {error.includes('not found') ? <MdLightbulb /> : <MdError />}
            </Icon>
            <Text color={error.includes('not found') ? 'blue.800' : 'red.800'} flex={1}>
              {error}
            </Text>
            <IconButton
              onClick={() => setError(null)}
              aria-label="Close error"
              size="sm"
              variant="ghost"
              colorPalette="gray"
            >
              <MdClose />
            </IconButton>
          </Flex>
        </Box>
      )}

      {isLoading && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={4}
          p={8}
          bg="cardBg"
          borderRadius="md"
          border="1px solid"
          borderColor="border"
        >
          <Spinner size="xl" color="primary" />
          <Text color="textMuted">Scanning for configuration files...</Text>
        </Flex>
      )}

      {configFiles.length > 0 && (
        <Box>
          <Flex align="center" gap={2} mb={4} flexWrap="wrap">
            <Heading as="h4" size="md" color="text">
              Found {configFiles.length} configuration file{configFiles.length > 1 ? 's' : ''} in directory:
            </Heading>
            <Code bg="panelBg" px={2} py={1} borderRadius="md" color="text" fontSize="sm">
              {selectedDirectory}
            </Code>
          </Flex>
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {configFiles.map((file, index) => (
              <Box
                key={index}
                p={4}
                bg="cardBg"
                borderRadius="md"
                border="2px solid"
                borderColor={file.isMainConfig ? "primary" : "border"}
                boxShadow="sm"
                transition="all 0.2s"
                _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
              >
                <VStack align="stretch" gap={3}>
                  <Flex align="center" justify="space-between">
                    <Text fontSize="lg" color={file.isMainConfig ? 'primary' : 'text'}>
                      <Icon>{file.isMainConfig ? <MdSettings /> : <MdDescription />}</Icon>
                    </Text>
                    {file.isMainConfig && (
                      <Box
                        px={2}
                        py={1}
                        bg="primary"
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                        borderRadius="md"
                      >
                        Primary Config
                      </Box>
                    )}
                  </Flex>
                  
                  <Box>
                    <Text fontWeight="bold" color="text" fontSize="md" mb={1}>
                      {file.name}
                    </Text>
                    <HStack gap={3} fontSize="xs" color="textMuted">
                      <Text>{formatFileSize(file.size)}</Text>
                      <Text>•</Text>
                      <Text>{formatDate(file.lastModified)}</Text>
                    </HStack>
                  </Box>
                  
                  <HStack gap={2}>
                    <Button
                      leftIcon={<MdVisibility />}
                      onClick={() => handleViewFile(file)}
                      size="sm"
                      variant="outline"
                      colorPalette="gray"
                      borderColor="border"
                      flex={1}
                      _hover={{ bg: "primaryHover", color: "white" }}
                    >
                      View
                    </Button>
                    <Button
                      leftIcon={<MdEdit />}
                      onClick={() => handleEditFile(file)}
                      size="sm"
                      bg="primary"
                      color="white"
                      flex={1}
                      _hover={{ bg: "primaryHover" }}
                    >
                      Edit
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {!isLoading && !error && configFiles.length === 0 && selectedDirectory && (
        <Box
          p={8}
          bg="cardBg"
          borderRadius="md"
          border="1px solid"
          borderColor="border"
          textAlign="center"
        >
          <VStack gap={4}>
            <Text fontSize="4xl">📭</Text>
            <Box>
              <Heading as="h4" size="md" color="text" mb={2}>
                No Configuration Files Found
              </Heading>
              <Text color="textMuted" mb={3}>
                No files matching the pattern were found in the selected directory.
              </Text>
              <Text color="textMuted" fontWeight="semibold" mb={2}>
                Looking for:
              </Text>
              <VStack align="center" gap={1}>
                <Code bg="panelBg" px={2} py={1} borderRadius="md" color="text">config.yaml</Code>
                <Text color="textMuted" fontSize="sm">(main configuration)</Text>
                <Code bg="panelBg" px={2} py={1} borderRadius="md" color="text">config-*.yaml</Code>
                <Text color="textMuted" fontSize="sm">(additional configurations)</Text>
              </VStack>
            </Box>
          </VStack>
        </Box>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <FileViewerModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        fileName={modalFileName}
        fileContent={modalFileContent}
      />

      <YamlEditorModal
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        fileName={editorFileName}
        fileContent={editorFileContent}
        filePath={editorFilePath}
        onSave={handleSaveFile}
      />
    </Box>
  );
});

NextConfigFileList.displayName = 'NextConfigFileList';

export default NextConfigFileList;