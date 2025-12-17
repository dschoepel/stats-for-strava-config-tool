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
          
          for (const key of topLevelKeys) {
            if (key === 'general') {
              // Handle general section with special athlete processing
              const generalData = yamlData.general;
              console.log('Found general section in', file.name, 'with keys:', Object.keys(generalData || {}));
              
              // If general contains athlete, map athlete section separately
              if (generalData?.athlete) {
                console.log('Creating athlete mapping for', file.name);
                const athleteInfo = {
                  fileName: file.name,
                  filePath: file.path,
                  parentSection: 'general',
                  ...sectionPositions.get('general')
                };
                
                if (sectionMapping.has('athlete')) {
                  conflicts.push({
                    section: 'athlete',
                    files: [sectionMapping.get('athlete').fileName, file.name]
                  });
                } else {
                  sectionMapping.set('athlete', athleteInfo);
                  console.log('Athlete mapping created successfully');
                }
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
                
                if (sectionMapping.has('general')) {
                  conflicts.push({
                    section: 'general',
                    files: [sectionMapping.get('general').fileName, file.name]
                  });
                } else {
                  sectionMapping.set('general', generalInfo);
                }
              }
            } else {
              // Handle all non-general top-level sections
              const sectionInfo = {
                fileName: file.name,
                filePath: file.path,
                ...sectionPositions.get(key)
              };
              
              if (sectionMapping.has(key)) {
                conflicts.push({
                  section: key,
                  files: [sectionMapping.get(key).fileName, file.name]
                });
              } else {
                sectionMapping.set(key, sectionInfo);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to parse ${file.name}:`, error.message);
      }
    }

    // Convert Map to objects for JSON serialization
    const sectionToFileMap = Object.fromEntries(
      Array.from(sectionMapping.entries()).map(([key, value]) => [
        key, 
        typeof value === 'string' ? value : value.fileName
      ])
    );
    
    const detailedSectionMapping = Object.fromEntries(sectionMapping);

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