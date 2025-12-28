/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import * as YAML from 'yaml';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

// Helper function to find line positions of top-level YAML sections
function findSectionPositions(lines) {
  const positions = new Map();
  let currentSection = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1; // 1-based line numbering
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;
    
    // Check if this is a top-level section (no leading whitespace on the original line)
    const originalLine = lines[i];
    if (!originalLine.startsWith(' ') && !originalLine.startsWith('\t') && line.includes(':')) {
      // Extract section name (everything before the first colon)
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const sectionName = line.substring(0, colonIndex).trim();
        
        // End previous section if exists
        if (currentSection && positions.has(currentSection)) {
          positions.get(currentSection).endLine = lineNumber - 1;
        }
        
        // Start new section
        currentSection = sectionName;
        positions.set(sectionName, {
          startLine: lineNumber,
          endLine: lines.length // Will be updated when next section starts or at EOF
        });
      }
    }
  }
  
  // Set end line for the last section
  if (currentSection && positions.has(currentSection)) {
    positions.get(currentSection).endLine = lines.length;
  }
  
  return positions;
}

export async function POST(request) {
  try {
    const { files } = await request.json();
    
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({
        success: false,
        error: 'Files array is required'
      }, { status: 400 });
    }

    // Use Map to store arrays of file info for each section
    const sectionMapping = new Map();
    const conflicts = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file.path, 'utf8');
        const yamlData = YAML.parse(content);
        
        if (yamlData && typeof yamlData === 'object') {
          // Parse with line number information
          const lines = content.split('\n');
          const sectionPositions = findSectionPositions(lines);
          
          // Get top-level keys from this file
          const topLevelKeys = Object.keys(yamlData);
          
          // Check if this is a split file (e.g., config-appearance-dashboard.yaml)
          const splitFileMatch = file.name.match(/^config-([^-]+)-(.+)\.ya?ml$/);
          
          if (splitFileMatch) {
            // This is a split file containing a second-level key
            const [, topKey, secondKey] = splitFileMatch;
            const nestedPath = `${topKey}.${secondKey}`;
            
            console.log(`Detected split file: ${file.name} -> ${nestedPath}`);
            
            // Map the nested path to this file
            const sectionInfo = {
              fileName: file.name,
              filePath: file.path,
              topLevelKey: topKey,
              secondLevelKey: secondKey,
              isSplitFile: true,
              ...sectionPositions.get(topKey)
            };
            
            if (!sectionMapping.has(nestedPath)) {
              sectionMapping.set(nestedPath, []);
            }
            sectionMapping.get(nestedPath).push(sectionInfo);
            continue; // Skip normal processing for split files
          }
          
          for (const key of topLevelKeys) {
            if (key === 'general') {
              // Handle general section with special athlete processing
              const generalData = yamlData.general;
              console.log('Found general section in', file.name, 'with keys:', Object.keys(generalData || {}));
              
              // If general contains athlete, map athlete section separately (even if it's empty/placeholder)
              if (generalData && typeof generalData === 'object' && 'athlete' in generalData) {
                console.log('Creating athlete mapping for', file.name);
                const athleteInfo = {
                  fileName: file.name,
                  filePath: file.path,
                  parentSection: 'general',
                  ...sectionPositions.get('general')
                };
                
                if (!sectionMapping.has('athlete')) {
                  sectionMapping.set('athlete', []);
                }
                sectionMapping.get('athlete').push(athleteInfo);
                console.log('Athlete mapping created successfully');
              } else {
                console.log('No athlete data found in general section of', file.name);
              }
              
              // Check if general has other keys besides athlete
              const generalWithoutAthlete = { ...generalData };
              delete generalWithoutAthlete.athlete;
              
              if (Object.keys(generalWithoutAthlete).length > 0) {
                // General section has content other than athlete
                const generalInfo = {
                  fileName: file.name,
                  filePath: file.path,
                  ...sectionPositions.get('general')
                };
                
                if (!sectionMapping.has('general')) {
                  sectionMapping.set('general', []);
                }
                sectionMapping.get('general').push(generalInfo);
              }
            } else {
              // Handle all non-general top-level sections
              const sectionInfo = {
                fileName: file.name,
                filePath: file.path,
                ...sectionPositions.get(key)
              };
              
              if (!sectionMapping.has(key)) {
                sectionMapping.set(key, []);
              }
              sectionMapping.get(key).push(sectionInfo);
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to parse ${file.name}:`, error.message);
      }
    }
    
    // Identify conflicts (sections with multiple files)
    for (const [section, fileInfoArray] of sectionMapping.entries()) {
      if (fileInfoArray.length > 1) {
        conflicts.push({
          section: section,
          files: fileInfoArray.map(info => info.fileName)
        });
      }
    }

    // Convert Map to objects for JSON serialization
    // Group nested sections with their parent for better organization
    const topLevelSections = [];
    const nestedSections = new Map(); // Map of parent -> array of children
    
    for (const [sectionKey] of sectionMapping.entries()) {
      if (sectionKey.includes('.')) {
        // This is a nested section (e.g., appearance.dashboard)
        const [topLevel] = sectionKey.split('.');
        if (!nestedSections.has(topLevel)) {
          nestedSections.set(topLevel, []);
        }
        nestedSections.get(topLevel).push(sectionKey);
      } else {
        // This is a top-level section
        topLevelSections.push(sectionKey);
      }
    }
    
    // Sort top-level sections alphabetically
    topLevelSections.sort();
    
    // Build sorted list: parent followed immediately by its children
    const sortedSectionKeys = [];
    for (const topLevel of topLevelSections) {
      sortedSectionKeys.push(topLevel);
      
      // Add children for this parent, if any
      if (nestedSections.has(topLevel)) {
        const children = nestedSections.get(topLevel).sort();
        sortedSectionKeys.push(...children);
      }
    }
    
    // For sectionToFileMap (simple mapping), use the first file if multiple exist
    // Maintain grouped order
    const sectionToFileMap = {};
    for (const key of sortedSectionKeys) {
      if (sectionMapping.has(key)) {
        sectionToFileMap[key] = sectionMapping.get(key)[0].fileName;
      }
    }
    
    // For detailedMapping, include all files for each section
    // Maintain grouped order
    const detailedSectionMapping = {};
    for (const key of sortedSectionKeys) {
      if (sectionMapping.has(key)) {
        const fileInfoArray = sectionMapping.get(key);
        detailedSectionMapping[key] = fileInfoArray.length === 1 ? fileInfoArray[0] : fileInfoArray;
      }
    }

    return NextResponse.json({
      success: true,
      sectionMapping: sectionToFileMap,
      detailedMapping: detailedSectionMapping,
      conflicts: conflicts,
      totalSections: sectionMapping.size
    });

  } catch (error) {
    console.error('Parse sections API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}