import React from 'react';
import PropTypes from 'prop-types';
import { Dialog, Portal, Button } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColorPalette = "blue"
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" zIndex={99998} />
        <Dialog.Positioner zIndex={99999}>
          <Dialog.Content
            maxW="400px"
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
                {title}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body
              p={{ base: 4, sm: 6 }}
              bg="cardBg"
            >
              <Dialog.Description
                fontSize={{ base: "sm", sm: "md" }}
                color="#1a202c"
                _dark={{ color: "#e2e8f0" }}
              >
                {message}
              </Dialog.Description>
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
                  {cancelText}
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette={confirmColorPalette}
                onClick={handleConfirm}
                size={{ base: "sm", sm: "md" }}
                fontSize={{ base: "xs", sm: "sm" }}
              >
                {confirmText}
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

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmColorPalette: PropTypes.string
};
