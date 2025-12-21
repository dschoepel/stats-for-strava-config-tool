import React, { useState, useRef, useEffect } from 'react';
import './SettingsDropdown.css';

const SettingsDropdown = ({ onSelectSetting }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const menuItems = [
    { id: 'ui', label: 'User Interface', icon: '🎨' },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'editor', label: 'Editor', icon: '📝' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'sportsList', label: 'Sports List', icon: '🏅' },
    { id: 'widgetDefinitions', label: 'Widgets', icon: '🧩' },
    { id: 'importExport', label: 'Import/Export', icon: '📦' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (itemId) => {
    setIsOpen(false);
    onSelectSetting(itemId);
  };

  return (
    <div className="settings-dropdown" ref={dropdownRef}>
      <button 
        className="settings-dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        ⚙️ Settings {isOpen ? '▲' : '▼'}
      </button>
      
      {isOpen && (
        <div className="settings-dropdown-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className="settings-menu-item"
              onClick={() => handleItemClick(item.id)}
            >
              <span className="menu-item-icon">{item.icon}</span>
              <span className="menu-item-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SettingsDropdown;
