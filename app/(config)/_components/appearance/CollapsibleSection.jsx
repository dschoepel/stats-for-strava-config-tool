import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { MdExpandMore, MdChevronRight } from 'react-icons/md';

/**
 * CollapsibleSection - Reusable wrapper for collapsible content sections
 */
const CollapsibleSection = ({ 
  title, 
  isExpanded, 
  onToggle, 
  children,
  icon = null,
  badge = null
}) => {
  return (
    <Box borderWidth="1px" borderColor="border" borderRadius="md" overflow="hidden" mb={4}>
      <Button
        onClick={onToggle}
        width="100%"
        justifyContent="space-between"
        variant="ghost"
        fontWeight="600"
        bg="panelBg"
        color="text"
        _hover={{ bg: "cardBg" }}
        px={4}
        py={3}
        fontSize={{ base: "sm", sm: "md" }}
      >
        <Flex align="center" gap={2} minW={0} flex={1}>
          <Box as={isExpanded ? MdExpandMore : MdChevronRight} flexShrink={0} />
          {icon && <Box as={icon} flexShrink={0} />}
          <Text noOfLines={1}>{title}</Text>
        </Flex>
        {badge && (
          <Text fontSize="xs" color="textMuted" fontWeight="normal" ml={2} flexShrink={0}>
            {badge}
          </Text>
        )}
      </Button>
      
      {isExpanded && (
        <Box p={4} borderTopWidth="1px" borderColor="border">
          <VStack align="stretch" gap={4}>
            {children}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  icon: PropTypes.element,
  badge: PropTypes.node
};

export default CollapsibleSection;
