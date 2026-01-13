import React, { useState, useMemo } from 'react';
import { Box, Flex, VStack, Heading, Text, Button, IconButton, Badge, Icon, Input, Field, Stack, RadioCard, Collapsible } from '@chakra-ui/react';
import { Checkbox } from '@chakra-ui/react';
import { MdClose, MdInfo, MdCheckCircle, MdWarning, MdExpandMore, MdExpandLess } from 'react-icons/md';
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
import { Tooltip } from '../../_components/ui/Tooltip';
import { splitConfigFile } from '../../../src/utils/configSplitter';

const SplitConfigModal = ({ file, isOpen, onClose, onSplit }) => {
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState(null);
  const [splitConfig, setSplitConfig] = useState({});
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [remainingDestination, setRemainingDestination] = useState('original');
  const [customFileName, setCustomFileName] = useState('config-remaining.yaml');

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

  // Preview what files will be created with hierarchical structure
  const hierarchicalPreview = useMemo(() => {
    if (!splitAnalysis) return [];
    
    const hierarchy = [];
    
    for (const [topKey, data] of splitAnalysis.entries()) {
      const topFileName = topKey === 'general' ? 'config.yaml' : `config-${topKey}.yaml`;
      
      // Check if this section has complex 2nd-level keys
      const hasComplexKeys = data.secondLevel.length > 0;
      
      const topLevelItem = {
        id: topKey,
        topKey,
        fileName: topFileName,
        hasChildren: hasComplexKeys,
        secondLevelKeys: [],
        description: hasComplexKeys 
          ? `${topKey} section with ${data.secondLevel.length} complex subsection${data.secondLevel.length > 1 ? 's' : ''}`
          : `Full ${topKey} section`
      };
      
      // Add second-level keys if they exist
      if (hasComplexKeys) {
        data.secondLevel.forEach((secondKey, index) => {
          topLevelItem.secondLevelKeys.push({
            id: `${topKey}.${secondKey}`,
            topKey,
            secondKey,
            fileName: `config-${topKey}-${secondKey}.yaml`,
            isFirst: index === 0,
            description: `${topKey}.${secondKey} subsection`
          });
        });
      }
      
      hierarchy.push(topLevelItem);
    }
    
    return hierarchy;
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
    if (isOpen && hierarchicalPreview.length > 0) {
      setError(null);
      
      // Initialize split configuration - all top-level selected, first child kept with parent, rest split
      const initialConfig = {};
      hierarchicalPreview.forEach(item => {
        initialConfig[item.topKey] = {
          selected: true,
          secondLevel: {}
        };
        
        item.secondLevelKeys.forEach((child, index) => {
          initialConfig[item.topKey].secondLevel[child.secondKey] = {
            split: index > 0 // First child stays with parent by default, others split
          };
        });
      });
      
      setSplitConfig(initialConfig);
      
      // Expand all sections by default
      setExpandedSections(new Set(hierarchicalPreview.map(item => item.topKey)));
      
      setRemainingDestination('original');
      setCustomFileName('config-remaining.yaml');
    }
  }, [isOpen, hierarchicalPreview]);

  // Calculate statistics
  const selectedTopLevelCount = Object.values(splitConfig).filter(c => c.selected).length;
  const totalTopLevelCount = hierarchicalPreview.length;
  const unselectedCount = totalTopLevelCount - selectedTopLevelCount;
  const hasUnselected = unselectedCount > 0;

  // Calculate how many files will be created
  const filesCount = useMemo(() => {
    let count = 0;
    hierarchicalPreview.forEach(item => {
      const config = splitConfig[item.topKey];
      if (config?.selected) {
        count++; // Parent file
        item.secondLevelKeys.forEach(child => {
          if (config.secondLevel[child.secondKey]?.split) {
            count++; // Split child file
          }
        });
      }
    });
    return count;
  }, [hierarchicalPreview, splitConfig]);

  // Toggle section expansion
  const toggleSection = (topKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(topKey)) {
      newExpanded.delete(topKey);
    } else {
      newExpanded.add(topKey);
    }
    setExpandedSections(newExpanded);
  };

  // Toggle top-level section selection
  const toggleTopLevel = (topKey) => {
    setSplitConfig(prev => ({
      ...prev,
      [topKey]: {
        ...prev[topKey],
        selected: !prev[topKey]?.selected
      }
    }));
  };

  // Toggle second-level split
  const toggleSecondLevelSplit = (topKey, secondKey) => {
    setSplitConfig(prev => ({
      ...prev,
      [topKey]: {
        ...prev[topKey],
        secondLevel: {
          ...prev[topKey]?.secondLevel,
          [secondKey]: {
            split: !prev[topKey]?.secondLevel?.[secondKey]?.split
          }
        }
      }
    }));
  };

  // Select/deselect all
  const handleSelectAll = () => {
    const newConfig = {};
    hierarchicalPreview.forEach(item => {
      newConfig[item.topKey] = {
        selected: true,
        secondLevel: {}
      };
      item.secondLevelKeys.forEach((child, index) => {
        newConfig[item.topKey].secondLevel[child.secondKey] = {
          split: index > 0
        };
      });
    });
    setSplitConfig(newConfig);
  };

  const handleSelectNone = () => {
    const newConfig = {};
    hierarchicalPreview.forEach(item => {
      newConfig[item.topKey] = {
        selected: false,
        secondLevel: {}
      };
      item.secondLevelKeys.forEach((child, index) => {
        newConfig[item.topKey].secondLevel[child.secondKey] = {
          split: index > 0
        };
      });
    });
    setSplitConfig(newConfig);
  };

  // Get list of selected files (for merge dropdown)
  const selectedFilesList = hierarchicalPreview
    .filter(item => splitConfig[item.topKey]?.selected)
    .map(item => ({ fileName: item.fileName }));

  if (!isOpen || !file) return null;

  const handleSplit = async () => {
    // Validate selection
    if (selectedTopLevelCount === 0) {
      setError('Please select at least one section to split');
      return;
    }

    // Validate remaining destination if needed
    if (hasUnselected) {
      if (remainingDestination === 'custom' && !customFileName.trim()) {
        setError('Please enter a filename for remaining sections');
        return;
      }
      if (remainingDestination === 'merge' && selectedTopLevelCount === 0) {
        setError('Please select at least one section to merge remaining sections into');
        return;
      }
    }

    setSplitting(true);
    setError(null);

    try {
      // Build configuration for split based on hierarchical selection
      const splitConfiguration = {
        sections: {},
        remainingConfig: hasUnselected ? {
          destination: remainingDestination,
          customFileName: remainingDestination === 'custom' ? customFileName : null,
          mergeIntoFile: remainingDestination === 'merge' ? selectedFilesList[0]?.fileName : null
        } : null
      };

      // Build the sections configuration
      hierarchicalPreview.forEach(item => {
        const config = splitConfig[item.topKey];
        if (config?.selected) {
          splitConfiguration.sections[item.topKey] = {
            include: true,
            secondLevel: {}
          };
          
          item.secondLevelKeys.forEach(child => {
            splitConfiguration.sections[item.topKey].secondLevel[child.secondKey] = {
              split: config.secondLevel[child.secondKey]?.split || false
            };
          });
        } else {
          splitConfiguration.sections[item.topKey] = {
            include: false
          };
        }
      });

      const result = await splitConfigFile(file.content, splitConfiguration);
      
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

            {/* File Preview with Hierarchical Structure */}
            <Box>
              <Flex 
                justify="space-between" 
                align={{ base: "flex-start", sm: "center" }} 
                mb={3}
                direction={{ base: "column", sm: "row" }}
                gap={{ base: 2, sm: 0 }}
              >
                <Heading size={{ base: "sm", sm: "md" }} lineHeight="1.2" display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Flex align="center" gap={2}>
                    <Icon color="primary" boxSize={4}><PiListChecksFill /></Icon> 
                    <Text>Sections to Split</Text>
                  </Flex>
                  <Badge colorPalette="blue" fontSize="xs">
                    {selectedTopLevelCount} of {totalTopLevelCount}
                  </Badge>
                  <Badge colorPalette="green" fontSize="xs">
                    {filesCount} file{filesCount !== 1 ? 's' : ''}
                  </Badge>
                </Heading>
                <Flex gap={2}>
                  <Button
                    onClick={handleSelectAll}
                    size="xs"
                    variant="ghost"
                    colorPalette="blue"
                    isDisabled={selectedTopLevelCount === totalTopLevelCount}
                    fontSize="xs"
                    px={2}
                  >
                    Select All
                  </Button>
                  <Button
                    onClick={handleSelectNone}
                    size="xs"
                    variant="ghost"
                    colorPalette="gray"
                    isDisabled={selectedTopLevelCount === 0}
                    fontSize="xs"
                    px={2}
                  >
                    Deselect
                  </Button>
                </Flex>
              </Flex>

              {!splitAnalysis || hierarchicalPreview.length === 0 ? (
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
                  {hierarchicalPreview.map((item) => {
                    const metadata = sectionMetadata[item.topKey] || { 
                      icon: PiFileFill, 
                      color: 'gray' 
                    };
                    const isSelected = splitConfig[item.topKey]?.selected;
                    const isExpanded = expandedSections.has(item.topKey);
                    const hasChildren = item.secondLevelKeys.length > 0;

                    return (
                      <Box key={item.topKey}>
                        {/* Top-level Section */}
                        <Flex
                          p={{ base: 2, sm: 3 }}
                          bg={isSelected ? "blue.50" : "gray.50"}
                          _dark={{ bg: isSelected ? "blue.900/20" : "gray.800" }}
                          borderWidth="1px"
                          borderColor={isSelected ? "blue.300" : "gray.300"}
                          _dark={{ borderColor: isSelected ? "blue.700" : "gray.700" }}
                          borderRadius="md"
                          align="center"
                          gap={{ base: 2, sm: 3 }}
                          opacity={isSelected ? 1 : 0.6}
                          transition="all 0.2s"
                          cursor="pointer"
                          onClick={() => toggleTopLevel(item.topKey)}
                          _hover={{ opacity: 1, borderColor: "primary" }}
                        >
                          <Checkbox.Root
                            checked={isSelected}
                            onCheckedChange={() => toggleTopLevel(item.topKey)}
                            onClick={(e) => e.stopPropagation()}
                            colorPalette="blue"
                            size={{ base: "sm", sm: "md" }}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                          
                          <Icon 
                            color="primary" 
                            boxSize={{ base: 4, sm: 5 }} 
                            display={{ base: "none", xs: "block" }}
                          >
                            {React.createElement(metadata.icon)}
                          </Icon>
                          
                          <VStack align="flex-start" gap={0} flex={1} minW={0}>
                            <Flex align="center" gap={2} wrap="wrap">
                              <Badge 
                                colorPalette={metadata.color}
                                fontSize="2xs"
                                fontWeight="600"
                              >
                                {item.fileName}
                              </Badge>
                              {hasChildren && (
                                <Badge colorPalette="gray" fontSize="2xs">
                                  {item.secondLevelKeys.length} subsection{item.secondLevelKeys.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </Flex>
                            <Text fontSize="2xs" color="textMuted" noOfLines={1}>
                              {item.description}
                            </Text>
                          </VStack>

                          {hasChildren && (
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection(item.topKey);
                              }}
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                              size="xs"
                              variant="ghost"
                              colorPalette="gray"
                            >
                              {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                            </IconButton>
                          )}

                          {isSelected && !hasChildren && (
                            <Icon boxSize={{ base: 3.5, sm: 4 }} color="green.600" _dark={{ color: "green.400" }} flexShrink={0}>
                              <MdCheckCircle />
                            </Icon>
                          )}
                        </Flex>

                        {/* Second-level Keys (collapsible) */}
                        {hasChildren && isExpanded && (
                          <Box mt={2} ml={{ base: 4, sm: 6 }} pl={3} borderLeftWidth="2px" borderColor="gray.300" _dark={{ borderColor: "gray.700" }}>
                            <VStack align="stretch" gap={2}>
                              {item.secondLevelKeys.map((child) => {
                                const shouldSplit = splitConfig[item.topKey]?.secondLevel?.[child.secondKey]?.split;
                                
                                return (
                                  <Flex
                                    key={child.id}
                                    p={{ base: 2, sm: 2.5 }}
                                    bg={shouldSplit ? "purple.50" : "gray.100"}
                                    _dark={{ bg: shouldSplit ? "purple.900/20" : "gray.700" }}
                                    borderWidth="1px"
                                    borderColor={shouldSplit ? "purple.300" : "gray.300"}
                                    _dark={{ borderColor: shouldSplit ? "purple.700" : "gray.600" }}
                                    borderRadius="md"
                                    align="center"
                                    gap={2}
                                    opacity={isSelected ? 1 : 0.5}
                                    pointerEvents={isSelected ? "auto" : "none"}
                                  >
                                    <VStack align="flex-start" gap={0} flex={1} minW={0}>
                                      <Flex align="center" gap={2} wrap="wrap">
                                        <Text fontSize="2xs" fontWeight="600" color={shouldSplit ? "purple.700" : "gray.700"} _dark={{ color: shouldSplit ? "purple.300" : "gray.300" }}>
                                          {child.secondKey}
                                        </Text>
                                        {child.isFirst && !shouldSplit && (
                                          <Badge colorPalette="gray" fontSize="2xs">kept with parent</Badge>
                                        )}
                                      </Flex>
                                      {shouldSplit && (
                                        <Text fontSize="2xs" color="textMuted" noOfLines={1}>
                                          → {child.fileName}
                                        </Text>
                                      )}
                                    </VStack>

                                    <Button
                                      onClick={() => toggleSecondLevelSplit(item.topKey, child.secondKey)}
                                      size="xs"
                                      variant={shouldSplit ? "solid" : "outline"}
                                      colorPalette={shouldSplit ? "purple" : "gray"}
                                      fontSize="2xs"
                                      px={2}
                                      h="24px"
                                    >
                                      {shouldSplit ? 'Split' : 'Keep'}
                                    </Button>
                                  </Flex>
                                );
                              })}
                            </VStack>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>

            {/* Remaining Sections Panel - only show when some files are unselected */}
            {hasUnselected && (
              <Box
                p={{ base: 3, sm: 4 }}
                bg="orange.50"
                _dark={{ bg: "orange.900/30", borderColor: "orange.700" }}
                borderRadius="md"
                borderWidth="1px"
                borderColor="orange.200"
              >
                <Flex align="start" gap={2} mb={3} direction={{ base: "column", sm: "row" }}>
                  <Flex align="start" gap={2} flex={1}>
                    <MdWarning size={20} color="var(--chakra-colors-orange-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <VStack align="stretch" gap={1} flex={1}>
                      <Text fontSize={{ base: "sm", sm: "md" }} color="orange.700" _dark={{ color: "orange.300" }} fontWeight="600">
                        {unselectedCount} section{unselectedCount > 1 ? 's' : ''} will not be split out
                      </Text>
                      <Text fontSize={{ base: "xs", sm: "sm" }} color="orange.600" _dark={{ color: "orange.400" }}>
                        Choose where these sections should be placed:
                      </Text>
                    </VStack>
                  </Flex>
                </Flex>

                <RadioCard.Root 
                  value={remainingDestination} 
                  onValueChange={(e) => setRemainingDestination(e.value)}
                  colorPalette="orange"
                  size="sm"
                >
                  <Stack gap={2}>
                    <RadioCard.Item value="original">
                      <RadioCard.ItemHiddenInput />
                      <RadioCard.ItemControl>
                        <RadioCard.ItemContent>
                          <Flex direction="column" gap={1} flex={1}>
                            <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="500" color="orange.800" _dark={{ color: "orange.200" }}>
                              Keep in original file
                            </Text>
                            <Text fontSize="2xs" color="orange.600" _dark={{ color: "orange.400" }}>
                              Creates: <Badge colorPalette="orange" fontSize="2xs">{file.name}</Badge>
                            </Text>
                          </Flex>
                        </RadioCard.ItemContent>
                        <RadioCard.ItemIndicator />
                      </RadioCard.ItemControl>
                    </RadioCard.Item>

                    <Box>
                      <RadioCard.Item value="custom">
                        <RadioCard.ItemHiddenInput />
                        <RadioCard.ItemControl>
                          <RadioCard.ItemContent>
                            <Flex direction="column" gap={1} flex={1}>
                              <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="500" color="orange.800" _dark={{ color: "orange.200" }}>
                                Create new file for remaining sections
                              </Text>
                              <Text fontSize="2xs" color="orange.600" _dark={{ color: "orange.400" }}>
                                Specify a custom filename
                              </Text>
                            </Flex>
                          </RadioCard.ItemContent>
                          <RadioCard.ItemIndicator />
                        </RadioCard.ItemControl>
                      </RadioCard.Item>
                      {remainingDestination === 'custom' && (
                        <Box mt={2} pl={{ base: 2, sm: 3 }}>
                          <Field.Root>
                            <Input
                              value={customFileName}
                              onChange={(e) => setCustomFileName(e.target.value)}
                              placeholder="config-remaining.yaml"
                              size="sm"
                              bg="white"
                              _dark={{ bg: "gray.800" }}
                              fontSize={{ base: "xs", sm: "sm" }}
                              borderColor="orange.300"
                              _focus={{ borderColor: "orange.500" }}
                            />
                          </Field.Root>
                        </Box>
                      )}
                    </Box>

                    {selectedFilesList.length > 0 && (
                      <Box>
                        <RadioCard.Item value="merge">
                          <RadioCard.ItemHiddenInput />
                          <RadioCard.ItemControl>
                            <RadioCard.ItemContent>
                              <Flex direction="column" gap={1} flex={1}>
                                <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="500" color="orange.800" _dark={{ color: "orange.200" }}>
                                  Merge into selected file
                                </Text>
                                <Text fontSize="2xs" color="orange.600" _dark={{ color: "orange.400" }}>
                                  Add to one of the split files
                                </Text>
                              </Flex>
                            </RadioCard.ItemContent>
                            <RadioCard.ItemIndicator />
                          </RadioCard.ItemControl>
                        </RadioCard.Item>
                        {remainingDestination === 'merge' && (
                          <Box mt={2} pl={{ base: 2, sm: 3 }}>
                            <Field.Root>
                              <Box
                                as="select"
                                bg="white"
                                _dark={{ bg: "gray.800" }}
                                borderWidth="1px"
                                borderColor="orange.300"
                                _focus={{ borderColor: "orange.500" }}
                                borderRadius="md"
                                px={2}
                                py={1}
                                fontSize={{ base: "xs", sm: "sm" }}
                                w="full"
                                cursor="pointer"
                              >
                                {selectedFilesList.map((f, idx) => (
                                  <option key={idx} value={f.fileName}>
                                    {f.fileName}
                                  </option>
                                ))}
                              </Box>
                            </Field.Root>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Stack>
                </RadioCard.Root>
              </Box>
            )}

            {/* Summary */}
            {hierarchicalPreview.length > 0 && (
              <Box>
                <Heading size={{ base: "sm", sm: "md" }} mb={2} lineHeight="1.2" display="flex" alignItems="center" gap={2}>
                  <Icon color="primary" boxSize={4}><PiChartLineFill /></Icon> Split Summary
                </Heading>
                <Flex gap={2} wrap="wrap" fontSize={{ base: "xs", sm: "sm" }}>
                  <Badge colorPalette="blue">
                    Sections: {selectedTopLevelCount}/{totalTopLevelCount}
                  </Badge>
                  <Badge colorPalette="green">
                    Files: {filesCount}
                  </Badge>
                  {hasUnselected && (
                    <Badge colorPalette="orange">
                      Unselected: {unselectedCount}
                    </Badge>
                  )}
                  <Badge colorPalette="purple">
                    Original: {file.name}
                  </Badge>
                </Flex>
                <Text fontSize="xs" color="textMuted" mt={2}>
                  {selectedTopLevelCount === totalTopLevelCount 
                    ? `All sections will be split into ${filesCount} file${filesCount !== 1 ? 's' : ''}` 
                    : `${selectedTopLevelCount} section${selectedTopLevelCount !== 1 ? 's' : ''} will be split into ${filesCount} file${filesCount !== 1 ? 's' : ''}`
                  }
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
          flexWrap={{ base: "wrap", sm: "nowrap" }}
        >
          <Button
            onClick={onClose}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            size={{ base: "sm", sm: "md" }}
            fontSize={{ base: "xs", sm: "sm" }}
            isDisabled={splitting}
            flex={{ base: "1", sm: "0" }}
            minW={{ base: "auto", sm: "80px" }}
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
            isDisabled={selectedTopLevelCount === 0 || splitting}
            loading={splitting}
            flex={{ base: "1", sm: "0" }}
            minW={{ base: "auto", sm: "100px" }}
          >
            <Icon mr={1} display={{ base: "none", sm: "inline-block" }}><PiArrowsSplitFill /></Icon>
            {splitting ? 'Splitting...' : `Split ${filesCount}`}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SplitConfigModal;
