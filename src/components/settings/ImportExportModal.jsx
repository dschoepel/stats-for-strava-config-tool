import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Button,
  Textarea,
  Flex,
} from '@chakra-ui/react';
import { exportSettingsAsYaml, importSettingsFromYaml } from '../../utils/settingsManager';

const ImportExportModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('export');
  const [yamlContent, setYamlContent] = useState(exportSettingsAsYaml());

  const handleExport = () => {
    setYamlContent(exportSettingsAsYaml());
    setMode('export');
  };

  const handleImport = () => {
    setYamlContent('');
    setMode('import');
  };

  const handleImportConfirm = () => {
    try {
      importSettingsFromYaml(yamlContent);
      alert('Settings imported successfully!');
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import settings. Please check the YAML format.');
    }
  };

  const downloadSettings = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config-tool-settings.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.600"
      zIndex="1000"
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg="bg"
        borderRadius="lg"
        boxShadow="lg"
        maxW={{ base: "95%", sm: "800px" }}
        w="100%"
        maxH={{ base: "90vh", sm: "80vh" }}
        overflowY="auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <Flex
          justify="space-between"
          align="center"
          p={{ base: 3, sm: 4 }}
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Heading size={{ base: "md", sm: "lg" }} lineHeight="1.2" wordBreak="break-word">
            📦 Import/Export Settings
          </Heading>
          <Button
            onClick={onClose}
            size={{ base: "xs", sm: "sm" }}
            variant="ghost"
            minW="auto"
            px={{ base: 2, sm: 3 }}
          >
            ✕
          </Button>
        </Flex>

        {/* Modal Body */}
        <VStack align="stretch" gap={4} p={{ base: 3, sm: 4 }}>
          {/* Mode Toggle Buttons */}
          <Flex gap={2}>
            <Button
              onClick={handleExport}
              colorPalette={mode === 'export' ? 'blue' : undefined}
              variant={mode === 'export' ? 'solid' : 'outline'}
              size={{ base: "sm", sm: "md" }}
              flex="1"
            >
              📤 Export
            </Button>
            <Button
              onClick={handleImport}
              colorPalette={mode === 'import' ? 'blue' : undefined}
              variant={mode === 'import' ? 'solid' : 'outline'}
              size={{ base: "sm", sm: "md" }}
              flex="1"
            >
              📥 Import
            </Button>
          </Flex>

          {/* YAML Content Textarea */}
          <Textarea
            value={yamlContent}
            onChange={(e) => setYamlContent(e.target.value)}
            placeholder={mode === 'import' ? 'Paste YAML settings here...' : ''}
            readOnly={mode === 'export'}
            minH="400px"
            fontFamily="'Fira Code', 'Monaco', 'Consolas', monospace"
            fontSize="0.9rem"
            lineHeight="1.5"
            bg="inputBg"
            resize="vertical"
          />
        </VStack>

        {/* Modal Footer */}
        <Flex
          direction={{ base: "column-reverse", sm: "row" }}
          justify="flex-end"
          gap={3}
          p={{ base: 3, sm: 4 }}
          borderTopWidth="1px"
          borderColor="border"
        >
          <Button
            onClick={onClose}
            variant="outline"
            size={{ base: "sm", sm: "md" }}
            width={{ base: "100%", sm: "auto" }}
          >
            Close
          </Button>
          {mode === 'export' ? (
            <Button
              onClick={downloadSettings}
              colorPalette="blue"
              size={{ base: "sm", sm: "md" }}
              width={{ base: "100%", sm: "auto" }}
            >
              💾 Download
            </Button>
          ) : (
            <Button
              onClick={handleImportConfirm}
              colorPalette="blue"
              size={{ base: "sm", sm: "md" }}
              width={{ base: "100%", sm: "auto" }}
            >
              📥 Import
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default ImportExportModal;
