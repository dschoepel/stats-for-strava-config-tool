/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import * as YAML from 'yaml';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

function generateSectionHeader(sectionKey, label, isNested = false) {
  const divider = isNested ? '#---------------------------------#' : '#===================================#';
  return `${divider}\n# ${label}\n${divider}`;
}

export async function POST(request) {
  try {
    const { configPath, outputDirectory, createBackup } = await request.json();
    
    if (!configPath) {
      return NextResponse.json({
        success: false,
        error: 'Config path is required'
      }, { status: 400 });
    }
    
    if (!outputDirectory) {
      return NextResponse.json({
        success: false,
        error: 'Output directory is required'
      }, { status: 400 });
    }
    
    // Read and parse master config
    const masterContent = await fs.readFile(configPath, 'utf8');
    const parsedData = YAML.parse(masterContent);
    
    if (!parsedData || typeof parsedData !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid config file format'
      }, { status: 400 });
    }
    
    const createdFiles = [];
    const errors = [];
    const warnings = [];
    
    // Create backup directory if needed
    let backupDir = null;
    if (createBackup) {
      backupDir = path.join(outputDirectory, 'config-backups');
      await fs.mkdir(backupDir, { recursive: true });
    }
    
    // Define section to file mapping
    const sectionToFileMapping = {
      general: { fileName: 'config.yaml', sections: ['general'] },
      appearance: { fileName: 'config-appearance.yaml', sections: ['appearance'] },
      import: { fileName: 'config-import.yaml', sections: ['import'] },
      metrics: { fileName: 'config-metrics.yaml', sections: ['metrics'] },
      gear: { fileName: 'config-gear.yaml', sections: ['gear'] },
      zwift: { fileName: 'config-zwift.yaml', sections: ['zwift'] },
      integrations: { fileName: 'config-integrations.yaml', sections: ['integrations'] },
      daemon: { fileName: 'config-daemon.yaml', sections: ['daemon'] }
    };
    
    const sectionLabels = {
      general: 'General Configuration Settings',
      appearance: 'Appearance Configuration Settings',
      import: 'Import Configuration Settings',
      metrics: 'Metrics Configuration Settings',
      gear: 'Gear Configuration Settings',
      zwift: 'Zwift Configuration Settings',
      integrations: 'Integrations Configuration Settings',
      daemon: 'Daemon Configuration Settings'
    };
    
    const nestedLabels = {
      athlete: 'Athlete Configuration Settings',
      dateFormat: 'Date Format Configuration Settings',
      dashboard: 'Dashboard Configuration Settings',
      heatmap: 'Heatmap Configuration Settings',
      photos: 'Photos Configuration Settings',
      eddington: 'Eddington Score Configuration Settings',
      stravaGear: 'Strava Gear Configuration Settings',
      customGear: 'Custom Gear Configuration Settings',
      notifications: 'Notifications Configuration Settings',
      ai: 'AI Integration Configuration Settings',
      cron: 'Cron Job Configuration Settings'
    };
    
    const nestedSections = {
      general: ['athlete'],
      appearance: ['dateFormat', 'dashboard', 'heatmap', 'photos'],
      metrics: ['eddington'],
      gear: ['stravaGear', 'customGear'],
      integrations: ['notifications', 'ai'],
      daemon: ['cron']
    };
    
    // Create each config file
    for (const [, { fileName, sections }] of Object.entries(sectionToFileMapping)) {
      const fileData = {};
      let hasData = false;
      
      sections.forEach(section => {
        if (parsedData[section]) {
          fileData[section] = parsedData[section];
          hasData = true;
        }
      });
      
      if (hasData) {
        const outputPath = path.join(outputDirectory, fileName);
        
        // Create backup if file exists
        if (createBackup) {
          try {
            await fs.access(outputPath);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const backupFileName = `${path.basename(fileName, '.yaml')}_backup_${timestamp}.yaml`;
            const backupPath = path.join(backupDir, backupFileName);
            
            const existingContent = await fs.readFile(outputPath, 'utf8');
            await fs.writeFile(backupPath, existingContent, 'utf8');
            warnings.push(`Backed up existing ${fileName} to ${backupFileName}`);
          } catch (error) {
            if (error.code !== 'ENOENT') {
              warnings.push(`Failed to backup ${fileName}: ${error.message}`);
            }
          }
        }
        
        // Generate file content with headers
        let fileContent = '';
        
        sections.forEach(section => {
          if (fileData[section]) {
            fileContent += generateSectionHeader(section, sectionLabels[section]) + '\n';
            
            const sectionData = fileData[section];
            const hasNestedSections = nestedSections[section];
            
            if (hasNestedSections && typeof sectionData === 'object') {
              const topLevelData = {};
              const nestedKeys = hasNestedSections;
              
              Object.keys(sectionData).forEach(key => {
                if (!nestedKeys.includes(key)) {
                  topLevelData[key] = sectionData[key];
                }
              });
              
              if (Object.keys(topLevelData).length > 0) {
                fileContent += `${section}:\n`;
                const topYaml = YAML.stringify(topLevelData, { indent: 2 });
                fileContent += topYaml.split('\n').map(line => line ? `  ${line}` : '').join('\n');
              } else {
                fileContent += `${section}:\n`;
              }
              
              hasNestedSections.forEach(nestedKey => {
                if (sectionData[nestedKey] !== undefined) {
                  fileContent += '\n' + generateSectionHeader(nestedKey, nestedLabels[nestedKey], true) + '\n';
                  const nestedYaml = YAML.stringify({ [nestedKey]: sectionData[nestedKey] }, { indent: 2 });
                  fileContent += nestedYaml.split('\n').map(line => line ? `  ${line}` : '').join('\n');
                }
              });
            } else {
              fileContent += YAML.stringify({ [section]: sectionData }, { indent: 2 });
            }
            
            fileContent += '\n';
          }
        });
        
        // Write file
        await fs.writeFile(outputPath, fileContent.trim(), 'utf8');
        createdFiles.push({
          fileName,
          path: outputPath,
          sections
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      createdFiles,
      fileCount: createdFiles.length,
      backupDirectory: backupDir,
      warnings,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Split config API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
