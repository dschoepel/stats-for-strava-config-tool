import React, { useState } from 'react';
import { Box, Code, IconButton, HStack } from '@chakra-ui/react';
import { MdContentCopy, MdCheck } from 'react-icons/md';

const CodeSnippet = ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Box position="relative" {...props}>
      <Code 
        display="block" 
        p={4} 
        pr={12}
        bg="gray.800" 
        color="gray.100" 
        borderRadius="md" 
        fontFamily="mono"
        position="relative"
      >
        {children}
      </Code>
      <IconButton
        onClick={handleCopy}
        aria-label="Copy code"
        size="sm"
        variant="ghost"
        colorPalette={copied ? "green" : "gray"}
        position="absolute"
        top={2}
        right={2}
        _hover={{ bg: "whiteAlpha.200" }}
      >
        {copied ? <MdCheck /> : <MdContentCopy />}
      </IconButton>
    </Box>
  );
};

export default CodeSnippet;
