import React, { useState, lazy, Suspense } from 'react';
import { Box, VStack, Heading, Text, Button, Flex, HStack, IconButton, Icon, Spinner } from '@chakra-ui/react';
import { MdClose, MdSettings, MdWarning, MdSearch, MdAdd } from 'react-icons/md';
import FileSelector from '../../../src/components/FileSelector';
import ServerFileBrowser from './ServerFileBrowser';
const YamlViewer = lazy(() => import('./YamlViewer'));
const YamlEditorModal = lazy(() => import('./YamlEditorModal'));
import FileCreationDialog from './yaml-utility/FileCreationDialog';
import FileExistsConflictDialog from './yaml-utility/FileExistsConflictDialog';
import LoadedFilesList from './yaml-utility/LoadedFilesList';
import GettingStartedGuide from './yaml-utility/GettingStartedGuide';
import { useYamlUtilityFiles } from './hooks/useYamlUtilityFiles';
import { useYamlUtilityDialogs } from './hooks/useYamlUtilityDialogs';
import { getSetting, loadSettings } from '../../../src/utils/settingsManager';
import { backupConfig } from '../../../src/utils/apiClient';
import { useToast } from '../../../src/hooks/useToast';

const YamlUtility = () => {
  const [showServerBrowser, setShowServerBrowser] = useState(false);
  const { showError } = useToast();

  // File management hook
  const {
    selectedFiles,
    setSelectedFiles,
    showViewer,
    setShowViewer,
    error,
    setError,
    handleFilesSelected,
    handleError,
    handleCloseViewer,
    handleClearFiles,
    handleLoadMoreFiles,
    validateFileName,
    checkFileExists,
    loadFileContent,
    addFileToViewer
  } = useYamlUtilityFiles();

  // Dialog management hook
  const {
    showFileNameDialog,
    showFileExistsDialog,
    showNewFileEditor,
    fileNameInput,
    fileNameError,
    newFileName,
    existingFilePath,
    existingFileContent,
    existingFilePathRef,
    setFileNameInput,
    setFileNameError,
    openFileNameDialog,
    closeFileNameDialog,
    openFileExistsDialog,
    closeFileExistsDialog,
    openNewFileEditor,
    closeNewFileEditor,
    resetAll
  } = useYamlUtilityDialogs();

  const handleCreateNewFile = () => {
    resetAll();
    
    const defaultPath = getSetting('files.defaultPath', '');
    if (!defaultPath) {
      alert('Please set a default file path in Settings before creating new files.');
      return;
    }
    
    openFileNameDialog();
  };

  const handleConfirmFileName = async () => {
    const validation = validateFileName(fileNameInput);
    
    if (!validation.valid) {
      setFileNameError(validation.error);
      return;
    }

    // Check if file already exists
    const { exists, filePath } = await checkFileExists(validation.fileName);
    
    if (exists) {
      console.log('[YamlUtility] File exists, showing conflict dialog. Path:', filePath);
      openFileExistsDialog(validation.fileName, filePath);
      return;
    }

    // File doesn't exist, open editor for new file
    const defaultPath = getSetting('files.defaultPath', '');
    openNewFileEditor(
      validation.fileName,
      "# New YAML Configuration File\n# Add your configuration below\n\n",
      `${defaultPath}/${validation.fileName}`
    );
  };

  const handleSaveNewFile = async (apiResult) => {
    try {
      console.log('handleSaveNewFile called with:', apiResult);
      
      // Create backup before saving if autoBackup is enabled and file already exists
      if (apiResult && apiResult.path) {
        const settings = loadSettings();
        if (settings.files?.autoBackup !== false) {
          try {
            // Use backupsDir setting for backup location
            const backupBaseDir = typeof settings.files?.backupsDir === 'string' 
              ? settings.files.backupsDir 
              : (typeof settings.files?.defaultPath === 'string' 
                ? settings.files.defaultPath 
                : '/data/statistics-for-strava/config');
            const backupDir = `${backupBaseDir}/backups`;
            
            const backupResult = await backupConfig({
              filePath: apiResult.path,
              backupDirectory: backupDir
            });
            if (backupResult.success) {
              console.log('Backup created before YAML Utility save:', backupResult.backupPath);
            } else {
              console.warn('Backup failed:', backupResult.error);
            }
          } catch (backupError) {
            console.warn('Backup error (continuing with save):', backupError);
            // Don't fail the save if backup fails
          }
        }
      }
      
      if (apiResult && apiResult.success) {
        if (!apiResult.content) {
          console.error('No content in API result');
          alert('File was saved but content is missing. Please reload it manually.');
          closeNewFileEditor();
          return;
        }
        
        addFileToViewer(newFileName, apiResult.content);
        closeNewFileEditor();
      } else {
        throw new Error('Save failed or returned no result');
      }
    } catch (error) {
      console.error('Error in handleSaveNewFile:', error);
      alert('File was saved but could not be added to viewer. Please reload it manually.');
      closeNewFileEditor();
    }
  };

  const handleOpenExistingFile = async () => {
    console.log('[YamlUtility] handleOpenExistingFile called');
    console.log('[YamlUtility] existingFilePathRef.current:', existingFilePathRef.current);
    
    closeFileExistsDialog();
    closeFileNameDialog();
    
    const filePathToLoad = existingFilePathRef.current;
    console.log('[YamlUtility] Loading existing file:', filePathToLoad);
    
    if (!filePathToLoad) {
      console.error('[YamlUtility] No file path to load');
      showError('File path is missing');
      return;
    }
    
    const content = await loadFileContent(filePathToLoad);
    
    if (content) {
      openNewFileEditor(newFileName, content, filePathToLoad);
    } else {
      showError('Failed to load existing file');
    }
  };

  const handleChooseDifferentName = () => {
    closeFileExistsDialog();
    // Keep filename dialog open so user can enter different name
  };

  const handleCancelFileCreation = () => {
    resetAll();
  };

  return (
    <Box p={6} minH="100vh" bg="bg">
      <VStack align="stretch" gap={6} maxW="1200px" mx="auto">
        <Flex justify="space-between" align="center" gap={4} wrap="wrap">
          <HStack gap={2}>
            <Icon as={MdSettings} boxSize={6} color="primary" />
            <Heading as="h2" size="lg" color="text">
              YAML Config File Utility
            </Heading>
          </HStack>
          {!showViewer && (
            <Button
              onClick={handleCreateNewFile}
              colorPalette="blue"
              size={{ base: "sm", sm: "md" }}
              leftIcon={<MdAdd />}
            >
              Create New File
            </Button>
          )}
        </Flex>
        
        <Text color="textMuted" mt={-4}>
          Upload and view your Strava configuration YAML files. This tool helps you inspect 
          config files that start with "config" or "gear-maintenance.yaml" and have .yaml or .yml extensions.
        </Text>

        {error && (
          <Flex
            p={4}
            bg="red.50"
            borderRadius="md"
            border="1px solid"
            borderColor="red.200"
            align="center"
            gap={3}
            _dark={{ bg: "red.900", borderColor: "red.700" }}
          >
            <Icon as={MdWarning} boxSize={5} color="red.600" _dark={{ color: "red.300" }} />
            <Box flex={1}>
              <Text color="red.800" _dark={{ color: "red.100" }}>
                <Text as="span" fontWeight="bold">Error:</Text> {error}
              </Text>
            </Box>
            <IconButton
              onClick={() => setError(null)}
              aria-label="Close error"
              size="sm"
              variant="ghost"
              colorPalette="red"
            >
              <MdClose />
            </IconButton>
          </Flex>
        )}

        {!showViewer && (
          <>
            <FileSelector 
              onFilesSelected={handleFilesSelected}
              onError={handleError}
            />
            
            {/* Server File Browser Button */}
            <Box mt={4}>
              <Button
                onClick={() => setShowServerBrowser(true)}
                colorPalette="blue"
                variant="outline"
                width="100%"
                size="lg"
              >
                <Icon mr={2}><MdSearch /></Icon>
                Browse Server Files
              </Button>
              <Text color="textMuted" fontSize="sm" mt={2} textAlign="center">
                Browse and select YAML files from the server
              </Text>
            </Box>
          </>
        )}

        {!showViewer && (
          <LoadedFilesList 
            files={selectedFiles} 
            onViewFiles={() => setShowViewer(true)} 
          />
        )}

        {showViewer && selectedFiles.length > 0 && (
          <Suspense fallback={
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minH={{ base: "200px", sm: "300px" }}
              bg="cardBg"
              borderRadius="md"
              borderWidth="1px"
              borderColor="border"
              p={6}
            >
              <VStack gap={3}>
                <Spinner size="xl" color="primary" />
                <Text fontSize={{ base: "sm", sm: "md" }} color="textMuted">
                  Loading YAML viewer...
                </Text>
              </VStack>
            </Box>
          }>
            <YamlViewer
              files={selectedFiles}
              onClose={handleCloseViewer}
              onClearFiles={handleClearFiles}
              onLoadMoreFiles={handleLoadMoreFiles}
              onFilesUpdated={setSelectedFiles}
            />
          </Suspense>
        )}

        {selectedFiles.length === 0 && !showViewer && (
          <GettingStartedGuide />
        )}
      </VStack>

      {/* File Creation Dialog */}
      <FileCreationDialog
        isOpen={showFileNameDialog}
        onClose={closeFileNameDialog}
        fileName={fileNameInput}
        onFileNameChange={(value) => {
          setFileNameInput(value);
          setFileNameError('');
        }}
        error={fileNameError}
        onConfirm={handleConfirmFileName}
      />

      {/* File Exists Conflict Dialog */}
      <FileExistsConflictDialog
        isOpen={showFileExistsDialog}
        onClose={closeFileExistsDialog}
        fileName={newFileName}
        onCancel={handleCancelFileCreation}
        onChooseDifferentName={handleChooseDifferentName}
        onOpenExisting={handleOpenExistingFile}
      />

      {/* New File Editor Modal */}
      <Suspense fallback={null}>
        <YamlEditorModal
          isOpen={showNewFileEditor}
          onClose={closeNewFileEditor}
          fileName={newFileName}
          fileContent={existingFileContent || "# New YAML Configuration File\n# Add your configuration below\n\n"}
          filePath={existingFilePath || `${getSetting('files.defaultPath', '')}/${newFileName}`}
          onSave={handleSaveNewFile}
          isNewFile={!existingFileContent}
        />
      </Suspense>

      {/* Server File Browser Modal */}
      <ServerFileBrowser
        isOpen={showServerBrowser}
        onClose={() => setShowServerBrowser(false)}
        onFilesSelected={handleFilesSelected}
      />
    </Box>
  );
};

export default YamlUtility;