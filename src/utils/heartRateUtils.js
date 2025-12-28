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
  
  const zoneRanges = [
    { from: 50, to: 60 },  // Zone 1
    { from: 61, to: 70 },  // Zone 2  
    { from: 71, to: 80 },  // Zone 3
    { from: 81, to: 90 },  // Zone 4
    { from: 91, to: null } // Zone 5
  ];
  
  const zones = {};
  zoneRanges.forEach((range, index) => {
    const zoneNum = index + 1;
    if (mode === 'relative') {
      zones[`zone${zoneNum}`] = {
        from: range.from,
        to: range.to
      };
    } else { // absolute
      zones[`zone${zoneNum}`] = {
        from: Math.round((range.from / 100) * maxHR),
        to: range.to === null ? null : Math.round((range.to / 100) * maxHR)
      };
    }
  });
  
  return zones;
};
