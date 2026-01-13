import React from 'react';
import PropTypes from 'prop-types';
import { Box, VStack, Flex, HStack, Heading, Button, SimpleGrid, Text, Icon } from '@chakra-ui/react';
import { MdInfo, MdEdit } from 'react-icons/md';

/**
 * LoadedFilesList - Displays grid of loaded YAML files with metadata
 * Shows file count, details, and "View Files" button
 */
const LoadedFilesList = ({ files, onViewFiles }) => {
  if (files.length === 0) return null;

  return (
    <Box p={{ base: 3, sm: 6 }} bg="cardBg" borderRadius="md" border="1px solid" borderColor="border">
      <VStack align="stretch" gap={4}>
        <Flex 
          justify="space-between" 
          align={{ base: "flex-start", sm: "center" }}
          direction={{ base: "column", sm: "row" }}
          gap={{ base: 2, sm: 0 }}
        >
          <HStack gap={2}>
            <Icon as={MdInfo} boxSize={{ base: 4, sm: 5 }} color="primary" />
            <Heading as="h3" size={{ base: "sm", sm: "md" }} color="text">
              Loaded Files ({files.length})
            </Heading>
          </HStack>
          <Button
            onClick={onViewFiles}
            bg="primary"
            color="white"
            _hover={{ bg: "primaryHover" }}
            size={{ base: "xs", sm: "md" }}
            leftIcon={<MdEdit />}
            w={{ base: "100%", sm: "auto" }}
            fontSize={{ base: "xs", sm: "sm" }}
          >
            View Files
          </Button>
        </Flex>
        
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={{ base: 2, sm: 3 }}>
          {files.map((file, index) => (
            <Flex
              key={index}
              p={{ base: 2, sm: 3 }}
              bg="panelBg"
              borderRadius="md"
              borderWidth="1px"
              borderColor="border"
              direction="column"
              align="stretch"
              _hover={{ borderColor: "primary" }}
              transition="all 0.2s"
              minW={0}
            >
              <VStack align="start" gap={0.5} flex={1} minW={0}>
                <Text
                  fontWeight="medium"
                  color="text"
                  fontSize={{ base: "xs", sm: "sm" }}
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  maxW="100%"
                  title={file.name}
                >
                  {file.name}
                </Text>
                <Text fontSize="2xs" color="textMuted" lineHeight="1.2">
                  {(file.size / 1024).toFixed(2)} KB
                </Text>
                <Text fontSize="2xs" color="textMuted" lineHeight="1.2">
                  {new Date(file.lastModified).toLocaleDateString()}
                </Text>
              </VStack>
            </Flex>
          ))}
        </SimpleGrid>
        
        <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
          These files are already loaded. Select more files above to add them, or click "View Files" to see them in the viewer.
        </Text>
      </VStack>
    </Box>
  );
};

LoadedFilesList.propTypes = {
  files: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    lastModified: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    content: PropTypes.string
  })).isRequired,
  onViewFiles: PropTypes.func.isRequired
};

export default LoadedFilesList;
