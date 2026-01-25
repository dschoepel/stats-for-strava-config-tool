import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { getDefaultConfigPath, INITIAL_SPORTS_LIST } from '../config/defaults.js';

function resolveFilePath(defaultPath) {
  let basePath = defaultPath || getDefaultConfigPath();

  // Expand ~ to home directory
  if (basePath.startsWith('~/') || basePath.startsWith('~\\')) {
    basePath = path.join(os.homedir(), basePath.slice(2));
  }

  // Ensure settings directory exists
  const settingsDir = path.join(basePath, 'settings');
  const filePath = path.join(settingsDir, 'strava-sports-by-category.yaml');

  return { filePath, settingsDir };
}

// GET - Read sports list
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const defaultPath = searchParams.get('defaultPath');

    const { filePath } = resolveFilePath(defaultPath);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const sportsList = yaml.load(content);
      return NextResponse.json({ success: true, sportsList });
    } catch (error) {
      // File doesn't exist, return initial list
      console.log('Sports list file not found, returning initial list');
      return NextResponse.json({ success: true, sportsList: INITIAL_SPORTS_LIST });
    }
  } catch (error) {
    console.error('Error reading sports list:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      sportsList: INITIAL_SPORTS_LIST // Fallback to initial list
    }, { status: 500 });
  }
}

// POST - Write sports list
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Support both parameter formats for backwards compatibility
    // Old format: { filePath, sports }
    // New format: { defaultPath, sportsList }
    const defaultPath = body.defaultPath || (body.filePath ? path.dirname(path.dirname(body.filePath)) : null);
    const sportsList = body.sportsList || body.sports;

    if (!sportsList || typeof sportsList !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid sports list data'
      }, { status: 400 });
    }

    const { filePath, settingsDir } = resolveFilePath(defaultPath);

    // Ensure settings directory exists
    await fs.mkdir(settingsDir, { recursive: true });

    // Write YAML file
    const yamlStr = yaml.dump(sportsList);
    await fs.writeFile(filePath, yamlStr, 'utf-8');

    console.log('Sports list saved to:', filePath);

    return NextResponse.json({ success: true, message: 'Sports list saved successfully' });
  } catch (error) {
    console.error('Error writing sports list:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
