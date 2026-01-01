import React from 'react';
import PropTypes from 'prop-types';
import { Dialog, Portal, Button, Input, Text, VStack, Box } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';

/**
 * FileCreationDialog - Dialog for creating new YAML configuration files
 * Handles filename input and validation according to naming conventions
 */
const FileCreationDialog = ({ 
  isOpen, 
  onClose, 
  fileName, 
  onFileNameChange,
  error,
  onConfirm 
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onConfirm();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="500px"
            borderRadius="lg"
            boxShadow="xl"
            bg="cardBg"
          >
            <Dialog.Header
              bg="#E2E8F0"
              _dark={{ bg: "#334155" }}
              borderTopRadius="lg"
            >
              <Dialog.Title 
                fontSize={{ base: "md", sm: "lg" }}
                color="#1a202c"
                _dark={{ color: "#f7fafc" }}
              >
                Create New Configuration File
              </Dialog.Title>
            </Dialog.Header>
            
            <Dialog.Body p={{ base: 4, sm: 6 }} bg="cardBg">
              <VStack align="stretch" gap={3}>
                <Box>
                  <Text fontSize="sm" fontWeight="600" mb={2}>
                    Filename:
                  </Text>
                  <Input
                    value={fileName}
                    onChange={(e) => onFileNameChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="config-new.yaml"
                    bg="inputBg"
                    color="text"
                    autoFocus
                  />
                </Box>
                
                {error && (
                  <Text fontSize="xs" color="red.600" _dark={{ color: "red.400" }}>
                    {error}
                  </Text>
                )}
                
                <Box
                  p={3}
                  bg="blue.50"
                  _dark={{ bg: "blue.900/30", borderColor: "blue.700" }}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="blue.200"
                >
                  <Text fontSize="xs" color="blue.700" _dark={{ color: "blue.300" }}>
                    <Text as="strong">Naming Convention:</Text><br />
                    • Use "config.yaml" for main configuration<br />
                    • Or start with "config-" for additional files<br />
                    • All files must end with ".yaml"<br />
                    <Text as="em" mt={1} display="block">
                      Examples: config.yaml, config-athlete.yaml, config-webhooks.yaml
                    </Text>
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>
            
            <Dialog.Footer
              gap={3}
              justify="flex-end"
              p={{ base: 3, sm: 4 }}
              bg="#E2E8F0"
              _dark={{ bg: "#334155" }}
              borderBottomRadius="lg"
            >
              <Dialog.ActionTrigger asChild>
                <Button
                  variant="outline"
                  onClick={onClose}
                  size={{ base: "sm", sm: "md" }}
                  fontSize={{ base: "xs", sm: "sm" }}
                >
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="blue"
                onClick={onConfirm}
                size={{ base: "sm", sm: "md" }}
                fontSize={{ base: "xs", sm: "sm" }}
              >
                Create File
              </Button>
            </Dialog.Footer>
            
            <Dialog.CloseTrigger
              asChild
              position="absolute"
              top={{ base: 2, sm: 3 }}
              right={{ base: 2, sm: 3 }}
            >
              <Button
                variant="ghost"
                size={{ base: "xs", sm: "sm" }}
                minW={{ base: "28px", sm: "32px" }}
                h={{ base: "28px", sm: "32px" }}
                p={0}
              >
                <MdClose />
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

FileCreationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fileName: PropTypes.string.isRequired,
  onFileNameChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  onConfirm: PropTypes.func.isRequired
};

export default FileCreationDialog;
