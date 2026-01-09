/**
 * JSON Schema for Gear Maintenance Configuration
 */

export const gearMaintenanceSchema = {
  type: 'object',
  required: ['enabled', 'hashtagPrefix', 'countersResetMode', 'ignoreRetiredGear'],
  properties: {
    enabled: {
      type: 'boolean',
      title: 'Enable Gear Maintenance',
      description: 'Set to on to enable the gear maintenance feature',
      default: true
    },
    hashtagPrefix: {
      type: 'string',
      title: 'Hashtag Prefix',
      description: 'Prefix for the hashtags used in the Strava activity title',
      default: 'sfs',
      minLength: 1,
      maxLength: 20,
      pattern: '^[a-zA-Z0-9-_]+$'
    },
    countersResetMode: {
      type: 'string',
      title: 'Counters Reset Mode',
      description: 'When to reset counters after adding a maintenance hashtag',
      enum: ['nextActivityOnwards', 'currentActivityOnwards'],
      default: 'nextActivityOnwards'
    },
    ignoreRetiredGear: {
      type: 'boolean',
      title: 'Ignore Retired Gear',
      description: 'Set to on to ignore retired gear',
      default: false
    },
    gears: {
      type: 'array',
      title: 'Gears',
      description: 'Define your Strava gear with associated components',
      items: {
        type: 'object',
        required: ['gearId'],
        properties: {
          gearId: {
            type: 'string',
            title: 'Gear ID',
            description: 'Your Strava gear ID',
            minLength: 1,
            pattern: '^[a-zA-Z0-9]+$'
          },
          imgSrc: {
            type: 'string',
            title: 'Image',
            description: 'Optional reference to an image in the gear-maintenance directory'
          },
          components: {
            type: 'array',
            title: 'Components',
            description: 'Components attached to this gear',
            items: {
              type: 'object',
              required: ['tag', 'label'],
              properties: {
                tag: {
                  type: 'string',
                  title: 'Tag',
                  description: 'Unique tag to be added to the Strava activity title (combined with hashtag prefix)',
                  minLength: 1,
                  maxLength: 50,
                  pattern: '^[a-zA-Z0-9-_]+$'
                },
                label: {
                  type: 'string',
                  title: 'Label',
                  description: 'Display name for the component',
                  minLength: 1,
                  maxLength: 100
                },
                imgSrc: {
                  type: 'string',
                  title: 'Image',
                  description: 'Optional reference to an image in the gear-maintenance directory'
                },
                purchasePrice: {
                  type: 'object',
                  title: 'Purchase Price',
                  description: 'Optional purchase price information',
                  properties: {
                    amountInCents: {
                      type: 'integer',
                      title: 'Amount (cents)',
                      description: 'Price in cents (e.g., 69000 = $690.00)',
                      minimum: 0
                    },
                    currency: {
                      type: 'string',
                      title: 'Currency',
                      description: 'Currency code (e.g., USD, EUR, GBP)',
                      default: 'USD',
                      minLength: 3,
                      maxLength: 3,
                      pattern: '^[A-Z]{3}$'
                    }
                  }
                },
                maintenance: {
                  type: 'array',
                  title: 'Maintenance Tasks',
                  description: 'List of maintenance tasks for this component',
                  items: {
                    type: 'object',
                    required: ['tag', 'label', 'interval'],
                    properties: {
                      tag: {
                        type: 'string',
                        title: 'Task Tag',
                        description: 'Unique tag for this maintenance task (combined with component tag)',
                        minLength: 1,
                        maxLength: 50,
                        pattern: '^[a-zA-Z0-9-_]+$'
                      },
                      label: {
                        type: 'string',
                        title: 'Task Label',
                        description: 'Display name for the maintenance task',
                        minLength: 1,
                        maxLength: 100
                      },
                      interval: {
                        type: 'object',
                        title: 'Maintenance Interval',
                        required: ['value', 'unit'],
                        properties: {
                          value: {
                            type: 'integer',
                            title: 'Interval Value',
                            description: 'How often to perform this maintenance',
                            minimum: 1
                          },
                          unit: {
                            type: 'string',
                            title: 'Interval Unit',
                            description: 'Unit of measurement for the interval',
                            enum: ['km', 'mi', 'hours', 'days'],
                            default: 'km'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      type: 'array',
      title: 'Legacy Components',
      description: 'Deprecated: Components are now nested within gears. This field is kept for backward compatibility.',
      items: {
        type: 'object'
      }
    }
  }
};

/**
 * Validate gear maintenance configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateGearMaintenanceConfig(config) {
  const errors = [];

  // Check for duplicate component tags across all gears
  const allComponentTags = [];
  if (config.gears) {
    config.gears.forEach((gear) => {
      if (gear.components) {
        gear.components.forEach((component) => {
          if (component.tag) {
            allComponentTags.push(component.tag);
          }

          // Check for duplicate maintenance task tags within each component
          if (component.maintenance) {
            const taskTags = component.maintenance.map(t => t.tag);
            const duplicateTaskTags = taskTags.filter((tag, index) => taskTags.indexOf(tag) !== index);
            if (duplicateTaskTags.length > 0) {
              errors.push(`Component "${component.label}" in gear "${gear.gearId}" has duplicate task tags: ${duplicateTaskTags.join(', ')}`);
            }
          }
        });
      }
    });

    const duplicateComponentTags = allComponentTags.filter((tag, index) => allComponentTags.indexOf(tag) !== index);
    if (duplicateComponentTags.length > 0) {
      errors.push(`Duplicate component tags found across gears: ${[...new Set(duplicateComponentTags)].join(', ')}`);
    }

    // Check for duplicate gear IDs
    const gearIds = config.gears.map(g => g.gearId).filter(id => id);
    const duplicateGearIds = gearIds.filter((id, index) => gearIds.indexOf(id) !== index);
    if (duplicateGearIds.length > 0) {
      errors.push(`Duplicate gear IDs found: ${[...new Set(duplicateGearIds)].join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
