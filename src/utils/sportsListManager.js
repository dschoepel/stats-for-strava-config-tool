import { getSportsList, saveSportsList } from './apiClient';

// Initial sports list grouped by category (used as fallback)
export const initialSportsList = {
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
    'Pilates', 'Yoga'
  ], 
  'Outdoor Sports': [
    'Golf', 'RockClimbing', 'Sail', 'Soccer'
  ],
  'Adaptive & Inclusive Sports': [
    'Handcycle', 'Wheelchair'
  ]
};

// Read sports list from server via API
export async function readSportsList(settings = {}) {
  try {
    const defaultPath = settings.files?.defaultPath || '';
    const response = await fetch(`/api/sports-list?defaultPath=${encodeURIComponent(defaultPath)}`);
    const data = await response.json();
    
    if (data.success) {
      return data.sportsList;
    } else {
      console.error('Failed to read sports list:', data.error);
      return initialSportsList;
    }
  } catch (error) {
    console.error('Error reading sports list:', error);
    return initialSportsList;
  }
}

// Write sports list to server via API
export async function writeSportsList(settings, sportsList) {
  try {
    const defaultPath = settings.files?.defaultPath || '';
    const response = await fetch('/api/sports-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ defaultPath, sportsList }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to save sports list');
    }
    
    return data;
  } catch (error) {
    console.error('Error writing sports list:', error);
    throw error;
  }
}
