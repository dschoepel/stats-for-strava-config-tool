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

export const importSchema = {
  type: "object",
  title: "Import Configuration",
  description: "Settings for importing activities from Strava",
  properties: {
    numberOfNewActivitiesToProcessPerImport: {
      type: "integer",
      title: "New Activities Per Import",
      description: "Maximum number of new activities to process per import. Strava has a 1000 request per day limit and importing one activity can take up to 3 API calls, so 250 is a safe default.",
      default: 250,
      minimum: 1,
      maximum: 500,
      examples: [250, 100, 150]
    },
    sportTypesToImport: {
      type: "array",
      title: "Sport Types to Import",
      description: "Leave empty to import all sport types. ⚠️ Changing this after activities are imported will delete activities not in the list.",
      items: {
        type: "string"
      },
      default: [],
      examples: [["Ride", "Run"], ["Ride", "Run", "Swim", "Walk"]]
    },
    activityVisibilitiesToImport: {
      type: "array",
      title: "Activity Visibilities to Import",
      description: "Leave empty to import all visibilities. ⚠️ Changing this after activities are imported will delete activities not in the list.",
      items: {
        type: "string",
        enum: ["everyone", "followers_only", "only_me"]
      },
      default: [],
      examples: [["everyone"], ["everyone", "followers_only"]]
    },
    skipActivitiesRecordedBefore: {
      type: ["string", "null"],
      title: "Skip Activities Before Date",
      description: "Optional date (YYYY-MM-DD) to skip activities recorded before. ⚠️ Changing this will delete activities recorded before the specified date.",
      format: "date",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      default: null,
      examples: ["2020-01-01", "2023-06-15", null]
    },
    activitiesToSkipDuringImport: {
      type: "array",
      title: "Activities to Skip",
      description: "Array of activity IDs to skip during import.",
      items: {
        type: "string"
      },
      default: [],
      examples: [["123456789", "987654321"], []]
    },
    optInToSegmentDetailImport: {
      type: "boolean",
      title: "Import Segment Details",
      description: "Import detailed segment information (requires extra API calls per segment, significantly increases import time).",
      default: false
    },
    webhooks: {
      type: "object",
      title: "Webhooks Configuration",
      description: "Settings for Strava webhook integration",
      properties: {
        enabled: {
          type: "boolean",
          title: "Enable Webhooks",
          description: "Enable automatic activity updates via Strava webhooks",
          default: true
        },
        verifyToken: {
          type: "string",
          title: "Verify Token",
          description: "Token used by Strava's validation request for security",
          default: "",
          minLength: 1,
          examples: ["YL_thR2Aq8I6zdCm-MfwffZAxyx"]
        },
        checkIntervalInMinutes: {
          type: "integer",
          title: "Check Interval (Minutes)",
          description: "How frequently to check for webhook events (1-60). Lower values = faster updates but more API calls.",
          minimum: 1,
          maximum: 60,
          default: 1,
          examples: [1, 5, 15, 30]
        }
      },
      required: ["enabled", "verifyToken", "checkIntervalInMinutes"]
    }
  },
  required: ["numberOfNewActivitiesToProcessPerImport"],
  additionalProperties: false
};

export const metricsSchema = {
  type: "object",
  title: "Metrics Configuration",
  description: "Performance metrics and scoring settings",
  properties: {
    eddington: {
      type: "array",
      title: "Eddington Score Configuration",
      description: "Customize which sport types are grouped together and how the Eddington score is calculated",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            title: "Label",
            description: "The label to be used for the tabs on the Eddington page",
            examples: ["Ride", "Run", "Walk"]
          },
          showInNavBar: {
            type: "boolean",
            title: "Show in Navigation Bar",
            description: "Display this score in the side navigation (max 2 enabled)",
            default: false
          },
          showInDashboardWidget: {
            type: "boolean",
            title: "Show in Dashboard Widget",
            description: "Display this score in the dashboard widget (max 2 enabled)",
            default: false
          },
          sportTypesToInclude: {
            type: "array",
            title: "Sport Types to Include",
            description: "Sport types to include in the Eddington score calculation. Only sport types from the same activity type category can be combined.",
            items: {
              type: "string"
            },
            examples: [["Ride", "MountainBikeRide", "GravelRide", "VirtualRide"]]
          }
        },
        required: ["label", "showInNavBar", "showInDashboardWidget", "sportTypesToInclude"]
      },
      default: [
        {
          label: "Ride",
          showInNavBar: true,
          showInDashboardWidget: true,
          sportTypesToInclude: ["Ride", "MountainBikeRide", "GravelRide", "VirtualRide"]
        },
        {
          label: "Run",
          showInNavBar: true,
          showInDashboardWidget: true,
          sportTypesToInclude: ["Run", "TrailRun", "VirtualRun"]
        },
        {
          label: "Walk",
          showInNavBar: false,
          showInDashboardWidget: false,
          sportTypesToInclude: ["Walk", "Hike"]
        }
      ]
    }
  },
  required: ["eddington"],
  additionalProperties: false
};

