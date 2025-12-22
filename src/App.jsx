import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Box, Flex, Heading, IconButton, Icon, HStack } from '@chakra-ui/react';
import { MdClose, MdSportsBasketball, MdWidgets, MdHome } from 'react-icons/md';
import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import YamlUtility from './components/YamlUtility'
import SettingsDropdown from './components/SettingsDropdown'
import UISettingsModal from './components/settings/UISettingsModal'
import FilesSettingsModal from './components/settings/FilesSettingsModal'
import EditorSettingsModal from './components/settings/EditorSettingsModal'
import PerformanceSettingsModal from './components/settings/PerformanceSettingsModal'
import ImportExportModal from './components/settings/ImportExportModal'
import SportsListEditor from './components/SportsListEditor'
import WidgetDefinitionsEditor from './components/WidgetDefinitionsEditor'
import NextConfigFileList from './components/NextConfigFileList'
import ConfigSectionEditor from './components/ConfigSectionEditor'
import AthleteConfigEditor from './components/config/AthleteConfigEditor'
import GeneralConfigEditor from './components/config/GeneralConfigEditor'
import AppearanceConfigEditor from './components/config/AppearanceConfigEditor'
import ZwiftConfigEditor from './components/config/ZwiftConfigEditor'
import Help from './components/Help'
import { loadSettings, loadSettingsFromFile, saveSettings, getSetting } from './utils/settingsManager'
import { initializeWidgetDefinitions } from './utils/widgetDefinitionsInitializer'

