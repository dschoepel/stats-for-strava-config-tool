'use client';

import { Component } from 'react';
import { Box, VStack, Text, Button, Icon, Heading } from '@chakra-ui/react';
import { MdError, MdRefresh } from 'react-icons/md';

/**
 * Error boundary for the Strava Console
 * Catches JavaScript errors in child components and displays a fallback UI
 */
class ConsoleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('ConsoleErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          p={6}
          bg="cardBg"
          borderRadius="lg"
          border="1px solid"
          borderColor="red.500"
        >
          <VStack gap={4} align="center">
            <Icon as={MdError} boxSize={12} color="red.500" />
            <Heading size="md" color="text">
              Something went wrong
            </Heading>
            <Text color="textMuted" textAlign="center" maxW="400px">
              The console encountered an unexpected error. This may be due to a
              connection issue or a problem with the terminal component.
            </Text>
            {this.state.error && (
              <Box
                p={3}
                bg="gray.900"
                borderRadius="md"
                maxW="100%"
                overflowX="auto"
              >
                <Text
                  fontSize="xs"
                  fontFamily="mono"
                  color="red.300"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                >
                  {this.state.error.toString()}
                </Text>
              </Box>
            )}
            <Button
              colorPalette="blue"
              onClick={this.handleReset}
              size="md"
            >
              <Icon as={MdRefresh} mr={2} />
              Try Again
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ConsoleErrorBoundary;
