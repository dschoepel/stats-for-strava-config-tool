import React, { useState, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef, memo } from 'react';
import { Box, VStack, HStack, Heading, Text, Button, Flex, Spinner, Code, IconButton, Table, Icon, Badge } from '@chakra-ui/react';
import { MdFolder, MdRefresh, MdClose, MdExpandMore, MdChevronRight, MdWarning, MdLightbulb, MdError, MdHelp, MdDescription, MdSettings, MdHome } from 'react-icons/md';
import { useToast } from '../../../src/hooks/useToast';
import FileViewerModal from '../../utilities/_components/FileViewerModal';
import YamlEditorModal from '../../utilities/_components/YamlEditorModal';
import ConfigFileGrid from '../../../src/components/config-files/ConfigFileGrid';
import SectionMappingTable from '../../../src/components/config-files/SectionMappingTable';
import ServerFolderBrowser from '../../utilities/_components/ServerFolderBrowser';
import EmptyStateWithDefaults from './EmptyStateWithDefaults';
import {
  listConfigFiles,
  scanConfigFiles,
  parseSections as parseSectionsService,
  validateSections as validateSectionsService,
  mergeConfig as mergeConfigService,
  readFile
} from '../../../src/services';
import { useSettings } from '../../../src/state/SettingsProvider';
import { useConfig } from '../../../src/state/ConfigProvider';

