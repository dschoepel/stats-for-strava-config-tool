import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

// Initial sports list (default if file doesn't exist)
const initialSportsList = {
  Cycling: [
    'Ride', 'MountainBikeRide', 'GravelRide', 'EBikeRide', 'EMountainBikeRide', 'VirtualRide', 'Velomobile'
  ],
  Running: [
    'Run', 'TrailRun', 'VirtualRun', 'Walking', 'Walk', 'Hike'
  ],
  'Water sports': [
    'Canoeing', 'Kayaking', 'Kitesurf', 'Rowing', 'StandUpPaddling', 'Surfing', 'Swim', 'Windsurf'
  ],
  'Winter sports': [
    'BackcountrySki', 'AlpineSki', 'NordicSki', 'IceSkate', 'Snowboard', 'Snowshoe'
  ],
  Skating: [
    'InlineSkate', 'RollerSki', 'Skateboard'
  ],
  'Racquet & Paddle Sports': [
    'Badminton', 'Pickleball', 'Racquetball', 'Squash', 'TableTennis', 'Tennis'
  ],
  Fitness: [
    'Crossfit', 'WeightTraining', 'Workout', 'StairStepper', 'VirtualRow', 'Elliptical', 'HighIntensityIntervalTraining'
  ],
  'Mind & Body Sports': [
    'Pilates', 'Yoga', 'Outdoor Sports', 'Golf', 'RockClimbing', 'Sail', 'Soccer'
  ],
  'Adaptive & Inclusive Sports': [
    'Handcycle', 'Wheelchair'
  ]
};

function resolveFilePath(defaultPath) {
  let basePath = defaultPath || '~/Documents/config/';
  
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
      return NextResponse.json({ success: true, sportsList: initialSportsList });
    }
  } catch (error) {
    console.error('Error reading sports list:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      sportsList: initialSportsList // Fallback to initial list
    }, { status: 500 });
  }
}

// POST - Write sports list
export async function POST(request) {
  try {
    const { defaultPath, sportsList } = await request.json();
    
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
