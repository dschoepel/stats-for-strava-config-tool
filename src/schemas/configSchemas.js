// Configuration schemas for form generation and validation

export const generalSchema = {
  type: "object",
  title: "General Configuration",
  description: "Application-level settings and configuration",
  properties: {
    appUrl: {
      type: "string",
      title: "Application URL",
      description: "The URL on which the app will be hosted. This URL will be used in the manifest file for installing as a native app.",
      default: "http://localhost:8080/",
      format: "uri",
      examples: ["http://localhost:8080/", "https://mystats.example.com/"]
    },
    appSubTitle: {
      type: ["string", "null"],
      title: "App Subtitle", 
      description: "Optional subtitle to display in the navbar. Useful for distinguishing between multiple instances of the app.",
      default: null,
      examples: ["Production", "Development", "Personal Stats"]
    },
    profilePictureUrl: {
      type: ["string", "null"],
      title: "Profile Picture URL",
      description: "Optional link to your profile picture. Will be used to display in the nav bar and link to your Strava profile. Any image can be used; a square format is recommended.",
      default: null,
      format: "uri",
      examples: ["https://example.com/avatar.jpg", null]
    }
  },
  required: ["appUrl"],
  additionalProperties: false
};

export const athleteSchema = {
  type: "object", 
  title: "Athlete Configuration",
  description: "Personal athlete data and performance settings",
  properties: {
    birthday: {
      type: "string",
      title: "Birthday",
      description: "Your birthday. Needed to calculate heart rate zones.",
      format: "date",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      examples: ["1990-01-15", "1985-12-25"]
    },
    maxHeartRateFormula: {
      oneOf: [
        {
          type: "string",
          title: "Heart Rate Formula",
          description: "The formula used to calculate your max heart rate. Default is Fox (220 - age).",
          enum: ["arena", "astrand", "fox", "gellish", "nes", "tanaka"],
          default: "fox",
          enumTitles: ["Arena (209.3 - 0.7 x age)", "Astrand (216.6 - 0.84 x age)", "Fox (220 - age) - Default", "Gellish (207 - 0.7 x age)", "NES (211 - 0.64 x age)", "Tanaka (208 - 0.7 x age)"]
        },
        {
          type: "object",
          title: "Custom Heart Rate by Date",
          description: "Set a fixed max heart rate number for specific date ranges",
          patternProperties: {
            "^\\d{4}-\\d{2}-\\d{2}$": {
              type: "integer",
              minimum: 100,
              maximum: 250,
              title: "Max Heart Rate (BPM)"
            }
          },
          additionalProperties: false
        }
      ]
    },
    heartRateZones: {
      type: "object",
      title: "Heart Rate Zones",
      description: "Configuration for heart rate training zones",
      properties: {
        mode: {
          type: "string",
          title: "Zone Mode",
          description: "Relative treats zone numbers as percentages based on max heart rate, absolute treats them as actual heartbeats per minute",
          enum: ["relative", "absolute"],
          default: "relative",
          enumTitles: ["Relative (%)", "Absolute (BPM)"]
        },
        default: {
          type: "object",
          title: "Default Zones",
          description: "The default zones for all activities",
          properties: {
            zone1: { $ref: "#/definitions/heartRateZone" },
            zone2: { $ref: "#/definitions/heartRateZone" },
            zone3: { $ref: "#/definitions/heartRateZone" },
            zone4: { $ref: "#/definitions/heartRateZone" },
            zone5: { $ref: "#/definitions/heartRateZone" }
          },
          required: ["zone1", "zone2", "zone3", "zone4", "zone5"]
        },
        dateRanges: {
          type: "object",
          title: "Date Range Overrides",
          description: "Override zones for specific date ranges",
          patternProperties: {
            "^\\d{4}-\\d{2}-\\d{2}$": {
              type: "object",
              title: "Zone Override",
              properties: {
                zone1: { $ref: "#/definitions/heartRateZone" },
                zone2: { $ref: "#/definitions/heartRateZone" },
                zone3: { $ref: "#/definitions/heartRateZone" },
                zone4: { $ref: "#/definitions/heartRateZone" },
                zone5: { $ref: "#/definitions/heartRateZone" }
              }
            }
          },
          additionalProperties: false
        },
        sportTypes: {
          type: "object",
          title: "Sport Type Overrides",
          description: "Override zones for specific sport types",
          patternProperties: {
            "^[A-Za-z]+$": {
              type: "object",
              properties: {
                default: {
                  type: "object",
                  title: "Default zones for this sport type",
                  properties: {
                    zone1: { $ref: "#/definitions/heartRateZone" },
                    zone2: { $ref: "#/definitions/heartRateZone" },
                    zone3: { $ref: "#/definitions/heartRateZone" },
                    zone4: { $ref: "#/definitions/heartRateZone" },
                    zone5: { $ref: "#/definitions/heartRateZone" }
                  }
                },
                dateRanges: {
                  type: "object",
                  patternProperties: {
                    "^\\d{4}-\\d{2}-\\d{2}$": {
                      type: "object",
                      properties: {
                        zone1: { $ref: "#/definitions/heartRateZone" },
                        zone2: { $ref: "#/definitions/heartRateZone" },
                        zone3: { $ref: "#/definitions/heartRateZone" },
                        zone4: { $ref: "#/definitions/heartRateZone" },
                        zone5: { $ref: "#/definitions/heartRateZone" }
                      }
                    }
                  }
                }
              }
            }
          },
          additionalProperties: false
        }
      },
      required: ["mode", "default"]
    },
    weightHistory: {
      type: "object",
      title: "Weight History",
      description: "History of weight (in kg or pounds, depending on appearance.unitSystem). Needed to calculate relative w/kg.",
      patternProperties: {
        "^\\d{4}-\\d{2}-\\d{2}$": {
          type: "number",
          minimum: 30,
          maximum: 300,
          title: "Weight (kg or lbs)"
        }
      },
      additionalProperties: false
    },
    ftpHistory: {
      type: "object", 
      title: "FTP History",
      description: "Optional history of Functional Threshold Power. Needed to calculate activity stress level.",
      properties: {
        cycling: {
          type: "object",
          title: "Cycling FTP History",
          patternProperties: {
            "^\\d{4}-\\d{2}-\\d{2}$": {
              type: "integer",
              minimum: 50,
              maximum: 600,
              title: "FTP (watts)"
            }
          },
          additionalProperties: false
        },
        running: {
          type: "array",
          title: "Running FTP History",
          description: "Currently not implemented - leave as empty array",
          items: {},
          maxItems: 0
        }
      },
      additionalProperties: false
    }
  },
  required: ["birthday", "maxHeartRateFormula", "heartRateZones"],
  additionalProperties: false,
  definitions: {
    heartRateZone: {
      type: "object",
      title: "Heart Rate Zone",
      properties: {
        from: {
          type: "integer",
          title: "From",
          minimum: 0,
          maximum: 250
        },
        to: {
          type: ["integer", "null"],
          title: "To", 
          minimum: 0,
          maximum: 250
        }
      },
      required: ["from", "to"]
    }
  }
};

// Helper function to get all available schemas
export const getConfigSchemas = () => ({
  general: generalSchema,
  athlete: athleteSchema
});

// Helper function to get schema by section name
export const getSchemaBySection = (sectionName) => {
  const schemas = getConfigSchemas();
  return schemas[sectionName] || null;
};