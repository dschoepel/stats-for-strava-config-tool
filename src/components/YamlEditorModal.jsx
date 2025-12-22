import React, { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Button, IconButton } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { FaSave } from 'react-icons/fa';
import Editor from '@monaco-editor/react';
import * as YAML from 'yaml';
import { getSetting } from '../utils/settingsManager';

const YamlEditorModal = ({ isOpen, onClose, fileName, fileContent, filePath, onSave }) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Get editor settings
  const fontSize = getSetting('editor.fontSize', 14);
  const tabSize = getSetting('editor.tabSize', 2);
  const wordWrap = getSetting('editor.wordWrap', true) ? 'on' : 'off';
  const showLineNumbers = getSetting('ui.showLineNumbers', true) ? 'on' : 'off';
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (isOpen && fileContent) {
      setContent(fileContent);
      setOriginalContent(fileContent);
      setIsDirty(false);
      setError(null);
      setValidationError(null);
    }
  }, [isOpen, fileContent]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && isOpen) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isOpen]);

  const handleEditorChange = (value) => {
    setContent(value || '');
    setIsDirty(value !== originalContent);
    setValidationError(null); // Clear validation error when editing
  };

  const validateYaml = (yamlContent) => {
    try {
      YAML.parse(yamlContent);
      return { valid: true };
    } catch (err) {
      return { 
        valid: false, 
        error: err.message,
        line: err.linePos?.[0]?.line || null
      };
    }
  };

  const handleSave = async () => {
    // Validate YAML before saving
    const validation = validateYaml(content);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: content
        })
      });

      const result = await response.json();

      if (result.success) {
        setOriginalContent(content);
        setIsDirty(false);
        if (onSave) {
          onSave(result);
        }
      } else {
        throw new Error(result.error || 'Failed to save file');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleEditorMount = (editor) => {
    // Configure Monaco editor settings
    editor.focus();
  };

  if (!isOpen) return null;

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
      onClick={handleClose}
    >
      <Flex
        bg="cardBg"
        borderWidth={{ base: 0, md: "1px" }}
        borderColor="border"
        borderRadius={{ base: 0, md: "xl" }}
        maxW={{ base: "100vw", md: "90vw" }}
        maxH={{ base: "100vh", md: "90vh" }}
        w="100%"
        h={{ base: "100%", md: "90vh" }}
        direction="column"
        boxShadow="0 20px 60px rgba(0, 0, 0, 0.3)"
        overflow="hidden"
        shadows="xl"
        onClick={(e) => e.stopPropagation()}
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
          gap={2}
        >
          <Flex align="center" gap={2} flex={1} minW={0}>
            <Text fontSize={{ base: "lg", sm: "xl" }}>✏️</Text>
            <Heading 
              size={{ base: "sm", sm: "md" }} 
              color="text" 
              lineHeight="1.2"
              wordBreak="break-word"
              noOfLines={{ base: 1, sm: 2 }}
              flex={1}
              minW={0}
            >
              {fileName}
            </Heading>
            {isDirty && (
              <Text 
                fontSize={{ base: "xs", sm: "sm" }} 
                color="orange.500" 
                fontWeight="600"
                flexShrink={0}
              >
                ● Unsaved
              </Text>
            )}
          </Flex>
          <IconButton
            onClick={handleClose}
            aria-label="Close editor"
            variant="ghost"
            size={{ base: "sm", sm: "md" }}
            colorPalette="gray"
            minW={{ base: "32px", sm: "auto" }}
            h={{ base: "32px", sm: "auto" }}
            p={{ base: 1, sm: 2 }}
            flexShrink={0}
          >
            <MdClose />
          </IconButton>
        </Flex>

        {error && (
          <Flex
            bg="red.50"
            _dark={{ bg: "red.900/30" }}
            borderBottomWidth="1px"
            borderColor="red.300"
            _dark={{ borderColor: "red.700" }}
            p={{ base: 2, sm: 3 }}
            align="center"
            gap={2}
          >
            <Text fontSize={{ base: "md", sm: "lg" }}>❌</Text>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="red.600" _dark={{ color: "red.300" }}>
              {error}
            </Text>
          </Flex>
        )}

        {validationError && (
          <Flex
            bg="orange.50"
            _dark={{ bg: "orange.900/30" }}
            borderBottomWidth="1px"
            borderColor="orange.300"
            _dark={{ borderColor: "orange.700" }}
            p={{ base: 2, sm: 3 }}
            align="flex-start"
            gap={2}
          >
            <Text fontSize={{ base: "md", sm: "lg" }} flexShrink={0}>⚠️</Text>
            <Box flex={1} minW={0}>
              <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="600" color="orange.700" _dark={{ color: "orange.300" }}>
                YAML Syntax Error:
              </Text>
              <Text fontSize={{ base: "xs", sm: "sm" }} color="orange.600" _dark={{ color: "orange.400" }} wordBreak="break-word">
                {validationError}
              </Text>
            </Box>
          </Flex>
        )}

        <Box flex={1} overflow="hidden" minH={0}>
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={content}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: fontSize,
              lineNumbers: showLineNumbers,
              rulers: [80],
              wordWrap: wordWrap,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: tabSize,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true
            }}
          />
        </Box>

        <Flex
          bg="#E2E8F0"
          _dark={{ bg: "#334155" }}
          borderTopWidth="1px"
          borderColor="border"
          p={{ base: 2, sm: 3 }}
          justify="space-between"
          align={{ base: "flex-start", sm: "center" }}
          flexShrink={0}
          gap={{ base: 2, sm: 3 }}
          direction={{ base: "column", sm: "row" }}
        >
          <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted" flexShrink={0}>
            Lines: {content.split('\n').length} | Size: {new Blob([content]).size} bytes
          </Text>
          <Flex gap={{ base: 2, sm: 3 }} wrap="wrap" justify={{ base: "stretch", sm: "flex-end" }} w={{ base: "100%", sm: "auto" }}>
            <Button
              onClick={handleClose}
              isDisabled={isSaving}
              variant="outline"
              colorPalette="gray"
              borderColor="border"
              size="sm"
              flex={{ base: 1, sm: 0 }}
              fontSize="xs"
              px={{ base: 1.5, sm: 3 }}
              h={{ base: "32px", sm: "auto" }}
              minW={{ base: "70px", sm: "80px" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isDisabled={!isDirty || isSaving}
              isLoading={isSaving}
              bg="primary"
              color="white"
              _hover={{ bg: "primaryHover" }}
              borderWidth={isDirty && !isSaving ? "3px" : "0"}
              borderColor={isDirty && !isSaving ? "primaryHover" : "transparent"}
              boxShadow={isDirty && !isSaving ? { base: "0 0 8px rgba(252, 82, 0, 0.5)", _dark: "0 0 12px rgba(255, 127, 63, 0.8)" } : "none"}
              size="sm"
              flex={{ base: 1, sm: 0 }}
              fontSize="xs"
              px={{ base: 1.5, sm: 3 }}
              h={{ base: "32px", sm: "auto" }}
              minW={{ base: "70px", sm: "80px" }}
            >
              <FaSave />
              {isSaving ? 'Saving...' : (isDirty ? 'Save *' : 'Save')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default YamlEditorModal;
