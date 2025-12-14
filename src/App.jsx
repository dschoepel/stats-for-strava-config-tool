import { useState } from 'react'
import './App.css'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isMainConfigExpanded, setIsMainConfigExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState('Main Configuration')
  const [breadcrumbs, setBreadcrumbs] = useState(['Main Configuration'])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

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
          <h1>Stats for Strava Config Tool</h1>
        </div>
        <div className="navbar-menu">
          <a href="#home">Home</a>
          <a href="#settings">Settings</a>
          <a href="#about">About</a>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>
      
      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Navigation</h2>
          </div>
          <ul className="sidebar-menu">
            <li>
              <div className="menu-item-wrapper">
                <a 
                  href="#main-config" 
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavClick('Main Configuration')
                    setIsMainConfigExpanded(!isMainConfigExpanded)
                  }}
                  className="menu-item-with-toggle"
                >
                  Main Configuration
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
                  <li><a href="#general" onClick={(e) => { e.preventDefault(); handleNavClick('General', 'Main Configuration') }}>General</a></li>
                  <li><a href="#athlete" onClick={(e) => { e.preventDefault(); handleNavClick('Athlete', 'Main Configuration') }}>Athlete</a></li>
                  <li><a href="#appearance" onClick={(e) => { e.preventDefault(); handleNavClick('Appearance', 'Main Configuration') }}>Appearance</a></li>
                  <li><a href="#import" onClick={(e) => { e.preventDefault(); handleNavClick('Import', 'Main Configuration') }}>Import</a></li>
                  <li><a href="#metrics" onClick={(e) => { e.preventDefault(); handleNavClick('Metrics', 'Main Configuration') }}>Metrics</a></li>
                  <li><a href="#gear" onClick={(e) => { e.preventDefault(); handleNavClick('Gear', 'Main Configuration') }}>Gear</a></li>
                  <li><a href="#zwift" onClick={(e) => { e.preventDefault(); handleNavClick('Zwift', 'Main Configuration') }}>Zwift</a></li>
                  <li><a href="#integrations" onClick={(e) => { e.preventDefault(); handleNavClick('Integrations', 'Main Configuration') }}>Integrations</a></li>
                  <li><a href="#scheduling" onClick={(e) => { e.preventDefault(); handleNavClick('Scheduling Daemon', 'Main Configuration') }}>Scheduling Daemon</a></li>
                </ul>
              )}
            </li>
            <li><a href="#activities" onClick={(e) => { e.preventDefault(); handleNavClick('Activities') }}>Activities</a></li>
            <li><a href="#stats" onClick={(e) => { e.preventDefault(); handleNavClick('Statistics') }}>Statistics</a></li>
            <li><a href="#config" onClick={(e) => { e.preventDefault(); handleNavClick('Configuration') }}>Configuration</a></li>
            <li><a href="#export" onClick={(e) => { e.preventDefault(); handleNavClick('Export') }}>Export</a></li>
          </ul>
        </aside>
        
        <main className="content-area">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
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
            <h2>{currentPage}</h2>
            {/* Content for {currentPage} will be displayed here */}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
