'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Drawer
} from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';

/**
 * BackupViewerDrawer Component
 * 
 * Drawer for viewing YAML backup file contents with syntax highlighting.
 * Features:
 * - Right-side drawer (xl size)
 * - Lazy-load syntax highlighting
 * - Scrollable monospace display
 * - Loading spinner
 */
export default function BackupViewerDrawer({ isOpen, onClose, file }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlightedContent, setHighlightedContent] = useState('');

  // Fetch file content
  useEffect(() => {
    if (!isOpen || !file) {
      setContent('');
      setHighlightedContent('');
      setError('');
      return;
    }

    const fetchContent = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/file-content?path=${encodeURIComponent(file.path)}`);
        
        if (!response.ok) {
          throw new Error('Failed to load file content');
        }

        const data = await response.json();
        setContent(data.content || '');

        // Lazy-load syntax highlighting
        try {
          const { highlightYaml } = await import('../../utils/shikiAdapter');
          const highlighted = await highlightYaml(data.content || '');
          setHighlightedContent(highlighted);
        } catch (highlightError) {
          // Fallback to plain text if highlighting fails
          console.warn('Syntax highlighting failed:', highlightError);
          setHighlightedContent('');
        }
      } catch (err) {
        setError(err.message || 'Failed to load file');
        setContent('');
        setHighlightedContent('');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [isOpen, file]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="end" size="xl">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <Flex justify="space-between" align="center" width="100%">
              <VStack align="start" gap={1} flex={1}>
                <Heading size="md">Backup File</Heading>
                {file && (
                  <Text fontSize="xs" color="gray.500" fontFamily="mono" wordBreak="break-all">
                    {file.name}
                  </Text>
                )}
              </VStack>
              <Drawer.CloseTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MdClose />
                </Button>
              </Drawer.CloseTrigger>
            </Flex>
          </Drawer.Header>

          <Drawer.Body>
            {loading && (
              <Flex justify="center" align="center" height="100%" py={10}>
                <Spinner size="lg" color="blue.500" />
              </Flex>
            )}

            {error && (
              <Box 
                bg="red.50" 
                _dark={{ bg: "red.900", borderColor: "red.700" }} 
                p={4} 
                borderRadius="md" 
                borderWidth="1px" 
                borderColor="red.200"
              >
                <Text color="red.700" _dark={{ color: "red.200" }} fontSize="sm" fontWeight="500">
                  {error}
                </Text>
              </Box>
            )}

            {!loading && !error && content && (
              <Box
                overflowX="auto"
                overflowY="auto"
                maxHeight="calc(80vh - 120px)"
                bg="gray.50"
                _dark={{ bg: "gray.900" }}
                p={{ base: 2, sm: 4 }}
                borderRadius="md"
                borderWidth="1px"
                borderColor="border"
              >
                {highlightedContent ? (
                  <Box
                    dangerouslySetInnerHTML={{ __html: highlightedContent }}
                    fontSize={{ base: "xs", sm: "sm" }}
                    fontFamily="mono"
                    lineHeight="1.6"
                    css={{
                      '& pre': {
                        margin: 0,
                        background: 'transparent',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      },
                      '& code': {
                        background: 'transparent',
                        fontFamily: 'inherit',
                        display: 'block',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }
                    }}
                  />
                ) : (
                  <Text
                    as="pre"
                    fontSize={{ base: "xs", sm: "sm" }}
                    fontFamily="mono"
                    lineHeight="1.6"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                  >
                    {content}
                  </Text>
                )}
              </Box>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