const ConfigFileList = forwardRef((props, ref) => {
  // Use contexts
  const { settings, hasHydrated: settingsHydrated } = useSettings();
  const { fileCache, updateFileCache, hasConfigInitialized, updateHasConfigInitialized, sectionToFileMap, updateSectionToFileMap } = useConfig();
  const [configFiles, setConfigFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [defaultPath, setDefaultPath] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFileName, setModalFileName] = useState('');
  const [modalFileContent, setModalFileContent] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [editorFileName, setEditorFileName] = useState('');
  const [editorFileContent, setEditorFileContent] = useState('');
  const [editorFilePath, setEditorFilePath] = useState('');
  const [isSectionMappingExpanded, setIsSectionMappingExpanded] = useState(false);
  const [missingSections, setMissingSections] = useState([]);
  const [validationStatus, setValidationStatus] = useState(null);
  const [isMerging, setIsMerging] = useState(false);

  const { showInfo, showWarning, showError, showSuccess } = useToast();

  // Memoize configuration mode calculation
  const configMode = useMemo(() => {
    if (!hasConfigInitialized) return null;
    if (validationStatus && !validationStatus.isComplete) return 'invalid';
    if (configFiles.length === 0) return null;
    if (configFiles.length === 1) return 'single-file';
    return 'multi-file';
  }, [hasConfigInitialized, validationStatus, configFiles.length]);

  // Validate that all required sections are present
  const validateSections = useCallback(async (mapping) => {
    try {
      const result = await validateSectionsService(Object.fromEntries(mapping || sectionToFileMap));

      if (result.success) {
        setValidationStatus(result);
        setMissingSections(result.missingSections || []);

        if (!result.isComplete) {
          showWarning(`Configuration incomplete: ${result.missingSections.length} section(s) missing`);
        }
      }
    } catch (error) {
      console.warn('Section validation failed:', error.message);
    }
  }, [sectionToFileMap, showWarning]);

  // Parse sections from loaded files
  const parseSections = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    try {
      const result = await parseSectionsService(files);

      if (result.success) {
        // Use detailed mapping instead of simple section mapping for full section info
        const mappingToUse = result.detailedMapping || result.sectionMapping;
        const newMapping = new Map(Object.entries(mappingToUse));
        updateSectionToFileMap(newMapping);
        
        if (result.conflicts.length > 0) {
          console.warn('Section conflicts detected:', result.conflicts);
          const conflictDetails = result.conflicts.map(c => 
            `${c.section} (${c.files.join(', ')})`
          ).join('; ');
          showWarning(`Duplicate sections found: ${conflictDetails}`);
        } else {
          showSuccess(`Mapped ${result.totalSections} configuration sections`);
        }
        
        // Validate sections after parsing
        await validateSections(newMapping);
      } else {
        console.warn('Failed to parse sections:', result.error);
      }
    } catch (error) {
      console.warn('Section parsing failed:', error.message);
    }
  }, [updateSectionToFileMap, showWarning, showSuccess, validateSections]);
  
  // scanDirectory function - needs to be defined before useImperativeHandle
  const scanDirectory = useCallback(async (dirPath, forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the current default path from settings
      const currentDefaultPath = settings.files?.defaultPath || '/data/statistics-for-strava/config/';
      
      // Check cache first if not forcing refresh
      if (!forceRefresh && fileCache.directory === dirPath && fileCache.files.length > 0 && fileCache.fileHashes.size > 0) {
        const result = await listConfigFiles(currentDefaultPath);
        
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
      
      const result = await scanConfigFiles(dirPath);
      
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
        updateFileCache({
          files: result.files,
          fileHashes: fileHashes,
          directory: result.directory
        });
        
        // Parse sections to build mapping (exclude gear-maintenance files)
        const filesToParse = result.files.filter(file => !file.isGearMaintenance);
        await parseSections(filesToParse);
        
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
  }, [fileCache, parseSections, showWarning, showError, showSuccess, updateFileCache, settings.files?.defaultPath]);
  
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
  const checkForFileChanges = useCallback(async () => {
    if (!selectedDirectory || fileCache.fileHashes.size === 0) {
      return;
    }
    
    try {
      // Get the current default path from settings
      const currentDefaultPath = settings.files?.defaultPath || '/data/statistics-for-strava/config/';
      const result = await listConfigFiles(currentDefaultPath);

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
  }, [selectedDirectory, fileCache.fileHashes, fileCache.files.length, settings.files?.defaultPath, showInfo, scanDirectory]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        showInfo('Checking default configuration directory...', 3000);
        
        // Get the default path from settings (from SettingsProvider)
        const currentDefaultPath = settings.files?.defaultPath || '/data/statistics-for-strava/config/';
        
        // Try to load files from default directory
        const result = await listConfigFiles(currentDefaultPath);
        
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
          updateFileCache({
            files: result.files,
            fileHashes: fileHashes,
            directory: result.directory
          });
          updateHasConfigInitialized(true);
          
          // Parse sections to build mapping (exclude gear-maintenance files)
          const filesToParse = result.files.filter(file => !file.isGearMaintenance);
          await parseSections(filesToParse);
          
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
          updateHasConfigInitialized(true);
        }
      } catch (error) {
        showError(`Failed to initialize: ${error.message}`);
        setError(`Initialization failed: ${error.message}`);
      }
    };

    // Only initialize if we haven't initialized yet AND settings are fully hydrated
    if (settingsHydrated && settings && !hasConfigInitialized) {
      initializeApp();
    } else if (hasConfigInitialized && fileCache.files.length > 0) {
      // Use cached data
      setConfigFiles(fileCache.files);
      setSelectedDirectory(fileCache.directory);
      setDefaultPath(fileCache.directory);
    }
  }, [settingsHydrated, hasConfigInitialized]);

  // Listen for settings changes and reload files if default path changed
  useEffect(() => {
    const handleSettingsChanged = async (event) => {
      const newSettings = event.detail;
      const newDefaultPath = newSettings.files?.defaultPath;
      
      // Check if the default path has changed
      if (newDefaultPath && newDefaultPath !== defaultPath) {
        console.log(`Default path changed from ${defaultPath} to ${newDefaultPath}, reloading files...`);
        showInfo('Default path changed, reloading configuration files...', 3000);
        
        // Reload files from new path
        try {
          const result = await listConfigFiles(newDefaultPath);
          
          if (result.success) {
            const fileHashes = new Map();
            result.files.forEach(file => {
              if (file.hash) {
                fileHashes.set(file.name, file.hash);
              }
            });
            
            setConfigFiles(result.files);
            setSelectedDirectory(result.directory);
            setDefaultPath(result.directory);
            updateFileCache({
              files: result.files,
              fileHashes: fileHashes,
              directory: result.directory
            });
            updateHasConfigInitialized(true);
            
            // Parse sections to build mapping (exclude gear-maintenance files)
            const filesToParse = result.files.filter(file => !file.isGearMaintenance);
            await parseSections(filesToParse);
            
            if (result.files.length === 0) {
              showWarning(`No config files found in new directory: ${result.directory}`);
            } else {
              showSuccess(`Loaded ${result.files.length} file${result.files.length > 1 ? 's' : ''} from new path: ${result.directory}`);
            }
          } else {
            showError(`Failed to load files from new path: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error reloading files after path change:', error);
          showError('Failed to reload configuration files from new path');
        }
      }
    };
    
    window.addEventListener('settingsChanged', handleSettingsChanged);
    
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChanged);
    };
  }, [defaultPath, showInfo, showSuccess, showWarning, showError, setConfigFiles, setSelectedDirectory, setDefaultPath, updateFileCache, updateHasConfigInitialized, parseSections]);

  // Merge all config files into a single config.yaml
  const handleMergeToSingleFile = useCallback(async () => {
    if (!configFiles || configFiles.length === 0) {
      showError('No config files to merge');
      return;
    }
    
    setIsMerging(true);
    try {
      showInfo('Creating complete configuration file...', 3000);
      
      const result = await mergeConfigService({
        files: configFiles.map(f => ({ name: f.name, path: f.path })),
        outputPath: `${selectedDirectory}/config.yaml`,
        createBackup: true,
        fillMissing: true  // Add missing sections with defaults
      });
      
      if (result.success) {
        showSuccess(`Created complete configuration with ${result.sectionsCount} sections`);
        if (result.backupPath) {
          showInfo(`Backup created: ${result.backupPath.split('\\').pop()}`, 5000);
        }
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            if (warning.includes('Added missing section')) {
              showInfo(warning, 3000);
            }
          });
        }
        // Refresh the file list and section mapping
        await scanDirectory(selectedDirectory, true);
      } else {
        showError(`Merge failed: ${result.error}`);
      }
    } catch (error) {
      showError(`Merge failed: ${error.message}`);
    } finally {
      setIsMerging(false);
    }
  }, [configFiles, selectedDirectory, showInfo, showSuccess, showError, scanDirectory]);

  const handleBrowseDirectory = useCallback(() => {
    setShowFolderBrowser(true);
  }, []);

  const handleFolderSelected = useCallback(async (folderPath) => {
    if (folderPath && folderPath.trim()) {
      showInfo(`Scanning directory: ${folderPath}`, 3000);
      await scanDirectory(folderPath.trim());
    }
  }, [showInfo, scanDirectory]);

  const handleRefreshFiles = useCallback(async () => {
    if (!selectedDirectory) return;

    showInfo('Refreshing files...', 2000);
    await scanDirectory(selectedDirectory, true); // Force refresh
  }, [selectedDirectory, showInfo, scanDirectory]);

  const handleViewFile = useCallback(async (fileInfo) => {
    try {
      showInfo(`Loading ${fileInfo.name}...`, 2000);

      const result = await readFile(fileInfo.path);
      
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
  }, [showInfo, showSuccess, showError]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setModalFileName('');
    setModalFileContent('');
  }, []);

  const handleEditFile = useCallback(async (fileInfo) => {
    try {
      showInfo(`Loading ${fileInfo.name} for editing...`, 2000);

      const result = await readFile(fileInfo.path);
      
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
  }, [showInfo, showSuccess, showError]);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditorFileName('');
    setEditorFileContent('');
    setEditorFilePath('');
  }, []);

  const handleSaveFile = useCallback(async () => {
    showSuccess(`${editorFileName} saved successfully`);
    // Refresh the file list to show updated file info
    await handleRefreshFiles();
    handleCloseEditor();
  }, [editorFileName, showSuccess, handleRefreshFiles, handleCloseEditor]);

  // Show loading state while settings are hydrating
  if (!settingsHydrated) {
    return (
      <Box p={6}>
        <VStack align="stretch" gap={6}>
          <Box>
            <Heading as="h3" size="lg" color="text" mb={2}>
              <Icon color="primary" mr={2}><MdHome /></Icon> Dashboard
            </Heading>
            <Flex align="center" gap={3} mt={4}>
              <Spinner size="sm" color="primary" />
              <Text color="textMuted">Loading settings...</Text>
            </Flex>
          </Box>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading as="h3" size="lg" color="text" mb={2}>
            <Icon color="primary" mr={2}><MdHome /></Icon> Dashboard
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
                   <><Icon color="text"><MdHelp /></Icon> Unknown</>}
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

        {validationStatus && !validationStatus.isComplete && missingSections.length > 0 && (
          <Box
            p={4}
            bg="orange.50"
            _dark={{ bg: 'orange.900/30' }}
            borderRadius="md"
            border="2px solid"
            borderColor="orange.400"
            boxShadow="sm"
          >
            <Flex align="flex-start" gap={3} mb={3}>
              <Icon fontSize="2xl" color="orange.500"><MdWarning /></Icon>
              <Box flex={1}>
                <Heading size="sm" color="orange.800" _dark={{ color: 'orange.200' }} mb={2}>
                  Configuration Incomplete
                </Heading>
                <Text color="orange.700" _dark={{ color: 'orange.300' }} fontSize="sm" mb={2}>
                  {missingSections.length} required section{missingSections.length > 1 ? 's are' : ' is'} missing from your configuration. 
                  Configuration editing is disabled until this is resolved.
                </Text>
                <Box
                  p={3}
                  bg="orange.100"
                  _dark={{ bg: 'orange.800/50' }}
                  borderRadius="md"
                  mb={3}
                >
                  <Text fontSize="sm" fontWeight="600" color="orange.900" _dark={{ color: 'orange.100' }} mb={2}>
                    Missing Sections:
                  </Text>
                  <Flex gap={2} flexWrap="wrap">
                    {missingSections.map(section => (
                      <Code
                        key={section}
                        px={2}
                        py={1}
                        bg="orange.200"
                        _dark={{ bg: 'orange.700', color: 'orange.100' }}
                        color="orange.900"
                        borderRadius="sm"
                        fontSize="sm"
                      >
                        {section}
                      </Code>
                    ))}
                  </Flex>
                </Box>
                <Text fontSize="sm" fontWeight="600" color="orange.800" _dark={{ color: 'orange.200' }} mb={2}>
                  Resolution Options:
                </Text>
                <VStack align="stretch" gap={2}>
                  <Button
                    size="sm"
                    onClick={handleMergeToSingleFile}
                    isLoading={isMerging}
                    loadingText="Merging..."
                    bg="orange.600"
                    color="white"
                    _hover={{ bg: "orange.700" }}
                  >
                    Option 1: Create Complete Single File Configuration
                  </Button>
                  <Text fontSize="xs" color="orange.600" _dark={{ color: 'orange.400' }} pl={2}>
                    Merges existing sections and fills in missing ones with defaults. Creates backup automatically.
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="orange"
                    onClick={() => showInfo('Use the sidebar menu to create individual section configurations', 5000)}
                  >
                    Option 2: Create Sections Individually
                  </Button>
                  <Text fontSize="xs" color="orange.600" _dark={{ color: 'orange.400' }} pl={2}>
                    Navigate to each missing section via the sidebar menu and configure individually.
                  </Text>
                </VStack>
              </Box>
            </Flex>
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
              <SectionMappingTable sectionToFileMap={sectionToFileMap} />
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
        <>
          <ConfigFileGrid
            files={configFiles}
            selectedDirectory={selectedDirectory}
            onView={handleViewFile}
            onEdit={handleEditFile}
          />
          
          {/* Show gear-maintenance card if it's not already present */}
          {!configFiles.some(f => f.isGearMaintenance) && (
            <Box
              mt={6}
              p={6}
              bg="cardBg"
              borderRadius="md"
              border="2px dashed"
              borderColor="border"
            >
              <VStack align="start" gap={4}>
                <HStack justify="space-between" w="full">
                  <HStack>
                    <Icon as={MdLightbulb} color="blue.400" boxSize={6} />
                    <VStack align="start" gap={1}>
                      <HStack>
                        <Text fontWeight="bold" fontSize="lg" color="text">
                          Optional: Gear Maintenance
                        </Text>
                        <Badge colorScheme="gray" fontSize="xs">
                          Optional
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="textMuted">
                        Track bike and gear maintenance schedules
                      </Text>
                    </VStack>
                  </HStack>
                </HStack>
                
                <Button
                  colorScheme="blue"
                  leftIcon={<Icon as={MdWarning} />}
                  size="sm"
                  onClick={async () => {
                    try {
                      const { defaultConfigService } = await import('../../../src/services/defaultConfigService');
                      const result = await defaultConfigService.pullDefaultConfig('gear-maintenance', selectedDirectory);
                      
                      if (result.success) {
                        showSuccess('✅ gear-maintenance.yaml created successfully');
                        await handleRefreshFiles();
                      } else {
                        showError(`Failed to create gear-maintenance.yaml: ${result.error}`);
                      }
                    } catch (error) {
                      showError(`Failed to create gear-maintenance.yaml: ${error.message}`);
                    }
                  }}
                >
                  Add gear-maintenance.yaml
                </Button>
                
                <Text
                  as="a"
                  href="https://statistics-for-strava-docs.robiningelbrecht.be/#/configuration/gear-maintenance"
                  target="_blank"
                  rel="noopener noreferrer"
                  fontSize="sm"
                  color="blue.400"
                  _hover={{ textDecoration: 'underline' }}
                >
                  View documentation →
                </Text>
              </VStack>
            </Box>
          )}
        </>
      )}

      {!isLoading && !error && configFiles.length === 0 && selectedDirectory && (
        <EmptyStateWithDefaults
          targetDirectory={selectedDirectory}
          onFileCreated={handleRefreshFiles}
        />
      )}
      
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

      <ServerFolderBrowser
        isOpen={showFolderBrowser}
        onClose={() => setShowFolderBrowser(false)}
        onFolderSelected={handleFolderSelected}
        initialPath={defaultPath}
      />
    </Box>
  );
});

ConfigFileList.displayName = 'ConfigFileList';

export default memo(ConfigFileList);