/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import * as YAML from 'yaml';
import path from 'path';
import { debugLog } from '../../../src/utils/debug';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

// Define the field order for the athlete section to ensure consistent YAML output
const ATHLETE_FIELD_ORDER = [
  'birthday',
  'maxHeartRateFormula',
  'restingHeartRateFormula',
  'heartRateZones',
  'weightHistory',
  'ftpHistory'
];

// Helper function to order object entries according to a predefined order
function orderObjectEntries(obj, fieldOrder) {
  const ordered = [];
  // First, add fields in the specified order
  for (const key of fieldOrder) {
    if (key in obj) {
      ordered.push([key, obj[key]]);
    }
  }
  // Then, add any remaining fields not in the order list
  for (const key of Object.keys(obj)) {
    if (!fieldOrder.includes(key)) {
      ordered.push([key, obj[key]]);
    }
  }
  return ordered;
}

export async function POST(request) {
  try {
    const { filePath, sectionName, sectionData, isAthlete, preserveNestedKeys = [] } = await request.json();
    
    if (!filePath || !sectionName || sectionData === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: filePath, sectionName, sectionData'
      }, { status: 400 });
    }
    
    debugLog('=== UPDATE SECTION API CALL ===');
    debugLog('Section:', sectionName);
    debugLog('File:', filePath);
    debugLog('isAthlete:', isAthlete);
    debugLog('preserveNestedKeys:', preserveNestedKeys);
    debugLog('Section data keys:', Object.keys(sectionData));
    
    if (preserveNestedKeys.length > 0) {
      debugLog('⚠️ Will preserve these nested keys:', preserveNestedKeys);
    } else {
      debugLog('✓ No nested keys to preserve (they are in separate files)');
    }

    // Check if this is a nested section (e.g., "appearance.dashboard")
    const isNestedSection = sectionName.includes('.');
    let topLevelKey, secondLevelKey;
    
    if (isNestedSection) {
      [topLevelKey, secondLevelKey] = sectionName.split('.');
    }

    // Read the existing YAML file
    const content = await fs.readFile(filePath, 'utf8');
    
    // Validate file is not empty
    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Configuration file is empty. Please restore from backup before saving.'
      }, { status: 400 });
    }
    
    debugLog('Original file has comments:', content.includes('#'));
    debugLog('Original content preview:', content.substring(0, 200) + '...');
    
    // Try to parse YAML for validation, but don't fail if it's invalid
    // (we'll fix it during text replacement)
    try {
      const yamlData = YAML.parse(content);
      if (!yamlData || typeof yamlData !== 'object') {
        console.warn('YAML file format seems invalid, but will attempt to update via text replacement');
      }
    } catch (parseError) {
      console.warn('YAML parse error (will be fixed during update):', parseError.message);
      // Continue anyway - we'll fix invalid YAML during text replacement
    }

    // Use custom text replacement approach to preserve comments and fix quoting
    debugLog('Using custom text replacement with proper quoting...');
    let updatedYaml;
    
    // Custom text replacement that handles proper quoting
    const lines = content.split('\n');
    const result = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (isAthlete) {
        // Handle athlete section (nested under general)
        if (trimmedLine === 'general:') {
          result.push(line);
          i++;
          let foundAthlete = false;
          let generalIndent = line.length - line.trimStart().length;
          
          // Look for athlete subsection
          while (i < lines.length) {
            const subLine = lines[i];
            const subTrimmed = subLine.trim();
            const subIndent = subLine.length - subLine.trimStart().length;
            
            // If we hit another top-level section, we need to insert athlete before it
            if (subTrimmed && subIndent <= generalIndent && !subTrimmed.startsWith('#')) {
              if (!foundAthlete) {
                // Insert athlete section before this top-level section
                const athleteIndent = ' '.repeat(generalIndent + 2);
                result.push(`${athleteIndent}athlete:`);
                const baseIndent = ' '.repeat(generalIndent + 4);
                // Use ordered entries to maintain consistent field order
                orderObjectEntries(sectionData, ATHLETE_FIELD_ORDER).forEach(([key, value]) => {
                  let valueStr;
                  if (value === null) {
                    valueStr = 'null';
                  } else if (typeof value === 'string') {
                    // Always quote birthday field, date-like values, and restingHeartRateFormula
                    const isDateValue = /^\d{4}-\d{2}-\d{2}$/.test(value);
                    const needsQuoting = key === 'birthday' || key === 'restingHeartRateFormula' || isDateValue || /[:#[\]{}*&!|>'"@`%]|^\s|\s$|^-\s/.test(value);
                    if (needsQuoting) {
                      valueStr = `'${value.replace(/'/g, "''")}'`;
                    } else {
                      valueStr = value;
                    }
                  } else if (typeof value === 'object' && value !== null) {
                    let complexYaml = YAML.stringify({ [key]: value }, {
                      indent: 2,
                      lineWidth: 0,
                      minContentWidth: 0,
                      singleQuote: true
                    }).trim();
                    // Quote both date keys and date values
                    complexYaml = complexYaml.replace(/(\s+)(\d{4}-\d{2}-\d{2}):/g, "$1'$2':");
                    complexYaml = complexYaml.replace(/: (\d{4}-\d{2}-\d{2})$/gm, ": '$1'");
                    const complexLines = complexYaml.split('\n');
                    complexLines.forEach((complexLine, index) => {
                      if (index === 0) {
                        result.push(baseIndent + complexLine.trimStart());
                      } else {
                        result.push(baseIndent + complexLine);
                      }
                    });
                    return;
                  } else {
                    valueStr = String(value);
                  }
                  result.push(`${baseIndent}${key}: ${valueStr}`);
                });
              }
              break;
            }

            if (subTrimmed === 'athlete:') {
              foundAthlete = true;
              result.push(subLine);
              const athleteIndent = subLine.length - subLine.trimStart().length;

              // Add new athlete data with proper quoting
              const baseIndent = ' '.repeat(athleteIndent + 2);
              // Use ordered entries to maintain consistent field order
              orderObjectEntries(sectionData, ATHLETE_FIELD_ORDER).forEach(([key, value]) => {
                let valueStr;
                if (value === null) {
                  valueStr = 'null';
                } else if (typeof value === 'string') {
                  // Always quote birthday field, date-like values, and restingHeartRateFormula
                  const isDateValue = /^\d{4}-\d{2}-\d{2}$/.test(value);
                  const needsQuoting = key === 'birthday' || key === 'restingHeartRateFormula' || isDateValue || /[:#[\]{}*&!|>'"@`%]|^\s|\s$|^-\s/.test(value);
                  if (needsQuoting) {
                    valueStr = `'${value.replace(/'/g, "''")}'`;
                  } else {
                    valueStr = value;
                  }
                } else if (typeof value === 'object' && value !== null) {
                  let complexYaml = YAML.stringify({ [key]: value }, {
                    indent: 2,
                    lineWidth: 0,
                    minContentWidth: 0,
                    singleQuote: true
                  }).trim();
                  // Quote both date keys and date values
                  complexYaml = complexYaml.replace(/(\s+)(\d{4}-\d{2}-\d{2}):/g, "$1'$2':");
                  complexYaml = complexYaml.replace(/: (\d{4}-\d{2}-\d{2})$/gm, ": '$1'");
                  const complexLines = complexYaml.split('\n');
                  complexLines.forEach((complexLine, index) => {
                    if (index === 0) {
                      result.push(baseIndent + complexLine.trimStart());
                    } else {
                      result.push(baseIndent + complexLine);
                    }
                  });
                  return;
                } else {
                  valueStr = String(value);
                }
                result.push(`${baseIndent}${key}: ${valueStr}`);
              });
              
              // Skip original athlete section content
              i++;
              while (i < lines.length) {
                const nextLine = lines[i];
                const nextTrimmed = nextLine.trim();
                const nextIndent = nextLine.length - nextLine.trimStart().length;
                
                // Stop if we find a section at the same level as athlete or higher
                if (nextTrimmed && nextIndent <= athleteIndent && !nextTrimmed.startsWith('#')) {
                  break;
                }
                i++;
              }
              break;
            } else {
              result.push(subLine);
              i++;
            }
          }
        } else {
          result.push(line);
          i++;
        }
      } else {
        // Handle top-level sections or nested sections
        const targetKey = isNestedSection ? topLevelKey : sectionName;
        
        if (trimmedLine === `${targetKey}:`) {
          result.push(line);
          const sectionIndent = line.length - line.trimStart().length;
          
          if (isNestedSection) {
            // For nested sections, we need to find and update the second-level key
            i++;
            let foundSecondLevel = false;
            
            while (i < lines.length) {
              const subLine = lines[i];
              const subTrimmed = subLine.trim();
              const subIndent = subLine.length - subLine.trimStart().length;
              
              // Stop if we hit another top-level section
              if (subTrimmed && subIndent <= sectionIndent && !subTrimmed.startsWith('#')) {
                // If we didn't find the second-level key, add it before this line
                if (!foundSecondLevel) {
                  const secondLevelIndent = ' '.repeat(sectionIndent + 2);
                  result.push(`${secondLevelIndent}${secondLevelKey}:`);
                  const baseIndent = ' '.repeat(sectionIndent + 4);
                  Object.entries(sectionData).forEach(([key, value]) => {
                    addYamlField(result, baseIndent, key, value);
                  });
                }
                break;
              }
              
              if (subTrimmed === `${secondLevelKey}:`) {
                foundSecondLevel = true;
                result.push(subLine);
                const secondLevelIndent = subLine.length - subLine.trimStart().length;
                
                // Add new data for the second-level key
                const baseIndent = ' '.repeat(secondLevelIndent + 2);
                Object.entries(sectionData).forEach(([key, value]) => {
                  addYamlField(result, baseIndent, key, value);
                });
                
                // Skip original second-level section content
                i++;
                while (i < lines.length) {
                  const nextLine = lines[i];
                  const nextTrimmed = nextLine.trim();
                  const nextIndent = nextLine.length - nextLine.trimStart().length;
                  
                  // Stop if we find a section at the same level as secondLevelKey or higher
                  if (nextTrimmed && nextIndent <= secondLevelIndent && !nextTrimmed.startsWith('#')) {
                    break;
                  }
                  i++;
                }
                break;
              } else {
                result.push(subLine);
                i++;
              }
            }
            
            // If we reached the end without finding second-level key, add it
            if (!foundSecondLevel) {
              const secondLevelIndent = ' '.repeat(sectionIndent + 2);
              result.push(`${secondLevelIndent}${secondLevelKey}:`);
              const baseIndent = ' '.repeat(sectionIndent + 4);
              Object.entries(sectionData).forEach(([key, value]) => {
                addYamlField(result, baseIndent, key, value);
              });
            }
          } else {
            // Handle top-level sections (original logic)
            const baseIndent = ' '.repeat(sectionIndent + 2);
            
            // First, add the data fields we're updating
            Object.entries(sectionData).forEach(([key, value]) => {
              addYamlField(result, baseIndent, key, value);
            });
            
            // Skip original section content, BUT preserve nested keys that we should keep
            i++;
            while (i < lines.length) {
              const nextLine = lines[i];
              const nextTrimmed = nextLine.trim();
              const nextIndent = nextLine.length - nextLine.trimStart().length;
              
              // Stop if we find a top-level section
              if (nextTrimmed && nextIndent <= sectionIndent && !nextTrimmed.startsWith('#')) {
                break;
              }
              
              // Check if this is a nested key we should preserve
              if (preserveNestedKeys.length > 0 && nextIndent === sectionIndent + 2) {
                const match = nextTrimmed.match(/^(\w+):/);
                if (match && preserveNestedKeys.includes(match[1])) {
                  // This is a nested key we need to preserve - copy it and its content
                  result.push(nextLine);
                  const nestedKeyIndent = nextIndent;
                  i++;
                  
                  // Copy all content under this nested key
                  while (i < lines.length) {
                    const nestedLine = lines[i];
                    const nestedTrimmed = nestedLine.trim();
                    const nestedLineIndent = nestedLine.length - nestedLine.trimStart().length;
                    
                    // Stop if we hit same-level or higher
                    if (nestedTrimmed && nestedLineIndent <= nestedKeyIndent && !nestedTrimmed.startsWith('#')) {
                      break;
                    }
                    
                    result.push(nestedLine);
                    i++;
                  }
                  continue;
                }
              }
              
              i++;
            }
          }
        } else {
          result.push(line);
          i++;
        }
      }
    }
    
    // Helper function to add a YAML field with proper formatting
    function addYamlField(result, baseIndent, key, value) {
      // Special handling for dashboard.layout - use JSON-like formatting or null
      if (key === 'layout') {
        // Handle null or empty layout
        if (value === null || (Array.isArray(value) && value.length === 0)) {
          result.push(`${baseIndent}${key}: null`);
          return;
        }
        
        // Handle array of widgets
        if (Array.isArray(value)) {
          result.push(`${baseIndent}${key}:`);
          
          value.forEach((widget, index) => {
            // Validate widget object has required fields
            if (!widget || typeof widget !== 'object') {
              throw new Error(`Invalid widget at index ${index}: must be an object`);
            }
            if (!widget.widget) {
              throw new Error(`Invalid widget at index ${index}: missing required field 'widget'`);
            }
            if (typeof widget.width !== 'number') {
              throw new Error(`Invalid widget at index ${index}: missing or invalid field 'width'`);
            }
            if (typeof widget.enabled !== 'boolean') {
              throw new Error(`Invalid widget at index ${index}: missing or invalid field 'enabled'`);
            }
            
            // Format widget as JSON-like with double quotes and proper indentation
            // Widget indent should be base + 2 for array items, then + 2 more for object content
            const widgetIndent = baseIndent + '  ';  // Array item level
            const objIndent = widgetIndent + '  ';   // Object content level
            
            // Opening brace on the same line as the dash
            result.push(`${widgetIndent}- {`);
            
            // Add widget fields
            result.push(`${objIndent}"widget": "${widget.widget}",`);
            result.push(`${objIndent}"width": ${widget.width},`);
            result.push(`${objIndent}"enabled": ${widget.enabled}${widget.config && Object.keys(widget.config).length > 0 ? ',' : ''}`);
            
            // Handle config if present
            if (widget.config && Object.keys(widget.config).length > 0) {
              result.push(`${objIndent}"config":`);
              result.push(`${objIndent}  {`);
              
              const configKeys = Object.keys(widget.config);
              configKeys.forEach((configKey, idx) => {
                const configValue = widget.config[configKey];
                const isLast = idx === configKeys.length - 1;
                const comma = isLast ? ',' : ',';
                
                if (Array.isArray(configValue)) {
                  // Format arrays inline
                  const arrayStr = JSON.stringify(configValue);
                  result.push(`${objIndent}    "${configKey}": ${arrayStr}${comma}`);
                } else if (typeof configValue === 'object' && configValue !== null) {
                  // Format nested objects
                  result.push(`${objIndent}    "${configKey}": ${JSON.stringify(configValue)}${comma}`);
                } else if (typeof configValue === 'string') {
                  result.push(`${objIndent}    "${configKey}": "${configValue}"${comma}`);
                } else {
                  // Numbers, booleans, null
                  result.push(`${objIndent}    "${configKey}": ${configValue}${comma}`);
                }
              });
              
              result.push(`${objIndent}  },`);
            }
            
            // Closing brace
            result.push(`${objIndent}}`);
          });
          return;
        }
      }
      
      let valueStr;
      if (value === null) {
        valueStr = 'null';
      } else if (typeof value === 'string') {
        // Always quote birthday field and date-like values (YYYY-MM-DD format)
        const isDateValue = /^\d{4}-\d{2}-\d{2}$/.test(value);
        const needsQuoting = key === 'birthday' || isDateValue || /[:#[\]{}*&!|>'"@`%]|^\s|\s$|^-\s/.test(value);
        if (needsQuoting) {
          valueStr = `'${value.replace(/'/g, "''")}'`;
        } else {
          valueStr = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        let complexYaml = YAML.stringify({ [key]: value }, {
          indent: 2,
          lineWidth: 0,
          minContentWidth: 0,
          singleQuote: true
        }).trim();
        // Quote both date keys and date values
        complexYaml = complexYaml.replace(/(\s+)(\d{4}-\d{2}-\d{2}):/g, "$1'$2':");
        complexYaml = complexYaml.replace(/: (\d{4}-\d{2}-\d{2})$/gm, ": '$1'");
        const complexLines = complexYaml.split('\n');
        complexLines.forEach((complexLine, index) => {
          if (index === 0) {
            result.push(baseIndent + complexLine.trimStart());
          } else {
            result.push(baseIndent + complexLine);
          }
        });
        return;
      } else {
        valueStr = String(value);
      }
      result.push(`${baseIndent}${key}: ${valueStr}`);
    }
    
    updatedYaml = result.join('\n');
    
    // Safety check: don't save if result is empty or too short
    if (!updatedYaml || updatedYaml.trim().length < 10) {
      console.error('Generated YAML is empty or too short, aborting save');
      console.error('Result array length:', result.length);
      console.error('Result preview:', result.slice(0, 10));
      return NextResponse.json({
        success: false,
        error: 'Generated YAML is invalid (too short). This is a bug - please report it.'
      }, { status: 500 });
    }

    // Create backup before writing (if auto-backup is enabled in settings)
    let backupCount = undefined;
    try {
      // Settings are stored in {configFileDir}/settings/config-tool-settings.yaml
      const fileDir = path.dirname(filePath);
      const settingsPath = path.join(fileDir, 'settings', 'config-tool-settings.yaml');
      let autoBackupEnabled = true; // Default to true
      
      debugLog('[UPDATE-SECTION] Checking backup settings...');
      debugLog('[UPDATE-SECTION] Config file dir:', fileDir);
      debugLog('[UPDATE-SECTION] Settings path:', settingsPath);
      
      try {
        const settingsContent = await fs.readFile(settingsPath, 'utf8');
        const settings = YAML.parse(settingsContent);
        autoBackupEnabled = settings?.files?.autoBackup !== false;
        debugLog('[UPDATE-SECTION] Settings loaded - autoBackup:', settings?.files?.autoBackup);
        debugLog('[UPDATE-SECTION] Auto-backup enabled:', autoBackupEnabled);
      } catch (settingsError) {
        debugLog('[UPDATE-SECTION] Failed to load settings, using default (enabled):', settingsError.message);
        // Settings file doesn't exist or can't be parsed - use default
      }
      
      if (autoBackupEnabled) {
        debugLog('[UPDATE-SECTION] Auto-backup enabled, creating backup...');
        
        const fileDir = path.dirname(filePath);
        const fileName = path.basename(filePath);
        const backupDir = path.join(fileDir, 'config-backups');
        
        debugLog('[UPDATE-SECTION] Backup directory:', backupDir);
        
        // Create backup directory if it doesn't exist
        await fs.mkdir(backupDir, { recursive: true });
        
        // Generate backup filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const nameParts = fileName.split('.');
        const extension = nameParts.pop();
        const name = nameParts.join('.');
        const backupFileName = `${name}_backup_${timestamp}.${extension}`;
        const backupPath = path.join(backupDir, backupFileName);
        
        // Copy original file to backup
        await fs.copyFile(filePath, backupPath);
        debugLog('[UPDATE-SECTION] Backup created:', backupPath);
        
        // Count total backups (all YAML files in backup folder)
        const files = await fs.readdir(backupDir);
        backupCount = files.filter(f => 
          f.endsWith('.yaml') || f.endsWith('.yml')
        ).length;
        debugLog('[UPDATE-SECTION] Total backups:', backupCount);
      } else {
        debugLog('[UPDATE-SECTION] Auto-backup disabled in settings');
      }
    } catch (backupError) {
      console.error('[UPDATE-SECTION] Backup failed:', backupError);
      // Don't fail the update if backup fails
    }

    // Write the updated YAML back to the file
    await fs.writeFile(filePath, updatedYaml, 'utf8');

    // Debug: Check if comments were preserved
    const hasComments = updatedYaml.includes('#');
    debugLog('Comments preserved:', hasComments);
    debugLog('Updated YAML preview:', updatedYaml.substring(0, 200) + '...');

    return NextResponse.json({
      success: true,
      message: `Section '${sectionName}' updated successfully`,
      filePath: filePath,
      backupCount,
      debug: {
        commentsPreserved: hasComments,
        yamlPreview: updatedYaml.substring(0, 200)
      }
    });

  } catch (error) {
    console.error('Update section API error:', error);
    
    // Provide more specific error messages
    if (error.code === 'ENOENT') {
      return NextResponse.json({
        success: false,
        error: 'Configuration file not found'
      }, { status: 404 });
    }
    
    if (error.name === 'YAMLException') {
      return NextResponse.json({
        success: false,
        error: 'Invalid YAML format in file'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}