import { useState, useEffect } from 'react';
import './App.css'
import YamlUtility from './components/YamlUtility'
import SettingsModal from './components/SettingsModal'
import NextConfigFileList from './components/NextConfigFileList'
import { loadSettings, saveSettings, getSetting } from './utils/settingsManager'

function App() {
  // Initialize settings
  const [settings, setSettings] = useState(() => loadSettings());
  const [isDarkMode, setIsDarkMode] = useState(() => getSetting('ui.theme', 'dark') === 'dark')
  const [isMainConfigExpanded, setIsMainConfigExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === 'undefined') return 'Configuration';
    try {
      const saved = localStorage.getItem('stats-config-current-page');
      return saved || 'Configuration';
    } catch {
      return 'Configuration';
    }
  })
  const [breadcrumbs, setBreadcrumbs] = useState(() => {
    if (typeof window === 'undefined') return ['Configuration'];
    try {
      const saved = localStorage.getItem('stats-config-breadcrumbs');
      return saved ? JSON.parse(saved) : ['Configuration'];
    } catch {
      return ['Configuration'];
    }
  })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => getSetting('ui.sidebarCollapsed', false))
  const [showSettingsModal, setShowSettingsModal] = useState(false)

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
    setCurrentPage(newBreadcrumbs[newBreadcrumbs.length - 1])
  }

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
          </ul>
        </aside>
        
        <main className="content-area">
          <nav className="breadcrumbs" aria-label="Breadcrumb" suppressHydrationWarning={true}>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); handleNavClick('Configuration') }}
              className="breadcrumb-home"
              title="Go to Configuration"
            >
              🏠
            </a>
            {breadcrumbs.map((crumb, index) => (
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
                <NextConfigFileList />
              </>
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
