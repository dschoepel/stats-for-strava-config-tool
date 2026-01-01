import React from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text, Button, Input, VStack, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import { MdDragIndicator, MdExpandMore, MdChevronRight, MdArrowUpward, MdArrowDownward, MdDelete, MdClose } from 'react-icons/md';

/**
 * DashboardWidgetItem - Displays a single widget in the dashboard layout editor
 */
const DashboardWidgetItem = ({
  widget,
  index,
  isExpanded,
  isDragged,
  isFirst,
  isLast,
  widgetDefinitions,
  expandedConfigs,
  onToggleExpansion,
  onMoveUp,
  onMoveDown,
  onDelete,
  onWidthChange,
  onEnabledToggle,
  onConfigChange,
  onToggleConfigEditor,
  onDragStart,
  onDragOver,
  onDragEnd
}) => {
  const widgetDef = widgetDefinitions[widget.name];
  const displayName = widgetDef?.displayName || widget.name;
  const description = widgetDef?.description || '';

  return (
    <Box
      bg="cardBg"
      borderWidth="1px"
      borderColor={isDragged ? "blue.500" : "border"}
      borderRadius="md"
      p={{ base: 2, sm: isExpanded ? 4 : 2 }}
      opacity={isDragged ? 0.5 : 1}
      transition="all 0.2s"
      cursor="grab"
      _hover={{
        borderColor: "borderHover",
        boxShadow: "md"
      }}
      _active={{ cursor: "grabbing" }}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Widget Header */}
      <Flex
        align="center"
        gap={{ base: 1, sm: 3 }}
        mb={isExpanded ? 3 : 0}
      >
        <Box fontSize={{ base: "md", sm: "xl" }} color="textMuted" cursor="grab" userSelect="none" title="Drag to reorder" flexShrink={0}>
          <MdDragIndicator />
        </Box>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onToggleExpansion(index)}
          title={isExpanded ? "Collapse" : "Expand"}
          px={{ base: 0, sm: 1 }}
          minW="auto"
          flexShrink={0}
        >
          {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
        </Button>
        <Box flex="1" minH="32px" display="flex" alignItems="center" overflow="hidden">
          <Flex align="center" gap={{ base: 1, sm: 2 }} wrap="wrap">
            <Text
              fontSize={{ base: "sm", sm: "lg" }}
              fontWeight="600"
              title={description}
              noOfLines={1}
            >
              {displayName}
            </Text>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted" fontFamily="mono" display={{ base: "none", sm: "block" }}>
              ({widget.name})
            </Text>
          </Flex>
        </Box>
        <Flex gap={{ base: 0.5, sm: 1 }} flexShrink={0}>
          <Button
            size="xs"
            variant="outline"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            title="Move up"
            minW={{ base: "20px", sm: "32px" }}
            px={{ base: 0, sm: 1 }}
            fontSize={{ base: "10px", sm: "sm" }}
            h={{ base: "20px", sm: "auto" }}
          >
            <MdArrowUpward />
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            title="Move down"
            minW={{ base: "20px", sm: "32px" }}
            px={{ base: 0, sm: 1 }}
            fontSize={{ base: "10px", sm: "sm" }}
            h={{ base: "20px", sm: "auto" }}
          >
            <MdArrowDownward />
          </Button>
          <Button
            size="xs"
            variant="outline"
            colorPalette="red"
            onClick={() => onDelete(index)}
            title="Remove widget"
            minW={{ base: "20px", sm: "32px" }}
            px={{ base: 0, sm: 1 }}
            fontSize={{ base: "10px", sm: "sm" }}
            h={{ base: "20px", sm: "auto" }}
          >
            <MdDelete />
          </Button>
        </Flex>
      </Flex>

      {/* Widget Properties (when expanded) */}
      {isExpanded && (
        <>
          <Flex
            wrap="wrap"
            gap={4}
            align="center"
            pt={3}
            borderTopWidth="1px"
            borderColor="border"
          >
            {/* Width */}
            <Flex align="center" gap={2} fontSize="sm">
              <Text fontWeight="500" color="textSecondary" minW="80px">Width:</Text>
              <NativeSelectRoot width="120px">
                <NativeSelectField
                  value={widget.width}
                  onChange={(e) => onWidthChange(index, e.target.value)}
                  title="Widget width as percentage"
                  bg="inputBg"
                  size="sm"
                >
                  <option value="33">33%</option>
                  <option value="50">50%</option>
                  <option value="66">66%</option>
                  <option value="100">100%</option>
                </NativeSelectField>
              </NativeSelectRoot>
            </Flex>

            {/* Enabled Toggle */}
            <Flex align="center" gap={2} fontSize="sm">
              <Text fontWeight="500" color="textSecondary" minW="80px">Enabled:</Text>
              <Button
                size="sm"
                variant={widget.enabled ? "solid" : "outline"}
                colorPalette={widget.enabled ? "green" : "gray"}
                onClick={() => onEnabledToggle(index)}
                title={widget.enabled ? "Widget is enabled" : "Widget is disabled"}
              >
                {widget.enabled ? "Yes" : "No"}
              </Button>
            </Flex>
          </Flex>

          {/* Widget Configuration */}
          {widgetDef?.hasConfig && widget.config && Object.keys(widget.config).length > 0 && (
            <Box mt={3} pt={3} borderTopWidth="1px" borderColor="border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleConfigEditor(index)}
                mb={expandedConfigs[index] ? 2 : 0}
                leftIcon={expandedConfigs[index] ? <MdExpandMore /> : <MdChevronRight />}
              >
                Configuration
              </Button>

              {expandedConfigs[index] && (
                <VStack align="stretch" gap={3} pl={4}>
                  {Object.entries(widget.config).map(([key, value]) => (
                    <Flex
                      key={key}
                      align="flex-start"
                      gap={3}
                      fontSize="sm"
                      flexWrap="wrap"
                    >
                      <Text
                        fontWeight="500"
                        color="textSecondary"
                        minW="150px"
                        pt={1}
                      >
                        {key}:
                      </Text>
                      <Box flex="1" minW="200px">
                        {typeof value === 'number' ? (
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => onConfigChange(index, key, Number(e.target.value))}
                            bg="inputBg"
                            width="150px"
                            size="sm"
                          />
                        ) : typeof value === 'boolean' ? (
                          <Flex align="center" gap={2}>
                            <Input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => onConfigChange(index, key, e.target.checked)}
                              width="auto"
                              height="auto"
                              cursor="pointer"
                            />
                            <Text fontSize="sm">{value ? 'Yes' : 'No'}</Text>
                          </Flex>
                        ) : Array.isArray(value) ? (
                          <VStack align="stretch" gap={2} flex="1">
                            <Flex wrap="wrap" gap={2} minH="32px">
                              {value.map((item, itemIndex) => (
                                <Flex
                                  key={itemIndex}
                                  align="center"
                                  gap={1}
                                  px={2}
                                  py={1}
                                  bg="cardBg"
                                  borderWidth="1px"
                                  borderColor="border"
                                  borderRadius="md"
                                  fontSize="sm"
                                >
                                  <Text>{item}</Text>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => {
                                      const newArray = value.filter((_, i) => i !== itemIndex);
                                      onConfigChange(index, key, newArray);
                                    }}
                                    title="Remove item"
                                    px={1}
                                    minW="auto"
                                    h="auto"
                                  >
                                    <MdClose />
                                  </Button>
                                </Flex>
                              ))}
                            </Flex>
                          </VStack>
                        ) : (
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => onConfigChange(index, key, e.target.value)}
                            bg="inputBg"
                            width="200px"
                            size="sm"
                          />
                        )}
                      </Box>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

DashboardWidgetItem.propTypes = {
  widget: PropTypes.shape({
    name: PropTypes.string.isRequired,
    enabled: PropTypes.bool,
    width: PropTypes.string,
    config: PropTypes.object
  }).isRequired,
  index: PropTypes.number.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  isDragged: PropTypes.bool.isRequired,
  isFirst: PropTypes.bool.isRequired,
  isLast: PropTypes.bool.isRequired,
  widgetDefinitions: PropTypes.object.isRequired,
  expandedConfigs: PropTypes.object.isRequired,
  onToggleExpansion: PropTypes.func.isRequired,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onWidthChange: PropTypes.func.isRequired,
  onEnabledToggle: PropTypes.func.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  onToggleConfigEditor: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired
};

export default DashboardWidgetItem;
