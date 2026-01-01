import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, VStack, HStack, Text, Button, IconButton, Flex, Field, Input, Textarea } from '@chakra-ui/react';
import { MdAdd, MdDelete, MdArrowUpward, MdArrowDownward, MdExpandMore, MdChevronRight } from 'react-icons/md';

/**
 * AICommandsList - Manages list of AI chat commands
 */
const AICommandsList = ({ commands = [], onChange, errors = {} }) => {
  const [expandedCommands, setExpandedCommands] = useState({});

  const handleAdd = () => {
    onChange([...commands, { command: '', message: '' }]);
    setExpandedCommands(prev => ({ ...prev, [commands.length]: true }));
  };

  const handleRemove = (index) => {
    onChange(commands.filter((_, i) => i !== index));
    
    const newExpanded = {};
    Object.keys(expandedCommands).forEach(key => {
      const keyIndex = parseInt(key);
      if (keyIndex < index) {
        newExpanded[keyIndex] = expandedCommands[key];
      } else if (keyIndex > index) {
        newExpanded[keyIndex - 1] = expandedCommands[key];
      }
    });
    setExpandedCommands(newExpanded);
  };

  const handleMove = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= commands.length) return;
    
    const updated = [...commands];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  const toggleExpansion = (index) => {
    setExpandedCommands(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleUpdate = (index, field, value) => {
    const updated = [...commands];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Box 
      p={4} 
      bg="panelBg" 
      borderRadius="md"
      border="1px solid"
      borderColor="border"
    >
      <VStack align="stretch" gap={4}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
          <Box flex="1">
            <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="medium" color="text">
              Pre-defined Chat Commands
            </Text>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
              {commands.length} command{commands.length === 1 ? '' : 's'}
            </Text>
          </Box>
          <Button
            onClick={handleAdd}
            colorPalette="green"
            size={{ base: "sm", sm: "sm" }}
            leftIcon={<MdAdd />}
          >
            Add Command
          </Button>
        </Flex>

        {/* Info Box */}
        <Box 
          p={3} 
          bg="infoBg"
          _dark={{ bg: "infoBg" }}
          borderRadius="md" 
          border="1px solid" 
          borderColor="border"
        >
          <Text fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9}>
            Pre-define frequently used questions. For example, a command <code>analyse-last-workout</code> 
            can be used with <code>/analyse-last-workout</code> in the AI chat.
          </Text>
        </Box>

        {commands.length === 0 ? (
          <Box
            p={6}
            textAlign="center"
            bg="cardBg"
            borderRadius="md"
            border="2px dashed"
            borderColor="border"
          >
            <Text fontSize="sm" color="textMuted" mb={3}>
              No commands defined yet. Add commands for frequently asked questions.
            </Text>
            <Button
              onClick={handleAdd}
              colorPalette="green"
              size="sm"
              leftIcon={<MdAdd />}
            >
              Add First Command
            </Button>
          </Box>
        ) : (
          <VStack align="stretch" gap={3}>
            {commands.map((cmd, index) => {
              const isExpanded = expandedCommands[index];
              const hasErrors = Object.keys(errors).some(key => key.startsWith(`ai.agent.commands[${index}]`));

              return (
                <Box
                  key={index}
                  borderWidth="1px"
                  borderColor={hasErrors ? "warningBorder" : "border"}
                  _dark={{ borderColor: hasErrors ? "warningBorder" : "border" }}
                  borderRadius="md"
                  overflow="hidden"
                >
                  {/* Header */}
                  <Flex
                    p={{ base: 2, sm: 3 }}
                    bg={hasErrors ? "warningBg" : "panelBg"}
                    _dark={{ bg: hasErrors ? "warningBg" : "panelBg" }}
                    align="center"
                    gap={{ base: 1, sm: 2 }}
                    cursor="pointer"
                    onClick={() => toggleExpansion(index)}
                    _hover={{ opacity: 0.8 }}
                    wrap="wrap"
                  >
                    <Box as={isExpanded ? MdExpandMore : MdChevronRight} boxSize={{ base: "16px", sm: "20px" }} flexShrink={0} />
                    <Text fontWeight="600" color="text" flex="1" fontSize={{ base: "sm", sm: "md" }} minW="120px" fontFamily="mono">
                      /{cmd.command || `command-${index + 1}`}
                    </Text>
                    <HStack gap={{ base: 0.5, sm: 1 }} flexShrink={0}>
                      <IconButton
                        size={{ base: "xs", sm: "sm" }}
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(index, index - 1);
                        }}
                        isDisabled={index === 0}
                        aria-label="Move up"
                        minW={{ base: "24px", sm: "32px" }}
                        h={{ base: "24px", sm: "32px" }}
                        p={0}
                      >
                        <MdArrowUpward />
                      </IconButton>
                      <IconButton
                        size={{ base: "xs", sm: "sm" }}
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(index, index + 1);
                        }}
                        isDisabled={index === commands.length - 1}
                        aria-label="Move down"
                        minW={{ base: "24px", sm: "32px" }}
                        h={{ base: "24px", sm: "32px" }}
                        p={0}
                      >
                        <MdArrowDownward />
                      </IconButton>
                      <IconButton
                        size={{ base: "xs", sm: "sm" }}
                        variant="ghost"
                        colorPalette="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(index);
                        }}
                        aria-label="Remove"
                        minW={{ base: "24px", sm: "32px" }}
                        h={{ base: "24px", sm: "32px" }}
                        p={0}
                      >
                        <MdDelete />
                      </IconButton>
                    </HStack>
                  </Flex>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <Box p={{ base: 3, sm: 4 }} bg="cardBg">
                      <VStack align="stretch" gap={4}>
                        {/* Command Name */}
                        <Field.Root invalid={!!errors[`ai.agent.commands[${index}].command`]}>
                          <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Command</Field.Label>
                          <Input
                            value={cmd.command || ''}
                            onChange={(e) => handleUpdate(index, 'command', e.target.value)}
                            placeholder="analyse-last-workout"
                            bg="inputBg"
                            size={{ base: "sm", sm: "md" }}
                            fontFamily="mono"
                          />
                          <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                            Command name (use letters, numbers, hyphens). Will be used as /{cmd.command || 'command'}
                          </Field.HelperText>
                          {errors[`ai.agent.commands[${index}].command`] && (
                            <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                              {errors[`ai.agent.commands[${index}].command`]}
                            </Field.ErrorText>
                          )}
                        </Field.Root>

                        {/* Message */}
                        <Field.Root invalid={!!errors[`ai.agent.commands[${index}].message`]}>
                          <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Message/Question</Field.Label>
                          <Textarea
                            value={cmd.message || ''}
                            onChange={(e) => handleUpdate(index, 'message', e.target.value)}
                            placeholder="Analyze my last workout and provide insights..."
                            bg="inputBg"
                            size={{ base: "sm", sm: "md" }}
                            rows={3}
                          />
                          <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                            The question or instruction to send to the AI
                          </Field.HelperText>
                          {errors[`ai.agent.commands[${index}].message`] && (
                            <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                              {errors[`ai.agent.commands[${index}].message`]}
                            </Field.ErrorText>
                          )}
                        </Field.Root>
                      </VStack>
                    </Box>
                  )}
                </Box>
              );
            })}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

AICommandsList.propTypes = {
  commands: PropTypes.arrayOf(PropTypes.shape({
    command: PropTypes.string,
    message: PropTypes.string
  })),
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default AICommandsList;
