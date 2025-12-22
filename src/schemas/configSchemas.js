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

export const appearanceSchema = {
  type: "object",
  title: "Appearance Configuration",
  description: "Visual customization and display preferences",
  properties: {
    locale: {
      type: "string",
      title: "Locale",
      description: "Language and regional settings for the application",
      enum: ["en_US", "fr_FR", "it_IT", "nl_BE", "de_DE", "pt_BR", "pt_PT", "sv_SE", "zh_CN"],
      default: "en_US",
      enumTitles: ["English (US)", "French (France)", "Italian", "Dutch (Belgium)", "German", "Portuguese (Brazil)", "Portuguese (Portugal)", "Swedish", "Chinese"]
    },
    unitSystem: {
      type: "string",
      title: "Unit System",
      description: "Measurement system for distance, weight, and other metrics",
      enum: ["metric", "imperial"],
      default: "metric",
      enumTitles: ["Metric (km, kg, °C)", "Imperial (miles, lbs, °F)"]
    },
    timeFormat: {
      type: "integer",
      title: "Time Format",
      description: "Time display format (24-hour or 12-hour with AM/PM)",
      enum: [24, 12],
      default: 24,
      enumTitles: ["24-hour (14:30)", "12-hour (2:30 PM)"]
    },
    dateFormat: {
      type: "object",
      title: "Date Format",
      description: "Date display formats using PHP date format strings",
      properties: {
        short: {
          type: "string",
          title: "Short Date Format",
          description: "Format for short dates (e.g., 'd-m-y' renders as 01-01-25). See https://www.php.net/manual/en/datetime.format.php",
          default: "d-m-y",
          examples: ["d-m-y", "m/d/y", "y-m-d"]
        },
        normal: {
          type: "string",
          title: "Normal Date Format",
          description: "Format for full dates (e.g., 'd-m-Y' renders as 01-01-2025)",
          default: "d-m-Y",
          examples: ["d-m-Y", "m/d/Y", "Y-m-d", "F j, Y"]
        }
      },
      required: ["short", "normal"]
    },
    dashboard: {
      type: "object",
      title: "Dashboard",
      description: "Dashboard widget configuration",
      properties: {
        layout: {
          type: ["object", "null"],
          title: "Dashboard Layout",
          description: "Custom dashboard widget layout. Leave null to use default layout. For configuration details, visit the documentation.",
          default: null
        }
      }
    },
    heatmap: {
      type: "object",
      title: "Heatmap Settings",
      description: "Configuration for activity heatmap visualization",
      properties: {
        polylineColor: {
          type: "string",
          title: "Polyline Color",
          description: "Color for route lines on the heatmap. Accepts any valid CSS color (e.g., 'red', '#FF0000', 'rgb(255,0,0)')",
          default: "#fc6719",
          pattern: "^(#[0-9A-Fa-f]{3,6}|rgb\\(|rgba\\(|hsl\\(|hsla\\(|[a-z]+).*$",
          examples: ["#fc6719", "red", "rgb(252, 103, 25)", "rgba(252, 103, 25, 0.8)"]
        },
        tileLayerUrl: {
          oneOf: [
            {
              type: "string",
              title: "Single Tile Layer",
              description: "URL template for map tiles",
              default: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              examples: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png"
              ]
            },
            {
              type: "array",
              title: "Multiple Tile Layers",
              description: "Array of tile layer URLs for layered maps (e.g., satellite + labels)",
              items: {
                type: "string"
              },
              examples: [
                [
                  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png",
                  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}.png"
                ]
              ]
            }
          ]
        },
        enableGreyScale: {
          type: "boolean",
          title: "Enable Grayscale",
          description: "Apply grayscale styling to the heatmap",
          default: true
        }
      },
      required: ["polylineColor", "tileLayerUrl", "enableGreyScale"]
    },
    photos: {
      type: "object",
      title: "Photos Settings",
      description: "Configuration for activity photos display",
      properties: {
        hidePhotosForSportTypes: {
          type: "array",
          title: "Hide Photos For Sport Types",
          description: "Sport types for which photos should be hidden on the photos page. See documentation for supported sport types.",
          items: {
            type: "string"
          },
          default: [],
          examples: [["VirtualRide", "VirtualRun"]]
        },
        defaultEnabledFilters: {
          type: "object",
          title: "Default Enabled Filters",
          description: "Filters that are enabled by default on the photos page",
          properties: {
            sportTypes: {
              type: "array",
              title: "Sport Types Filter",
              description: "Sport types to show by default. See documentation for supported sport types.",
              items: {
                type: "string"
              },
              default: [],
              examples: [["Ride", "Run", "Hike"]]
            },
            countryCode: {
              type: ["string", "null"],
              title: "Country Code Filter",
              description: "Default country filter using ISO2 country code (e.g., 'US', 'GB', 'FR')",
              default: null,
              pattern: "^[A-Z]{2}$",
              examples: ["US", "GB", "FR", "DE", null]
            }
          }
        }
      },
      required: ["hidePhotosForSportTypes", "defaultEnabledFilters"]
    },
    sportTypesSortingOrder: {
      type: "array",
      title: "Sport Types Sorting Order",
      description: "Define custom order for sport types (e.g., in dashboard tabs). Sport types not listed will use default ordering. See documentation for supported sport types.",
      items: {
        type: "string"
      },
      default: [],
      examples: [["Ride", "Run", "Hike", "Walk", "Swim"]]
    }
  },
  required: ["locale", "unitSystem", "timeFormat", "dateFormat"],
  additionalProperties: false
};

export const zwiftSchema = {
  type: "object",
  title: "Zwift Configuration",
  description: "Zwift integration settings for displaying your Zwift badge and stats",
  properties: {
    level: {
      type: ["integer", "null"],
      title: "Zwift Level",
      description: "Your Zwift level (1 - 100). Will be used to render your Zwift badge. Leave empty to disable this feature",
      minimum: 1,
      maximum: 100,
      default: null,
      examples: [25, 50, 100, null]
    },
    racingScore: {
      type: ["integer", "null"],
      title: "Zwift Racing Score",
      description: "Your Zwift racing score (0 - 1000). Will be used to add to your Zwift badge if zwift.level is filled out",
      minimum: 0,
      maximum: 1000,
      default: null,
      examples: [500, 750, 950, null]
    }
  },
  additionalProperties: false
};

// Helper function to get all available schemas
export const getConfigSchemas = () => ({
  general: generalSchema,
  athlete: athleteSchema,
  appearance: appearanceSchema,
  zwift: zwiftSchema
});

// Helper function to get schema by section name
export const getSchemaBySection = (sectionName) => {
  const schemas = getConfigSchemas();
  return schemas[sectionName] || null;
};