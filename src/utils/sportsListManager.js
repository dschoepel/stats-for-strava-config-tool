import { initialSportsList } from './sportsListInitializer';
import { loadSportsList, saveSportsList } from '../services';

// initialSportsList is now imported from sportsListInitializer.js to maintain single source of truth
export { initialSportsList };

// Read sports list from server via API
export async function readSportsList(settings = {}) {
  try {
    const defaultPath = settings.files?.defaultPath || '';
    const data = await loadSportsList(defaultPath);

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
    const filePath = `${defaultPath}/sports-list.yaml`;
    const data = await saveSportsList(filePath, sportsList);

    if (!data.success) {
      throw new Error(data.error || 'Failed to save sports list');
    }

    return data;
  } catch (error) {
    console.error('Error writing sports list:', error);
    throw error;
  }
}