export const gearSchema = {
  type: "object",
  title: "Gear Configuration",
  description: "Gear tracking and maintenance settings",
  properties: {
    stravaGear: {
      type: "array",
      title: "Strava Gear",
      description: "Enrich Strava gear with additional data not available in Strava",
      items: {
        type: "object",
        properties: {
          gearId: {
            type: "string",
            title: "Gear ID",
            description: "Strava gear ID (get from gear details popup, NOT from URL)",
            examples: ["g12337767"]
          },
          purchasePrice: {
            type: "object",
            title: "Purchase Price",
            description: "Used to calculate relative cost per workout and hour",
            properties: {
              amountInCents: {
                type: "integer",
                title: "Amount in Cents",
                description: "Price in smallest currency unit (cents, pence, etc.)",
                minimum: 0,
                examples: [123456]
              },
              currency: {
                type: "string",
                title: "Currency",
                description: "ISO 4217 currency code",
                pattern: "^[A-Z]{3}$",
                examples: ["EUR", "USD", "GBP"]
              }
            },
            required: ["amountInCents", "currency"]
          }
        },
        required: ["gearId"]
      },
      default: []
    },
    customGear: {
      type: "array",
      title: "Custom Gear",
      description: "Track gear that Strava doesn't allow you to configure",
      items: {
        type: "object"
      },
      default: []
    }
  },
  additionalProperties: false
};

export const integrationsSchema = {
  type: "object",
  title: "Integrations Configuration",
  description: "External service integrations and notifications",
  properties: {
    notifications: {
      type: "object",
      title: "Notifications",
      description: "Notification service configuration",
      properties: {
        services: {
          type: "array",
          title: "Notification Services",
          description: "List of notification service URLs (Shoutrrr format). Leave empty to disable.",
          items: {
            type: "string",
            format: "uri"
          },
          default: [],
          examples: [["ntfy://ntfy.sh/topic"]]
        }
      },
      required: ["services"]
    },
    ai: {
      type: "object",
      title: "AI Integration",
      description: "Artificial Intelligence features configuration",
      properties: {
        enabled: {
          type: "boolean",
          title: "Enable AI Features",
          description: "⚠️ Use caution when enabling if your app is publicly accessible",
          default: false
        },
        enableUI: {
          type: "boolean",
          title: "Enable AI UI",
          description: "Enable AI features in the user interface (by default only accessible via CLI)",
          default: false
        },
        provider: {
          type: "string",
          title: "AI Provider",
          description: "The AI service provider to use",
          enum: ["anthropic", "azureOpenAI", "gemini", "ollama", "openAI", "deepseek", "mistral"],
          examples: ["openAI"]
        },
        configuration: {
          type: "object",
          title: "Provider Configuration",
          description: "Provider-specific configuration",
          properties: {
            key: {
              type: "string",
              title: "API Key",
              description: "Your API key for the selected provider",
              examples: ["YOUR-API-KEY"]
            },
            model: {
              type: "string",
              title: "Model Name",
              description: "The AI model to use",
              examples: ["gpt-4", "claude-3-opus"]
            },
            url: {
              type: ["string", "null"],
              title: "Service URL",
              description: "Required only for Ollama - URL to your hosted instance",
              format: "uri",
              default: null,
              examples: ["http://host.docker.internal:11434/api"]
            }
          },
          required: ["key", "model"]
        }
      },
      required: ["enabled", "enableUI", "provider", "configuration"]
    }
  },
  additionalProperties: false
};

export const daemonSchema = {
  type: "object",
  title: "Daemon Configuration",
  description: "Scheduled tasks and background job configuration",
  properties: {
    cron: {
      type: "array",
      title: "Cron Jobs",
      description: "Scheduled tasks that run at regular intervals",
      items: {
        type: "object",
        properties: {
          action: {
            type: "string",
            title: "Action",
            description: "The action to perform",
            enum: ["importDataAndBuildApp", "gearMaintenanceNotification", "appUpdateAvailableNotification"],
            enumTitles: ["Import Data and Build App", "Gear Maintenance Notification", "App Update Available Notification"]
          },
          expression: {
            type: "string",
            title: "Cron Expression",
            description: "Cron expression specifying when the action should run (see crontab.guru)",
            pattern: "^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\\d+(ns|us|µs|ms|s|m|h))+)|((((\\d+,)+\\d+|(\\d+([/\\-])\\d+)|\\d+|\\*) ){4,6}(((\\d+,)+\\d+|(\\d+([/\\-])\\d+)|\\d+|\\*)))$",
            examples: ["0 14 * * *", "*/30 * * * *"]
          },
          enabled: {
            type: "boolean",
            title: "Enabled",
            description: "Whether this action should be executed",
            default: false
          }
        },
        required: ["action", "expression", "enabled"]
      },
      default: [
        {
          action: "importDataAndBuildApp",
          expression: "0 14 * * *",
          enabled: true
        },
        {
          action: "gearMaintenanceNotification",
          expression: "0 14 * * *",
          enabled: false
        },
        {
          action: "appUpdateAvailableNotification",
          expression: "0 14 * * *",
          enabled: false
        }
      ]
    }
  },
  required: ["cron"],
  additionalProperties: false
};

// Helper function to get all available schemas
export const getConfigSchemas = () => ({
  general: generalSchema,
  athlete: athleteSchema,
  appearance: appearanceSchema,
  zwift: zwiftSchema,
  import: importSchema,
  metrics: metricsSchema,
  gear: gearSchema,
  integrations: integrationsSchema,
  daemon: daemonSchema
});

// Helper function to get schema by section name
export const getSchemaBySection = (sectionName) => {
  const schemas = getConfigSchemas();
  return schemas[sectionName] || null;
};