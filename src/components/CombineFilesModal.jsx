import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, VStack, Heading, Text, Button, Input, IconButton, Badge } from '@chakra-ui/react';
import { MdClose, MdArrowUpward, MdArrowDownward, MdExpandMore, MdChevronRight, MdInfo } from 'react-icons/md';
import { FcIdea } from 'react-icons/fc';
import { Tooltip } from './Tooltip';
import { checkForDuplicateKeys, removeDuplicateKeys } from '../utils/yamlMergeUtils';

const CombineFilesModal = ({ files, isOpen, onClose, onCombine }) => {
  const [orderedFiles, setOrderedFiles] = useState(() => [...files]);
  const [combineMethod, setCombineMethod] = useState('append'); // 'append' or 'merge'
  const [separator, setSeparator] = useState('---');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  // Reset ordered files when modal opens with new files
  const [lastFilesLength, setLastFilesLength] = useState(files.length);
  
  if (isOpen && files.length !== lastFilesLength) {
    setOrderedFiles([...files]);
    setLastFilesLength(files.length);
  }

  // Check for duplicates and compute default smart merge settings
  const { duplicateInfo, defaultSmartMerge, defaultPrimaryFiles } = useMemo(() => {
    if (orderedFiles.length > 1) {
      const info = checkForDuplicateKeys(orderedFiles);
      
      if (info.hasDuplicates) {
        const newSmartMerge = {};
        const newPrimaryFiles = {};
        
        info.duplicateKeys.forEach(key => {
          const details = info.duplicateDetails[key];
          
          // Auto-select config.yaml as primary if it has this key
          const configFile = details.files.find(f => f.fileName === 'config.yaml');
          const primaryIndex = configFile ? configFile.fileIndex : details.files[0].fileIndex;
          
          if (details.canSmartMerge) {
            newSmartMerge[key] = true; // Auto-enable smart merge
            newPrimaryFiles[key] = primaryIndex;
          } else {
            newSmartMerge[key] = false;
            newPrimaryFiles[key] = primaryIndex; // Still prefer config.yaml even with conflicts
          }
        });
        
        return { duplicateInfo: info, defaultSmartMerge: newSmartMerge, defaultPrimaryFiles: newPrimaryFiles };
      }
      
      return { duplicateInfo: info, defaultSmartMerge: {}, defaultPrimaryFiles: {} };
    }
    return { duplicateInfo: null, defaultSmartMerge: {}, defaultPrimaryFiles: {} };
  }, [orderedFiles]);

  // Use the computed defaults directly as initial state
  const [smartMergeEnabled, setSmartMergeEnabled] = useState(defaultSmartMerge);
  const [primaryFilePerKey, setPrimaryFilePerKey] = useState(defaultPrimaryFiles);

  // Update state when defaults change (when orderedFiles change)
  const defaultsKey = JSON.stringify(defaultSmartMerge);
  useEffect(() => {
    setSmartMergeEnabled(defaultSmartMerge);
    setPrimaryFilePerKey(defaultPrimaryFiles);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultsKey]);

  if (!isOpen) return null;

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const newFiles = [...orderedFiles];
    const draggedFile = newFiles[draggedIndex];
    
    // Remove dragged item
    newFiles.splice(draggedIndex, 1);
    
    // Insert at new position
    newFiles.splice(dropIndex, 0, draggedFile);
    
    setOrderedFiles(newFiles);
    setDraggedIndex(null);
  };

  const moveFile = (fromIndex, toIndex) => {
    const newFiles = [...orderedFiles];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setOrderedFiles(newFiles);
  };



  const toggleKeyExpansion = (key) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  const handleCombine = () => {
    // Check for duplicate keys
    const duplicateCheck = checkForDuplicateKeys(orderedFiles);
    
    let filesToCombine = orderedFiles;
    
    if (duplicateCheck.hasDuplicates) {
      // Check if there are any second-level conflicts that aren't resolved
      const hasUnresolvedConflicts = duplicateCheck.duplicateKeys.some(key => {
        const details = duplicateCheck.duplicateDetails[key];
        return details.hasSecondLevelConflicts && !smartMergeEnabled[key];
      });

      if (hasUnresolvedConflicts) {
        alert('Some duplicate keys have second-level conflicts that need to be resolved. Please review the conflict details or disable smart merge for those keys.');
        return;
      }
      
      // Remove duplicate keys based on smart merge settings
      filesToCombine = removeDuplicateKeys(orderedFiles, smartMergeEnabled, primaryFilePerKey);
    }
    
    let combinedContent = '';
    
    if (combineMethod === 'append') {
      // Simple append - just concatenate files
      combinedContent = filesToCombine.map(file => file.content.trim()).join('\n');
    } else {
      // Merge method with separator only if separator is provided and not empty
      if (separator && separator.trim()) {
        combinedContent = filesToCombine.map(file => file.content.trim()).join('\n' + separator.trim() + '\n');
      } else {
        combinedContent = filesToCombine.map(file => file.content.trim()).join('\n');
      }
    }

    const combinedFile = {
      name: `combined_config_${Date.now()}.yaml`,
      size: new Blob([combinedContent]).size,
      lastModified: new Date(),
      content: combinedContent
    };

    onCombine(combinedFile);
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
        maxW={{ base: "100vw", md: "800px" }}
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
            >
              🔗 Combine YAML Files
            </Heading>
            {duplicateInfo && duplicateInfo.hasDuplicates && (
              <Text fontSize={{ base: "xs", sm: "sm" }} color="orange.600" _dark={{ color: "orange.400" }} fontWeight="600">
                ⚠️ Duplicates detected - scroll down for details
              </Text>
            )}
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
          <VStack align="stretch" gap={{ base: 4, sm: 6 }}>
            {/* Combine Options */}
            <Box>
              <Text fontWeight="600" mb={2} fontSize={{ base: "sm", sm: "md" }}>Combine Method:</Text>
              <VStack align="stretch" gap={2}>
                <Flex
                  as="label"
                  p={3}
                  borderWidth="1px"
                  borderColor={combineMethod === 'append' ? 'primary' : 'border'}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: "cardBg" }}
                  bg={combineMethod === 'append' ? 'blue.50' : 'transparent'}
                  _dark={{ bg: combineMethod === 'append' ? 'blue.900/30' : 'transparent' }}
                  align="center"
                  gap={2}
                >
                  <input 
                    type="radio" 
                    value="append" 
                    checked={combineMethod === 'append'}
                    onChange={(e) => setCombineMethod(e.target.value)}
                  />
                  <VStack align="flex-start" gap={0} flex={1}>
                    <Text fontWeight="500" fontSize={{ base: "sm", sm: "md" }}>Append Files</Text>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">Add files one after another</Text>
                  </VStack>
                </Flex>
                <Flex
                  as="label"
                  p={3}
                  borderWidth="1px"
                  borderColor={combineMethod === 'merge' ? 'primary' : 'border'}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: "cardBg" }}
                  bg={combineMethod === 'merge' ? 'blue.50' : 'transparent'}
                  _dark={{ bg: combineMethod === 'merge' ? 'blue.900/30' : 'transparent' }}
                  align="center"
                  gap={2}
                >
                  <input 
                    type="radio" 
                    value="merge" 
                    checked={combineMethod === 'merge'}
                    onChange={(e) => setCombineMethod(e.target.value)}
                  />
                  <VStack align="flex-start" gap={0} flex={1}>
                    <Text fontWeight="500" fontSize={{ base: "sm", sm: "md" }}>Merge with Separator</Text>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">Add separator between files</Text>
                  </VStack>
                </Flex>
              </VStack>
            </Box>

            {/* Separator Input */}
            <Box>
              <Text fontWeight="600" mb={2} fontSize={{ base: "sm", sm: "md" }}>Separator (optional):</Text>
              <Input
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                placeholder="--- (YAML document separator)"
                bg="inputBg"
                size={{ base: "sm", sm: "md" }}
              />
            </Box>

            {/* File Ordering */}
            <Box>
              <Heading size={{ base: "sm", sm: "md" }} mb={2} lineHeight="1.2">📋 File Order</Heading>
              <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted" mb={3}>Files will be combined in the order shown below (drag to reorder):</Text>
              
              <VStack align="stretch" gap={2}>
                {orderedFiles.map((file, index) => (
                  <Flex
                    key={`${file.name}-${index}`}
                    bg="cardBg"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="md"
                    p={{ base: 2, sm: 3 }}
                    align="center"
                    gap={{ base: 2, sm: 3 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    cursor="move"
                    opacity={draggedIndex === index ? 0.5 : 1}
                    _hover={{ bg: "panelBg" }}
                  >
                    <Text fontWeight="600" fontSize={{ base: "sm", sm: "md" }} minW={{ base: "20px", sm: "30px" }}>
                      {index + 1}.
                    </Text>
                    <VStack align="flex-start" gap={0} flex={1} minW={0}>
                      <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="500" noOfLines={1}>
                        📄 {file.name}
                      </Text>
                      <Text fontSize="xs" color="textMuted">
                        ({Math.round(file.size / 1024)} KB)
                      </Text>
                    </VStack>
                    <Flex gap={{ base: 0.5, sm: 1 }} flexShrink={0}>
                      <IconButton
                        onClick={() => moveFile(index, Math.max(0, index - 1))}
                        isDisabled={index === 0}
                        aria-label="Move up"
                        variant="ghost"
                        size={{ base: "xs", sm: "sm" }}
                        minW={{ base: "24px", sm: "32px" }}
                        h={{ base: "24px", sm: "32px" }}
                        p={0}
                      >
                        <MdArrowUpward />
                      </IconButton>
                      <IconButton
                        onClick={() => moveFile(index, Math.min(orderedFiles.length - 1, index + 1))}
                        isDisabled={index === orderedFiles.length - 1}
                        aria-label="Move down"
                        variant="ghost"
                        size={{ base: "xs", sm: "sm" }}
                        minW={{ base: "24px", sm: "32px" }}
                        h={{ base: "24px", sm: "32px" }}
                        p={0}
                      >
                        <MdArrowDownward />
                      </IconButton>
                    </Flex>
                  </Flex>
                ))}
              </VStack>
            </Box>

            {/* Preview Info */}
            <Box>
              <Heading size={{ base: "sm", sm: "md" }} mb={2} lineHeight="1.2">📊 Combined File Preview</Heading>
              <Flex gap={2} wrap="wrap" fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
                <Badge colorPalette="blue">Files: {orderedFiles.length}</Badge>
                <Badge colorPalette="green">Total Size: ~{Math.round(orderedFiles.reduce((sum, file) => sum + file.size, 0) / 1024)} KB</Badge>
                <Badge colorPalette="purple">Method: {combineMethod === 'append' ? 'Append' : 'Merge'}</Badge>
              </Flex>
              
              {duplicateInfo && duplicateInfo.hasDuplicates && (
                <Box mt={4}>
                  <Flex align="center" gap={2} mb={3}>
                    <Text fontSize={{ base: "md", sm: "lg" }}>⚠️</Text>
                    <Heading size={{ base: "sm", sm: "md" }} lineHeight="1.2">Duplicate Key Analysis</Heading>
                    <Tooltip 
                      content="Smart merge analyzes second-level keys only. Deeper nesting is not evaluated."
                      showArrow
                    >
                      <Box as="span" cursor="help" color="textMuted" display="inline-flex">
                        <MdInfo />
                      </Box>
                    </Tooltip>
                  </Flex>
                  
                  <VStack align="stretch" gap={2}>
                    {duplicateInfo.duplicateKeys.map(key => {
                      const details = duplicateInfo.duplicateDetails[key];
                      const isExpanded = expandedKeys.has(key);
                      const canMerge = details.canSmartMerge;
                      
                      return (
                        <Box
                          key={key}
                          borderWidth="1px"
                          borderColor={canMerge ? "green.300" : "orange.300"}
                          _dark={{ borderColor: canMerge ? "green.700" : "orange.700" }}
                          borderRadius="md"
                          overflow="hidden"
                        >
                          {/* Header */}
                          <Flex
                            p={{ base: 2, sm: 3 }}
                            bg={canMerge ? "green.50" : "orange.50"}
                            _dark={{ bg: canMerge ? "green.900/30" : "orange.900/30" }}
                            align="center"
                            gap={2}
                            cursor="pointer"
                            onClick={() => toggleKeyExpansion(key)}
                            _hover={{ opacity: 0.8 }}
                            direction="column"
                          >
                            <Flex align="center" gap={2} w="100%">
                              <Box fontSize={{ base: "md", sm: "lg" }}>
                                {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
                              </Box>
                              <Badge 
                                colorPalette={canMerge ? "green" : "orange"}
                                fontSize={{ base: "xs", sm: "sm" }}
                                fontWeight="600"
                              >
                                {key}
                              </Badge>
                              <Text 
                                fontSize={{ base: "xs", sm: "sm" }} 
                                color={canMerge ? "green.700" : "orange.700"}
                                _dark={{ color: canMerge ? "green.300" : "orange.300" }}
                                flex={1}
                              >
                                {canMerge ? "✅ Safe to merge" : "⚠️ Second-level conflicts"}
                              </Text>
                              <Text fontSize="xs" color="textMuted">
                                {details.files.length} files
                              </Text>
                            </Flex>
                            {canMerge && !isExpanded && (
                              <Flex
                                align="center"
                                gap={1}
                                w="100%"
                              >
                                <FcIdea size={14} />
                                <Text 
                                  fontSize="xs" 
                                  color="green.600" 
                                  _dark={{ color: "green.400" }}
                                  fontWeight="500"
                                >
                                  Verify primary file selection - click to expand
                                </Text>
                              </Flex>
                            )}
                          </Flex>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <Box p={{ base: 3, sm: 4 }} bg="cardBg">
                              <VStack align="stretch" gap={3}>
                                {/* Smart Merge Toggle */}
                                <Flex align="center" gap={2} p={2} bg="panelBg" borderRadius="md">
                                  <Flex as="label" align="center" gap={2} cursor={canMerge ? "pointer" : "not-allowed"} opacity={canMerge ? 1 : 0.5}>
                                    <input
                                      type="checkbox"
                                      checked={smartMergeEnabled[key] || false}
                                      disabled={!canMerge}
                                      onChange={(e) => setSmartMergeEnabled(prev => ({
                                        ...prev,
                                        [key]: e.target.checked
                                      }))}
                                      style={{ cursor: canMerge ? 'pointer' : 'not-allowed' }}
                                    />
                                    <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="500">
                                      Enable Smart Merge
                                    </Text>
                                  </Flex>
                                  {!canMerge && (
                                    <Text fontSize="xs" color="orange.600" _dark={{ color: "orange.400" }}>
                                      (Disabled due to conflicts)
                                    </Text>
                                  )}
                                </Flex>

                                {/* Primary File Selector */}
                                <Box>
                                  <Flex align="center" gap={2} mb={1}>
                                    <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="600">
                                      Primary File (keeps top-level key):
                                    </Text>
                                    {!details.files.find(f => f.fileName === 'config.yaml') && (
                                      <Badge colorPalette="orange" fontSize="xs">
                                        Choose primary
                                      </Badge>
                                    )}
                                  </Flex>
                                  {!details.files.find(f => f.fileName === 'config.yaml') && (
                                    <Text fontSize="xs" color="orange.600" _dark={{ color: "orange.400" }} mb={2}>
                                      ⚠️ config.yaml not found - please select which file should be primary
                                    </Text>
                                  )}
                                  <Box
                                    as="select"
                                    value={primaryFilePerKey[key] || details.files[0].fileIndex}
                                    onChange={(e) => setPrimaryFilePerKey(prev => ({
                                      ...prev,
                                      [key]: parseInt(e.target.value)
                                    }))}
                                    p={2}
                                    fontSize={{ base: "xs", sm: "sm" }}
                                    borderWidth="1px"
                                    borderColor={!details.files.find(f => f.fileName === 'config.yaml') ? "orange.500" : "border"}
                                    borderRadius="md"
                                    bg="inputBg"
                                    w="100%"
                                    cursor="pointer"
                                  >
                                    {details.files.map(fileInfo => (
                                      <option key={fileInfo.fileIndex} value={fileInfo.fileIndex}>
                                        {fileInfo.fileName}
                                        {fileInfo.fileName === 'config.yaml' ? ' (default)' : ''}
                                      </option>
                                    ))}
                                  </Box>
                                </Box>

                                {/* Second-Level Key Analysis */}
                                <Box>
                                  <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="600" mb={2}>
                                    Second-Level Keys by File:
                                  </Text>
                                  <VStack align="stretch" gap={2}>
                                    {details.secondLevelAnalysis.map(analysis => (
                                      <Box 
                                        key={analysis.fileIndex}
                                        p={2}
                                        bg="panelBg"
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor="border"
                                      >
                                        <Text fontSize="xs" fontWeight="600" mb={1}>
                                          📄 {analysis.fileName}
                                        </Text>
                                        <Flex gap={1} wrap="wrap">
                                          {analysis.secondLevelKeys.length > 0 ? (
                                            analysis.secondLevelKeys.map(secondKey => (
                                              <Badge 
                                                key={secondKey}
                                                colorPalette={details.conflictingSecondKeys.includes(secondKey) ? "red" : "blue"}
                                                fontSize="xs"
                                              >
                                                {secondKey}
                                                {details.conflictingSecondKeys.includes(secondKey) && " ⚠️"}
                                              </Badge>
                                            ))
                                          ) : (
                                            <Text fontSize="xs" color="textMuted">No second-level keys</Text>
                                          )}
                                        </Flex>
                                      </Box>
                                    ))}
                                  </VStack>
                                </Box>

                                {/* Conflict Warning */}
                                {!canMerge && (
                                  <Box
                                    p={2}
                                    bg="orange.50"
                                    _dark={{ bg: "orange.900/30", borderColor: "orange.700" }}
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor="orange.300"
                                  >
                                    <Text fontSize="xs" color="orange.700" _dark={{ color: "orange.300" }} fontWeight="600" mb={1}>
                                      ⚠️ Conflicting Second-Level Keys:
                                    </Text>
                                    <Flex gap={1} wrap="wrap">
                                      {details.conflictingSecondKeys.map(conflictKey => (
                                        <Badge key={conflictKey} colorPalette="red" fontSize="xs">
                                          {conflictKey}
                                        </Badge>
                                      ))}
                                    </Flex>
                                    <Text fontSize="xs" color="orange.600" _dark={{ color: "orange.400" }} mt={2}>
                                      These keys appear in multiple files. To proceed, you can:
                                      <br />• Manually resolve conflicts in the original files first
                                      <br />• Disable smart merge (content from non-primary files will be discarded)
                                    </Text>
                                  </Box>
                                )}

                                {/* Merge Explanation */}
                                {smartMergeEnabled[key] && canMerge && (
                                  <Box
                                    p={2}
                                    bg="green.50"
                                    _dark={{ bg: "green.900/30" }}
                                    borderRadius="md"
                                  >
                                    <Text fontSize="xs" color="green.700" _dark={{ color: "green.300" }} mb={2}>
                                      ✓ Content from non-primary files will be appended under the <Text as="strong">{key}</Text> key (without the duplicate key line).
                                    </Text>
                                    <Flex align="center" gap={1}>
                                      <FcIdea size={14} />
                                      <Text fontSize="xs" color="green.600" _dark={{ color: "green.400" }} fontWeight="600">
                                        Please verify the Primary File selection above is correct before combining.
                                      </Text>
                                    </Flex>
                                  </Box>
                                )}
                              </VStack>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              )}
            </Box>
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
          >
            Cancel
          </Button>
          <Button
            onClick={handleCombine}
            bg="primary"
            color="white"
            _hover={{ bg: "primaryHover" }}
            size={{ base: "sm", sm: "md" }}
            fontSize={{ base: "xs", sm: "sm" }}
          >
            🔗 Combine Files
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

CombineFilesModal.propTypes = {
  files: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired
  })).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCombine: PropTypes.func.isRequired
};

export default CombineFilesModal;