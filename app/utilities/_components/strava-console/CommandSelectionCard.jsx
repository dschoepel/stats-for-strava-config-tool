'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Flex,
  Spinner,
  NativeSelectRoot,
  NativeSelectField,
  Input
} from '@chakra-ui/react';
import {
  MdPlayArrow,
  MdStop,
  MdRefresh,
  MdSearch
} from 'react-icons/md';

/**
 * Card containing command selection dropdown, action buttons, and arguments input
 */
export default function CommandSelectionCard({
  commands,
  selectedCommandId,
  selectedCommand,
  isRunning,
  isLoadingCommands,
  isDiscovering,
  runnerStatus,
  terminalReady,
  args,
  argsError,
  onSelectCommand,
  onRun,
  onStop,
  onReload,
  onDiscover,
  onArgsChange,
  onArgsErrorClear
}) {
  return (
    <Box
      p={{ base: 4, sm: 5 }}
      bg="cardBg"
      borderRadius="lg"
      border="1px solid"
      borderColor="border"
    >
      <VStack align="stretch" gap={3}>
        {/* Command Row with Buttons */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
            Command
          </Text>
          {isLoadingCommands ? (
            <HStack gap={2} h="40px" align="center">
              <Spinner size="sm" color="primary" />
              <Text fontSize="sm" color="textMuted">Loading commands...</Text>
            </HStack>
          ) : (
            <Flex gap={2} wrap="wrap" align="center">
              <Box flex="1" minW={{ base: "100%", sm: "200px" }}>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={selectedCommandId || ''}
                    onChange={(e) => onSelectCommand(e.target.value)}
                    disabled={isRunning}
                    placeholder="Select a command"
                  >
                    {commands.map((cmd) => (
                      <option key={cmd.id} value={cmd.id}>
                        {cmd.name}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>

              {/* Action Buttons */}
              {!isRunning ? (
                <Button
                  colorPalette="green"
                  onClick={onRun}
                  disabled={!selectedCommand || !terminalReady || runnerStatus !== 'online'}
                  size="sm"
                  title="Run command"
                >
                  <Icon as={MdPlayArrow} />
                  <Text display={{ base: "none", sm: "inline" }} ml={1}>Run</Text>
                </Button>
              ) : (
                <Button
                  colorPalette="red"
                  onClick={onStop}
                  size="sm"
                  title="Stop command"
                >
                  <Icon as={MdStop} />
                  <Text display={{ base: "none", sm: "inline" }} ml={1}>Stop</Text>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onReload}
                disabled={isRunning}
                title="Reload commands"
                color="text"
                borderColor="border"
              >
                <Icon as={MdRefresh} />
                <Text display={{ base: "none", sm: "inline" }} ml={1}>Reload</Text>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onDiscover}
                disabled={isRunning || isDiscovering || runnerStatus !== 'online'}
                title="Discover commands from the Strava container"
                color="text"
                borderColor="border"
              >
                {isDiscovering ? <Spinner size="xs" /> : <Icon as={MdSearch} />}
                <Text display={{ base: "none", sm: "inline" }} ml={1}>Discover</Text>
              </Button>
            </Flex>
          )}
        </Box>

        {/* Command Info */}
        {selectedCommand && (
          <Box
            p={3}
            bg="gray.50"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
          >
            <VStack align="stretch" gap={1}>
              <Text fontSize="xs" color="gray.700" _dark={{ color: 'gray.200' }}>
                {selectedCommand.description}
              </Text>
              <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }} fontFamily="mono" wordBreak="break-word">
                php bin/console {selectedCommand.command}
              </Text>
            </VStack>
          </Box>
        )}

        {/* Arguments Input - Show when command accepts args */}
        {selectedCommand?.acceptsArgs && (
          <Box mt={3}>
            <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
              Arguments {selectedCommand.argsDescription && (
                <Text as="span" fontWeight="normal" color="textMuted">
                  — {selectedCommand.argsDescription}
                </Text>
              )}
            </Text>
            <VStack align="stretch" gap={2}>
              <Input
                value={args}
                onChange={(e) => {
                  onArgsChange(e.target.value);
                  onArgsErrorClear();
                }}
                placeholder={selectedCommand.argsPlaceholder || 'Enter arguments'}
                disabled={isRunning}
                fontFamily="mono"
                fontSize="sm"
                borderColor={argsError ? 'red.500' : 'border'}
                _focus={{
                  borderColor: argsError ? 'red.500' : 'blue.500',
                  boxShadow: argsError ? '0 0 0 1px var(--chakra-colors-red-500)' : '0 0 0 1px var(--chakra-colors-blue-500)'
                }}
              />
              {argsError && (
                <Text fontSize="sm" color="red.500">
                  {argsError}
                </Text>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
