/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import * as YAML from 'yaml';
import { getConfigSchemas } from '../../../src/schemas/configSchemas.js';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

// Import helper function
function getDefaultsFromSchema(schema) {
  if (!schema || !schema.properties) return {};
  
  const defaults = {};
  Object.entries(schema.properties).forEach(([key, prop]) => {
    if (prop.default !== undefined) {
      defaults[key] = prop.default;
    } else if (prop.type === 'object' && prop.properties) {
      // Recursively get defaults for nested objects
      const nestedDefaults = getDefaultsFromSchema(prop);
      // Always include nested objects if they have any defaults
      if (Object.keys(nestedDefaults).length > 0) {
        defaults[key] = nestedDefaults;
      }
    } else if (prop.type === 'array') {
      defaults[key] = prop.default || [];
    } else if (prop.type && Array.isArray(prop.type) && prop.type.includes('null')) {
      // For nullable fields without defaults, set to null
      defaults[key] = null;
    }
  });
  
  return defaults;
}

// Import merge utility functions (we'll inline them since imports might not work in API routes)
function generateTableOfContents(configData) {
  const toc = [];
  toc.push('#---------------------------------------------------#');
  toc.push('# Table of Contents');
  toc.push('#---------------------------------------------------#');
  
  const sections = [
    { key: 'general', label: 'General configuration settings', subsections: [
      { key: 'athlete', label: 'Athlete configuration settings' }
    ]},
    { key: 'appearance', label: 'Appearance configuration settings', subsections: [
      { key: 'dateFormat', label: 'Date format configuration settings' },
      { key: 'dashboard', label: 'Dashboard configuration settings' },
      { key: 'heatmap', label: 'Heatmap configuration settings' },
      { key: 'photos', label: 'Photos configuration settings' }
    ]},
    { key: 'import', label: 'Import configuration settings' },
    { key: 'metrics', label: 'Metrics configuration settings', subsections: [
      { key: 'eddington', label: 'Eddington score configuration settings' }
    ]},
    { key: 'gear', label: 'Gear configuration settings', subsections: [
      { key: 'stravaGear', label: 'Strava gear configuration settings' },
      { key: 'customGear', label: 'Custom gear configuration settings' }
    ]},
    { key: 'zwift', label: 'Zwift configuration settings' },
    { key: 'integrations', label: 'Integrations configuration settings', subsections: [
      { key: 'notifications', label: 'Notifications configuration settings' },
      { key: 'ai', label: 'AI integrations configuration settings' }
    ]},
    { key: 'daemon', label: 'Daemon configuration settings', subsections: [
      { key: 'cron', label: 'Cron job configuration settings' }
    ]}
  ];
  
  sections.forEach(section => {
    if (configData[section.key]) {
      toc.push(`# - ${section.label}`);
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          if (configData[section.key] && configData[section.key][subsection.key]) {
            toc.push(`#   - ${subsection.label}`);
          }
        });
      }
    }
  });
  
  toc.push('#');
  return toc.join('\n');
}

function generateSectionHeader(sectionKey, label, isNested = false) {
  const divider = isNested ? '#---------------------------------#' : '#===================================#';
  return `${divider}\n# ${label}\n${divider}`;
}

