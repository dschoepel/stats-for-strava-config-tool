import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Input, Flex, Text, Grid, VStack, HStack } from '@chakra-ui/react';
import { Checkbox } from '@chakra-ui/react';
import { MdExpandMore, MdChevronRight } from 'react-icons/md';

/**
 * SportTypeMultiSelect - Reusable component for selecting multiple sport types
 * Organizes sports by category with collapsible sections
 */
const SportTypeMultiSelect = ({ 
  fieldName,
  fieldSchema, 
  fieldPath, 
  value, 
  onChange, 
  hasError,
  sportsList,
  subsectionKey = null
}) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isExpanded, setIsExpanded] = useState(subsectionKey ? true : true);
  
  const selectedSports = Array.isArray(value) ? value : [];

  const handleSportToggle = (sport) => {
    const newSelection = selectedSports.includes(sport)
      ? selectedSports.filter(s => s !== sport)
      : [...selectedSports, sport];
    onChange(fieldPath, newSelection);
  };

  // Namespace category keys by subsection to keep them independent
  const getCategoryKey = (category) => {
    return subsectionKey ? `${subsectionKey}-${category}` : category;
  };

  const toggleSportCategory = (category) => {
    const categoryKey = getCategoryKey(category);
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const expandAllCategories = () => {
    setExpandedCategories(prev => {
      const updated = { ...prev };
      Object.keys(sportsList).forEach(cat => {
        updated[getCategoryKey(cat)] = true;
      });
      return updated;
    });
  };

  const collapseAllCategories = () => {
    setExpandedCategories(prev => {
      const updated = { ...prev };
      Object.keys(sportsList).forEach(cat => {
        updated[getCategoryKey(cat)] = false;
      });
      return updated;
    });
  };

  const clearAll = () => {
    onChange(fieldPath, []);
  };

  const toggleSubsection = () => {
    setIsExpanded(!isExpanded);
  };

  const selectedCount = selectedSports.length;

  return (
    <Box mb={4} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
      {subsectionKey && (
        <Button
          onClick={toggleSubsection}
          width="100%"
          justifyContent="space-between"
          variant="ghost"
          fontWeight="600"
          fontSize={{ base: "xs", sm: "sm" }}
          bg="panelBg"
          color="text"
          _hover={{ bg: "cardBg" }}
          px={{ base: 2, sm: 4 }}
        >
          <Flex align="center" minW={0} flex={1}>
            <Box as={isExpanded ? MdExpandMore : MdChevronRight} mr={{ base: 1, sm: 2 }} flexShrink={0} />
            <Text noOfLines={1}>{fieldSchema.title || fieldName}</Text>
          </Flex>
          <Text fontSize="xs" color="textMuted" fontWeight="normal" ml={2} flexShrink={0}>
            {selectedCount}
          </Text>
        </Button>
      )}
      
      {isExpanded && (
        <Box p={3}>
          <Text fontWeight="500" mb={1} fontSize="sm">
            {fieldSchema.title || fieldName}
          </Text>
          {fieldSchema.description && (
            <Text fontSize="sm" color="textMuted" mb={2}>{fieldSchema.description}</Text>
          )}
          
          {Object.keys(sportsList).length === 0 ? (
            <Text fontSize="sm" color="textMuted">
              No sports configured. Add sports in Settings → Sports List.
            </Text>
          ) : (
            <>
              <HStack mb={2} gap={2} flexWrap="wrap">
                <Button 
                  onClick={expandAllCategories} 
                  size="xs" 
                  variant="ghost"
                  fontSize={{ base: "xs", sm: "sm" }}
                >
                  Expand All
                </Button>
                <Button 
                  onClick={collapseAllCategories} 
                  size="xs" 
                  variant="ghost"
                  fontSize={{ base: "xs", sm: "sm" }}
                >
                  Collapse All
                </Button>
                {selectedCount > 0 && (
                  <Button 
                    onClick={clearAll} 
                    size="xs" 
                    variant="ghost"
                    colorPalette="red"
                    fontSize={{ base: "xs", sm: "sm" }}
                  >
                    Clear All ({selectedCount})
                  </Button>
                )}
              </HStack>
              
              <VStack align="stretch" gap={2}>
                {Object.entries(sportsList).map(([category, sports]) => {
                  const categoryKey = getCategoryKey(category);
                  const isCategoryExpanded = expandedCategories[categoryKey] !== false;
                  const categorySelectedCount = sports.filter(sport => selectedSports.includes(sport)).length;
                  
                  return (
                    <Box key={category} borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden">
                      <Button
                        onClick={() => toggleSportCategory(category)}
                        width="100%"
                        justifyContent="space-between"
                        variant="ghost"
                        size="sm"
                        bg="cardBg"
                        color="text"
                        fontSize={{ base: "xs", sm: "sm" }}
                        px={{ base: 2, sm: 3 }}
                      >
                        <Flex align="center" minW={0} flex={1} overflow="hidden">
                          <Box as={isCategoryExpanded ? MdExpandMore : MdChevronRight} mr={{ base: 1, sm: 2 }} flexShrink={0} />
                          <Text noOfLines={1} overflow="hidden" textOverflow="ellipsis">{category}</Text>
                        </Flex>
                        <Text fontSize="xs" color="textMuted" fontWeight="normal" ml={2} flexShrink={0}>
                          {categorySelectedCount}/{sports.length}
                        </Text>
                      </Button>
                      
                      {isCategoryExpanded && (
                        <Grid 
                          templateColumns="repeat(auto-fill, minmax(140px, 1fr))" 
                          gap={2} 
                          p={3}
                        >
                          {sports.map(sport => (
                            <Checkbox.Root
                              key={sport}
                              checked={selectedSports.includes(sport)}
                              onCheckedChange={() => handleSportToggle(sport)}
                              size={{ base: "sm", sm: "md" }}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <Checkbox.Label fontSize={{ base: "xs", sm: "sm" }}>
                                <Text noOfLines={1} fontSize={{ base: "xs", sm: "sm" }}>
                                  {sport}
                                </Text>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </>
          )}
          
          {hasError && (
            <Text color="red.500" fontSize="sm" mt={2}>{hasError}</Text>
          )}
        </Box>
      )}
    </Box>
  );
};

SportTypeMultiSelect.propTypes = {
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
  })).isRequired,
  subsectionKey: PropTypes.string
};

export default SportTypeMultiSelect;
