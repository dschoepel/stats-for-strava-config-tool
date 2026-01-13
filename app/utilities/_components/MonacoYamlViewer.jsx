import { useRef, useCallback, useMemo, memo, lazy, Suspense } from 'react';
const Editor = lazy(() => import('@monaco-editor/react').then(module => ({ default: module.default })));
import { Box, Flex, Text, Button, Icon, Spinner, VStack } from '@chakra-ui/react';
import { MdFolder, MdSearch, MdContentCopy, MdDownload, MdCheckCircle, MdWarning, MdEdit } from 'react-icons/md';
import { formatFileSize, validateYamlContent } from '../../../src/utils/yamlFileHandler';
import { getSetting } from '../../../src/utils/settingsManager';

const MonacoYamlViewer = ({ 
  fileName, 
  fileContent, 
  fileSize = null, 
  lastModified = null,
  showFileInfo = true,
  showActions = true,
  onCopy = null,
  onEdit = null,
  className = '',
  height = '100%'
}) => {
  const editorRef = useRef(null);

  // Memoize editor settings (expensive localStorage reads)
  const editorSettings = useMemo(() => ({
    fontSize: getSetting('editor.fontSize', 14),
    tabSize: getSetting('editor.tabSize', 2),
    wordWrap: getSetting('editor.wordWrap', true) ? 'on' : 'off',
    showLineNumbers: getSetting('ui.showLineNumbers', true) ? 'on' : 'off'
  }), []);

  // Force word wrap off on small screens for better mobile experience
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 425;
  const effectiveWordWrap = isMobile ? 'off' : editorSettings.wordWrap;

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;

    // Focus the editor
    editor.focus();
  }, []);

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy();
    } else {
      try {
        await navigator.clipboard.writeText(fileContent);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  }, [onCopy, fileContent]);

  const handleSearch = useCallback(() => {
    if (editorRef.current) {
      // Trigger the find widget (Ctrl+F)
      editorRef.current.trigger('keyboard', 'actions.find');
    }
  }, []);

  // Memoize validation result
  const isValid = useMemo(() => validateYamlContent(fileContent), [fileContent]);

  // Memoize formatted date string
  const formattedDate = useMemo(() => {
    if (!lastModified) return '';
    const date = new Date(lastModified);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }, [lastModified]);

  // Memoize Monaco editor options object
  const editorOptions = useMemo(() => ({
    readOnly: true,
    minimap: { enabled: !isMobile },
    scrollBeyondLastLine: false,
    fontSize: isMobile ? 12 : editorSettings.fontSize,
    wordWrap: effectiveWordWrap,
    tabSize: editorSettings.tabSize,
    automaticLayout: true,
    lineNumbers: editorSettings.showLineNumbers,
    renderWhitespace: 'selection',
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalScrollbarSize: isMobile ? 8 : 10,
      horizontalScrollbarSize: isMobile ? 8 : 10
    },
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    contextmenu: true,
    selectOnLineNumbers: true,
    matchBrackets: 'always',
    folding: true,
    foldingHighlight: true,
    showFoldingControls: 'always'
  }), [isMobile, editorSettings.fontSize, effectiveWordWrap, editorSettings.tabSize, editorSettings.showLineNumbers]);

  return (
    <Box 
      className={className}
      display="flex" 
      flexDirection="column" 
      h="100%" 
      bg="cardBg" 
      borderRadius="lg" 
      overflow="hidden"
    >
      {showFileInfo && (
        <Flex 
          justify="space-between" 
          align="center" 
          p={{ base: 2, sm: 4 }} 
          bg="panelBg" 
          borderBottom="1px solid" 
          borderColor="border"
          flexDirection={{ base: "column", lg: "row" }}
          gap={{ base: 2, lg: 3 }}
          overflow="hidden"
        >
          <Flex align="center" gap={{ base: 2, sm: 3 }} flex={1} minW={0} flexWrap="wrap" overflow="hidden">
            <Text 
              fontWeight="semibold" 
              color="text" 
              display="flex" 
              alignItems="center" 
              gap={1.5}
              fontSize={{ base: "xs", sm: "md" }}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              maxW="100%"
            >
              <Icon color="primary" boxSize={{ base: 4, sm: 5 }}><MdFolder /></Icon>
              {fileName}
            </Text>
            {fileSize && lastModified && (
              <Text
                fontSize={{ base: "2xs", sm: "sm" }}
                color="text"
                opacity={0.8}
                whiteSpace={{ base: "normal", sm: "nowrap" }}
                lineHeight="1.2"
              >
                {formatFileSize(fileSize)} • Modified: {formattedDate}
              </Text>
            )}
            <Box 
              px={{ base: 1.5, sm: 2 }} 
              py={{ base: 0.5, sm: 1 }} 
              borderRadius="md" 
              fontSize={{ base: "2xs", sm: "sm" }} 
              fontWeight="medium"
              bg={isValid ? "green.50" : "red.50"}
              _dark={{ bg: isValid ? "green.950" : "red.950" }}
              color={isValid ? "green.600" : "red.600"}
              _dark={{ color: isValid ? "green.400" : "red.400" }}
              display="flex"
              alignItems="center"
              gap={1}
              whiteSpace="nowrap"
              flexShrink={0}
            >
              <Icon fontSize={{ base: "xs", sm: "md" }}>{isValid ? <MdCheckCircle /> : <MdWarning />}</Icon>
              {isValid ? 'Valid' : 'Invalid'}
            </Box>
          </Flex>
          {showActions && (
            <Flex gap={{ base: 1, sm: 2 }} align="center" w={{ base: "100%", lg: "auto" }} justify={{ base: "flex-end", lg: "flex-start" }} flexShrink={0}>
              <Button 
                onClick={handleSearch} 
                variant="outline" 
                size={{ base: "xs", sm: "sm" }} 
                colorPalette="gray"
                title="Search (Ctrl+F)"
                fontSize={{ base: "2xs", sm: "sm" }}
                px={{ base: 1.5, sm: 3 }}
                h={{ base: "24px", sm: "auto" }}
              >
                <Icon fontSize={{ base: "xs", sm: "md" }}><MdSearch /></Icon>
                <Text display={{ base: "none", sm: "inline" }} ml={1}>Search</Text>
              </Button>
              <Button 
                onClick={handleCopy} 
                variant="outline" 
                size={{ base: "xs", sm: "sm" }} 
                colorPalette="gray"
                title="Copy to clipboard"
                fontSize={{ base: "2xs", sm: "sm" }}
                px={{ base: 1.5, sm: 3 }}
                h={{ base: "24px", sm: "auto" }}
              >
                <Icon fontSize={{ base: "xs", sm: "md" }}><MdContentCopy /></Icon>
                <Text display={{ base: "none", sm: "inline" }} ml={1}>Copy</Text>
              </Button>
              {onEdit && (
              <Button 
                onClick={onEdit} 
                variant="outline" 
                size={{ base: "xs", sm: "sm" }} 
                colorPalette="gray"
                title="Edit file"
                fontSize={{ base: "2xs", sm: "sm" }}
                px={{ base: 1.5, sm: 3 }}
                h={{ base: "24px", sm: "auto" }}
              >

                  <Icon fontSize={{ base: "xs", sm: "md" }}><MdEdit /></Icon>
                  <Text display={{ base: "none", sm: "inline" }} ml={1}>Edit</Text>
                </Button>
              )}
            </Flex>
          )}
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
            height={height}
            language="yaml"
            value={fileContent}
            theme="vs-dark"
            onMount={handleEditorMount}
            options={editorOptions}
          />
        </Suspense>
      </Box>
    </Box>
  );
};

export default memo(MonacoYamlViewer);