function App() {
  const { theme, setTheme } = useTheme();
  
  // Initialize settings
  const [settings, setSettings] = useState({}); // Will be loaded after hydration
  const [isMainConfigExpanded, setIsMainConfigExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState('Configuration')
  const [breadcrumbs, setBreadcrumbs] = useState(['Configuration'])
  const [hasHydrated, setHasHydrated] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false) // Will be set after hydration
  const [activeSettingsModal, setActiveSettingsModal] = useState(null)
  
  // File cache management at app level to persist across navigation
  const configListRef = useRef(null)
  const [fileCache, setFileCache] = useState({ files: [], fileHashes: new Map(), directory: null })
  const [hasConfigInitialized, setHasConfigInitialized] = useState(false)
  const [sectionToFileMap, setSectionToFileMap] = useState(new Map())
  const [sectionData, setSectionData] = useState({})
  const [isLoadingSectionData, setIsLoadingSectionData] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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

  // Restore state from localStorage after hydration
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedPage = localStorage.getItem('stats-config-current-page');
        const savedBreadcrumbs = localStorage.getItem('stats-config-breadcrumbs');
        
        if (savedPage) {
          setCurrentPage(savedPage);
        }
        if (savedBreadcrumbs) {
          setBreadcrumbs(JSON.parse(savedBreadcrumbs));
        }
        
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
  }, []);

  // Save current page and breadcrumbs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stats-config-current-page', currentPage);
      localStorage.setItem('stats-config-breadcrumbs', JSON.stringify(breadcrumbs));
    } catch (error) {
      console.error('Error saving navigation state:', error);
    }
  }, [currentPage, breadcrumbs])

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

  // Initialize widget definitions when config files are loaded
  useEffect(() => {
    if (hasConfigInitialized && sectionToFileMap.size > 0) {
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
    }
  }, [hasConfigInitialized, sectionToFileMap]);

  const handleNavClick = (page, parentPage = null, skipUnsavedCheck = false) => {
    // Warn if trying to navigate away with unsaved changes
    if (!skipUnsavedCheck && hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. These changes will be lost if you leave without saving.\n\nAre you sure you want to leave?')) {
        return;
      }
      setHasUnsavedChanges(false);
    }
    
    if (parentPage) {
      setBreadcrumbs([parentPage, page])
    } else {
      setBreadcrumbs([page])
    }
    setCurrentPage(page)
  }

  const handleBreadcrumbClick = (index) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(newBreadcrumbs)
    const targetPage = newBreadcrumbs[newBreadcrumbs.length - 1]
    setCurrentPage(targetPage)
  }

  // Load section data when navigating to a section page
  const loadSectionData = useCallback(async (sectionName) => {
    setIsLoadingSectionData(true)
    try {
      console.log('Loading section data for:', sectionName)
      console.log('Available section mappings:', Array.from(sectionToFileMap.keys()))
      console.log('Section mapping entries:', Array.from(sectionToFileMap.entries()))
      
      // Map section names to the appropriate keys in the section mapping
      const sectionKey = sectionName.toLowerCase()
      let sectionInfo = null
      
      // Get section info from mapping (handle both string and object formats)
      sectionInfo = sectionToFileMap.get(sectionKey)
      console.log(`Section info for ${sectionKey}:`, sectionInfo)
      
      if (!sectionInfo && sectionKey === 'athlete') {
        // Fallback: if athlete section not found, try to use general section
        console.log('Athlete section not found, trying to use general section as fallback')
        sectionInfo = sectionToFileMap.get('general')
        console.log('Using general section for athlete data:', sectionInfo)
      }
      
      if (!sectionInfo) {
        console.log(`No section info found for '${sectionKey}', available keys:`, Array.from(sectionToFileMap.keys()))
      }
      
      // Handle both string filename and full object formats
      let filePath = null
      if (typeof sectionInfo === 'string') {
        // API returned simple mapping with just filename
        filePath = `${fileCache.directory}/${sectionInfo}`
        console.log(`Constructed file path from string: ${filePath}`)
      } else if (sectionInfo && sectionInfo.filePath) {
        // API returned detailed mapping with full object
        filePath = sectionInfo.filePath
        console.log(`Using file path from object: ${filePath}`)
      }
      
      if (filePath) {
        console.log('Found section info, using file path:', filePath)
        const response = await fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`)
        const result = await response.json()
        
        if (result.success) {
          // Parse YAML and extract the section data
          const YAML = await import('yaml')
          const parsedData = YAML.parse(result.content)
          console.log('Parsed YAML data:', parsedData)
          
          let sectionContent = {}
          if (sectionName.toLowerCase() === 'athlete') {
            // Athlete data comes from general.athlete
            sectionContent = parsedData.general?.athlete || {}
          } else if (sectionName.toLowerCase() === 'general') {
            // General section excludes athlete data
            const { athlete: _athlete, ...generalData } = parsedData.general || {}
            sectionContent = generalData
            console.log('Extracted general data:', sectionContent)
          } else {
            // Other sections are top-level
            sectionContent = parsedData[sectionName.toLowerCase()] || {}
            console.log('Extracted section data:', sectionContent)
          }
          
          setSectionData(prev => ({
            ...prev,
            [sectionName.toLowerCase()]: sectionContent
          }))
        } else {
          console.error('Failed to load file content:', result.error)
        }
      } else {
        console.error('Section info not found for:', sectionKey)
      }
    } catch (error) {
      console.error('Error loading section data:', error)
    } finally {
      setIsLoadingSectionData(false)
    }
  }, [sectionToFileMap, fileCache.directory])

  // Save section data
  const saveSectionData = async (sectionName, data) => {
    setIsLoadingSectionData(true)
    try {
      const sectionInfo = sectionToFileMap.get(sectionName.toLowerCase())
      
      // Handle both string filename and full object formats
      let filePath = null
      if (typeof sectionInfo === 'string') {
        filePath = `${fileCache.directory}/${sectionInfo}`
      } else if (sectionInfo && sectionInfo.filePath) {
        filePath = sectionInfo.filePath
      }
      
      if (filePath) {
        const response = await fetch('/api/update-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: filePath,
            sectionName: sectionName.toLowerCase(),
            sectionData: data,
            isAthlete: sectionName.toLowerCase() === 'athlete'
          })
        })
        
        const result = await response.json()
        if (result.success) {
          // Reload section data to ensure form reflects actual saved data
          await loadSectionData(sectionName)
          
          // Show success message or toast
          console.log('Section updated successfully')
          
          // Clear unsaved changes flag and navigate back to Configuration
          setHasUnsavedChanges(false)
          
          // Navigate back to Configuration (skip unsaved check since we just saved)
          handleNavClick('Configuration', null, true)
        } else {
          throw new Error(result.error)
        }
      }
    } catch (error) {
      console.error('Error saving section data:', error)
      // Show error message
    } finally {
      setIsLoadingSectionData(false)
    }
  }

  // Load section data when navigating to section pages
  useEffect(() => {
    if ((currentPage === 'General' || currentPage === 'Athlete' || currentPage === 'Appearance') && sectionToFileMap.size > 0) {
      loadSectionData(currentPage)
    }
  }, [currentPage, sectionToFileMap, loadSectionData])

  // Determine configuration mode based on available files
  const detectConfigurationMode = (files) => {
    const hasMainConfig = files.some(f => f.name === 'config.yaml')
    const hasConfigFiles = files.some(f => f.name.startsWith('config-') && f.name.endsWith('.yaml'))
    const totalFiles = files.length
    
    // config.yaml must always be present
    if (!hasMainConfig) {
      return 'invalid' // Missing required config.yaml
    }
    
    if (totalFiles === 1 && hasMainConfig) {
      return 'single-file'
    } else if (hasMainConfig && hasConfigFiles) {
      return 'multi-file'
    } else {
      return 'unknown'
    }
  }

  // Calculate configuration mode based on current files
  const configMode = useMemo(() => {
    if (fileCache.files && fileCache.files.length > 0) {
      const mode = detectConfigurationMode(fileCache.files)
      console.log(`Configuration mode detected: ${mode}`);
      console.log('Files:', fileCache.files.map(f => f.name));
      return mode
    }
    return null
  }, [fileCache.files])

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
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); handleNavClick('Configuration') }}
              className="breadcrumb-home"
              title="Go to Configuration"
            >
              <Icon fontSize="1.5em" style={{ verticalAlign: 'middle' }}><MdHome /></Icon>
            </a>
            {hasHydrated && breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {index > 0 && <span className="breadcrumb-separator"> / </span>}
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); handleBreadcrumbClick(index) }}
                  className={index === breadcrumbs.length - 1 ? 'active' : ''}
                >
                  {crumb}
                </a>
              </span>
            ))}
          </nav>
          <div className="content-body">
            {currentPage === 'YAML Utility' ? (
              <YamlUtility setBreadcrumbs={setBreadcrumbs} breadcrumbs={breadcrumbs} />
            ) : currentPage === 'Configuration' ? (
              <>
                <h2>{currentPage}</h2>
                <NextConfigFileList 
                  ref={configListRef}
                  fileCache={fileCache}
                  setFileCache={setFileCache}
                  hasConfigInitialized={hasConfigInitialized}
                  setHasConfigInitialized={setHasConfigInitialized}
                  configMode={configMode}
                  sectionToFileMap={sectionToFileMap}
                  setSectionToFileMap={setSectionToFileMap}
                />
              </>
            ) : currentPage === 'General' ? (
              <GeneralConfigEditor
                key={JSON.stringify(sectionData.general)}
                initialData={sectionData.general || {}}
                onSave={(data) => saveSectionData('general', data)}
                onCancel={() => handleNavClick('Configuration')}
                isLoading={isLoadingSectionData}
                onDirtyChange={setHasUnsavedChanges}
              />
            ) : currentPage === 'Athlete' ? (
              <AthleteConfigEditor
                key={JSON.stringify(sectionData.athlete)}
                initialData={sectionData.athlete || {}}
                onSave={(data) => saveSectionData('athlete', data)}
                onCancel={() => handleNavClick('Configuration')}
                isLoading={isLoadingSectionData}
                onDirtyChange={setHasUnsavedChanges}
              />
            ) : currentPage === 'Appearance' ? (
              <AppearanceConfigEditor
                key={JSON.stringify(sectionData.appearance)}
                initialData={sectionData.appearance || {}}
                onSave={(data) => saveSectionData('appearance', data)}
                onCancel={() => handleNavClick('Configuration')}
                isLoading={isLoadingSectionData}
                onDirtyChange={setHasUnsavedChanges}
              />
            ) : currentPage === 'Zwift' ? (
              <ZwiftConfigEditor
                key={JSON.stringify(sectionData.zwift)}
                initialData={sectionData.zwift || {}}
                onSave={(data) => saveSectionData('zwift', data)}
                onCancel={() => handleNavClick('Configuration')}
                isLoading={isLoadingSectionData}
                onDirtyChange={setHasUnsavedChanges}
              />
            ) : currentPage === 'Help & Documentation' ? (
              <Help />
            ) : (
              <>
                <h2>{currentPage}</h2>
                {/* Content for {currentPage} will be displayed here */}
              </>
            )}
          </div>
        </Box>
      </Flex>
      
      {/* Individual Settings Modals */}
      <UISettingsModal
        isOpen={activeSettingsModal === 'ui'}
        onClose={() => setActiveSettingsModal(null)}
      />
      <FilesSettingsModal
        isOpen={activeSettingsModal === 'files'}
        onClose={() => setActiveSettingsModal(null)}
      />
      <EditorSettingsModal
        isOpen={activeSettingsModal === 'editor'}
        onClose={() => setActiveSettingsModal(null)}
      />
      <PerformanceSettingsModal
        isOpen={activeSettingsModal === 'performance'}
        onClose={() => setActiveSettingsModal(null)}
      />
      <ImportExportModal
        isOpen={activeSettingsModal === 'importExport'}
        onClose={() => setActiveSettingsModal(null)}
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
          onClick={() => setActiveSettingsModal(null)}
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
                onClick={() => setActiveSettingsModal(null)}
                aria-label="Close"
                size="sm"
                variant="ghost"
                colorPalette="gray"
              >
                <Icon><MdClose /></Icon>
              </IconButton>
            </Flex>
            <Box flex={1} p={8} overflowY="auto" bg="cardBg">
              <SportsListEditor settings={settings} />
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
          onClick={() => setActiveSettingsModal(null)}
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
                onClick={() => setActiveSettingsModal(null)}
                aria-label="Close"
                size="sm"
                variant="ghost"
                colorPalette="gray"
              >
                <Icon><MdClose /></Icon>
              </IconButton>
            </Flex>
            <Box flex={1} p={8} overflowY="auto" bg="cardBg">
              <WidgetDefinitionsEditor settings={settings} />
            </Box>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}

export default App
