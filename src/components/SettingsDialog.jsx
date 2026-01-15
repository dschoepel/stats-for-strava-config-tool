import React from 'react';
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Icon,
  Tabs,
} from '@chakra-ui/react';
import { MdClose, MdPalette, MdFolder, MdCode, MdVerifiedUser, MdImportExport } from 'react-icons/md';
import UISettingsModal from './settings/UISettingsModal';
import FilesSettingsModal from './settings/FilesSettingsModal';
import EditorSettingsModal from './settings/EditorSettingsModal';
import ValidationSettingsModal from './settings/ValidationSettingsModal';
import ImportExportModal from './settings/ImportExportModal';

/**
 * Unified settings dialog with tabs for different setting categories
 * Consolidates 5 separate modals into one tabbed interface
 */
const SettingsDialog = ({ isOpen, onClose, initialTab = 'ui', shouldOpenBackupManager = false, onBackupManagerOpened }) => {
  if (!isOpen) return null;

  const tabs = [
    { id: 'ui', label: 'UI', icon: MdPalette },
    { id: 'files', label: 'Files', icon: MdFolder },
    { id: 'editor', label: 'Editor', icon: MdCode },
    { id: 'validation', label: 'Validation', icon: MdVerifiedUser },
    { id: 'importExport', label: 'Import/Export', icon: MdImportExport },
  ];

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0, 0, 0, 0.7)"
      display="flex"
      justifyContent="center"
      alignItems="center"
      zIndex={10000}
      onClick={onClose}
    >
      <Box
        bg="cardBg"
        borderRadius="xl"
        boxShadow="0 20px 60px rgba(0, 0, 0, 0.3)"
        w="90%"
        maxW="1200px"
        maxH="90vh"
        display="flex"
        flexDirection="column"
        border="1px solid"
        borderColor="border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
            Settings
          </Heading>
          <IconButton
            onClick={onClose}
            aria-label="Close"
            size="sm"
            variant="ghost"
            colorPalette="gray"
          >
            <Icon><MdClose /></Icon>
          </IconButton>
        </Flex>

        {/* Tabs */}
        <Tabs.Root defaultValue={initialTab} flex="1" display="flex" flexDirection="column" overflow="hidden">
          <Tabs.List 
            borderBottom="1px solid" 
            borderColor="border" 
            bg="panelBg" 
            px={{ base: 2, sm: 4 }}
            gap={{ base: 1, sm: 2 }}
            overflowX="auto"
            flexWrap={{ base: "nowrap", sm: "wrap" }}
          >
            {tabs.map((tab) => (
              <Tabs.Trigger 
                key={tab.id} 
                value={tab.id} 
                display="flex" 
                alignItems="center" 
                gap={{ base: 1, sm: 2 }}
                px={{ base: 2, sm: 3 }}
                py={{ base: 2, sm: 2.5 }}
                fontSize={{ base: "xs", sm: "sm" }}
                whiteSpace="nowrap"
                flexShrink={0}
              >
                <Icon fontSize={{ base: "sm", sm: "md" }}><tab.icon /></Icon>
                <Box display={{ base: "none", sm: "block" }}>{tab.label}</Box>
                <Box display={{ base: "block", sm: "none" }} fontSize="2xs">{tab.label}</Box>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Box flex="1" overflowY="auto" bg="cardBg">
            <Tabs.Content value="ui" p={0}>
              <UISettingsModal isOpen onClose={onClose} embedded />
            </Tabs.Content>
            <Tabs.Content value="files" p={0}>
              <FilesSettingsModal 
                isOpen 
                onClose={onClose} 
                embedded 
                shouldOpenBackupManager={shouldOpenBackupManager}
                onBackupManagerOpened={onBackupManagerOpened}
              />
            </Tabs.Content>
            <Tabs.Content value="editor" p={0}>
              <EditorSettingsModal isOpen onClose={onClose} embedded />
            </Tabs.Content>
            <Tabs.Content value="validation" p={0}>
              <ValidationSettingsModal isOpen onClose={onClose} embedded />
            </Tabs.Content>
            <Tabs.Content value="importExport" p={0}>
              <ImportExportModal isOpen onClose={onClose} embedded />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Box>
    </Box>
  );
};

export default SettingsDialog;
