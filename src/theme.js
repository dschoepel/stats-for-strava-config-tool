// theme.js
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
    theme: {
        tokens: {
            colors: {
                brand: {
                    primary: { value: "#FC5200" },
                    primaryDark: { value: "#D84300" },
                    grayLight: { value: "#F5F5F5" },
                    gray: { value: "#E0E0E0" },
                    grayDark: { value: "#757575" },
                    text: { value: "#212121" },
                    bg: { value: "#FFFFFF" },
                },
            },
            spacing: {
                buttonY: { value: "0.75rem" }, // 12px vertical padding for buttons
            },
        },
        semanticTokens: {
  colors: {
    // Page background (lightest layer)
    bg: {
      value: {
        base: "#F9FAFB",     // light gray for subtle background
        _dark: "#020617",    // near-black slate for strong card contrast
      },
    },

    // Card background (primary surface)
    cardBg: {
      value: {
        base: "#FFFFFF",     // pure white (strong contrast from darker bg)
        _dark: "#1E293B",    // slate-800 (strong contrast from near-black bg)
      },
    },

    // Panel background (between bg and card)
    panelBg: {
      value: {
        base: "#E2E8F0",     // gray.200
        _dark: "#334155",    // slate-700
      },
    },

    // Toast panel background (for info/loading toasts)
    "bg.panel": {
      value: {
        base: "#FFFFFF",     // white for info toasts
        _dark: "#94A3B8",    // slate-400 (lighter for better text contrast)
      },
    },

    // Input field background
    inputBg: {
      value: {
        base: "#FFFFFF",     // white for input fields
        _dark: "#1E293B",    // slate-800
      },
    },

    // Modal background (needs to stand out above overlay)
    modalBg: {
      value: {
        base: "#FFFFFF",     // pure white
        _dark: "#1E293B",    // slate-800 (same as cardBg but semantically distinct)
      },
    },

    // Table header background (needs strong contrast)
    tableHeaderBg: {
      value: {
        base: "#CBD5E0",     // slate.300 (darker than panelBg)
        _dark: "#475569",    // slate.600 (lighter than panelBg)
      },
    },

    // Table header text (needs strong contrast with header bg)
    tableHeaderText: {
      value: {
        base: "#1A202C",     // gray.800 (dark text on light bg)
        _dark: "#F1F5F9",    // slate.100 (light text on dark bg)
      },
    },

    // Border color (stronger, more visible)
    border: {
      value: {
        base: "#94A3B8",     // slate.400 (darker, more visible)
        _dark: "#64748B",    // slate.500 (lighter, more visible)
      },
    },

    // Sidebar Icon colors (ensures visibility)
    sidebarIcon: {
      value: {
        base: "#4A5568",     // gray.600
        _dark: "#CBD5E0",    // gray.300
      },
    },

    // Primary text
    text: {
      value: {
        base: "#1A202C",     // gray.800
        _dark: "#F8FAFC",    // slate-50
      },
    },

    // Muted text
    textMuted: {
      value: {
        base: "#4A5568",     // gray.600
        _dark: "#94A3B8",    // slate-400
      },
    },

    // Helper text (form field descriptions)
    helperText: {
      value: {
        base: "#4A5568",     // gray.600
        _dark: "#91a2beff",    // gray.300 (lighter for better contrast)
      },
    },

    // Accent (Stats for Strava orange)
    primary: {
      value: {
        base: "#FC5200",
        _dark: "#FF6A1A",
      },
    },

    primaryHover: {
      value: {
        base: "#D84300",
        _dark: "#FF7F3F",
      },
    },
  },
},
        recipes: {
            button: {
                base: {
                    paddingY: "buttonY", // Use the spacing token for vertical padding
                },
            },
        },
        slotRecipes: {
            input: {
                base: {
                    field: {
                        bg: "inputBg",
                    },
                },
            },
        },
    },
});

export const system = createSystem(defaultConfig, config);
export const theme = system;
