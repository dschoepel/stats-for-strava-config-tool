import { useState, useCallback } from 'react';
import { readFile, updateSection, backupConfig } from '../services';
import { loadSettings } from '../utils/settingsManager';

/**
 * Custom hook to manage configuration data loading and saving
 * @param {Object} fileCache - The file cache containing directory and file information
 * @param {Map} sectionToFileMap - Map of section names to file paths
 * @param {Function} showError - Function to display error messages
 * @param {Function} showSuccess - Function to display success messages
 * @param {Function} setHasUnsavedChanges - Function to update unsaved changes state
 * @param {Function} handleNavClick - Function to navigate after save
 * @returns {Object} - Returns sectionData, loading state, and methods to load/save sections
 */
export const useConfigData = (fileCache, sectionToFileMap, showError, showSuccess, setHasUnsavedChanges, handleNavClick) => {
  const [sectionData, setSectionData] = useState({});
  const [isLoadingSectionData, setIsLoadingSectionData] = useState(false);

  // Helper function to load a single section file
  const loadSectionFile = useCallback(async (sectionInfo, sectionKey) => {
    let filePath = null;
    let topLevelKey = null;
    let secondLevelKey = null;
    
    if (typeof sectionInfo === 'string') {
      filePath = `${fileCache.directory}/${sectionInfo}`;
    } else if (sectionInfo && sectionInfo.filePath) {
      filePath = sectionInfo.filePath;
      topLevelKey = sectionInfo.topLevelKey;
      secondLevelKey = sectionInfo.secondLevelKey;
    }
    
    if (!filePath) return null;
    
    const result = await readFile(filePath);
    
    if (!result.success) {
      console.error('Failed to load file:', filePath, result.error);
      return null;
    }
    
    const YAML = await import('yaml');
    let parsedData;
    try {
      parsedData = YAML.parse(result.content);
    } catch (parseError) {
      console.error('YAML parse error for file:', filePath);
      console.error('Parse error details:', parseError);
      console.error('File content preview:', result.content?.substring(0, 500));
      return {};
    }
    
    // Check if parsing returned null/undefined (empty file)
    if (!parsedData || typeof parsedData !== 'object') {
      console.warn('YAML file is empty or not an object:', filePath);
      return {};
    }
    
    // Handle split files
    if (topLevelKey && secondLevelKey) {
      return parsedData[topLevelKey]?.[secondLevelKey] || parsedData[topLevelKey] || {};
    }
    
    // Handle nested section keys (e.g., "appearance.dashboard")
    if (sectionKey.includes('.')) {
      const [topKey, ...restKeys] = sectionKey.split('.');
      let data = parsedData[topKey];
      for (const key of restKeys) {
        if (data && typeof data === 'object') {
          data = data[key];
        } else {
          return {};
        }
      }
      return data || {};
    }
    
    // Return the section data for simple keys
    return parsedData[sectionKey] || {};
  }, [fileCache.directory]);

  // Load section data when navigating to a section page
  const loadSectionData = useCallback(async (sectionName) => {
    setIsLoadingSectionData(true);
    try {
      // Map display names to actual YAML section keys
      const sectionKeyMap = {
        'scheduling daemon': 'daemon',
      };
      
      const sectionKey = sectionKeyMap[sectionName.toLowerCase()] || sectionName.toLowerCase();
      
      let sectionInfo = null;
      
      // First try direct match
      sectionInfo = sectionToFileMap.get(sectionKey);
      
      // Check for nested mappings (e.g., "appearance" might have "appearance.dashboard")
      // This should be checked regardless of whether we found a direct match
      if (!sectionKey.includes('.')) {
        // Look for any nested paths that start with this key
        const nestedMappings = Array.from(sectionToFileMap.entries())
          .filter(([key]) => key.startsWith(`${sectionKey}.`));
        
        if (nestedMappings.length > 0) {
          // Load all nested sections and combine them
          const combinedData = {};
          
          // Also load parent section if it exists
          if (sectionInfo) {
            const parentData = await loadSectionFile(sectionInfo, sectionKey);
            Object.assign(combinedData, parentData);
          }
          
          // Load each nested section
          for (const [nestedKey, nestedInfo] of nestedMappings) {
            const nestedData = await loadSectionFile(nestedInfo, nestedKey);
            // Extract the second-level key (e.g., "dashboard" from "appearance.dashboard")
            const secondKey = nestedKey.split('.')[1];
            if (nestedData && secondKey) {
              combinedData[secondKey] = nestedData;
            }
          }
          
          // Set the combined data and return early
          setSectionData(prev => ({
            ...prev,
            [sectionKey]: combinedData
          }));
          setIsLoadingSectionData(false);
          return;
        }
      }
      
      if (!sectionInfo && sectionKey === 'athlete') {
        // Fallback: if athlete section not found, try to use general section
        sectionInfo = sectionToFileMap.get('general');
      }
      
      if (!sectionInfo) {
        // Section info not found in mapping
      }
      
      // Handle both string filename and full object formats
      let filePath = null;
      let topLevelKey = null;
      let secondLevelKey = null;
      
      if (typeof sectionInfo === 'string') {
        // API returned simple mapping with just filename
        filePath = `${fileCache.directory}/${sectionInfo}`;
      } else if (sectionInfo && sectionInfo.filePath) {
        // API returned detailed mapping with full object
        filePath = sectionInfo.filePath;
        topLevelKey = sectionInfo.topLevelKey;
        secondLevelKey = sectionInfo.secondLevelKey;
        if (sectionInfo.isSplitFile) {
          // This is a split file
        }
      }
      
      if (filePath) {
        const result = await readFile(filePath);
        
        if (result.success) {
          // Parse YAML and extract the section data
          const YAML = await import('yaml');
          const parsedData = YAML.parse(result.content);
          console.log('Parsed YAML data:', parsedData);
          
          let sectionContent = {};
          
          // Handle split files differently
          if (topLevelKey && secondLevelKey) {
            // This is a split file - the content is under topLevelKey.secondLevelKey
            sectionContent = parsedData[topLevelKey]?.[secondLevelKey] || parsedData[topLevelKey] || {};
            console.log(`Extracted split file data for ${topLevelKey}.${secondLevelKey}:`, sectionContent);
          } else if (sectionKey === 'athlete') {
            // Athlete data comes from general.athlete
            sectionContent = parsedData.general?.athlete || {};
          } else if (sectionKey === 'general') {
            // General section excludes athlete data
            const { athlete: _athlete, ...generalData } = parsedData.general || {};
            sectionContent = generalData;
          } else {
            // Other sections are top-level - use sectionKey not sectionName
            sectionContent = parsedData[sectionKey] || {};
          }
          
          setSectionData(prev => ({
            ...prev,
            [sectionKey]: sectionContent
          }));
        } else {
          console.error('Failed to load file content:', result.error);
          setSectionData(prev => ({
            ...prev,
            [sectionKey]: {}
          }));
        }
      } else {
        console.error('Section info not found for:', sectionKey);
        console.log('Available sections:', Array.from(sectionToFileMap.keys()));
        
        // Show user-friendly error message
        showError(
          `Configuration section "${sectionName}" not found in your config files. The section may be missing or in multiple files causing a conflict. Please check your configuration files.`,
          7000
        );
        
        // Set empty object so the editor can still open
        setSectionData(prev => ({
          ...prev,
          [sectionKey]: {}
        }));
      }
    } catch (error) {
      console.error('Error loading section data:', error);
      // Set empty object on error so editor can open
      const sectionKeyMap = {
        'scheduling daemon': 'daemon',
      };
      const sectionKey = sectionKeyMap[sectionName.toLowerCase()] || sectionName.toLowerCase();
      setSectionData(prev => ({
        ...prev,
        [sectionKey]: {}
      }));
    } finally {
      setIsLoadingSectionData(false);
    }
  }, [sectionToFileMap, fileCache.directory, showError, loadSectionFile]);

  // Helper function to save a single section to a file
  const saveSingleSection = useCallback(async (sectionInfo, sectionKey, data, isAthlete = false, preserveNestedKeys = []) => {
    let filePath = null;
    if (typeof sectionInfo === 'string') {
      filePath = `${fileCache.directory}/${sectionInfo}`;
    } else if (sectionInfo && sectionInfo.filePath) {
      filePath = sectionInfo.filePath;
    }
    
    if (!filePath) {
      return { success: false, error: 'No file path found' };
    }
    
    if (preserveNestedKeys.length > 0) {
      // Preserving nested keys during save
    }
    
    // Create backup before saving if autoBackup is enabled
    const settings = loadSettings();
    if (settings.files?.autoBackup !== false) {
      try {
        // Use backupsDir setting for backup location
        const backupBaseDir = typeof settings.files?.backupsDir === 'string' 
          ? settings.files.backupsDir 
          : (typeof settings.files?.defaultPath === 'string' 
            ? settings.files.defaultPath 
            : '/data/statistics-for-strava/config');
        const backupDir = `${backupBaseDir}/backups`;
        
        const backupResult = await backupConfig({
          filePath,
          backupDirectory: backupDir
        });
        if (backupResult.success) {
          console.log('Backup created:', backupResult.backupPath);
        } else {
          console.warn('Backup failed:', backupResult.error);
        }
      } catch (backupError) {
        console.warn('Backup error (continuing with save):', backupError);
        // Don't fail the save if backup fails
      }
    }
    
    const result = await updateSection({
      filePath,
      sectionName: sectionKey,
      sectionData: data,
      isAthlete,
      preserveNestedKeys
    });
    
    if (!result.success) {
      console.error('Save failed for section:', sectionKey);
      console.error('Error:', result.error);
    }
    
    return result;
  }, [fileCache.directory]);

  // Save section data
  const saveSectionData = useCallback(async (sectionName, data) => {
    setIsLoadingSectionData(true);
    try {
      const sectionKey = sectionName.toLowerCase();
      let sectionInfo = sectionToFileMap.get(sectionKey);
      
      // Check if there are nested mappings for this section
      const nestedMappings = Array.from(sectionToFileMap.entries())
        .filter(([key]) => key.startsWith(`${sectionKey}.`));
      
      // If we have nested mappings (split files), save each nested key to its respective file
      if (nestedMappings.length > 0) {
        // IMPORTANT: Save nested sections SEQUENTIALLY, not in parallel
        // This prevents race conditions when multiple saves modify the same file
        
        const nestedResults = [];
        
        // Save each nested section to its split file
        for (const [nestedKey, nestedInfo] of nestedMappings) {
          const secondKey = nestedKey.split('.')[1];
          if (data[secondKey]) {
            console.log(`Saving nested section ${nestedKey}...`);
            const result = await saveSingleSection(nestedInfo, nestedKey, data[secondKey], false);
            nestedResults.push(result);
            if (!result.success) {
              console.error(`Failed to save ${nestedKey}:`, result.error);
              break; // Stop on first failure
            }
          }
        }
        
        const nestedSuccess = nestedResults.every(r => r.success);
        
        if (!nestedSuccess) {
          console.error('Failed to save nested sections');
          nestedResults.forEach((r, i) => {
            if (!r.success) {
              console.error(`Nested save ${i} failed:`, r.error);
            }
          });
          throw new Error('Failed to save nested sections');
        }
        
        // Now save parent section data (keys that aren't split out)
        const parentInfo = sectionToFileMap.get(sectionKey);
        if (parentInfo) {
          // Extract keys that belong in parent file (not in any nested mapping)
          const nestedKeys = nestedMappings.map(([key]) => key.split('.')[1]);
          const parentData = {};
          for (const [key, value] of Object.entries(data)) {
            if (!nestedKeys.includes(key)) {
              parentData[key] = value;
            }
          }
          
          if (Object.keys(parentData).length > 0) {
            console.log(`Saving parent section ${sectionKey} with nested keys to preserve:`, nestedKeys);
            const parentResult = await saveSingleSection(
              parentInfo, 
              sectionKey, 
              parentData, 
              sectionKey === 'athlete',
              nestedKeys // Pass nested keys to preserve
            );
            if (!parentResult.success) {
              throw new Error(`Failed to save parent section: ${parentResult.error}`);
            }
          }
        }
        
        // All saves successful
        await loadSectionData(sectionName);
        showSuccess('Configuration saved successfully!');
        setHasUnsavedChanges(false);
        
        setIsLoadingSectionData(false);
        return;
      }
      
      // Fallback: if athlete section not found, try to use general section
      if (!sectionInfo && sectionKey === 'athlete') {
        sectionInfo = sectionToFileMap.get('general');
      }
      
      // Handle both string filename and full object formats
      let filePath = null;
      if (typeof sectionInfo === 'string') {
        filePath = `${fileCache.directory}/${sectionInfo}`;
      } else if (sectionInfo && sectionInfo.filePath) {
        filePath = sectionInfo.filePath;
      }
      
      // Define nested keys that should be preserved during save (even if not split files)
      // This handles cases where a section has nested subsections that are edited separately
      const NESTED_KEYS_TO_PRESERVE = {
        general: ['athlete'], // athlete is edited on separate page but stored under general
        // Add other sections here if they have similar patterns in the future
      };
      
      const preserveNestedKeys = NESTED_KEYS_TO_PRESERVE[sectionKey] || [];
      
      if (filePath) {
        const result = await updateSection({
          filePath,
          sectionName: sectionName.toLowerCase(),
          sectionData: data,
          isAthlete: sectionName.toLowerCase() === 'athlete',
          preserveNestedKeys
        });
        
        if (result.success) {
          // Reload section data to ensure form reflects actual saved data
          await loadSectionData(sectionName);
          
          showSuccess('Configuration saved successfully!');
          
          // Clear unsaved changes flag
          setHasUnsavedChanges(false);
        } else {
          throw new Error(result.error);
        }
      } else {
        // Section info not found - cannot save
        const errorMsg = `Cannot save "${sectionName}" configuration: section mapping not found. The section may exist in multiple config files causing a conflict, or the files may need to be rescanned.`;
        showError(errorMsg, 8000);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error saving section data:', error);
      showError(`Failed to save configuration: ${error.message}`, 7000);
    } finally {
      setIsLoadingSectionData(false);
    }
  }, [sectionToFileMap, fileCache.directory, showError, showSuccess, setHasUnsavedChanges, handleNavClick, saveSingleSection, loadSectionData]);

  return {
    sectionData,
    isLoadingSectionData,
    loadSectionData,
    saveSectionData
  };
};
