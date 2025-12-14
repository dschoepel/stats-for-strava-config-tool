import './App.css'

function App() {
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Stats for Strava Config Tool</h1>
        </div>
        <div className="navbar-menu">
          <a href="#home">Home</a>
          <a href="#settings">Settings</a>
          <a href="#about">About</a>
        </div>
      </nav>
      
      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Navigation</h2>
          </div>
          <ul className="sidebar-menu">
            <li><a href="#dashboard">Dashboard</a></li>
            <li><a href="#activities">Activities</a></li>
            <li><a href="#stats">Statistics</a></li>
            <li><a href="#config">Configuration</a></li>
            <li><a href="#export">Export</a></li>
          </ul>
        </aside>
        
        <main className="content-area">
          {/* Content area ready for the web app's content */}
        </main>
      </div>
    </div>
  )
}

export default App
