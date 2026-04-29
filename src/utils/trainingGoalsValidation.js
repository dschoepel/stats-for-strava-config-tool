export const GOAL_TYPES = ['distance', 'elevation', 'movingTime', 'numberOfActivities', 'calories'];
export const UNIT_TYPES = ['km', 'm', 'mi', 'ft', 'hour', 'minute'];
export const UNIT_NOT_APPLICABLE = ['numberOfActivities', 'calories'];
export const PERIODS = ['weekly', 'monthly', 'yearly', 'lifetime'];

export const GOAL_TYPE_LABELS = {
  distance: 'Distance',
  elevation: 'Elevation',
  movingTime: 'Moving Time',
  numberOfActivities: 'Number of Activities',
  calories: 'Calories',
};

export const UNIT_LABELS = {
  km: 'km',
  m: 'm',
  mi: 'mi',
  ft: 'ft',
  hour: 'hours',
  minute: 'minutes',
};

/**
 * Validates a single training goal entry.
 * @returns {Object} errors map { fieldName: errorString }
 */
export function validateGoalEntry(goal) {
  const errors = {};

  if (!goal.label || !goal.label.trim()) {
    errors.label = 'Label is required';
  }

  if (!goal.type || !GOAL_TYPES.includes(goal.type)) {
    errors.type = 'Goal type is required';
  }

  if (goal.type && !UNIT_NOT_APPLICABLE.includes(goal.type)) {
    if (!goal.unit || !UNIT_TYPES.includes(goal.unit)) {
      errors.unit = 'Unit is required for this goal type';
    }
  }

  if (goal.goal === undefined || goal.goal === null || goal.goal === '') {
    errors.goal = 'Goal value is required';
  } else if (typeof goal.goal !== 'number' || isNaN(goal.goal) || goal.goal <= 0) {
    errors.goal = 'Goal must be a positive number';
  }

  if (goal.restrictToDateRange) {
    const { from, to } = goal.restrictToDateRange;
    if (!from) errors['restrictToDateRange.from'] = 'Start date is required';
    if (!to) errors['restrictToDateRange.to'] = 'End date is required';
    if (from && to && from > to) {
      errors['restrictToDateRange.from'] = 'Start date must be on or before end date';
    }
  }

  return errors;
}

/**
 * Validates the full training goals config object.
 * @returns {Object} flat errors map { 'weekly[0].label': 'error msg', ... }
 */
export function validateTrainingGoalsConfig(goalsConfig) {
  const allErrors = {};
  const goals = goalsConfig?.goals || {};

  PERIODS.forEach(period => {
    (goals[period] || []).forEach((entry, i) => {
      const entryErrors = validateGoalEntry(entry);
      Object.entries(entryErrors).forEach(([field, msg]) => {
        allErrors[`${period}[${i}].${field}`] = msg;
      });
    });
  });

  return allErrors;
}
