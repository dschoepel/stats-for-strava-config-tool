import React, { useState, useMemo } from 'react';
import { Box, Flex, VStack, Heading, Text, Button, Input, IconButton, Badge } from '@chakra-ui/react';
import { MdClose, MdArrowUpward, MdArrowDownward, MdExpandMore, MdChevronRight, MdInfo } from 'react-icons/md';
import { FcIdea } from 'react-icons/fc';
import { Tooltip } from './Tooltip';

const CombineFilesModal = ({ files, isOpen, onClose, onCombine }) => {
  const [orderedFiles, setOrderedFiles] = useState(() => [...files]);
  const [combineMethod, setCombineMethod] = useState('append'); // 'append' or 'merge'
  const [separator, setSeparator] = useState('---');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [smartMergeEnabled, setSmartMergeEnabled] = useState({});
  const [primaryFilePerKey, setPrimaryFilePerKey] = useState({});

  // Reset ordered files when modal opens with new files
  const [lastFilesLength, setLastFilesLength] = useState(files.length);
  
  if (isOpen && files.length !== lastFilesLength) {
    setOrderedFiles([...files]);
    setLastFilesLength(files.length);
  }

  // Parse YAML to extract second-level keys under a given top-level key
  const parseSecondLevelKeys = (content, topLevelKey) => {
    const normalizedContent = content.replace(/\\n/g, '\n');
    const lines = normalizedContent.split('\n');
    const secondLevelKeys = [];
    let inTargetSection = false;
    let currentIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're entering the target top-level key
      const topLevelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
      if (topLevelMatch) {
        if (topLevelMatch[1] === topLevelKey) {
          inTargetSection = true;
          currentIndent = 0;
        } else {
          inTargetSection = false;
        }
        continue;
      }

      // If we're in the target section, look for second-level keys
      if (inTargetSection) {
        // Check for indented keys (second-level)
        const indentMatch = line.match(/^(\s+)([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
        if (indentMatch) {
          const indent = indentMatch[1].length;
          const key = indentMatch[2];
          
          // Only capture direct children (second level)
          if (currentIndent === 0 || indent === currentIndent) {
            currentIndent = indent;
            secondLevelKeys.push(key);
          }
        }
      }
    }

    return secondLevelKeys;
  };

  const checkForDuplicateKeys = (files) => {
    const allKeys = new Set();
    const duplicates = new Set();
    const fileKeys = {};
    const duplicateDetails = {};

    files.forEach((file, fileIndex) => {
      const normalizedContent = file.content.replace(/\\n/g, '\n');
      const lines = normalizedContent.split('\n');
      const keys = [];
      
      lines.forEach(line => {
        // Match top-level YAML keys (not indented, followed by colon)
        const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
        if (match) {
          const key = match[1];
          keys.push(key);
          
          if (allKeys.has(key)) {
            duplicates.add(key);
          } else {
            allKeys.add(key);
          }
        }
      });
      
      fileKeys[fileIndex] = keys;
    });

    // For each duplicate key, analyze second-level conflicts
    duplicates.forEach(dupKey => {
      const filesWithKey = files.map((file, idx) => ({
        fileIndex: idx,
        fileName: file.name,
        hasKey: fileKeys[idx].includes(dupKey)
      })).filter(f => f.hasKey);

      // Parse second-level keys for each file
      const secondLevelAnalysis = filesWithKey.map(fileInfo => {
        const file = files[fileInfo.fileIndex];
        const secondKeys = parseSecondLevelKeys(file.content, dupKey);
        return {
          ...fileInfo,
          secondLevelKeys: secondKeys
        };
      });

      // Check for second-level conflicts
      const allSecondKeys = new Set();
      const conflictingSecondKeys = new Set();
      
      secondLevelAnalysis.forEach(analysis => {
        analysis.secondLevelKeys.forEach(key => {
          if (allSecondKeys.has(key)) {
            conflictingSecondKeys.add(key);
          } else {
            allSecondKeys.add(key);
          }
        });
      });

      duplicateDetails[dupKey] = {
        files: filesWithKey,
        secondLevelAnalysis,
        hasSecondLevelConflicts: conflictingSecondKeys.size > 0,
        conflictingSecondKeys: Array.from(conflictingSecondKeys),
        canSmartMerge: conflictingSecondKeys.size === 0
      };
    });

    return {
      hasDuplicates: duplicates.size > 0,
      duplicateKeys: Array.from(duplicates),
      fileKeys,
      duplicateDetails
    };
  };

  const removeDuplicateKeys = (files, smartMergeSettings) => {
    const duplicateCheck = checkForDuplicateKeys(files);
    
    if (!duplicateCheck.hasDuplicates) {
      return files; // No duplicates, return original files
    }

    const processedFiles = [];
    const contentToMerge = {}; // Track content to merge under each key

    // First pass: Extract content from non-primary files that needs to be merged
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      const normalizedContent = file.content.replace(/\\n/g, '\n');
      const lines = normalizedContent.split('\n');
      
      duplicateCheck.duplicateKeys.forEach(key => {
        const details = duplicateCheck.duplicateDetails[key];
        
        if (smartMergeSettings[key]) {
          const primaryFileIdx = primaryFilePerKey[key];
          
          if (fileIndex !== primaryFileIdx && details.files.some(f => f.fileIndex === fileIndex)) {
            // This is a non-primary file with the duplicate key - extract its content
            if (!contentToMerge[key]) {
              contentToMerge[key] = [];
            }
            
            let inTargetSection = false;
            let sectionContent = [];
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const topLevelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
              
              if (topLevelMatch) {
                if (topLevelMatch[1] === key) {
                  inTargetSection = true;
                  // Don't include the top-level key line itself
                  continue;
                } else if (inTargetSection) {
                  // Hit a different top-level key, stop collecting
                  break;
                }
              } else if (inTargetSection) {
                // Collect ALL lines under the target key (including blank lines)
                // This preserves exact indentation and spacing from the original file
                sectionContent.push(line);
              }
            }
            
            if (sectionContent.length > 0) {
              contentToMerge[key].push({
                fileIndex,
                fileName: file.name,
                content: sectionContent
              });
            }
          }
        }
      });
    }

    // Second pass: Process each file, removing sections or merging content
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      const normalizedContent = file.content.replace(/\\n/g, '\n');
      const lines = normalizedContent.split('\n');
      const filteredLines = [];
      let skipUntilNextTopLevel = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const topLevelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
        
        if (topLevelMatch) {
          // This is a top-level key
          const key = topLevelMatch[1];
          skipUntilNextTopLevel = false;
          
          const details = duplicateCheck.duplicateDetails[key];
          if (details) {
            const primaryFileIdx = primaryFilePerKey[key];
            
            if (smartMergeSettings[key]) {
              // Smart merge enabled
              if (fileIndex === primaryFileIdx) {
                // This IS the primary file - keep the top-level key
                filteredLines.push(line);
                
                // After adding the top-level key, we need to add its content
                // We'll collect the original content and then append merged content
                let originalContent = [];
                let j = i + 1;
                
                // Collect original content under this key
                while (j < lines.length) {
                  const nextLine = lines[j];
                  const nextTopLevel = nextLine.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
                  
                  if (nextTopLevel) {
                    // Hit next top-level key
                    break;
                  }
                  originalContent.push(nextLine);
                  j++;
                }
                
                // Add original content
                filteredLines.push(...originalContent);
                
                // Append merged content from other files
                if (contentToMerge[key] && contentToMerge[key].length > 0) {
                  contentToMerge[key].forEach(mergeInfo => {
                    // Preserve exact indentation from the source file
                    filteredLines.push(...mergeInfo.content);
                  });
                }
                
                // Skip ahead past the content we just processed
                i = j - 1;
              } else {
                // This is NOT the primary file - skip this entire section
                skipUntilNextTopLevel = true;
              }
            } else {
              // Smart merge disabled - keep first occurrence only
              if (fileIndex === primaryFileIdx) {
                filteredLines.push(line);
              } else {
                skipUntilNextTopLevel = true;
              }
            }
          } else {
            // Not a duplicate key
            filteredLines.push(line);
          }
        } else {
          // This is content under a top-level key
          if (!skipUntilNextTopLevel) {
            filteredLines.push(line);
          }
        }
      }

      processedFiles.push({
        ...file,
        content: filteredLines.join('\n'),
        size: new Blob([filteredLines.join('\n')]).size
      });
    }

    return processedFiles;
  };

  // Check for duplicates when files or order changes
  const duplicateInfo = useMemo(() => {
    if (orderedFiles.length > 1) {
      const info = checkForDuplicateKeys(orderedFiles);
      
      // Auto-enable smart merge for keys that can be merged
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
        
        setSmartMergeEnabled(newSmartMerge);
        setPrimaryFilePerKey(newPrimaryFiles);
      }
      
      return info;
    }
    return null;
  }, [orderedFiles]);

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
      filesToCombine = removeDuplicateKeys(orderedFiles, smartMergeEnabled);
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
                                    _dark={{ bg: "orange.900/30" }}
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor="orange.300"
                                    _dark={{ borderColor: "orange.700" }}
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

export default CombineFilesModal;