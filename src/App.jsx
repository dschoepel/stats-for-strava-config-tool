import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './App.css'
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
import Help from './components/Help'
import { loadSettings, loadSettingsFromFile, saveSettings, getSetting } from './utils/settingsManager'
import { initializeWidgetDefinitions } from './utils/widgetDefinitionsInitializer'

function App() {
  // Initialize settings
  const [settings, setSettings] = useState({}); // Will be loaded after hydration
  const [isDarkMode, setIsDarkMode] = useState(false) // Will be set after hydration
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
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    // Save theme to settings
    const newSettings = { ...settings };
    newSettings.ui.theme = newTheme ? 'dark' : 'light';
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
        setIsDarkMode(loadedSettings.ui?.theme === 'dark');
        setIsSidebarCollapsed(loadedSettings.ui?.sidebarCollapsed ?? false);
        
        console.log('Loaded settings:', loadedSettings);
        console.log('Sidebar collapsed setting:', loadedSettings.ui?.sidebarCollapsed);
        
        setHasHydrated(true);
      } catch (error) {
        console.error('Error restoring navigation state:', error);
        // Fall back to defaults
        const loadedSettings = loadSettings();
        setSettings(loadedSettings);
        setIsDarkMode(getSetting('ui.theme', 'dark') === 'dark');
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
    setIsDarkMode(newSettings.ui.theme === 'dark');
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
    <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <nav className="navbar">
        <div className="navbar-brand">
          <button 
            className="mobile-menu-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <img src="/logo.svg" alt="Stats for Strava" className="app-logo" />
          <h1>Stats for Strava Config Tool</h1>
        </div>
        <div className="navbar-menu">
          <a href="#home" onClick={(e) => { e.preventDefault(); handleNavClick('Configuration') }}>Home</a>
          <SettingsDropdown onSelectSetting={setActiveSettingsModal} />
          <a href="#help" onClick={(e) => { e.preventDefault(); handleNavClick('Help & Documentation') }}>About</a>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>
      
      <div className="main-layout">
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : 'show'}`}>
          <div className="sidebar-header">
            <h2>Navigation</h2>
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? '▶' : '◀'}
            </button>
          </div>
          <ul className="sidebar-menu">
            <li>
              <div className="menu-item-wrapper">
                <a 
                  href="#main-config" 
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavClick('Configuration')
                    // When sidebar is collapsed, expand both sidebar and submenu
                    if (isSidebarCollapsed) {
                      setIsSidebarCollapsed(false)
                      setIsMainConfigExpanded(true)
                    } else {
                      setIsMainConfigExpanded(!isMainConfigExpanded)
                    }
                  }}
                  className="menu-item-with-toggle"
                  title="Configuration"
                >
                  <span className="menu-icon">⚙️</span>
                  <span className="menu-text">Configuration</span>
                </a>
                <button 
                  className="expand-toggle"
                  onClick={() => setIsMainConfigExpanded(!isMainConfigExpanded)}
                  aria-label="Toggle submenu"
                >
                  {isMainConfigExpanded ? '▼' : '▶'}
                </button>
              </div>
              {isMainConfigExpanded && (
                <ul className="submenu">
                  <li><a href="#general" onClick={(e) => { e.preventDefault(); handleNavClick('General', 'Configuration') }} title="General"><span className="menu-icon">🔧</span><span className="menu-text">General</span></a></li>
                  <li><a href="#athlete" onClick={(e) => { e.preventDefault(); handleNavClick('Athlete', 'Configuration') }} title="Athlete"><span className="menu-icon">👤</span><span className="menu-text">Athlete</span></a></li>
                  <li><a href="#appearance" onClick={(e) => { e.preventDefault(); handleNavClick('Appearance', 'Configuration') }} title="Appearance"><span className="menu-icon">🎨</span><span className="menu-text">Appearance</span></a></li>
                  <li><a href="#import" onClick={(e) => { e.preventDefault(); handleNavClick('Import', 'Configuration') }} title="Import"><span className="menu-icon">📥</span><span className="menu-text">Import</span></a></li>
                  <li><a href="#metrics" onClick={(e) => { e.preventDefault(); handleNavClick('Metrics', 'Configuration') }} title="Metrics"><span className="menu-icon">📊</span><span className="menu-text">Metrics</span></a></li>
                  <li><a href="#gear" onClick={(e) => { e.preventDefault(); handleNavClick('Gear', 'Configuration') }} title="Gear"><span className="menu-icon">🚴</span><span className="menu-text">Gear</span></a></li>
                  <li><a href="#zwift" onClick={(e) => { e.preventDefault(); handleNavClick('Zwift', 'Configuration') }} title="Zwift"><span className="menu-icon">🖥️</span><span className="menu-text">Zwift</span></a></li>
                  <li><a href="#integrations" onClick={(e) => { e.preventDefault(); handleNavClick('Integrations', 'Configuration') }} title="Integrations"><span className="menu-icon">🔗</span><span className="menu-text">Integrations</span></a></li>
                  <li><a href="#scheduling" onClick={(e) => { e.preventDefault(); handleNavClick('Scheduling Daemon', 'Configuration') }} title="Scheduling Daemon"><span className="menu-icon">⏰</span><span className="menu-text">Scheduling Daemon</span></a></li>
                </ul>
              )}
            </li>
            <li><a href="#activities" onClick={(e) => { e.preventDefault(); handleNavClick('Activities') }} title="Activities"><span className="menu-icon">🏃</span><span className="menu-text">Activities</span></a></li>
            <li><a href="#stats" onClick={(e) => { e.preventDefault(); handleNavClick('Statistics') }} title="Statistics"><span className="menu-icon">📈</span><span className="menu-text">Statistics</span></a></li>
            <li><a href="#yaml-utility" onClick={(e) => { e.preventDefault(); handleNavClick('YAML Utility') }} title="YAML Utility"><span className="menu-icon">📄</span><span className="menu-text">YAML Utility</span></a></li>
            <li><a href="#export" onClick={(e) => { e.preventDefault(); handleNavClick('Export') }} title="Export"><span className="menu-icon">📤</span><span className="menu-text">Export</span></a></li>
            <li><a href="#help" onClick={(e) => { e.preventDefault(); handleNavClick('Help & Documentation') }} title="Help & Documentation"><span className="menu-icon">❓</span><span className="menu-text">Help & Documentation</span></a></li>
          </ul>
        </aside>
        
        <main className="content-area">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); handleNavClick('Configuration') }}
              className="breadcrumb-home"
              title="Go to Configuration"
            >
              🏠
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
              <YamlUtility />
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
            ) : currentPage === 'Help & Documentation' ? (
              <Help />
            ) : (
              <>
                <h2>{currentPage}</h2>
                {/* Content for {currentPage} will be displayed here */}
              </>
            )}
          </div>
        </main>
      </div>
      
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
        <div className="modal-overlay" onClick={() => setActiveSettingsModal(null)}>
          <div className="setting-modal" style={{ maxWidth: '1000px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏅 Sports List</h2>
              <button onClick={() => setActiveSettingsModal(null)} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <SportsListEditor settings={settings} />
            </div>
          </div>
        </div>
      )}
      
      {activeSettingsModal === 'widgetDefinitions' && (
        <div className="modal-overlay" onClick={() => setActiveSettingsModal(null)}>
          <div className="setting-modal" style={{ maxWidth: '1200px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🧩 Widget Definitions</h2>
              <button onClick={() => setActiveSettingsModal(null)} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <WidgetDefinitionsEditor settings={settings} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
