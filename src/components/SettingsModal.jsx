import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Flex, Heading, Text, Button, Input, Icon, IconButton, Textarea } from '@chakra-ui/react';
import { MdClose, MdSave, MdRefresh, MdFileUpload, MdFileDownload, MdPalette, MdFolder, MdEdit, MdSpeed, MdSportsBasketball, MdWidgets, MdSettings } from 'react-icons/md';
import { NativeSelectField, NativeSelectRoot } from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { Checkbox } from '@chakra-ui/react';
import SportsListEditor from './SportsListEditor';
import WidgetDefinitionsEditor from './WidgetDefinitionsEditor';
import { loadSettings, saveSettings, resetSettings, exportSettingsAsYaml, importSettingsFromYaml } from '../utils/settingsManager';

const SettingsModal = ({ isOpen, onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState({}); // Will be loaded when modal opens
  const [activeTab, setActiveTab] = useState('ui');
  const [isDirty, setIsDirty] = useState(false);
  const [sportsListDirty, setSportsListDirty] = useState(false);
  const [widgetDefinitionsDirty, setWidgetDefinitionsDirty] = useState(false);
  const [importExportMode, setImportExportMode] = useState(null); // 'import' or 'export'
  const [yamlContent, setYamlContent] = useState('');

  // Initialize settings when modal opens
  useEffect(() => {
    if (isOpen) {
      // Use a function to batch state updates and avoid cascading renders
      const initializeSettings = () => {
        const loadedSettings = loadSettings();
        setSettings(loadedSettings);
        setIsDirty(false);
        setSportsListDirty(false);
        setWidgetDefinitionsDirty(false);
      };
      
      // Schedule state updates to run after the effect
      Promise.resolve().then(initializeSettings);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isDirty || sportsListDirty || widgetDefinitionsDirty) {
      let message;
      if (sportsListDirty) {
        message = 'You have unsaved changes in the Sports List. These changes will be lost if you close without saving.';
      } else if (widgetDefinitionsDirty) {
        message = 'You have unsaved changes in Widget Definitions. These changes will be lost if you close without saving.';
      } else {
        message = 'You have unsaved settings. These changes will be lost if you close without saving.';
      }
      
      if (window.confirm(`${message}\n\nAre you sure you want to close?`)) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleTabChange = (newTab) => {
    if (activeTab === 'sportsList' && sportsListDirty) {
      if (window.confirm('You have unsaved changes in the Sports List. These changes will be lost if you switch tabs.\n\nAre you sure you want to continue?')) {
        setSportsListDirty(false);
        setActiveTab(newTab);
      }
    } else if (activeTab === 'widgetDefinitions' && widgetDefinitionsDirty) {
      if (window.confirm('You have unsaved changes in Widget Definitions. These changes will be lost if you switch tabs.\n\nAre you sure you want to continue?')) {
        setWidgetDefinitionsDirty(false);
        setActiveTab(newTab);
      }
    } else {
      setActiveTab(newTab);
    }
  };



  const handleSettingChange = (path, value) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    
    let current = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setIsDirty(true);
  };

  const handleSave = () => {
    saveSettings(settings);
    setIsDirty(false);
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      setSettings(loadSettings());
      setIsDirty(false);
      if (onSettingsChange) {
        onSettingsChange(loadSettings());
      }
    }
  };

  const handleExport = () => {
    const yamlString = exportSettingsAsYaml();
    setYamlContent(yamlString);
    setImportExportMode('export');
  };

  const handleImport = () => {
    setYamlContent('');
    setImportExportMode('import');
  };

  const handleImportConfirm = () => {
    try {
      const imported = importSettingsFromYaml(yamlContent);
      setSettings(imported);
      setIsDirty(true);
      setImportExportMode(null);
      setYamlContent('');
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import settings. Please check the YAML format.');
    }
  };

  const downloadSettings = () => {
    const yamlString = exportSettingsAsYaml();
    const blob = new Blob([yamlString], { type: 'text/yaml' });
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

  const tabs = [
    { id: 'ui', label: 'User Interface', icon: MdPalette },
    { id: 'files', label: 'Files', icon: MdFolder },
    { id: 'editor', label: 'Editor', icon: MdEdit },
    { id: 'performance', label: 'Performance', icon: MdSpeed },
    { id: 'sportsList', label: 'Sports List', icon: MdSportsBasketball },
    { id: 'widgetDefinitions', label: 'Widgets', icon: MdWidgets }
  ];

  return (
    <Flex
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.7)"
      justify="center"
      align="center"
      zIndex={10000}
      onClick={onClose}
    >
      <Flex
        bg="cardBg"
        borderRadius="xl"
        boxShadow="0 20px 60px rgba(0, 0, 0, 0.3)"
        w="90%"
        maxW="800px"
        maxH="90vh"
        flexDirection="column"
        border="1px solid"
        borderColor="border"
        onClick={(e) => e.stopPropagation()}
      >
        <Flex
          justify="space-between"
          align="center"
          p={4}
          borderBottom="1px solid"
          borderColor="border"
          bg="panelBg"
          borderTopRadius="xl"
        >
          <Heading as="h2" size="lg" color="text" fontWeight="semibold">
            ⚙️ Settings
          </Heading>
          <IconButton
            onClick={handleClose}
            aria-label="Close"
            size="sm"
            variant="ghost"
            colorPalette="gray"
          >
            <Icon><MdClose /></Icon>
          </IconButton>
        </Flex>

        {importExportMode ? (
          <VStack p={8} gap={4} align="stretch" flex={1}>
            <HStack justify="space-between" mb={4}>
              <Heading as="h3" size="md" color="text">
                {importExportMode === 'export' ? '📤 Export Settings' : '📥 Import Settings'}
              </Heading>
              <Button
                onClick={() => {
                  setImportExportMode(null);
                  setYamlContent('');
                }}
                variant="outline"
                colorPalette="gray"
                borderColor="border"
              >
                Cancel
              </Button>
            </HStack>
            
            <Box flex={1}>
              <Textarea
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                placeholder={importExportMode === 'import' ? 'Paste YAML settings here...' : ''}
                readOnly={importExportMode === 'export'}
                rows={20}
                bg="inputBg"
                border="1px solid"
                borderColor="border"
                color="text"
                fontFamily="'Fira Code', 'Monaco', 'Consolas', monospace"
                fontSize="sm"
                lineHeight="1.5"
                resize="vertical"
                minH="400px"
                _focus={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 3px rgba(252, 82, 0, 0.2)"
                }}
              />
            </Box>
            
            <HStack justify="flex-end" gap={3}>
              {importExportMode === 'export' ? (
                <Button
                  onClick={downloadSettings}
                  bg="primary"
                  color="white"
                  _hover={{ bg: "primaryHover" }}
                  leftIcon={<Icon><MdSave /></Icon>}
                >
                  Download as File
                </Button>
              ) : (
                <Button
                  onClick={handleImportConfirm}
                  bg="primary"
                  color="white"
                  _hover={{ bg: "primaryHover" }}
                  leftIcon={<Icon><MdFileUpload /></Icon>}
                >
                  Import Settings
                </Button>
              )}
            </HStack>
          </VStack>
        ) : (
          <>
            <Flex
              overflowX="auto"
              overflowY="hidden"
              minH="60px"
              borderBottom="1px solid"
              borderColor="border"
              bg="panelBg"
              css={{
                '&::-webkit-scrollbar': { height: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: 'var(--chakra-colors-primary)', borderRadius: '3px' },
              }}
            >
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  variant="ghost"
                  h="60px"
                  px={5}
                  flexShrink={0}
                  borderBottom="3px solid"
                  borderBottomColor={activeTab === tab.id ? "primary" : "transparent"}
                  bg={activeTab === tab.id ? { base: "rgba(252, 82, 0, 0.1)", _dark: "rgba(255, 106, 26, 0.1)" } : "transparent"}
                  color={activeTab === tab.id ? "primary" : "textMuted"}
                  borderRadius={0}
                  _hover={{
                    bg: { base: "rgba(0, 0, 0, 0.05)", _dark: "rgba(255, 255, 255, 0.1)" },
                    color: "text"
                  }}
                >
                  <HStack gap={2}>
                    <Icon fontSize="lg"><tab.icon /></Icon>
                    <Text fontWeight="medium">
                      {tab.label}{(tab.id === 'sportsList' && sportsListDirty) || (tab.id === 'widgetDefinitions' && widgetDefinitionsDirty) ? ' *' : ''}
                    </Text>
                  </HStack>
                </Button>
              ))}
            </Flex>

            <Box 
              flex={1} 
              p={activeTab === 'sportsList' || activeTab === 'widgetDefinitions' ? 8 : 8} 
              overflowY="auto" 
              bg="cardBg"
            >
              {activeTab === 'ui' && (
                <VStack align="stretch" gap={6}>
                  <Heading as="h3" size="md" color="text" fontWeight="semibold">
                    User Interface Settings
                  </Heading>
                  
                  <Field.Root>
                    <Field.Label color="text" fontWeight="medium">Theme</Field.Label>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={settings.ui?.theme || 'dark'}
                        onChange={(e) => handleSettingChange('ui.theme', e.target.value)}
                        bg="inputBg"
                        border="1px solid"
                        borderColor="border"
                        color="text"
                        _focus={{
                          borderColor: "primary",
                          boxShadow: "0 0 0 3px rgba(252, 82, 0, 0.2)"
                        }}
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Field.Root>

                  <Checkbox
                    checked={settings.ui?.sidebarCollapsed || false}
                    onCheckedChange={(e) => handleSettingChange('ui.sidebarCollapsed', e.checked)}
                    color="text"
                    fontWeight="medium"
                  >
                    Start with sidebar collapsed
                  </Checkbox>

                  <Checkbox
                    checked={settings.ui?.autoSave || true}
                    onCheckedChange={(e) => handleSettingChange('ui.autoSave', e.checked)}
                    color="text"
                    fontWeight="medium"
                  >
                    Auto-save changes
                  </Checkbox>

                  <Checkbox
                    checked={settings.ui?.showLineNumbers || true}
                    onCheckedChange={(e) => handleSettingChange('ui.showLineNumbers', e.checked)}
                    color="text"
                    fontWeight="medium"
                  >
                    Show line numbers in YAML viewer
                  </Checkbox>
                </VStack>
              )}

              {activeTab === 'files' && (
                <VStack align="stretch" gap={6}>
                  <Heading as="h3" size="md" color="text" fontWeight="semibold">
                    File Settings
                  </Heading>
                  
                  <Field.Root>
                    <Field.Label color="text" fontWeight="medium">Default file path</Field.Label>
                    <Input
                      value={settings.files?.defaultPath || ''}
                      onChange={(e) => handleSettingChange('files.defaultPath', e.target.value)}
                      placeholder="~/Documents/strava-config-tool/"
                      bg="inputBg"
                      border="1px solid"
                      borderColor="border"
                      color="text"
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 3px rgba(252, 82, 0, 0.2)"
                      }}
                    />
                  </Field.Root>

                  <Checkbox
                    checked={settings.files?.autoBackup || true}
                    onCheckedChange={(e) => handleSettingChange('files.autoBackup', e.checked)}
                    color="text"
                    fontWeight="medium"
                  >
                    Create automatic backups
                  </Checkbox>

                  <Checkbox
                    checked={settings.files?.validateOnLoad || true}
                    onCheckedChange={(e) => handleSettingChange('files.validateOnLoad', e.checked)}
                    color="text"
                    fontWeight="medium"
                  >
                    Validate YAML syntax on file load
                  </Checkbox>

                  <Field.Root>
                    <Field.Label color="text" fontWeight="medium">Maximum recent files</Field.Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={settings.files?.maxRecentFiles || 10}
                      onChange={(e) => handleSettingChange('files.maxRecentFiles', parseInt(e.target.value))}
                      bg="inputBg"
                      border="1px solid"
                      borderColor="border"
                      color="text"
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 3px rgba(252, 82, 0, 0.2)"
                      }}
                    />
                  </Field.Root>
                </VStack>
              )}

              {activeTab === 'editor' && (
                <VStack align="stretch" gap={6}>
                  <Heading as="h3" size="md" color="text" fontWeight="semibold">
                    Editor Settings
                  </Heading>
                  
                  <Field.Root>
                    <Field.Label color="text" fontWeight="medium">Font size</Field.Label>
                    <Input
                      type="number"
                      min={10}
                      max={24}
                      value={settings.editor?.fontSize || 14}
                      onChange={(e) => handleSettingChange('editor.fontSize', parseInt(e.target.value))}
                      bg="inputBg"
                      border="1px solid"
                      borderColor="border"
                      color="text"
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 3px rgba(252, 82, 0, 0.2)"
                      }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="text" fontWeight="medium">Tab size</Field.Label>
                    <Input
                      type="number"
                      min={2}
                      max={8}
                      value={settings.editor?.tabSize || 2}
                      onChange={(e) => handleSettingChange('editor.tabSize', parseInt(e.target.value))}
                      bg="inputBg"
                      border="1px solid"
                      borderColor="border"
                      color="text"
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 3px rgba(252, 82, 0, 0.2)"
                      }}
                    />
                  </Field.Root>

                  <Checkbox
                    checked={settings.editor?.wordWrap || true}
                    onCheckedChange={(e) => handleSettingChange('editor.wordWrap', e.checked)}
                    color="text"
                    fontWeight="medium"
                  >
                    Enable word wrap
                  </Checkbox>

                  <Checkbox
                    checked={settings.editor?.highlightSearch || true}
                    onCheckedChange={(e) => handleSettingChange('editor.highlightSearch', e.checked)}
                    color="text"
                    fontWeight="medium"
                  >
                    Highlight search matches
                  </Checkbox>
                </VStack>
              )}

              {activeTab === 'performance' && (
                <VStack align="stretch" gap={6}>
                  <Heading as="h3" size="md" color="text" fontWeight="semibold">
                    Performance Settings
                  </Heading>
                  
                  <Field.Root>
                    <Field.Label color="text" fontWeight="medium">Maximum file size (MB)</Field.Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={Math.round((settings.performance?.maxFileSize || 10485760) / 1024 / 1024)}
                      onChange={(e) => handleSettingChange('performance.maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
                      bg="inputBg"
                      border="1px solid"
                      borderColor="border"
                      color="text"
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 3px rgba(252, 82, 0, 0.2)"
                      }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="text" fontWeight="medium">Search timeout (ms)</Field.Label>
                    <Input
                      type="number"
                      min={100}
                      max={2000}
                      step={100}
                      value={settings.performance?.searchTimeout || 500}
                      onChange={(e) => handleSettingChange('performance.searchTimeout', parseInt(e.target.value))}
                      bg="inputBg"
                      border="1px solid"
                      borderColor="border"
                      color="text"
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 3px rgba(252, 82, 0, 0.2)"
                      }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="text" fontWeight="medium">Auto-save interval (seconds)</Field.Label>
                    <Input
                      type="number"
                      min={10}
                      max={300}
                      step={10}
                      value={Math.round((settings.performance?.autoSaveInterval || 30000) / 1000)}
                      onChange={(e) => handleSettingChange('performance.autoSaveInterval', parseInt(e.target.value) * 1000)}
                      bg="inputBg"
                      border="1px solid"
                      borderColor="border"
                      color="text"
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 3px rgba(252, 82, 0, 0.2)"
                      }}
                    />
                  </Field.Root>
                </VStack>
              )}

              {activeTab === 'sportsList' && (
                <SportsListEditor 
                  settings={settings} 
                  onDirtyChange={setSportsListDirty}
                />
              )}

              {activeTab === 'widgetDefinitions' && (
                <WidgetDefinitionsEditor 
                  settings={settings} 
                  onDirtyChange={setWidgetDefinitionsDirty}
                />
              )}
            </Box>
          </>
        )}

        <Flex
          p={6}
          borderTop="1px solid"
          borderColor="border"
          bg="panelBg"
          justify="space-between"
          align="center"
          flexWrap="wrap"
          gap={4}
          borderBottomRadius="xl"
        >
          {!importExportMode && (
            <>
              <HStack gap={3}>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  colorPalette="gray"
                  borderColor="border"
                  leftIcon={<Icon><MdFileDownload /></Icon>}
                >
                  Export
                </Button>
                <Button
                  onClick={handleImport}
                  variant="outline"
                  colorPalette="gray"
                  borderColor="border"
                  leftIcon={<Icon><MdFileUpload /></Icon>}
                >
                  Import
                </Button>
                <Button
                  onClick={handleReset}
                  colorPalette="red"
                  variant="outline"
                  borderColor={{ base: "#dc3545", _dark: "#991b1b" }}
                  _hover={{ bg: { base: "#dc3545", _dark: "#991b1b" }, color: "white" }}
                  leftIcon={<Icon><MdRefresh /></Icon>}
                >
                  Reset to Defaults
                </Button>
              </HStack>
              
              <HStack gap={3}>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  colorPalette="gray"
                  borderColor="border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  isDisabled={!isDirty}
                  bg="primary"
                  color="white"
                  _hover={{ bg: "primaryHover" }}
                  leftIcon={<Icon><MdSave /></Icon>}
                >
                  Save Settings
                </Button>
              </HStack>
            </>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SettingsModal;