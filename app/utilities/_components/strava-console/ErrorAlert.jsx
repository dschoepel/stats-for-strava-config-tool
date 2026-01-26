'use client';

import { Box, Text } from '@chakra-ui/react';

/**
 * Alert box for displaying error messages
 * @param {Object} props
 * @param {string} props.message - Error message to display
 */
export default function ErrorAlert({ message }) {
  if (!message) return null;

  return (
    <Box
      p={4}
      bg="red.50"
      borderRadius="md"
      border="1px solid"
      borderColor="red.200"
      _dark={{ bg: 'rgba(239, 68, 68, 0.1)', borderColor: 'red.700' }}
    >
      <Text color="red.600" _dark={{ color: 'red.200' }}>
        {message}
      </Text>
    </Box>
  );
}
