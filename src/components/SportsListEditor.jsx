import React, { useEffect, useState } from 'react';
import { readSportsList, writeSportsList, initialSportsList } from '../utils/sportsListManager';
import './SportsListEditor.css';

export default function SportsListEditor({ settings, onDirtyChange }) {
  const [sportsList, setSportsList] = useState(initialSportsList);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [isDirty, setIsDirty] = useState(false);
  
  // Modal states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [showEditSportModal, setShowEditSportModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    async function load() {
      const list = await readSportsList(settings);
      setSportsList(list);
      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
      // Collapse all categories by default
      const expanded = {};
      Object.keys(list).forEach(cat => expanded[cat] = false);
      setExpandedCategories(expanded);
    }
    load();
  }, [settings, onDirtyChange]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const collapseAll = () => {
    const collapsed = {};
    Object.keys(sportsList).forEach(cat => collapsed[cat] = false);
    setExpandedCategories(collapsed);
  };

  const expandAll = () => {
    const expanded = {};
    Object.keys(sportsList).forEach(cat => expanded[cat] = true);
    setExpandedCategories(expanded);
  };

  // Add category
  const handleAddCategory = () => {
    if (!inputValue.trim()) {
      setModalError('Category name cannot be empty');
      return;
    }
    const exists = Object.keys(sportsList).some(
      cat => cat.toLowerCase() === inputValue.trim().toLowerCase()
    );
    if (exists) {
      setModalError('Category already exists (case-insensitive)');
      return;
    }
    const categoryName = inputValue.trim();
    setSportsList({ ...sportsList, [categoryName]: [] });
    setExpandedCategories(prev => ({ ...prev, [categoryName]: true }));
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
    setShowAddCategoryModal(false);
    setInputValue('');
    setModalError('');
    showMessage(`Category "${categoryName}" added`, 'success');
  };

  // Add sport
  const handleAddSport = () => {
    if (!inputValue.trim()) {
      setModalError('Sport name cannot be empty');
      return;
    }
    const sports = sportsList[selectedCategory] || [];
    const exists = sports.some(
      s => s.toLowerCase() === inputValue.trim().toLowerCase()
    );
    if (exists) {
      setModalError('Sport already exists in this category (case-insensitive)');
      return;
    }
    const sportName = inputValue.trim();
    setSportsList({
      ...sportsList,
      [selectedCategory]: [...sports, sportName]
    });
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
    setShowAddSportModal(false);
    setInputValue('');
    setModalError('');
    showMessage(`Sport "${sportName}" added to ${selectedCategory}`, 'success');
  };

  // Edit sport
  const handleEditSport = () => {
    if (!inputValue.trim()) {
      setModalError('Sport name cannot be empty');
      return;
    }
    const sports = sportsList[selectedCategory] || [];
    const exists = sports.some(
      s => s.toLowerCase() === inputValue.trim().toLowerCase() && s !== selectedSport
    );
    if (exists) {
      setModalError('Sport name already exists in this category (case-insensitive)');
      return;
    }
    setSportsList({
      ...sportsList,
      [selectedCategory]: sports.map(s => s === selectedSport ? inputValue.trim() : s)
    });
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
    setShowEditSportModal(false);
    setInputValue('');
    setModalError('');
    showMessage('Sport updated', 'success');
  };

  // Delete sport
  const handleDeleteSport = () => {
    if (window.confirm(`Delete sport "${selectedSport}"?`)) {
      setSportsList({
        ...sportsList,
        [selectedCategory]: sportsList[selectedCategory].filter(s => s !== selectedSport)
      });
      setIsDirty(true);
      if (onDirtyChange) onDirtyChange(true);
      setShowEditSportModal(false);
      showMessage(`Sport "${selectedSport}" deleted from ${selectedCategory}`, 'success');
    }
  };

  // Delete category
  const handleDeleteCategory = (cat) => {
    if (window.confirm(`Delete category "${cat}" and all its sports?`)) {
      const { [cat]: _, ...rest } = sportsList;
      setSportsList(rest);
      setIsDirty(true);
      if (onDirtyChange) onDirtyChange(true);
      showMessage(`Category "${cat}" deleted`, 'success');
    }
  };

  // Save
  const handleSave = async () => {
    try {
      await writeSportsList(settings, sportsList);
      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
      showMessage('✅ Saved successfully!', 'success');
    } catch (err) {
      showMessage(`❌ Error saving: ${err.message}`, 'error');
    }
  };

  return (
    <div className="sports-list-editor">
      <div className="editor-header">
        <h3>Sports List</h3>
        <div className="header-actions">
          <button 
            className="btn-secondary btn-sm"
            onClick={collapseAll}
            title="Collapse all categories"
          >
            ▸ Collapse
          </button>
          <button 
            className="btn-secondary btn-sm"
            onClick={expandAll}
            title="Expand all categories"
          >
            ▾ Expand
          </button>
          <button 
            className="btn-secondary"
            onClick={() => {
              setInputValue('');
              setShowAddCategoryModal(true);
            }}
          >
            + Category
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={!isDirty}
            title={isDirty ? 'Save changes to sports list' : 'No changes to save'}
          >
            💾 Save{isDirty ? ' *' : ''}
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="sports-accordion">
        {Object.keys(sportsList).map(category => (
          <div key={category} className="category-item">
            <div className="category-header">
              <button 
                className="category-toggle"
                onClick={() => toggleCategory(category)}
              >
                <span className="toggle-icon">
                  {expandedCategories[category] ? '▾' : '▸'}
                </span>
                <span className="category-name">{category}</span>
                <span className="sport-count">({sportsList[category].length})</span>
              </button>
              <div className="category-actions">
                <button
                  className="btn-icon"
                  onClick={() => {
                    setSelectedCategory(category);
                    setInputValue('');
                    setShowAddSportModal(true);
                  }}
                  title="Add sport to this category"
                >
                  +
                </button>
                <button
                  className="btn-icon btn-danger"
                  onClick={() => handleDeleteCategory(category)}
                  title="Delete category"
                >
                  🗑
                </button>
              </div>
            </div>

            {expandedCategories[category] && (
              <div className="sports-list">
                {sportsList[category].length === 0 ? (
                  <div className="empty-message">No sports in this category</div>
                ) : (
                  sportsList[category].map(sport => (
                    <div key={sport} className="sport-item">
                      <span className="sport-name">- {sport}</span>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          setSelectedCategory(category);
                          setSelectedSport(sport);
                          setInputValue(sport);
                          setShowEditSportModal(true);
                        }}
                        title="Edit sport"
                      >
                        ✎
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="modal-overlay" onClick={() => { setShowAddCategoryModal(false); setModalError(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h4>Add New Category</h4>
            {modalError && <div className="modal-error">{modalError}</div>}
            <input
              type="text"
              placeholder="Category name"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setModalError(''); }}
              onKeyPress={e => e.key === 'Enter' && handleAddCategory()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowAddCategoryModal(false); setModalError(''); }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddCategory}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sport Modal */}
      {showAddSportModal && (
        <div className="modal-overlay" onClick={() => { setShowAddSportModal(false); setModalError(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h4>Add Sport to {selectedCategory}</h4>
            {modalError && <div className="modal-error">{modalError}</div>}
            <input
              type="text"
              placeholder="Sport name"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setModalError(''); }}
              onKeyPress={e => e.key === 'Enter' && handleAddSport()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowAddSportModal(false); setModalError(''); }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddSport}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sport Modal */}
      {showEditSportModal && (
        <div className="modal-overlay" onClick={() => { setShowEditSportModal(false); setModalError(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h4>Edit Sport</h4>
            {modalError && <div className="modal-error">{modalError}</div>}
            <input
              type="text"
              placeholder="Sport name"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setModalError(''); }}
              onKeyPress={e => e.key === 'Enter' && handleEditSport()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-danger" onClick={handleDeleteSport}>
                Delete
              </button>
              <button className="btn-secondary" onClick={() => { setShowEditSportModal(false); setModalError(''); }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleEditSport}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
