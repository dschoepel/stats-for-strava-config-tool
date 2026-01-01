import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Box, Flex, Heading, IconButton, Icon, HStack, Breadcrumb } from '@chakra-ui/react';
import { MdClose, MdSportsBasketball, MdWidgets, MdHome } from 'react-icons/md';
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import SettingsDropdown from './components/SettingsDropdown'
import SettingsDialog from './components/SettingsDialog'
import SportsListEditor from './components/SportsListEditor'
import WidgetDefinitionsEditor from './components/WidgetDefinitionsEditor'
import AppRouter from './components/AppRouter'
import Help from './components/Help'
import { loadSettings, loadSettingsFromFile, saveSettings, getSetting } from './utils/settingsManager'
import { initializeWidgetDefinitions } from './utils/widgetDefinitionsInitializer'
import { initializeSportsList } from './utils/sportsListInitializer'
import { ToastProvider, useToast } from './contexts/ToastContext'
import { ToastContainer } from './components/Toast'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useNavigation } from './hooks/useNavigation'
import { useConfigData } from './hooks/useConfigData'

function App() {
  const { theme, setTheme } = useTheme();
  const { toasts, removeToast, showError, showSuccess } = useToast();
  
  // Initialize settings
  const [settings, setSettings] = useState({}); // Will be loaded after hydration
  const [isMainConfigExpanded, setIsMainConfigExpanded] = useState(false)
  const { currentPage, breadcrumbs, navigateTo, navigateToBreadcrumb } = useNavigation()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false) // Will be set after hydration
  const [activeSettingsModal, setActiveSettingsModal] = useState(null)
  
  // File cache management at app level to persist across navigation
  const configListRef = useRef(null)
  const [fileCache, setFileCache] = useState({ files: [], fileHashes: new Map(), directory: null })
  const [hasConfigInitialized, setHasConfigInitialized] = useState(false)
  const [sectionToFileMap, setSectionToFileMap] = useState(new Map())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [sportsListDirty, setSportsListDirty] = useState(false)
  
  // Use the config data hook for managing section data
  const { 
    sectionData, 
    isLoadingSectionData, 
    loadSectionData, 
    saveSectionData 
  } = useConfigData(fileCache, sectionToFileMap, showError, showSuccess, setHasUnsavedChanges, navigateTo)
  const [widgetDefinitionsDirty, setWidgetDefinitionsDirty] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' })

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Save theme to settings
    const newSettings = { ...settings };
    newSettings.ui.theme = newTheme;
    setSettings(newSettings);
    await saveSettings(newSettings);
  }

  const toggleSidebar = async () => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    // Save sidebar state to settings
    const newSettings = { ...settings };
    if (!newSettings.ui) newSettings.ui = {};
    newSettings.ui.sidebarCollapsed = newCollapsed;
    setSettings(newSettings);
    
    console.log('Saving sidebar collapsed state:', newCollapsed);
    const success = await saveSettings(newSettings);
    if (!success) {
      console.error('Failed to save sidebar state');
    } else {
      console.log('Sidebar state saved successfully');
    }
  }

  const handleCloseModal = (modalName) => {
    const isDirty = modalName === 'sportsList' ? sportsListDirty : modalName === 'widgetDefinitions' ? widgetDefinitionsDirty : false;
    
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: `You have unsaved changes in ${modalName === 'sportsList' ? 'Sports List' : 'Widget Definitions'}. These changes will be lost if you close without saving.\n\nAre you sure you want to close?`,
        onConfirm: () => {
          setActiveSettingsModal(null);
          if (modalName === 'sportsList') setSportsListDirty(false);
          if (modalName === 'widgetDefinitions') setWidgetDefinitionsDirty(false);
          setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
        }
      });
    } else {
      setActiveSettingsModal(null);
    }
  };

  // Restore state from localStorage after hydration
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load settings - try from localStorage first (faster), then validate with file
        let loadedSettings = loadSettings();
        
        // Try to load from file in background
        try {
          const fileSettings = await loadSettingsFromFile();
          if (fileSettings) {
            loadedSettings = fileSettings;
          }
        } catch (fileError) {
          console.log('Using localStorage settings:', fileError);
        }
        
        setSettings(loadedSettings);
        if (loadedSettings.ui?.theme) {
          setTheme(loadedSettings.ui.theme);
        }
        // On mobile, start with sidebar collapsed; on desktop, use saved preference
        const isMobile = window.innerWidth < 768;
        setIsSidebarCollapsed(isMobile ? true : (loadedSettings.ui?.sidebarCollapsed ?? false));
        
        console.log('Loaded settings:', loadedSettings);
        console.log('Sidebar collapsed setting:', loadedSettings.ui?.sidebarCollapsed);
        
        setHasHydrated(true);
      } catch (error) {
        console.error('Error restoring navigation state:', error);
        // Fall back to defaults
        const loadedSettings = loadSettings();
        setSettings(loadedSettings);
        if (loadedSettings.ui?.theme) {
          setTheme(loadedSettings.ui.theme);
        }
        setIsSidebarCollapsed(getSetting('ui.sidebarCollapsed', false));
        setHasHydrated(true);
      }
    };
    
    initializeApp();
    // setTheme is stable from next-themes and won't cause re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle settings changes
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    // Update UI state based on new settings
    setIsSidebarCollapsed(newSettings.ui.sidebarCollapsed);
  }

  // Listen for settings changes from other parts of the app
  useEffect(() => {
    const handleSettingsChangedEvent = (event) => {
      handleSettingsChange(event.detail);
    };
    
    const handleSettingsResetEvent = () => {
      const defaultSettings = loadSettings();
      handleSettingsChange(defaultSettings);
    };

    window.addEventListener('settingsChanged', handleSettingsChangedEvent);
    window.addEventListener('settingsReset', handleSettingsResetEvent);

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChangedEvent);
      window.removeEventListener('settingsReset', handleSettingsResetEvent);
    };
  }, []);

  // Initialize widget definitions and sports list when config files are loaded
  useEffect(() => {
    if (hasConfigInitialized && sectionToFileMap.size > 0) {
      // Initialize widget definitions
      initializeWidgetDefinitions(sectionToFileMap)
        .then(result => {
          if (result.success) {
            console.log('✅ Widget definitions initialization complete:', result.message);
          } else {
            console.error('❌ Widget definitions initialization failed:', result.message);
          }
        })
        .catch(error => {
          console.error('❌ Widget definitions initialization error:', error);
        });
      
      // Initialize sports list
      initializeSportsList()
        .then(result => {
          if (result.success) {
            console.log('✅ Sports list initialization complete:', result.message);
          } else {
            console.error('❌ Sports list initialization failed:', result.message);
          }
        })
        .catch(error => {
          console.error('❌ Sports list initialization error:', error);
        });
    }
  }, [hasConfigInitialized, sectionToFileMap]);

  const handleNavClick = (page, parentPage = null, skipUnsavedCheck = false) => {
    // Warn if trying to navigate away with unsaved changes
    if (!skipUnsavedCheck && hasUnsavedChanges) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. These changes will be lost if you leave without saving.\n\nAre you sure you want to leave?',
        onConfirm: () => {
          setHasUnsavedChanges(false);
          setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
          // Proceed with navigation using navigateTo
          navigateTo(page, parentPage, true);
        }
      });
      return;
    }
    
    navigateTo(page, parentPage, skipUnsavedCheck);
  }

  const handleBreadcrumbClick = (index) => {
    // Warn if trying to navigate away with unsaved changes
    if (hasUnsavedChanges) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. These changes will be lost if you leave without saving.\n\nAre you sure you want to leave?',
        onConfirm: () => {
          setHasUnsavedChanges(false);
          setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
          // Proceed with breadcrumb navigation
          navigateToBreadcrumb(index);
        }
      });
      return;
    }
    
    navigateToBreadcrumb(index);
  }

  // Load section data when navigating to section pages
  useEffect(() => {
    if ((currentPage === 'General' || currentPage === 'Athlete' || currentPage === 'Appearance' || currentPage === 'Import' || currentPage === 'Metrics' || currentPage === 'Gear' || currentPage === 'Integrations' || currentPage === 'Scheduling Daemon' || currentPage === 'Zwift') && sectionToFileMap.size > 0) {
      loadSectionData(currentPage)
    }
  }, [currentPage, sectionToFileMap, loadSectionData])

  return (
    <Flex direction="column" h="100vh" w="full" bg="bg" color="text">
      <Navbar 
        isDarkMode={theme === 'dark'}
        toggleTheme={toggleTheme}
        toggleSidebar={toggleSidebar}
        handleNavClick={handleNavClick}
        onSelectSetting={setActiveSettingsModal}
      />
      
      <Flex mt="64px" h="calc(100vh - 64px)">
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
          isMainConfigExpanded={isMainConfigExpanded}
          setIsMainConfigExpanded={setIsMainConfigExpanded}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          handleNavClick={handleNavClick}
        />
        
        <Box as="main" flex={1} bg="bg" overflowY="auto">
          <Breadcrumb.Root size="lg" p={6} borderBottom="1px solid" borderColor="border" color="text">
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Breadcrumb.Link 
                  onClick={(e) => { e.preventDefault(); handleNavClick('Configuration') }}
                  cursor="pointer"
                  title="Go to Configuration"
                  color="text"
                  _hover={{ color: "primary" }}
                >
                  <Icon fontSize="1.5em"><MdHome /></Icon>
                </Breadcrumb.Link>
              </Breadcrumb.Item>
              <Breadcrumb.Separator color="text" />
              
              {hasHydrated && breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <Breadcrumb.Item>
                    {index === breadcrumbs.length - 1 ? (
                      <Breadcrumb.CurrentLink color="primary" fontWeight="semibold">{crumb}</Breadcrumb.CurrentLink>
                    ) : (
                      <Breadcrumb.Link 
                        onClick={(e) => { e.preventDefault(); handleBreadcrumbClick(index) }}
                        cursor="pointer"
                        color="text"
                        _hover={{ color: "primary" }}
                      >
                        {crumb}
                      </Breadcrumb.Link>
                    )}
                  </Breadcrumb.Item>
                  {index < breadcrumbs.length - 1 && <Breadcrumb.Separator color="text" />}
                </React.Fragment>
              ))}
            </Breadcrumb.List>
          </Breadcrumb.Root>
          <Box p={8} color="text">
            <AppRouter
              currentPage={currentPage}
              settings={settings}
              sectionData={sectionData}
              isLoadingSectionData={isLoadingSectionData}
              configListRef={configListRef}
              fileCache={fileCache}
              hasConfigInitialized={hasConfigInitialized}
              sectionToFileMap={sectionToFileMap}
              onNavigate={handleNavClick}
              onSaveSectionData={saveSectionData}
              onUnsavedChangesChange={setHasUnsavedChanges}
              onConfigInitializedChange={setHasConfigInitialized}
              onFileCacheChange={setFileCache}
              onSectionToFileMapChange={setSectionToFileMap}
            />
          </Box>
        </Box>
      </Flex>
      
      {/* Unified Settings Dialog */}
      <SettingsDialog
        isOpen={['ui', 'files', 'editor', 'validation', 'importExport'].includes(activeSettingsModal)}
        onClose={() => setActiveSettingsModal(null)}
        initialTab={activeSettingsModal || 'ui'}
      />
      
      {/* Sports List and Widget Definitions as full-screen modals */}
      {activeSettingsModal === 'sportsList' && (
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
          onClick={() => handleCloseModal('sportsList')}
        >
          <Flex
            bg="cardBg"
            borderRadius="xl"
            boxShadow="0 20px 60px rgba(0, 0, 0, 0.3)"
            w="90%"
            maxW="1000px"
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
              <HStack gap={2}>
                <Icon fontSize="2xl" color="primary"><MdSportsBasketball /></Icon>
                <Heading as="h2" size="lg" color="text" fontWeight="semibold">
                  Sports List
                </Heading>
              </HStack>
              <IconButton
                onClick={() => handleCloseModal('sportsList')}
                aria-label="Close"
                size="sm"
                variant="ghost"
                colorPalette="gray"
              >
                <Icon><MdClose /></Icon>
              </IconButton>
            </Flex>
            <Box flex={1} p={8} overflowY="auto" bg="cardBg">
              <SportsListEditor settings={settings} onDirtyChange={setSportsListDirty} />
            </Box>
          </Flex>
        </Flex>
      )}
      
      {activeSettingsModal === 'widgetDefinitions' && (
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
          onClick={() => handleCloseModal('widgetDefinitions')}
        >
          <Flex
            bg="cardBg"
            borderRadius="xl"
            boxShadow="0 20px 60px rgba(0, 0, 0, 0.3)"
            w="90%"
            maxW="1200px"
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
              <HStack gap={2}>
                <Icon fontSize="2xl" color="primary"><MdWidgets /></Icon>
                <Heading as="h2" size="lg" color="text" fontWeight="semibold">
                  Widget Definitions
                </Heading>
              </HStack>
              <IconButton
                onClick={() => handleCloseModal('widgetDefinitions')}
                aria-label="Close"
                size="sm"
                variant="ghost"
                colorPalette="gray"
              >
                <Icon><MdClose /></Icon>
              </IconButton>
            </Flex>
            <Box flex={1} p={8} overflowY="auto" bg="cardBg">
              <WidgetDefinitionsEditor settings={settings} onDirtyChange={setWidgetDefinitionsDirty} />
            </Box>
          </Flex>
        </Flex>
      )}
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Confirmation Dialog */}
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
  )
}

export default App
