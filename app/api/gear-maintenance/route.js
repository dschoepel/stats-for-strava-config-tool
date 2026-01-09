/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { getDefaultConfigPath } from '../config/defaults.js';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

// Default gear maintenance configuration
const defaultGearMaintenance = {
  enabled: true,
  hashtagPrefix: 'sfs',
  countersResetMode: 'nextActivityOnwards',
  ignoreRetiredGear: false,
  components: [],
  gears: []
};

/**
 * Resolve the gear maintenance config file path
 */
function resolveGearMaintenanceFilePath(defaultPath) {
  let basePath = defaultPath || getDefaultConfigPath();

  // Expand ~ to home directory
  if (basePath.startsWith('~/') || basePath.startsWith('~\\')) {
    basePath = path.join(os.homedir(), basePath.slice(2));
  }

  const filePath = path.join(basePath, 'gear-maintenance.yaml');
  return { filePath, basePath };
}

/**
 * GET - Read gear maintenance configuration
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const defaultPath = searchParams.get('defaultPath');

    const { filePath } = resolveGearMaintenanceFilePath(defaultPath);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const config = yaml.load(content);
      return NextResponse.json({ 
        success: true, 
        config,
        filePath 
      });
    } catch {
      // File doesn't exist, return default config
      console.log('Gear maintenance config not found, returning default');
      return NextResponse.json({ 
        success: true, 
        config: defaultGearMaintenance,
        filePath,
        isDefault: true
      });
    }
  } catch (error) {
    console.error('Error reading gear maintenance config:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      config: defaultGearMaintenance
    }, { status: 500 });
  }
}

/**
 * POST - Write gear maintenance configuration
 */
export async function POST(request) {
  try {
    const { defaultPath, config } = await request.json();

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Configuration data is required'
      }, { status: 400 });
    }

    const { filePath, basePath } = resolveGearMaintenanceFilePath(defaultPath);

    // Ensure directory exists
    await fs.mkdir(basePath, { recursive: true });

    // Write YAML file with comments
    const yamlStr = generateYamlWithComments(config);
    await fs.writeFile(filePath, yamlStr, 'utf-8');

    console.log('Gear maintenance config saved to:', filePath);

    return NextResponse.json({ 
      success: true, 
      message: 'Gear maintenance configuration saved successfully',
      filePath
    });

  } catch (error) {
    console.error('Error writing gear maintenance config:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Generate YAML with helpful comments
 */
function generateYamlWithComments(config) {
  let yamlStr = '# Gear Maintenance Configuration\n';
  yamlStr += '# See: https://statistics-for-strava-docs.robiningelbrecht.be/#/configuration/gear-maintenance\n\n';
  
  yamlStr += '# Set to true to enable the gear maintenance feature\n';
  yamlStr += `enabled: ${config.enabled}\n\n`;
  
  yamlStr += '# Prefix for the hashtags used in the Strava activity title\n';
  yamlStr += `hashtagPrefix: '${config.hashtagPrefix}'\n\n`;
  
  yamlStr += '# If set to "nextActivityOnwards", adding a maintenance hashtag to an activity title will reset the counters from the next activity onwards.\n';
  yamlStr += '# If set to "currentActivityOnwards", adding a maintenance hashtag to an activity title will reset the counters from the tagged activity onwards.\n';
  yamlStr += '# If you are unsure, set this to "nextActivityOnwards" as this is the most common use case.\n';
  yamlStr += `countersResetMode: ${config.countersResetMode}\n\n`;
  
  yamlStr += '# Set to true to ignore retired gear\n';
  yamlStr += `ignoreRetiredGear: ${config.ignoreRetiredGear}\n\n`;
  
  if (config.components && config.components.length > 0) {
    yamlStr += 'components:\n';
    config.components.forEach(component => {
      yamlStr += '  # Tag to be added to the Strava activity title.\n';
      yamlStr += '  # Will be combined with the hashtag-prefix and must be unique across all components.\n';
      yamlStr += `  # Example: #${config.hashtagPrefix}-${component.tag}\n`;
      yamlStr += `  - tag: '${component.tag}'\n`;
      yamlStr += `    label: '${component.label}'\n`;
      
      if (component.imgSrc) {
        yamlStr += `    imgSrc: '${component.imgSrc}'\n`;
      }
      
      if (component.attachedTo && component.attachedTo.length > 0) {
        yamlStr += '    attachedTo:\n';
        component.attachedTo.forEach(gearId => {
          yamlStr += `      - '${gearId}'\n`;
        });
      }
      
      if (component.purchasePrice) {
        yamlStr += '    purchasePrice:\n';
        yamlStr += `      amountInCents: ${component.purchasePrice.amountInCents}\n`;
        yamlStr += `      currency: '${component.purchasePrice.currency}'\n`;
      }
      
      if (component.maintenance && component.maintenance.length > 0) {
        yamlStr += '    maintenance:\n';
        component.maintenance.forEach(task => {
          yamlStr += `      - tag: ${task.tag}\n`;
          yamlStr += `        label: ${task.label}\n`;
          yamlStr += '        interval:\n';
          yamlStr += `          value: ${task.interval.value}\n`;
          yamlStr += `          unit: ${task.interval.unit}\n`;
        });
      }
      yamlStr += '\n';
    });
  } else {
    yamlStr += 'components: []\n\n';
  }
  
  if (config.gears && config.gears.length > 0) {
    yamlStr += '# If you don\'t want to reference images, set gears to an empty array: `gears: []`\n';
    yamlStr += 'gears:\n';
    config.gears.forEach(gear => {
      yamlStr += `  - gearId: '${gear.gearId}'\n`;
      if (gear.imgSrc) {
        yamlStr += `    imgSrc: '${gear.imgSrc}'\n`;
      }
    });
  } else {
    yamlStr += 'gears: []\n';
  }
  
  return yamlStr;
}
