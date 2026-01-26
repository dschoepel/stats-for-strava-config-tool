'use client';

import { Box, HStack, Text, Icon } from '@chakra-ui/react';
import { MdWarning } from 'react-icons/md';

/**
 * Fixed warning banner displayed when a command is running
 * @param {Object} props
 * @param {string} props.message - Full message for larger screens
 * @param {string} props.shortMessage - Shortened message for mobile
 */
export default function WarningBanner({ message, shortMessage }) {
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bg="orange.500"
      color="white"
      py={2}
      px={{ base: 2, sm: 4 }}
      textAlign="center"
      zIndex={9999}
      fontWeight="bold"
      boxShadow="lg"
    >
      <HStack justify="center" gap={{ base: 1, sm: 2 }}>
        <Icon as={MdWarning} boxSize={{ base: 4, sm: 5 }} />
        <Text fontSize={{ base: "xs", sm: "sm" }} display={{ base: "none", sm: "block" }}>
          {message}
        </Text>
        <Text fontSize="xs" display={{ base: "block", sm: "none" }}>
          {shortMessage}
        </Text>
        <Icon as={MdWarning} boxSize={{ base: 4, sm: 5 }} />
      </HStack>
    </Box>
  );
}
