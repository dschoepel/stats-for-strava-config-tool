import React from 'react';
import { Box, Flex, VStack, Heading, Text, Button, IconButton, Icon } from '@chakra-ui/react';
import { MdClose, MdComputer, MdStorage } from 'react-icons/md';

/**
 * Modal for selecting download destination (PC or Server)
 */
const DownloadDestinationModal = ({ isOpen, fileName, onSelect, onClose }) => {
  if (!isOpen) return null;

  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
      bg="rgba(0, 0, 0, 0.6)"
      zIndex="9999"
      align="center"
      justify="center"
      onClick={onClose}
    >
      <Box
        bg="cardBg"
        borderRadius="lg"
        boxShadow="dark-lg"
        width={{ base: "90%", sm: "400px" }}
        maxWidth="400px"
        overflow="hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Flex
          bg="primary"
          color="white"
          p={{ base: 3, sm: 4 }}
          align="center"
          justify="space-between"
        >
          <Heading size={{ base: "sm", sm: "md" }}>
            Download Destination
          </Heading>
          <IconButton
            onClick={onClose}
            size="sm"
            variant="ghost"
            colorPalette="whiteAlpha"
            aria-label="Close"
          >
            <Icon><MdClose /></Icon>
          </IconButton>
        </Flex>

        {/* Body */}
        <VStack p={{ base: 4, sm: 6 }} gap={4} align="stretch">
          <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
            Where would you like to save {fileName ? <><strong>{fileName}</strong></> : <>the selected files</>}?
          </Text>

          {/* PC Option */}
          <Button
            size="lg"
            colorPalette="blue"
            onClick={() => onSelect('pc')}
            height="auto"
            py={4}
          >
            <VStack gap={1} align="start" width="100%">
              <Flex align="center" gap={2}>
                <Icon fontSize="xl"><MdComputer /></Icon>
                <Text fontWeight="600">Download to PC</Text>
              </Flex>
              <Text fontSize="xs" fontWeight="normal" color="blue.200">
                Save file to your computer's downloads folder
              </Text>
            </VStack>
          </Button>

          {/* Server Option */}
          <Button
            size="lg"
            colorPalette="green"
            onClick={() => onSelect('server')}
            height="auto"
            py={4}
          >
            <VStack gap={1} align="start" width="100%">
              <Flex align="center" gap={2}>
                <Icon fontSize="xl"><MdStorage /></Icon>
                <Text fontWeight="600">Save to Server</Text>
              </Flex>
              <Text fontSize="xs" fontWeight="normal" color="green.200">
                Save to Docker container's file system (not host server)
              </Text>
            </VStack>
          </Button>

          <Text fontSize="2xs" color="gray.500" _dark={{ color: "gray.500" }} textAlign="center">
            Note: Server files are saved to the Docker container's internal file system, 
            not the host machine running Docker.
          </Text>

          <Button
            variant="ghost"
            onClick={onClose}
            mt={2}
          >
            Cancel
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
};

export default DownloadDestinationModal;
