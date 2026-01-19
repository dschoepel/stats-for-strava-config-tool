// Heart rate calculation utilities

export const heartRateFormulas = {
  arena: (age) => Math.round(209.3 - (0.7 * age)),
  astrand: (age) => Math.round(216.6 - (0.84 * age)),
  fox: (age) => Math.round(220 - age),
  gellish: (age) => Math.round(207 - (0.7 * age)),
  nes: (age) => Math.round(211 - (0.64 * age)),
  tanaka: (age) => Math.round(208 - (0.7 * age))
};

export const calculateAge = (birthday) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const calculateMaxHeartRate = (birthday, formula) => {
  if (!birthday || !formula) return null;
  const age = calculateAge(birthday);
  if (age === null || typeof formula !== 'string') return null;
  
  const calculator = heartRateFormulas[formula];
  return calculator ? calculator(age) : null;
};

export const calculateDefaultZones = (maxHR, mode) => {
  if (!maxHR) return null;
  
  if (mode === 'relative') {
    // For relative mode, use consecutive percentage boundaries (no overlap)
    return {
      zone1: { from: 50, to: 59 },
      zone2: { from: 60, to: 69 },
      zone3: { from: 70, to: 79 },
      zone4: { from: 80, to: 89 },
      zone5: { from: 90, to: null }
    };
  } else { // absolute
    // For absolute mode, calculate BPM values and ensure consecutive zones with no gaps
    const percentages = [50, 60, 70, 80, 90];
    
    // Calculate BPM thresholds
    const thresholds = percentages.map(pct => Math.round((pct / 100) * maxHR));
    
    // Create zones with consecutive boundaries (no gaps)
    return {
      zone1: { from: thresholds[0], to: thresholds[1] - 1 },
      zone2: { from: thresholds[1], to: thresholds[2] - 1 },
      zone3: { from: thresholds[2], to: thresholds[3] - 1 },
      zone4: { from: thresholds[3], to: thresholds[4] - 1 },
      zone5: { from: thresholds[4], to: null }
    };
  }
};

/**
 * Validate that heart rate zones have no gaps between consecutive zones
 * @param {Object} zones - Zone object with zone1-zone5
 * @param {string} mode - Zone mode: 'relative' or 'absolute'
 * @returns {Object} - Object with zone keys and error messages
 */
export const validateZoneConsecutiveness = (zones, mode = 'absolute') => {
  const errors = {};
  
  if (!zones || typeof zones !== 'object') {
    return errors;
  }
  
  // Validate consecutiveness in both relative and absolute modes
  // Check zones 1-4 (zone 5 is open-ended)
  for (let i = 1; i <= 4; i++) {
    const currentZone = zones[`zone${i}`];
    const nextZone = zones[`zone${i + 1}`];
    
    if (currentZone && nextZone) {
      const currentTo = currentZone.to;
      const nextFrom = nextZone.from;
      
      if (currentTo !== null && nextFrom !== null) {
        const expectedNextFrom = currentTo + 1;
        if (nextFrom !== expectedNextFrom) {
          const unit = mode === 'relative' ? '%' : 'BPM';
          errors[`zone${i + 1}`] = `Zone ${i + 1} must start at ${expectedNextFrom}${unit} (Zone ${i} ends at ${currentTo}${unit})`;
        }
      }
    }
  }
  
  return errors;
};

/**
 * Fix gaps in heart rate zones by making them consecutive
 * @param {Object} zones - Zone object with zone1-zone5
 * @returns {Object} - Fixed zones object
 */
export const fixZoneGaps = (zones) => {
  if (!zones || typeof zones !== 'object') {
    return zones;
  }
  
  const fixed = { ...zones };
  
  // Fix zones 1-4 to be consecutive
  for (let i = 1; i <= 4; i++) {
    const currentZone = fixed[`zone${i}`];
    const nextZone = fixed[`zone${i + 1}`];
    
    if (currentZone && nextZone && currentZone.to !== null) {
      if (!fixed[`zone${i + 1}`]) {
        fixed[`zone${i + 1}`] = {};
      }
      fixed[`zone${i + 1}`] = {
        ...nextZone,
        from: currentZone.to + 1
      };
    }
  }
  
  return fixed;
};
