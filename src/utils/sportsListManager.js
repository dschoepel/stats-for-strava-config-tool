import { initialSportsList } from './sportsListInitializer';

// initialSportsList is now imported from sportsListInitializer.js to maintain single source of truth
export { initialSportsList };

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
