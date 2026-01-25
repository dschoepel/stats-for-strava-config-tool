'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Flex
} from '@chakra-ui/react';
import {
  MdClose,
  MdMerge,
  MdSwapHoriz,
  MdNewReleases,
  MdWarning
} from 'react-icons/md';

/**
 * Dialog component for displaying discovered commands from the Strava container.
 * Allows users to merge new commands or replace all existing commands.
 */
export default function DiscoverCommandsDialog({
  commands,
  existingCommands,
  onMerge,
  onOverwrite,
  onClose,
  error
}) {
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  // Determine which commands are new vs existing
  const { commandEntries, newCount, existingCount } = useMemo(() => {
    const existingIds = new Set(existingCommands.map(cmd => cmd.id));
    const entries = Object.entries(commands).map(([id, entry]) => ({
      id,
      name: entry.name || id,
      description: entry.description || '',
      acceptsArgs: entry.acceptsArgs || false,
      isNew: !existingIds.has(id)
    }));

    const newOnes = entries.filter(e => e.isNew).length;
    return {
      commandEntries: entries,
      newCount: newOnes,
      existingCount: entries.length - newOnes
    };
  }, [commands, existingCommands]);

  if (error) {
    return (
      <Box
        p={{ base: 3, sm: 4, md: 5 }}
        bg="cardBg"
        borderRadius="lg"
        border="1px solid"
        borderColor="red.200"
        _dark={{ borderColor: 'red.700' }}
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontWeight="medium" color="red.600" _dark={{ color: 'red.300' }} fontSize={{ base: "sm", sm: "md" }}>
            Discovery Failed
          </Text>
          <Button size="xs" variant="ghost" onClick={onClose}>
            <Icon as={MdClose} />
          </Button>
        </Flex>
        <Text fontSize="sm" color="red.500" _dark={{ color: 'red.400' }}>
          {error}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      p={{ base: 3, sm: 4, md: 5 }}
      bg="cardBg"
      borderRadius="lg"
      border="1px solid"
      borderColor="border"
    >
      {/* Header */}
      <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} mb={4} gap={2}>
        <VStack align="flex-start" gap={1} flex={1}>
          <Text fontWeight="semibold" color="text" fontSize={{ base: "sm", sm: "md" }}>
            Discovered Commands
          </Text>
          <HStack gap={2} flexWrap="wrap">
            <Badge colorPalette="blue" variant="subtle" size="sm">
              {commandEntries.length} found
            </Badge>
            {newCount > 0 && (
              <Badge colorPalette="green" variant="subtle" size="sm">
                {newCount} new
              </Badge>
            )}
          </HStack>
        </VStack>
        <Button size="xs" variant="ghost" onClick={onClose} color="text">
          <Icon as={MdClose} />
        </Button>
      </Flex>

      {/* Command List */}
      <Box
        maxH="300px"
        overflowY="auto"
        mb={4}
        borderRadius="md"
        border="1px solid"
        borderColor="border"
      >
        <VStack align="stretch" gap={0}>
          {commandEntries.map((entry, index) => (
            <Flex
              key={entry.id}
              px={{ base: 3, sm: 4 }}
              py={3}
              align="center"
              gap={3}
              bg={entry.isNew ? 'green.50' : 'transparent'}
              _dark={{ bg: entry.isNew ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}
              borderTop={index > 0 ? '1px solid' : 'none'}
              borderColor="border"
            >

              <Box flex="1" minW={0}>
                <VStack align="flex-start" gap={1}>
                  <Text fontSize="sm" fontWeight="medium" color="text" overflow="hidden" textOverflow="ellipsis" whiteSpace={{ base: "normal", sm: "nowrap" }} wordBreak={{ base: "break-word", sm: "normal" }}>
                    {entry.name}
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    {entry.isNew && (
                      <Badge colorPalette="green" variant="solid" size="xs">
                        <HStack gap={1}>
                          <Icon as={MdNewReleases} boxSize={3} />
                          <Text>New</Text>
                        </HStack>
                      </Badge>
                    )}
                    {entry.acceptsArgs && (
                      <Badge colorPalette="blue" variant="subtle" size="xs">
                        requires arguments
                      </Badge>
                    )}
                  </HStack>
                </VStack>
                {entry.description && (
                  <Text fontSize="xs" color="textMuted" truncate mt={1}>
                    {entry.description}
                  </Text>
                )}

                <Text fontSize="xs" color="textMuted" fontFamily="mono" mt={0.5} overflow="hidden" textOverflow="ellipsis" whiteSpace={{ base: "normal", sm: "nowrap" }} wordBreak={{ base: "break-word", sm: "normal" }}>
                  php bin/console app:strava:{entry.id}
                </Text>
              </Box>
            </Flex>
          ))}
        </VStack>
      </Box>

      {/* Summary */}
      <Text fontSize="xs" color="textMuted" mb={4}>
        {newCount > 0
          ? `${newCount} new command${newCount > 1 ? 's' : ''} found, ${existingCount} already configured.`
          : 'All discovered commands are already in your configuration.'}
      </Text>

      {/* Actions */}
      {!confirmOverwrite ? (
        <Flex gap={3} justify="flex-end" direction={{ base: "column", sm: "row" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            color="text"
            borderColor="border"
            w={{ base: "100%", sm: "auto" }}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            colorPalette="orange"
            onClick={() => setConfirmOverwrite(true)}
            w={{ base: "100%", sm: "auto" }}
          >
            <Icon as={MdSwapHoriz} mr={2} />
            Replace All
          </Button>
          <Button
            colorPalette="green"
            size="sm"
            onClick={() => onMerge(commands)}
            disabled={newCount === 0}
            title={newCount === 0 ? 'No new commands to merge' : `Add ${newCount} new command${newCount > 1 ? 's' : ''}`}
            w={{ base: "100%", sm: "auto" }}
          >
            <Icon as={MdMerge} mr={2} />
            Merge ({newCount} new)
          </Button>
        </Flex>
      ) : (
        <Box
          p={3}
          bg="orange.50"
          borderRadius="md"
          border="1px solid"
          borderColor="orange.200"
          _dark={{ bg: 'rgba(251, 146, 60, 0.1)', borderColor: 'orange.700' }}
        >

          <Flex gap={2} align="center" mb={3}>
            <Icon as={MdWarning} color="orange.500" boxSize={4} />
            <Text fontSize="sm" fontWeight="medium" color="orange.700" _dark={{ color: 'orange.200' }}>
              This will replace all existing commands with the {commandEntries.length} discovered commands.
            </Text>
          </Flex>
          <Flex gap={2} justify="flex-end" direction={{ base: "column", sm: "row" }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmOverwrite(false)}
              color="text"
              borderColor="border"
              w={{ base: "100%", sm: "auto" }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              colorPalette="orange"
              onClick={() => onOverwrite(commands)}
              w={{ base: "100%", sm: "auto" }}
            >
              Confirm Replace All
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
