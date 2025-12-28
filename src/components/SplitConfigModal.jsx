import React, { useState, useMemo } from 'react';
import { Box, Flex, VStack, Heading, Text, Button, IconButton, Badge, Checkbox, Icon } from '@chakra-ui/react';
import { MdClose, MdInfo, MdCheckCircle } from 'react-icons/md';
import { 
  PiArrowsSplitFill, 
  PiGearSixFill, 
  PiPaletteFill, 
  PiDownloadFill, 
  PiChartLineFill, 
  PiBicycleFill, 
  PiGameControllerFill, 
  PiLinkSimpleHorizontalBold, 
  PiClockFill, 
  PiUserFill,
  PiFileFill,
  PiListChecksFill,
  PiCircleFill
} from 'react-icons/pi';
import { Tooltip } from './Tooltip';
import { splitConfigFile } from '../utils/configSplitter';

const SplitConfigModal = ({ file, isOpen, onClose, onSplit }) => {
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState(null);

  // Analyze the file to determine split structure
  const splitAnalysis = useMemo(() => {
    if (!file || !file.content) return null;
    
    try {
      // Parse YAML to analyze structure
      const lines = file.content.split('\n');
      const sections = new Map();
      let currentTopKey = null;
      let currentIndent = 0;
      
      lines.forEach(line => {
        // Match top-level YAML keys (not indented)
        const topMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
        if (topMatch) {
          currentTopKey = topMatch[1];
          sections.set(currentTopKey, { secondLevel: [] });
          currentIndent = 0;
          return;
        }
        
        // Match second-level keys (indented)
        if (currentTopKey) {
          const secondMatch = line.match(/^(\s+)([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
          if (secondMatch) {
            const indent = secondMatch[1].length;
            const key = secondMatch[2];
            
            if (currentIndent === 0 || indent === currentIndent) {
              currentIndent = indent;
              sections.get(currentTopKey).secondLevel.push(key);
            }
          }
        }
      });
      
      return sections;
    } catch (err) {
      console.error('Error analyzing file:', err);
      return null;
    }
  }, [file]);

  // Preview what files will be created
  const filePreview = useMemo(() => {
    if (!splitAnalysis) return [];
    
    const preview = [];
    
    for (const [topKey, data] of splitAnalysis.entries()) {
      const topFileName = topKey === 'general' ? 'config.yaml' : `config-${topKey}.yaml`;
      
      // Check if this section has complex 2nd-level keys
      const hasMultipleComplex = data.secondLevel.length > 1;
      const hasComplexAndSimple = data.secondLevel.length >= 1;
      
      if (!hasMultipleComplex && !hasComplexAndSimple) {
        // Simple section - one file
        preview.push({
          fileName: topFileName,
          topKey,
          secondKey: null,
          description: `Full ${topKey} section`
        });
      } else {
        // Will be split - parent file + children
        const firstSecondKey = data.secondLevel[0];
        preview.push({
          fileName: topFileName,
          topKey,
          secondKey: firstSecondKey,
          description: `${topKey} (simple keys + ${firstSecondKey})`
        });
        
        // Additional split files
        for (let i = 1; i < data.secondLevel.length; i++) {
          const secondKey = data.secondLevel[i];
          preview.push({
            fileName: `config-${topKey}-${secondKey}.yaml`,
            topKey,
            secondKey,
            description: `${topKey}.${secondKey}`
          });
        }
      }
    }
    
    return preview;
  }, [splitAnalysis]);

  // Section metadata for display
  const sectionMetadata = {
    general: { icon: PiGearSixFill, color: 'blue' },
    appearance: { icon: PiPaletteFill, color: 'purple' },
    import: { icon: PiDownloadFill, color: 'green' },
    metrics: { icon: PiChartLineFill, color: 'orange' },
    gear: { icon: PiBicycleFill, color: 'cyan' },
    zwift: { icon: PiGameControllerFill, color: 'pink' },
    integrations: { icon: PiLinkSimpleHorizontalBold, color: 'teal' },
    daemon: { icon: PiClockFill, color: 'red' },
    athlete: { icon: PiUserFill, color: 'blue' }
  };

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !file) return null;

  const handleSplit = async () => {
    setSplitting(true);
    setError(null);

    try {
      const result = await splitConfigFile(file.content);
      
      if (!result.success) {
        setError(result.error || 'Failed to split configuration file');
        setSplitting(false);
        return;
      }

      if (result.files.length === 0) {
        setError('No files generated. The config may be empty or invalid.');
        setSplitting(false);
        return;
      }

      // Convert to file objects with proper structure
      const splitFiles = result.files.map(splitFile => ({
        name: splitFile.fileName,
        content: splitFile.content,
        size: new Blob([splitFile.content]).size,
        lastModified: new Date(),
        sections: splitFile.sections
      }));

      // Notify parent component
      onSplit(splitFiles);
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error splitting config:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSplitting(false);
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
        maxW={{ base: "100vw", md: "700px" }}
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
              <Icon color="primary" boxSize={5}><PiArrowsSplitFill /></Icon> Split Config File
            </Heading>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
              Split {file.name} into separate section files
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
            {/* Info Box */}
            <Box
              p={{ base: 3, sm: 4 }}
              bg="blue.50"
              _dark={{ bg: "blue.900/30", borderColor: "blue.700" }}
              borderRadius="md"
              borderWidth="1px"
              borderColor="blue.200"
            >
              <Flex align="start" gap={2}>
                <MdInfo size={20} color="var(--chakra-colors-blue-600)" />
                <VStack align="stretch" gap={2} flex={1}>
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="blue.700" _dark={{ color: "blue.300" }} fontWeight="600">
                    Smart Split with 2nd-Level Analysis:
                  </Text>
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="blue.700" _dark={{ color: "blue.300" }}>
                    • Analyzes nested structure to determine optimal splits<br />
                    • Complex 2nd-level sections are split into separate files<br />
                    • First complex section stays with parent + simple keys<br />
                    • Original file remains unchanged<br />
                    • Headers with mapping tables are automatically generated
                  </Text>
                </VStack>
              </Flex>
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

            {/* File Preview */}
            <Box>
              <Heading size={{ base: "sm", sm: "md" }} mb={3} lineHeight="1.2" display="flex" alignItems="center" gap={2}>
                <Icon color="primary" boxSize={4}><PiListChecksFill /></Icon> Files to be Created
              </Heading>

              {!splitAnalysis || filePreview.length === 0 ? (
                <Box
                  p={4}
                  bg="gray.50"
                  _dark={{ bg: "gray.800" }}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="border"
                >
                  <Text color="textMuted" fontSize="sm">
                    No sections detected in this file. Make sure the file has valid YAML structure.
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" gap={2}>
                  {filePreview.map((preview, index) => {
                    const metadata = sectionMetadata[preview.topKey] || { 
                      icon: PiFileFill, 
                      color: 'gray' 
                    };

                    return (
                      <Flex
                        key={index}
                        p={{ base: 2, sm: 3 }}
                        bg="cardBg"
                        borderWidth="1px"
                        borderColor="border"
                        borderRadius="md"
                        align="center"
                        gap={{ base: 2, sm: 3 }}
                      >
                        <Icon color="primary" boxSize={5}>{React.createElement(metadata.icon)}</Icon>
                        
                        <VStack align="flex-start" gap={0} flex={1} minW={0}>
                          <Flex align="center" gap={2} wrap="wrap">
                            <Badge 
                              colorPalette={metadata.color}
                              fontSize={{ base: "xs", sm: "sm" }}
                              fontWeight="600"
                            >
                              {preview.fileName}
                            </Badge>
                          </Flex>
                          <Text fontSize="xs" color="textMuted">
                            {preview.description}
                          </Text>
                        </VStack>

                        <Icon boxSize={4} color="green.600" _dark={{ color: "green.400" }}>
                          <MdCheckCircle />
                        </Icon>
                      </Flex>
                    );
                  })}
                </VStack>
              )}
            </Box>

            {/* Summary */}
            {filePreview.length > 0 && (
              <Box>
                <Heading size={{ base: "sm", sm: "md" }} mb={2} lineHeight="1.2" display="flex" alignItems="center" gap={2}>
                  <Icon color="primary" boxSize={4}><PiChartLineFill /></Icon> Split Summary
                </Heading>
                <Flex gap={2} wrap="wrap" fontSize={{ base: "xs", sm: "sm" }}>
                  <Badge colorPalette="blue">
                    Files: {filePreview.length}
                  </Badge>
                  <Badge colorPalette="green">
                    Sections: {splitAnalysis?.size || 0}
                  </Badge>
                  <Badge colorPalette="purple">
                    Original: {file.name}
                  </Badge>
                </Flex>
                <Text fontSize="xs" color="textMuted" mt={2}>
                  Split files will be added to your current file list
                </Text>
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
            isDisabled={splitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSplit}
            bg="primary"
            color="white"
            _hover={{ bg: "primaryHover" }}
            size={{ base: "sm", sm: "md" }}
            fontSize={{ base: "xs", sm: "sm" }}
            isDisabled={!filePreview || filePreview.length === 0 || splitting}
            loading={splitting}
          >
            <Icon mr={1}><PiArrowsSplitFill /></Icon>
            {splitting ? 'Splitting...' : 'Split Config'}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SplitConfigModal;
