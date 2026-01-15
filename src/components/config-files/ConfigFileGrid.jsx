import React from 'react';
import { Box, SimpleGrid, VStack, Flex, Text, Icon, Code, HStack, Button, Badge } from '@chakra-ui/react';
import { MdSettings, MdDescription, MdVisibility, MdEdit, MdBuild } from 'react-icons/md';

/**
 * ConfigFileCard - Displays a single configuration file card
 */
const ConfigFileCard = ({ file, onView, onEdit }) => {
  // Determine card styling based on file type
  const getBorderColor = () => {
    if (file.isMainConfig) return "primary";
    if (file.isGearMaintenance) return "orange.500";
    return "border";
  };

  const getIconColor = () => {
    if (file.isMainConfig) return 'primary';
    if (file.isGearMaintenance) return 'orange.500';
    return 'text';
  };

  const getIcon = () => {
    if (file.isMainConfig) return <MdSettings />;
    if (file.isGearMaintenance) return <MdBuild />;
    return <MdDescription />;
  };

  return (
    <Box
      p={4}
      bg="cardBg"
      borderRadius="md"
      border="2px solid"
      borderColor={getBorderColor()}
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
    >
      <VStack align="stretch" gap={3}>
        <Flex align="center" justify="space-between">
          <Text fontSize="lg" color={getIconColor()}>
            <Icon>
              {getIcon()}
            </Icon>
          </Text>
          {file.isMainConfig && (
            <Badge colorPalette="blue" size="sm">
              MAIN
            </Badge>
          )}
          {file.isGearMaintenance && (
            <Badge colorPalette="orange" size="sm">
              OPTIONAL
            </Badge>
          )}
        </Flex>
        
        <Box>
          <Text fontWeight="bold" color="text" mb={1} noOfLines={1}>
            {file.name}
          </Text>
          {file.isGearMaintenance ? (
            <Text fontSize="sm" color="textMuted">
              Gear maintenance configuration (not used for section mapping)
            </Text>
          ) : file.sections && file.sections.length > 0 ? (
            <Text fontSize="sm" color="textMuted">
              {file.sections.length} section{file.sections.length > 1 ? 's' : ''}: {' '}
              <Code bg="panelBg" px={1} fontSize="xs" color="text">
                {file.sections.join(', ')}
              </Code>
            </Text>
          ) : null}
        </Box>
        
        <HStack gap={2}>
          <Button
            onClick={() => onView(file)}
            size="sm"
            variant="outline"
            colorPalette="blue"
            flex={1}
          >
            <MdVisibility /> View
          </Button>
          <Button
            onClick={() => onEdit(file)}
            size="sm"
            variant="outline"
            colorPalette="green"
            flex={1}
          >
            <MdEdit /> Edit
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

/**
 * ConfigFileGrid - Displays a grid of configuration file cards
 */
const ConfigFileGrid = ({ files, selectedDirectory, onView, onEdit }) => {
  return (
    <Box>
      <Flex align="center" gap={2} mb={4} flexWrap="wrap">
        <Text fontSize="lg" fontWeight="semibold" color="text">
          Found {files.length} configuration file{files.length > 1 ? 's' : ''} in directory:
        </Text>
        <Code bg="panelBg" px={2} py={1} borderRadius="md" color="text" fontSize="sm">
          {selectedDirectory}
        </Code>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {files.map((file, index) => (
          <ConfigFileCard
            key={index}
            file={file}
            onView={onView}
            onEdit={onEdit}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ConfigFileGrid;
