import React, { useState, useEffect } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownHelp.css';

/**
 * MarkdownHelp component dynamically loads and renders markdown help files
 * @param {string} filePath - Path to the markdown file relative to docs/help/
 */
const MarkdownHelp = ({ filePath }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMarkdown = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/docs/help/${filePath}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load help content: ${response.statusText}`);
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error('Error loading markdown:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMarkdown();
  }, [filePath]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minH="400px"
      >
        <Spinner size="xl" color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        maxW="800px" 
        mx="auto" 
        p={8}
        bg="red.500/10" 
        border="1px solid" 
        borderColor="red.500" 
        borderRadius="lg"
      >
        <Text color="text" fontWeight="semibold" mb={2}>
          Error Loading Help Content
        </Text>
        <Text color="text" opacity={0.8}>
          {error}
        </Text>
      </Box>
    );
  }

  return (
    <Box 
      maxW="1000px" 
      mx="auto" 
      p={8} 
      bg="bg"
      className="markdown-content"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownHelp;
