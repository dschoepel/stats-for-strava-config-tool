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
      zIndex={9999}
    >
      <Box
        bg="yellow.400"
        color="gray.900"
        py={3}
        px={{ base: 2, sm: 4 }}
        textAlign="center"
        fontWeight="bold"
        boxShadow="0 4px 12px rgba(0,0,0,0.3)"
        borderBottom="3px solid"
        borderColor="orange.600"
      >
        <HStack justify="center" gap={{ base: 1, sm: 2 }}>
          <Icon 
            as={MdWarning} 
            boxSize={{ base: 5, sm: 6 }} 
            color="orange.600"
            css={{
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.5 }
              }
            }}
          />
          <Text fontSize={{ base: "sm", sm: "md" }} display={{ base: "none", sm: "block" }}>
            {message}
          </Text>
          <Text fontSize="sm" display={{ base: "block", sm: "none" }}>
            {shortMessage}
          </Text>
          <Icon 
            as={MdWarning} 
            boxSize={{ base: 5, sm: 6 }} 
            color="orange.600"
            css={{
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.5 }
              }
            }}
          />
        </HStack>
      </Box>
      
      {/* Animated Progress Bar */}
      <Box
        position="relative"
        height="3px"
        bg="orange.200"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          height="100%"
          bg="orange.600"
          css={{
            animation: "progress 1.5s ease-in-out infinite",
            "@keyframes progress": {
              "0%": {
                transform: "translateX(-100%)"
              },
              "50%": {
                transform: "translateX(0%)"
              },
              "100%": {
                transform: "translateX(100%)"
              }
            }
          }}
        />
      </Box>
    </Box>
  );
}
