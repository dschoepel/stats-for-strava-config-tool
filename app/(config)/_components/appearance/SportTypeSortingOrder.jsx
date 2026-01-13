import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Text, Grid, VStack, HStack, Code, Input } from '@chakra-ui/react';
import { MdExpandMore, MdChevronRight, MdAdd, MdClose, MdArrowUpward, MdArrowDownward, MdDragIndicator } from 'react-icons/md';
import { useDragAndDrop } from '../../../../src/hooks/useDragAndDrop';

/**
 * SportTypeSortingOrder - Component for managing sport type display order
 * Allows adding, removing, and reordering sports with drag-and-drop or arrows
 */
const SportTypeSortingOrder = ({ 
  fieldName,
  fieldSchema, 
  fieldPath, 
  value, 
  onChange, 
  hasError,
  sportsList
}) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [filterText, setFilterText] = useState('');
  
  const sortingOrder = Array.isArray(value) ? value : [];

  // Drag and drop reorder callback
  const handleReorder = (oldIndex, newIndex) => {
    const newOrder = [...sortingOrder];
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);
    onChange(fieldPath, newOrder);
  };

  // Initialize drag and drop hook
  const {
    draggedIndex,
    isPendingDrag,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDragAndDrop(handleReorder);

  const handleAddSport = (sport) => {
    if (!sortingOrder.includes(sport)) {
      onChange(fieldPath, [...sortingOrder, sport]);
    }
  };

  const handleRemoveSport = (sport) => {
    onChange(fieldPath, sortingOrder.filter(s => s !== sport));
  };

  const handleMoveSportUp = (index) => {
    if (index > 0) {
      const newOrder = [...sortingOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      onChange(fieldPath, newOrder);
    }
  };

  const handleMoveSportDown = (index) => {
    if (index < sortingOrder.length - 1) {
      const newOrder = [...sortingOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      onChange(fieldPath, newOrder);
    }
  };

  return (
    <Box mb={4}>
      <Text fontWeight="500" mb={1} fontSize="sm">
        {fieldSchema.title || fieldName}
      </Text>
      {fieldSchema.description && (
        <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
      )}
      
      <VStack align="stretch" gap={4}>
        {/* Current Order */}
        {sortingOrder.length > 0 && (
          <Box>
            <Text fontWeight="500" fontSize="sm" mb={2}>Current Order:</Text>
            <VStack align="stretch" gap={1}>
              {sortingOrder.map((sport, index) => {
                const isDragged = draggedIndex === index;
                const isPending = isPendingDrag;
                
                return (
                  <Flex 
                    key={sport} 
                    data-drag-index={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={(e) => handleTouchMove(e, sortingOrder)}
                    onTouchEnd={handleTouchEnd}
                    align="center" 
                    gap={{ base: 1, sm: 2 }}
                    p={{ base: 1.5, sm: 2 }}
                    bg="cardBg"
                    borderRadius="md"
                    fontSize={{ base: "xs", sm: "sm" }}
                    borderWidth="1px"
                    borderColor={draggedIndex === index ? "blue.500" : "border"}
                    opacity={draggedIndex === index ? 0.5 : 1}
                    transform={isPendingDrag && draggedIndex === null ? "scale(1.02)" : "scale(1)"}
                    boxShadow={isPendingDrag ? "md" : "none"}
                    transition="all 0.2s"
                    cursor={draggedIndex === index ? "grabbing" : "grab"}
                    _hover={{
                      borderColor: "blue.400",
                      boxShadow: "md",
                      bg: "gray.50",
                      _dark: { bg: "gray.700", borderColor: "blue.400" }
                    }}
                  >
                    <Box 
                      fontSize={{ base: "md", sm: "lg" }} 
                      color="textMuted" 
                      cursor="grab" 
                      userSelect="none" 
                      title="Drag to reorder"
                      flexShrink={0}
                      _active={{ cursor: "grabbing" }}
                    >
                      <MdDragIndicator />
                    </Box>
                    <Text flex={1} noOfLines={1} overflow="hidden" textOverflow="ellipsis">{sport}</Text>
                    <HStack gap={{ base: 0.5, sm: 1 }} flexShrink={0}>
                      <Button
                        onClick={() => handleMoveSportUp(index)}
                        size="xs"
                        variant="ghost"
                        isDisabled={index === 0}
                        aria-label="Move up"
                        minW={{ base: "20px", sm: "auto" }}
                        h={{ base: "20px", sm: "auto" }}
                        px={{ base: 0, sm: 2 }}
                        fontSize={{ base: "xs", sm: "sm" }}
                      >
                        <Box as={MdArrowUpward} />
                      </Button>
                      <Button
                        onClick={() => handleMoveSportDown(index)}
                        size="xs"
                        variant="ghost"
                        isDisabled={index === sortingOrder.length - 1}
                        aria-label="Move down"
                        minW={{ base: "20px", sm: "auto" }}
                        h={{ base: "20px", sm: "auto" }}
                        px={{ base: 0, sm: 2 }}
                        fontSize={{ base: "xs", sm: "sm" }}
                      >
                        <Box as={MdArrowDownward} />
                      </Button>
                      <Button
                        onClick={() => handleRemoveSport(sport)}
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        aria-label="Remove"
                        minW={{ base: "20px", sm: "auto" }}
                        h={{ base: "20px", sm: "auto" }}
                        px={{ base: 0, sm: 2 }}
                        fontSize={{ base: "xs", sm: "sm" }}
                      >
                        <Box as={MdClose} />
                      </Button>
                    </HStack>
                  </Flex>
                );
              })}
            </VStack>
          </Box>
        )}

        {/* Add Sports */}
        {Object.keys(sportsList).length > 0 && (
          <Box>
            <Text fontWeight="500" fontSize="sm" mb={2}>Add Sport to Order:</Text>
            
            {/* Filter input */}
            <Input
              placeholder="Filter sports..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              size="sm"
              mb={2}
            />
            
            <VStack align="stretch" gap={2}>
              {Object.entries(sportsList).map(([category, categoryArray]) => {
                const availableInCategory = categoryArray.filter(sport => {
                  const notInOrder = !sortingOrder.includes(sport);
                  const matchesFilter = !filterText || sport.toLowerCase().includes(filterText.toLowerCase());
                  return notInOrder && matchesFilter;
                });
                
                if (availableInCategory.length === 0) return null;
                
                const categoryKey = `sorting_${category}`;
                const isCategoryExpanded = expandedCategories[categoryKey] !== false;
                
                return (
                  <Box key={category} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                    <Button
                      onClick={() => setExpandedCategories(prev => ({
                        ...prev,
                        [categoryKey]: !prev[categoryKey]
                      }))}
                      width="100%"
                      justifyContent="flex-start"
                      variant="ghost"
                      size="sm"
                      bg="cardBg"
                      color="text"
                      fontSize={{ base: "xs", sm: "sm" }}
                    >
                      <Box as={isCategoryExpanded ? MdExpandMore : MdChevronRight} mr={2} flexShrink={0} />
                      {category} ({availableInCategory.length})
                    </Button>
                    
                    {isCategoryExpanded && (
                      <Grid templateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap={2} p={3}>
                        {availableInCategory.map(sport => (
                          <Button
                            key={sport}
                            onClick={() => handleAddSport(sport)}
                            size={{ base: "xs", sm: "sm" }}
                            variant="outline"
                            fontSize={{ base: "xs", sm: "sm" }}
                            justifyContent="flex-start"
                            overflow="hidden"
                            px={2}
                          >
                            <Box as={MdAdd} boxSize={{ base: "12px", sm: "16px" }} mr={1} flexShrink={0} />
                            <Text noOfLines={1} overflow="hidden" textOverflow="ellipsis" flex={1} textAlign="left">
                              {sport}
                            </Text>
                          </Button>
                        ))}
                      </Grid>
                    )}
                  </Box>
                );
              })}
            </VStack>
          </Box>
        )}
      </VStack>
      
      {hasError && (
        <Text color="red.500" fontSize="sm" mt={2}>{hasError}</Text>
      )}
    </Box>
  );
};

SportTypeSortingOrder.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldSchema: PropTypes.object,
  fieldPath: PropTypes.string.isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  hasError: PropTypes.bool,
  sportsList: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired
  })).isRequired
};

export default SportTypeSortingOrder;
