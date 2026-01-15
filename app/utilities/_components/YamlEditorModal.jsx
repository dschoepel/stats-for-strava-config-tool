import React, { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Heading, Text, Button, IconButton, Spinner, VStack } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { FaSave } from 'react-icons/fa';
const Editor = lazy(() => import('@monaco-editor/react').then(module => ({ default: module.default })));
import * as YAML from 'yaml';
import { getSetting } from '../../../src/utils/settingsManager';
import { ConfirmDialog } from '../../_components/ui/ConfirmDialog';
import { checkFileExists, saveFile } from '../../../src/services';

// Pure validation function moved outside component
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

const YamlEditorModal = ({ isOpen, onClose, fileName, fileContent, filePath, onSave, isNewFile = false, skipValidation = false }) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  // Memoize editor settings (expensive localStorage reads)
  const editorSettings = useMemo(() => ({
    fontSize: getSetting('editor.fontSize', 14),
    tabSize: getSetting('editor.tabSize', 2),
    wordWrap: getSetting('editor.wordWrap', true) ? 'on' : 'off',
    showLineNumbers: getSetting('ui.showLineNumbers', true) ? 'on' : 'off'
  }), []);

  // Memoize content statistics
  const contentStats = useMemo(() => ({
    lines: content.split('\n').length,
    bytes: new Blob([content]).size
  }), [content]);

  // Memoize Monaco editor options
  const editorOptions = useMemo(() => ({
    minimap: { enabled: true },
    fontSize: editorSettings.fontSize,
    lineNumbers: editorSettings.showLineNumbers,
    rulers: [80],
    wordWrap: editorSettings.wordWrap,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: editorSettings.tabSize,
    insertSpaces: true,
    formatOnPaste: true,
    formatOnType: true
  }), [editorSettings.fontSize, editorSettings.showLineNumbers, editorSettings.wordWrap, editorSettings.tabSize]);

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

  const handleEditorChange = useCallback((value) => {
    setContent(value || '');
    setIsDirty(value !== originalContent);
    setValidationError(null); // Clear validation error when editing
  }, [originalContent]);

  const performSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveFile(filePath, content);

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
  }, [filePath, content, onSave]);

  const handleSave = useCallback(async () => {
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
      const checkResult = await checkFileExists(filePath);
      
      // If editing an existing file (not creating new), just save it
      if (!isNewFile) {
        await performSave();
        return;
      }
      
      // For new files only:
      // If file exists but no changes were made, just close
      if (checkResult.exists && !isDirty) {
        onClose();
        return;
      }
      
      // If file exists and there are changes, show overwrite dialog
      if (checkResult.exists && isDirty) {
        setShowOverwriteDialog(true);
        return;
      }

      // File doesn't exist, or exists but we need to save changes
      await performSave();
    } catch (error) {
      // If check fails, proceed with save anyway
      console.warn('File existence check failed, proceeding with save:', error);
      await performSave();
    }
  }, [content, fileName, skipValidation, filePath, onSave, onClose, isNewFile, isDirty, performSave]);

  const handleClose = useCallback(() => {
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
  }, [isDirty, onClose]);

  const handleEditorMount = useCallback((editor) => {
    // Configure Monaco editor settings
    editor.focus();
  }, []);

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
          <Suspense fallback={
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minH="400px"
              bg="cardBg"
            >
              <VStack gap={3}>
                <Spinner size="lg" color="primary" />
                <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
                  Loading editor...
                </Text>
              </VStack>
            </Box>
          }>
            <Editor
              height="100%"
              defaultLanguage="yaml"
              value={content}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={editorOptions}
            />
          </Suspense>
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
            Lines: {contentStats.lines} | Size: {contentStats.bytes} bytes
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

YamlEditorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fileName: PropTypes.string.isRequired,
  fileContent: PropTypes.string.isRequired,
  filePath: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  isNewFile: PropTypes.bool,
  skipValidation: PropTypes.bool
};

export default memo(YamlEditorModal);