export async function POST(request) {
  try {
    const { files, outputPath, createBackup, fillMissing = false } = await request.json();
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Files array is required and must not be empty'
      }, { status: 400 });
    }
    
    if (!outputPath) {
      return NextResponse.json({
        success: false,
        error: 'Output path is required'
      }, { status: 400 });
    }
    
    const mergedData = {};
    const errors = [];
    const warnings = [];
    
    // Parse and merge all config files
    for (const file of files) {
      try {
        let content;
        if (file.path) {
          content = await fs.readFile(file.path, 'utf8');
        } else if (file.content) {
          content = file.content;
        } else {
          errors.push(`No path or content provided for file: ${file.name || 'unknown'}`);
          continue;
        }
        
        const parsedData = YAML.parse(content);
        if (parsedData && typeof parsedData === 'object') {
          Object.keys(parsedData).forEach(key => {
            if (!mergedData[key]) {
              mergedData[key] = parsedData[key];
            } else {
              warnings.push(`Duplicate section '${key}' found in ${file.name || file.path} - using version from first file`);
            }
          });
        }
      } catch (error) {
        errors.push(`Failed to parse ${file.name || file.path}: ${error.message}`);
      }
    }
    
    // If fillMissing is true, add missing sections with defaults
    if (fillMissing) {
      const allSections = ['general', 'appearance', 'import', 'metrics', 'gear', 'zwift', 'integrations', 'daemon'];
      const missingSections = allSections.filter(section => !mergedData[section]);
      
      // Define nested section structure
      const nestedSectionMap = {
        general: ['athlete'],
        appearance: [], // dateFormat, dashboard, heatmap, photos are properties, not separate schemas
        metrics: [], // eddington is a property
        gear: [], // stravaGear, customGear are properties
        integrations: [], // notifications, ai are properties
        daemon: [] // cron is a property
      };
      
      if (missingSections.length > 0) {
        const schemas = getConfigSchemas();
        
        for (const section of missingSections) {
          if (schemas[section]) {
            const defaults = getDefaultsFromSchema(schemas[section]);
            if (defaults && Object.keys(defaults).length > 0) {
              // Add nested sections if they have separate schemas
              const nestedSections = nestedSectionMap[section] || [];
              for (const nestedSection of nestedSections) {
                if (schemas[nestedSection]) {
                  defaults[nestedSection] = getDefaultsFromSchema(schemas[nestedSection]);
                }
              }
              
              mergedData[section] = defaults;
              warnings.push(`Added missing section '${section}' with default values`);
            }
          }
        }
      }
      
      // Also check for missing nested sections in existing top-level sections
      const schemas = getConfigSchemas();
      for (const [section, nestedSections] of Object.entries(nestedSectionMap)) {
        if (mergedData[section] && nestedSections.length > 0) {
          for (const nestedSection of nestedSections) {
            // If the parent section exists but the nested section doesn't, add it
            if (!mergedData[section][nestedSection] && schemas[nestedSection]) {
              const nestedDefaults = getDefaultsFromSchema(schemas[nestedSection]);
              if (Object.keys(nestedDefaults).length > 0) {
                mergedData[section][nestedSection] = nestedDefaults;
                warnings.push(`Added missing nested section '${nestedSection}' to existing '${section}' section`);
              }
            }
          }
        }
      }
    }
    
    if (Object.keys(mergedData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid configuration data found in provided files',
        errors
      }, { status: 400 });
    }
    
    // Create backup if requested and file exists
    let backupPath = null;
    if (createBackup) {
      try {
        await fs.access(outputPath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const dirPath = path.dirname(outputPath);
        const fileName = path.basename(outputPath, '.yaml');
        const backupDir = path.join(dirPath, 'config-backups');
        
        await fs.mkdir(backupDir, { recursive: true });
        backupPath = path.join(backupDir, `${fileName}_backup_${timestamp}.yaml`);
        
        const existingContent = await fs.readFile(outputPath, 'utf8');
        await fs.writeFile(backupPath, existingContent, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          warnings.push(`Failed to create backup: ${error.message}`);
        }
      }
    }
    
    // Generate merged YAML with TOC and headers
    let mergedYaml = generateTableOfContents(mergedData) + '\n\n';
    
    const sectionOrder = [
      { key: 'general', label: 'General Configuration Settings' },
      { key: 'appearance', label: 'Appearance Configuration Settings' },
      { key: 'import', label: 'Import Configuration Settings' },
      { key: 'metrics', label: 'Metrics Configuration Settings' },
      { key: 'gear', label: 'Gear Configuration Settings' },
      { key: 'zwift', label: 'Zwift Configuration Settings' },
      { key: 'integrations', label: 'Integrations Configuration Settings' },
      { key: 'daemon', label: 'Daemon Configuration Settings' }
    ];
    
    const nestedSections = {
      general: [{ key: 'athlete', label: 'Athlete Configuration Settings' }],
      appearance: [
        { key: 'dateFormat', label: 'Date Format Configuration Settings' },
        { key: 'dashboard', label: 'Dashboard Configuration Settings' },
        { key: 'heatmap', label: 'Heatmap Configuration Settings' },
        { key: 'photos', label: 'Photos Configuration Settings' }
      ],
      metrics: [{ key: 'eddington', label: 'Eddington Score Configuration Settings' }],
      gear: [
        { key: 'stravaGear', label: 'Strava Gear Configuration Settings' },
        { key: 'customGear', label: 'Custom Gear Configuration Settings' }
      ],
      integrations: [
        { key: 'notifications', label: 'Notifications Configuration Settings' },
        { key: 'ai', label: 'AI Integration Configuration Settings' }
      ],
      daemon: [{ key: 'cron', label: 'Cron Job Configuration Settings' }]
    };
    
    // Build YAML with headers
    sectionOrder.forEach(section => {
      if (mergedData[section.key]) {
        mergedYaml += generateSectionHeader(section.key, section.label) + '\n';
        
        const sectionData = mergedData[section.key];
        const hasNestedSections = nestedSections[section.key];
        
        if (hasNestedSections && typeof sectionData === 'object') {
          const topLevelData = {};
          const nestedKeys = hasNestedSections.map(s => s.key);
          
          Object.keys(sectionData).forEach(key => {
            if (!nestedKeys.includes(key)) {
              topLevelData[key] = sectionData[key];
            }
          });
          
          if (Object.keys(topLevelData).length > 0) {
            mergedYaml += `${section.key}:\n`;
            const topYaml = YAML.stringify(topLevelData, { indent: 2 });
            mergedYaml += topYaml.split('\n').map(line => line ? `  ${line}` : '').join('\n');
          } else {
            mergedYaml += `${section.key}:\n`;
          }
          
          hasNestedSections.forEach(nested => {
            if (sectionData[nested.key] !== undefined) {
              mergedYaml += '\n' + generateSectionHeader(nested.key, nested.label, true) + '\n';
              const nestedYaml = YAML.stringify({ [nested.key]: sectionData[nested.key] }, { indent: 2 });
              mergedYaml += nestedYaml.split('\n').map(line => line ? `  ${line}` : '').join('\n');
            }
          });
        } else {
          mergedYaml += YAML.stringify({ [section.key]: sectionData }, { indent: 2 });
        }
        
        mergedYaml += '\n';
      }
    });
    
    // Write merged config to output path
    await fs.writeFile(outputPath, mergedYaml.trim(), 'utf8');
    
    return NextResponse.json({
      success: true,
      outputPath,
      backupPath,
      sectionsCount: Object.keys(mergedData).length,
      warnings,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Merge config API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
