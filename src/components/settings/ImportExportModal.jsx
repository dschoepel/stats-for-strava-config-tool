import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Button,
  Textarea,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { MdSave, MdFileUpload, MdFileDownload } from 'react-icons/md';
import { FiPackage } from 'react-icons/fi';
import { exportSettingsAsYaml, importSettingsFromYaml } from '../../utils/settingsManager';

const ImportExportModal = ({ isOpen, onClose, embedded = false }) => {
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

  // If embedded in a tabbed dialog, render without modal wrapper
  if (embedded) {
    return (
      <>
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
              <Flex align="center" gap={2}><Icon><MdFileDownload /></Icon> Export</Flex>
            </Button>
            <Button
              onClick={handleImport}
              colorPalette={mode === 'import' ? 'blue' : undefined}
              variant={mode === 'import' ? 'solid' : 'outline'}
              size={{ base: "sm", sm: "md" }}
              flex="1"
            >
              <Flex align="center" gap={2}><Icon><MdFileUpload /></Icon> Import</Flex>
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
              <Flex align="center" gap={2}><Icon><MdSave /></Icon> Download</Flex>
            </Button>
          ) : (
            <Button
              onClick={handleImportConfirm}
              colorPalette="blue"
              size={{ base: "sm", sm: "md" }}
              width={{ base: "100%", sm: "auto" }}
            >
              <Flex align="center" gap={2}><Icon><MdFileUpload /></Icon> Import</Flex>
            </Button>
          )}
        </Flex>
      </>
    );
  }

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
          <Heading size={{ base: "md", sm: "lg" }} lineHeight="1.2" wordBreak="break-word" display="flex" alignItems="center" gap={2}>
            <Icon color="primary"><FiPackage /></Icon> Import/Export Settings
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
              <Flex align="center" gap={2}><Icon><MdFileDownload /></Icon> Export</Flex>
            </Button>
            <Button
              onClick={handleImport}
              colorPalette={mode === 'import' ? 'blue' : undefined}
              variant={mode === 'import' ? 'solid' : 'outline'}
              size={{ base: "sm", sm: "md" }}
              flex="1"
            >
              <Flex align="center" gap={2}><Icon><MdFileUpload /></Icon> Import</Flex>
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
              <Flex align="center" gap={2}><Icon><MdSave /></Icon> Download</Flex>
            </Button>
          ) : (
            <Button
              onClick={handleImportConfirm}
              colorPalette="blue"
              size={{ base: "sm", sm: "md" }}
              width={{ base: "100%", sm: "auto" }}
            >
              <Flex align="center" gap={2}><Icon><MdFileUpload /></Icon> Import</Flex>
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default ImportExportModal;
