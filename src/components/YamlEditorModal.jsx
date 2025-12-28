import React, { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Button, IconButton } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { FaSave } from 'react-icons/fa';
import Editor from '@monaco-editor/react';
import * as YAML from 'yaml';
import { getSetting } from '../utils/settingsManager';
import { ConfirmDialog } from './ConfirmDialog';

const YamlEditorModal = ({ isOpen, onClose, fileName, fileContent, filePath, onSave, isNewFile = false, skipValidation = false }) => {
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
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  useEffect(() => {
    if (isOpen && fileContent) {
      setContent(fileContent);
      setOriginalContent(fileContent);
      // For new files, mark as dirty so they can be saved even without edits
      setIsDirty(isNewFile);
      setError(null);
      setValidationError(null);
    }
  }, [isOpen, fileContent, isNewFile]);

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

    // Validate filename convention (must be config.yaml or config-*.yaml)
    // Skip validation if skipValidation prop is true (e.g., when editing in YAML Viewer)
    if (fileName && !skipValidation) {
      const isValidName = fileName === 'config.yaml' || 
                         (fileName.startsWith('config-') && fileName.endsWith('.yaml'));
      
      if (!isValidName) {
        setError('Invalid filename. Must be "config.yaml" or start with "config-" and end with ".yaml"');
        return;
      }
    }

    // Check if file exists
    // If no filePath is provided (e.g., editing in YAML Viewer), skip the file check
    if (!filePath) {
      // No server path available, just return the content to the caller
      if (onSave) {
        onSave(content);
      }
      setOriginalContent(content);
      setIsDirty(false);
      onClose();
      return;
    }
    
    try {
      const checkResponse = await fetch('/api/check-file-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });

      const checkResult = await checkResponse.json();
      
      console.log('[YamlEditorModal] File check result:', checkResult, 'isDirty:', isDirty, 'isNewFile:', isNewFile);
      
      // If editing an existing file (not creating new), just save it
      if (!isNewFile) {
        console.log('[YamlEditorModal] Editing existing file, saving directly');
        await performSave();
        return;
      }
      
      // For new files only:
      // If file exists but no changes were made, just close
      if (checkResult.exists && !isDirty) {
        console.log('[YamlEditorModal] File exists with no changes, closing');
        onClose();
        return;
      }
      
      // If file exists and there are changes, show overwrite dialog
      if (checkResult.exists && isDirty) {
        console.log('[YamlEditorModal] File exists with changes, showing overwrite dialog');
        setShowOverwriteDialog(true);
        return;
      }

      // File doesn't exist, or exists but we need to save changes
      console.log('[YamlEditorModal] Proceeding with save...');
      await performSave();
    } catch (error) {
      // If check fails, proceed with save anyway
      console.warn('File existence check failed, proceeding with save:', error);
      await performSave();
    }
  };

  const performSave = async () => {
    console.log('[YamlEditorModal] performSave called, saving to:', filePath);
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
      console.log('[YamlEditorModal] Save result:', result);

      if (result.success) {
        setOriginalContent(content);
        setIsDirty(false);
        if (onSave) {
          // Pass both the result and the content
          onSave({ ...result, content: content });
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
      setConfirmDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to close?',
        onConfirm: () => {
          onClose();
          setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
        }
      });
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

      {/* Confirm Overwrite Dialog */}
      <ConfirmDialog
        isOpen={showOverwriteDialog}
        onClose={() => setShowOverwriteDialog(false)}
        onConfirm={() => {
          setShowOverwriteDialog(false);
          performSave();
        }}
        title="Overwrite File?"
        message={`The file "${fileName}" already exists. Do you want to overwrite it?`}
        confirmText="Overwrite"
        cancelText="Cancel"
        confirmColorPalette="orange"
      />
      
      {/* Unsaved Changes Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Leave Anyway"
        confirmColorPalette="orange"
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' })}
      />
    </Flex>
  );
};

export default YamlEditorModal;
