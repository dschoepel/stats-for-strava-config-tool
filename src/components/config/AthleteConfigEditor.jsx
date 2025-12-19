import React from 'react';
import ConfigSectionEditor from '../ConfigSectionEditor';
import '../ConfigSectionEditor.css';

/**
 * AthleteConfigEditor - Handles athlete-specific configuration fields
 * Uses the original ConfigSectionEditor which has full heart rate zones support
 */
const AthleteConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  // Use the original ConfigSectionEditor which already has all the complex logic
  // including heart rate zones, sports list integration, auto-calculation, etc.
  return (
    <ConfigSectionEditor
      sectionName="athlete"
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
      isLoading={isLoading}
      onDirtyChange={onDirtyChange}
    />
  );
};

export default AthleteConfigEditor;
