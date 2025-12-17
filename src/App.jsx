import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './App.css'
import YamlUtility from './components/YamlUtility'
import SettingsModal from './components/SettingsModal'
import NextConfigFileList from './components/NextConfigFileList'
import ConfigSectionEditor from './components/ConfigSectionEditor'
import Help from './components/Help'
import { loadSettings, saveSettings, getSetting } from './utils/settingsManager'

function App() {
  // Initialize settings
  const [settings, setSettings] = useState(() => loadSettings());
  const [isDarkMode, setIsDarkMode] = useState(() => getSetting('ui.theme', 'dark') === 'dark')
  const [isMainConfigExpanded, setIsMainConfigExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState('Configuration')
  const [breadcrumbs, setBreadcrumbs] = useState(['Configuration'])
  const [hasHydrated, setHasHydrated] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => getSetting('ui.sidebarCollapsed', false))
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  // File cache management at app level to persist across navigation
  const configListRef = useRef(null)
  const [fileCache, setFileCache] = useState({ files: [], fileHashes: new Map(), directory: null })
  const [hasConfigInitialized, setHasConfigInitialized] = useState(false)
  const [sectionToFileMap, setSectionToFileMap] = useState(new Map())
  const [sectionData, setSectionData] = useState({})
  const [isLoadingSectionData, setIsLoadingSectionData] = useState(false)

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    // Save theme to settings
    const newSettings = { ...settings };
    newSettings.ui.theme = newTheme ? 'dark' : 'light';
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  const toggleSidebar = () => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    // Save sidebar state to settings
    const newSettings = { ...settings };
    newSettings.ui.sidebarCollapsed = newCollapsed;
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  // Restore state from localStorage after hydration
  useEffect(() => {
    try {
      const savedPage = localStorage.getItem('stats-config-current-page');
      const savedBreadcrumbs = localStorage.getItem('stats-config-breadcrumbs');
      
      if (savedPage) {
        setCurrentPage(savedPage);
      }
      if (savedBreadcrumbs) {
        setBreadcrumbs(JSON.parse(savedBreadcrumbs));
      }
      
      setHasHydrated(true);
    } catch (error) {
      console.error('Error restoring navigation state:', error);
      setHasHydrated(true);
    }
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

  const handleNavClick = (page, parentPage = null) => {
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
            console.log('Extracted athlete data:', sectionContent)
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
          
          // Navigate back to Configuration
          handleNavClick('Configuration')
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

  // Load section data when navigating to General or Athlete pages
  useEffect(() => {
    if ((currentPage === 'General' || currentPage === 'Athlete') && sectionToFileMap.size > 0) {
      loadSectionData(currentPage)
    }
  }, [currentPage, sectionToFileMap])

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
          <a href="#settings" onClick={(e) => { e.preventDefault(); setShowSettingsModal(true); }}>Settings</a>
          <a href="#about">About</a>
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
              <ConfigSectionEditor
                sectionName="general"
                initialData={sectionData.general || {}}
                onSave={(data) => saveSectionData('general', data)}
                onCancel={() => handleNavClick('Configuration')}
                isLoading={isLoadingSectionData}
              />
            ) : currentPage === 'Athlete' ? (
              <>
                {console.log('Athlete page - sectionData.athlete:', sectionData.athlete)}
                <ConfigSectionEditor
                  sectionName="athlete"
                  initialData={sectionData.athlete || {}}
                  onSave={(data) => saveSectionData('athlete', data)}
                  onCancel={() => handleNavClick('Configuration')}
                  isLoading={isLoadingSectionData}
                />
              </>
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
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}

export default App
