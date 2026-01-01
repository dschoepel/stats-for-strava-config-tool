import React from 'react';
import { Box, Flex, HStack, VStack, Text, Button, IconButton, Icon, Code } from '@chakra-ui/react';
import { MdExpandMore, MdChevronRight, MdEdit, MdDelete } from 'react-icons/md';

/**
 * WidgetListItem - Displays a widget definition with expand/collapse functionality
 */
const WidgetListItem = ({ widget, isExpanded, onToggle, onEdit, onDelete }) => {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="md"
      overflow="hidden"
      bg="cardBg"
    >
      <Flex
        justify="space-between"
        align="center"
        bg="panelBg"
      >
        <Button
          onClick={() => onToggle(widget.name)}
          variant="ghost"
          flex={1}
          justifyContent="flex-start"
          px={4}
          py={3}
          borderRadius={0}
          _hover={{ bg: { base: "#e9ecef", _dark: "#334155" } }}
        >
          <HStack gap={3} flex={1}>
            <Icon fontSize="xl">
              {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
            </Icon>
            <Text fontWeight="semibold" fontSize="md" color="text">
              {widget.displayName}
            </Text>
            <Box
              px={2}
              py={1}
              borderRadius="md"
              bg={widget.hasConfig ? "primary" : "panelBg"}
              color={widget.hasConfig ? "white" : "textMuted"}
              fontSize="xs"
              fontWeight="medium"
            >
              {widget.hasConfig ? 'Config' : 'No Config'}
            </Box>
          </HStack>
        </Button>
        <HStack gap={1} px={2}>
          <IconButton
            onClick={() => onEdit(widget)}
            title="Edit widget definition"
            aria-label="Edit widget"
            size="sm"
            variant="ghost"
            colorPalette="gray"
          >
            <Icon><MdEdit /></Icon>
          </IconButton>
          <IconButton
            onClick={() => onDelete(widget.name)}
            title="Delete widget definition"
            aria-label="Delete widget"
            size="sm"
            variant="ghost"
            colorPalette="red"
          >
            <Icon><MdDelete /></Icon>
          </IconButton>
        </HStack>
      </Flex>

      {isExpanded && (
        <Box px={4} py={3} bg={{ base: "#f8f9fa", _dark: "#0f172a" }}>
          <VStack align="stretch" gap={2}>
            <HStack>
              <Text fontWeight="bold" color="text">Name:</Text>
              <Code bg="inputBg" px={2} py={1} borderRadius="sm">{widget.name}</Code>
            </HStack>
            <HStack align="flex-start">
              <Text fontWeight="bold" color="text">Description:</Text>
              <Text color="text">{widget.description}</Text>
            </HStack>
            {widget.hasConfig && widget.configTemplate && (
              <Box>
                <Text fontWeight="bold" color="text" mb={2}>Config Template:</Text>
                <Box
                  as="pre"
                  bg="inputBg"
                  p={3}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="border"
                  fontSize="sm"
                  overflowX="auto"
                  color="text"
                >
                  {widget.configTemplate}
                </Box>
              </Box>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default WidgetListItem;
