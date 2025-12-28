import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Box, Flex, Text, Button, Icon } from '@chakra-ui/react';
import { MdFolder, MdSearch, MdContentCopy, MdDownload, MdCheckCircle, MdWarning } from 'react-icons/md';
import { formatFileSize, validateYamlContent } from '../utils/yamlFileHandler';
import { getSetting } from '../utils/settingsManager';

const MonacoYamlViewer = ({ 
  fileName, 
  fileContent, 
  fileSize = null, 
  lastModified = null,
  showFileInfo = true,
  showActions = true,
  onDownload = null,
  onCopy = null,
  className = '',
  height = '100%'
}) => {
  const editorRef = useRef(null);
  
  // Get editor settings
  const fontSize = getSetting('editor.fontSize', 14);
  const tabSize = getSetting('editor.tabSize', 2);
  const wordWrap = getSetting('editor.wordWrap', true) ? 'on' : 'off';
  const showLineNumbers = getSetting('ui.showLineNumbers', true) ? 'on' : 'off';
  
  // Force word wrap off on small screens for better mobile experience
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 425;
  const effectiveWordWrap = isMobile ? 'off' : wordWrap;

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    
    // Focus the editor
    editor.focus();
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const blob = new Blob([fileContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
    } else {
      try {
        await navigator.clipboard.writeText(fileContent);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const handleSearch = () => {
    if (editorRef.current) {
      // Trigger the find widget (Ctrl+F)
      editorRef.current.trigger('keyboard', 'actions.find');
    }
  };

  const isValid = validateYamlContent(fileContent);
  
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
                {formatFileSize(fileSize)} • 
                Modified: {(() => {
                  const date = new Date(lastModified);
                  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                })()}
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
              <Button 
                onClick={handleDownload} 
                variant="outline" 
                size={{ base: "xs", sm: "sm" }} 
                colorPalette="gray"
                title="Download file"
                fontSize={{ base: "2xs", sm: "sm" }}
                px={{ base: 1.5, sm: 3 }}
                h={{ base: "24px", sm: "auto" }}
              >
                <Icon fontSize={{ base: "xs", sm: "md" }}><MdDownload /></Icon>
                <Text display={{ base: "none", sm: "inline" }} ml={1}>Download</Text>
              </Button>
            </Flex>
          )}
        </Flex>
      )}

      <Box flex={1} overflow="hidden" minH={0}>
        <Editor
          height={height}
          language="yaml"
          value={fileContent}
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            readOnly: true,
            minimap: { enabled: !isMobile },
            scrollBeyondLastLine: false,
            fontSize: isMobile ? 12 : fontSize,
            wordWrap: effectiveWordWrap,
            tabSize: tabSize,
            automaticLayout: true,
            lineNumbers: showLineNumbers,
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
          }}
        />
      </Box>
    </Box>
  );
};

export default MonacoYamlViewer;
