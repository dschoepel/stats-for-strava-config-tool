import React from 'react';
import PropTypes from 'prop-types';
import { Dialog, Portal, Button, Text, VStack } from '@chakra-ui/react';

/**
 * FileExistsConflictDialog - Dialog shown when attempting to create a file that already exists
 * Provides options: Cancel, Choose Different Name, or Open for Editing
 */
const FileExistsConflictDialog = ({ 
  isOpen, 
  onClose, 
  fileName,
  onCancel,
  onChooseDifferentName,
  onOpenExisting
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={() => onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="500px" bg="cardBg">
            <Dialog.Header>
              <Dialog.Title color={{ base: '#1a202c', _dark: '#f7fafc' }}>
                File Already Exists
              </Dialog.Title>
            </Dialog.Header>
            
            <Dialog.Body bg="cardBg">
              <VStack align="stretch" gap={4}>
                <Text color={{ base: '#2d3748', _dark: '#e2e8f0' }}>
                  A file named <strong>{fileName}</strong> already exists at this location.
                </Text>
                <Text color={{ base: '#2d3748', _dark: '#e2e8f0' }}>
                  You can edit this file on the Configuration page, or you can:
                </Text>
                <VStack align="stretch" gap={2} pl={4}>
                  <Text fontSize="sm" color={{ base: '#4a5568', _dark: '#cbd5e0' }}>
                    • Choose a different name for your new file
                  </Text>
                  <Text fontSize="sm" color={{ base: '#4a5568', _dark: '#cbd5e0' }}>
                    • Open the existing file for editing here
                  </Text>
                </VStack>
              </VStack>
            </Dialog.Body>
            
            <Dialog.Footer gap={3}>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="blue" onClick={onChooseDifferentName}>
                Choose Different Name
              </Button>
              <Button colorPalette="green" onClick={onOpenExisting}>
                Open for Editing
              </Button>
            </Dialog.Footer>
            
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

FileExistsConflictDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fileName: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onChooseDifferentName: PropTypes.func.isRequired,
  onOpenExisting: PropTypes.func.isRequired
};

export default FileExistsConflictDialog;
