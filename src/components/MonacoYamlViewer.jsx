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
          p={4} 
          bg="panelBg" 
          borderBottom="1px solid" 
          borderColor="border"
          flexDirection={{ base: "column", md: "row" }}
          gap={{ base: 3, md: 0 }}
        >
          <Flex align="center" gap={3} flex={1} minW={0} flexWrap="wrap">
            <Text fontWeight="semibold" color="text" display="flex" alignItems="center" gap={2}>
              <Icon color="primary"><MdFolder /></Icon>
              {fileName}
            </Text>
            {fileSize && lastModified && (
              <Text fontSize="sm" color="text" opacity={0.8} whiteSpace="nowrap">
                {formatFileSize(fileSize)} • 
                Modified: {(() => {
                  const date = new Date(lastModified);
                  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                })()}
              </Text>
            )}
            <Box 
              px={2} 
              py={1} 
              borderRadius="md" 
              fontSize="sm" 
              fontWeight="medium"
              bg={isValid ? "green.50" : "red.50"}
              _dark={{ bg: isValid ? "green.950" : "red.950" }}
              color={isValid ? "green.600" : "red.600"}
              _dark={{ color: isValid ? "green.400" : "red.400" }}
              display="flex"
              alignItems="center"
              gap={1}
              whiteSpace="nowrap"
            >
              <Icon fontSize="md">{isValid ? <MdCheckCircle /> : <MdWarning />}</Icon>
              {isValid ? 'Valid YAML' : 'Invalid YAML'}
            </Box>
          </Flex>
          {showActions && (
            <Flex gap={2} align="center" w={{ base: "100%", md: "auto" }} justify={{ base: "flex-end", md: "flex-start" }}>
              <Button 
                onClick={handleSearch} 
                variant="outline" 
                size="sm" 
                colorPalette="gray"
                title="Search (Ctrl+F)"
              >
                <Icon><MdSearch /></Icon>
                Search
              </Button>
              <Button 
                onClick={handleCopy} 
                variant="outline" 
                size="sm" 
                colorPalette="gray"
                title="Copy to clipboard"
              >
                <Icon><MdContentCopy /></Icon>
                Copy
              </Button>
              <Button 
                onClick={handleDownload} 
                variant="outline" 
                size="sm" 
                colorPalette="gray"
                title="Download file"
              >
                <Icon><MdDownload /></Icon>
                Download
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
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: fontSize,
            wordWrap: wordWrap,
            tabSize: tabSize,
            automaticLayout: true,
            lineNumbers: showLineNumbers,
            renderWhitespace: 'selection',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
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
