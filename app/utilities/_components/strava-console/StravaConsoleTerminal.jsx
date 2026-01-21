'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

/**
 * Terminal component using xterm.js
 * Provides a read-only terminal for displaying command output
 */
const StravaConsoleTerminal = forwardRef(function StravaConsoleTerminal({ onReady }, ref) {
  const terminalContainerRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expose terminal methods to parent component
  useImperativeHandle(ref, () => ({
    write: (text) => {
      if (terminalRef.current) {
        terminalRef.current.write(text);
      }
    },
    writeln: (text) => {
      if (terminalRef.current) {
        terminalRef.current.writeln(text);
      }
    },
    clear: () => {
      if (terminalRef.current) {
        terminalRef.current.clear();
      }
    },
    fit: () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    },
    focus: () => {
      if (terminalRef.current) {
        terminalRef.current.focus();
      }
    }
  }));

  useEffect(() => {
    let terminal = null;
    let fitAddon = null;
    let resizeObserver = null;

    const initTerminal = async () => {
      try {
        // Dynamic imports for client-side only
        const { Terminal } = await import('@xterm/xterm');
        const { FitAddon } = await import('@xterm/addon-fit');

        // Import CSS
        await import('@xterm/xterm/css/xterm.css');

        if (!terminalContainerRef.current) {
          return;
        }

        // Create terminal with theme that works in light and dark mode
        terminal = new Terminal({
          cursorBlink: false,
          disableStdin: true,  // Read-only terminal
          fontSize: 13,
          fontFamily: '"Cascadia Code", "Fira Code", Menlo, Monaco, "Courier New", monospace',
          lineHeight: 1.2,
          scrollback: 5000,
          convertEol: true,
          theme: {
            background: '#1a1b26',
            foreground: '#a9b1d6',
            cursor: '#c0caf5',
            cursorAccent: '#1a1b26',
            selectionBackground: '#33467c',
            selectionForeground: '#c0caf5',
            black: '#32344a',
            red: '#f7768e',
            green: '#9ece6a',
            yellow: '#e0af68',
            blue: '#7aa2f7',
            magenta: '#ad8ee6',
            cyan: '#449dab',
            white: '#787c99',
            brightBlack: '#444b6a',
            brightRed: '#ff7a93',
            brightGreen: '#b9f27c',
            brightYellow: '#ff9e64',
            brightBlue: '#7da6ff',
            brightMagenta: '#bb9af7',
            brightCyan: '#0db9d7',
            brightWhite: '#acb0d0'
          }
        });

        // Load fit addon
        fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);

        // Open terminal in container
        terminal.open(terminalContainerRef.current);

        // Initial fit
        setTimeout(() => {
          fitAddon.fit();
        }, 0);

        // Store refs
        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;

        // Handle resize
        resizeObserver = new ResizeObserver(() => {
          if (fitAddon && terminalContainerRef.current) {
            try {
              fitAddon.fit();
            } catch (e) {
              // Ignore fit errors during resize
            }
          }
        });
        resizeObserver.observe(terminalContainerRef.current);

        // Write welcome message
        terminal.writeln('\x1b[36m╔════════════════════════════════════════════════╗\x1b[0m');
        terminal.writeln('\x1b[36m║\x1b[0m  \x1b[1;33mStrava Console\x1b[0m                                \x1b[36m║\x1b[0m');
        terminal.writeln('\x1b[36m║\x1b[0m  Select a command and click Run to execute.    \x1b[36m║\x1b[0m');
        terminal.writeln('\x1b[36m╚════════════════════════════════════════════════╝\x1b[0m');
        terminal.writeln('');

        setIsLoading(false);
        onReady?.();

      } catch (err) {
        console.error('Failed to initialize terminal:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initTerminal();

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (terminal) {
        terminal.dispose();
      }
    };
  }, [onReady]);

  if (error) {
    return (
      <Box
        h="400px"
        bg="#1a1b26"
        borderRadius="md"
        border="1px solid"
        borderColor="border"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <VStack gap={2}>
          <Text color="red.400" fontWeight="medium">Failed to load terminal</Text>
          <Text color="gray.400" fontSize="sm">{error}</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box position="relative">
      {isLoading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="#1a1b26"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1}
        >
          <VStack gap={3}>
            <Spinner size="lg" color="cyan.400" />
            <Text color="gray.400" fontSize="sm">Loading terminal...</Text>
          </VStack>
        </Box>
      )}
      <Box
        ref={terminalContainerRef}
        h="400px"
        bg="#1a1b26"
        borderRadius="md"
        overflow="hidden"
        p={2}
        sx={{
          '& .xterm': {
            height: '100%',
            padding: '8px'
          },
          '& .xterm-viewport': {
            overflowY: 'auto !important'
          },
          '& .xterm-viewport::-webkit-scrollbar': {
            width: '8px'
          },
          '& .xterm-viewport::-webkit-scrollbar-track': {
            background: '#1a1b26'
          },
          '& .xterm-viewport::-webkit-scrollbar-thumb': {
            background: '#444b6a',
            borderRadius: '4px'
          },
          '& .xterm-viewport::-webkit-scrollbar-thumb:hover': {
            background: '#565f89'
          }
        }}
      />
    </Box>
  );
});

export default StravaConsoleTerminal;
