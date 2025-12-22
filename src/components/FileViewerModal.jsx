import React, { useEffect, useRef, useState } from 'react';
import { Box, Flex, Heading, IconButton } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import MonacoYamlViewer from './MonacoYamlViewer';

const FileViewerModal = ({ isOpen, onClose, fileName, fileContent }) => {
  const contentRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState(600);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      const updateHeight = () => {
        const height = contentRef.current?.clientHeight || 600;
        setEditorHeight(height);
      };
      
      // Initial height calculation
      setTimeout(updateHeight, 0);
      
      // Update on window resize
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
      bg="blackAlpha.800"
      justify="center"
      align="center"
      zIndex="9999"
      p={{ base: 0, md: 8 }}
      onClick={handleOverlayClick}
    >
      <Flex
        bg="cardBg"
        borderWidth={{ base: 0, md: "1px" }}
        borderColor="border"
        borderRadius={{ base: 0, md: "xl" }}
        maxW={{ base: "100vw", md: "90vw" }}
        maxH={{ base: "100vh", md: "90vh" }}
        w="100%"
        h={{ base: "100%", md: "auto" }}
        direction="column"
        boxShadow="0 20px 60px rgba(0, 0, 0, 0.3)"
        overflow="hidden"
        shadows="xl"
      >
        <Flex
          bg="#E2E8F0"
          _dark={{ bg: "#334155" }}
          borderBottomWidth="1px"
          borderColor="border"
          p={{ base: 3, sm: 4 }}
          justify="space-between"
          align="center"
          flexShrink={0}
        >
          <Heading 
            size={{ base: "sm", sm: "md" }} 
            color="text" 
            lineHeight="1.2"
            wordBreak="break-word"
            noOfLines={{ base: 1, sm: 2 }}
            maxW={{ base: "calc(100vw - 100px)", sm: "auto" }}
          >
            📄 {fileName}
          </Heading>
          <IconButton
            onClick={onClose}
            aria-label="Close viewer"
            variant="ghost"
            size={{ base: "sm", sm: "md" }}
            colorPalette="gray"
            minW={{ base: "32px", sm: "auto" }}
            h={{ base: "32px", sm: "auto" }}
            p={{ base: 1, sm: 2 }}
          >
            <MdClose />
          </IconButton>
        </Flex>
        
        <Box 
          ref={contentRef} 
          flex={1} 
          overflow="hidden" 
          display="flex" 
          flexDirection="column" 
          minH={0}
        >
          <MonacoYamlViewer
            fileName={fileName}
            fileContent={fileContent}
            showFileInfo={false}
            showActions={true}
            className="modal-viewer"
            height={`${editorHeight}px`}
          />
        </Box>
      </Flex>
    </Flex>
  );
};

export default FileViewerModal;