import React, { useState } from 'react';
import { Box, VStack, Heading, Text, Button, Flex, HStack, IconButton, SimpleGrid, Icon } from '@chakra-ui/react';
import { MdClose, MdSettings, MdWarning, MdRocket, MdStars, MdSearch, MdEdit, MdDownload, MdContentCopy, MdPalette, MdLock, MdInfo } from 'react-icons/md';
import FileSelector from './FileSelector';
import YamlViewer from './YamlViewer';
import { processYamlFiles } from '../utils/yamlFileHandler';

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

  return (
    <Box p={6} minH="100vh" bg="bg">
      <VStack align="stretch" gap={6} maxW="1200px" mx="auto">
        <HStack gap={2}>
          <Icon as={MdSettings} boxSize={6} color="primary" />
          <Heading as="h2" size="lg" color="text">
            YAML Config File Utility
          </Heading>
        </HStack>
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
    </Box>
  );
};

export default YamlUtility;