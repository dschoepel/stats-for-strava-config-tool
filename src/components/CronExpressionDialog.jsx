import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Flex,
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { Cron } from 'react-js-cron';
import 'react-js-cron/dist/styles.css';

/**
 * CronExpressionDialog - Modal dialog for visual cron expression editor
 */
const CronExpressionDialog = ({ isOpen, onClose, initialValue, onSave }) => {
  const [cronExpression, setCronExpression] = useState(initialValue || '0 14 * * *');

  const handleSave = () => {
    onSave(cronExpression);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={1000}
        onClick={onClose}
      />

      {/* Dialog */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        bg="cardBg"
        borderRadius="lg"
        boxShadow="xl"
        zIndex={1001}
        width={{ base: "95%", sm: "90%", md: "700px" }}
        maxHeight="90vh"
        overflow="hidden"
        border="1px solid"
        borderColor="border"
      >
        <VStack align="stretch" gap={0}>
          {/* Header */}
          <Flex
            justify="space-between"
            align="center"
            p={4}
            borderBottom="1px solid"
            borderColor="border"
            bg="panelBg"
          >
            <Text fontSize="lg" fontWeight="semibold" color="text">
              Cron Expression Editor
            </Text>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              aria-label="Close"
            >
              <MdClose />
            </Button>
          </Flex>

          {/* Content */}
          <Box p={4} maxHeight="calc(90vh - 140px)" overflowY="auto">
            <VStack align="stretch" gap={4}>
              {/* Current Expression Display */}
              <Box
                p={3}
                bg="infoBg"
                borderRadius="md"
                border="1px solid"
                borderColor="border"
              >
                <Text fontSize="xs" color="textMuted" mb={1}>
                  Current Expression
                </Text>
                <Text fontSize="md" fontFamily="monospace" color="text" fontWeight="medium">
                  {cronExpression}
                </Text>
              </Box>

              {/* Cron Generator */}
              <Box
                className="cron-builder-container"
                sx={{
                  '& .react-js-cron': {
                    width: '100%',
                  },
                  '& .react-js-cron-field': {
                    marginBottom: '12px',
                  },
                  '& .react-js-cron-select': {
                    background: 'var(--chakra-colors-inputBg)',
                    border: '1px solid var(--chakra-colors-border)',
                    borderRadius: '6px',
                    color: 'var(--chakra-colors-text)',
                    padding: '6px 8px',
                    fontSize: '14px',
                    minWidth: '120px',
                  },
                  '& .react-js-cron-custom-select': {
                    background: 'var(--chakra-colors-inputBg)',
                    border: '1px solid var(--chakra-colors-border)',
                    borderRadius: '6px',
                    color: 'var(--chakra-colors-text)',
                  },
                  '& label': {
                    color: 'var(--chakra-colors-text)',
                    fontSize: '13px',
                    fontWeight: '500',
                    marginRight: '8px',
                  },
                }}
              >
                <Cron
                  value={cronExpression}
                  setValue={setCronExpression}
                  clearButton={false}
                />
              </Box>

              {/* Helper Text */}
              <Box
                p={3}
                bg="mutedBg"
                borderRadius="md"
                border="1px solid"
                borderColor="border"
              >
                <Text fontSize="xs" color="textMuted">
                  <strong>Tip:</strong> Use the dropdowns above to build your schedule visually. 
                  The cron expression updates automatically as you make changes.
                </Text>
              </Box>
            </VStack>
          </Box>

          {/* Footer */}
          <Flex
            justify="flex-end"
            align="center"
            gap={3}
            p={4}
            borderTop="1px solid"
            borderColor="border"
            bg="panelBg"
          >
            <Button
              onClick={onClose}
              variant="outline"
              colorPalette="gray"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              colorPalette="blue"
              size="sm"
            >
              Apply Expression
            </Button>
          </Flex>
        </VStack>
      </Box>
    </>
  );
};

export default CronExpressionDialog;
