/**
 * Built-in Presets for Claude Code Settings
 *
 * These presets are bundled with the app and cannot be modified or deleted.
 * They provide sensible defaults for different use cases.
 */

import type { Preset, PresetInfo } from "../types/claudeSettings";

// ============================================================================
// Built-in Presets Definitions
// ============================================================================

/**
 * Cautious preset - Maximum safety, requires confirmation for all actions
 */
export const CAUTIOUS_PRESET: Preset = {
  id: "builtin:cautious",
  name: "Cautious",
  icon: "shield",
  description: "Maximum safety. Requires confirmation for all actions.",
  type: "builtin",
  settings: {
    permissions: {
      allow: [],
      deny: [
        "Bash(rm:*)",
        "Bash(rm -rf:*)",
        "Read(.env)",
        "Read(.env.*)",
      ],
      ask: ["Bash", "Edit", "Write", "Read"],
    },
  },
};

/**
 * Balanced preset - Safe operations auto-approved, risky ones ask
 */
export const BALANCED_PRESET: Preset = {
  id: "builtin:balanced",
  name: "Balanced",
  icon: "scale",
  description: "Safe operations auto-approved. Risky actions require confirmation.",
  type: "builtin",
  settings: {
    permissions: {
      allow: [
        // Package managers
        "Bash(npm:*)",
        "Bash(pnpm:*)",
        "Bash(yarn:*)",
        "Bash(bun:*)",
        // Safe git commands
        "Bash(git status:*)",
        "Bash(git diff:*)",
        "Bash(git add:*)",
        "Bash(git log:*)",
        // Safe shell commands
        "Bash(ls:*)",
        "Bash(cat:*)",
        "Bash(grep:*)",
        "Bash(find:*)",
        "Bash(echo:*)",
        "Bash(pwd:*)",
        "Bash(which:*)",
        // Read source files
        "Read(src/**)",
        "Read(lib/**)",
        "Read(package.json)",
        "Read(tsconfig.json)",
        // Documentation URLs
        "WebFetch(domain:docs.*)",
        "WebFetch(domain:github.com)",
        "WebFetch(domain:stackoverflow.com)",
      ],
      deny: [
        // Dangerous commands
        "Bash(rm -rf:*)",
        "Bash(rm -r:*)",
        // Sensitive files
        "Read(.env)",
        "Read(.env.*)",
        "Read(secrets/**)",
      ],
      ask: [
        // Git push/commit requires confirmation
        "Bash(git push:*)",
        "Bash(git commit:*)",
        // File modifications require confirmation
        "Write",
        "Edit",
      ],
    },
  },
};

/**
 * Yolo preset - Maximum speed, minimal confirmations
 */
export const YOLO_PRESET: Preset = {
  id: "builtin:yolo",
  name: "Yolo",
  icon: "zap",
  description: "Maximum speed. Minimal confirmations for fast development.",
  type: "builtin",
  settings: {
    permissions: {
      allow: ["Bash", "Read", "Write", "Edit", "WebFetch"],
      deny: [
        // Still protect against catastrophic mistakes
        "Bash(rm -rf /)",
        "Read(.env)",
        "Read(.env.*)",
      ],
      ask: [],
    },
  },
};

// ============================================================================
// Exports
// ============================================================================

/**
 * All built-in presets as an array
 */
export const BUILT_IN_PRESETS: Preset[] = [
  CAUTIOUS_PRESET,
  BALANCED_PRESET,
  YOLO_PRESET,
];

/**
 * Built-in presets as PresetInfo (includes settings for preset detection)
 */
export const BUILT_IN_PRESET_INFOS: PresetInfo[] = BUILT_IN_PRESETS.map((preset) => ({
  id: preset.id,
  name: preset.name,
  icon: preset.icon,
  type: preset.type,
  description: preset.description,
  settings: preset.settings,
}));

/**
 * Get a built-in preset by ID
 */
export const getBuiltInPreset = (id: string): Preset | undefined => {
  return BUILT_IN_PRESETS.find((preset) => preset.id === id);
};

/**
 * Check if an ID is a built-in preset ID
 */
export const isBuiltInPresetId = (id: string): boolean => {
  return BUILT_IN_PRESETS.some((preset) => preset.id === id);
};

/**
 * Get built-in preset info by ID
 */
export const getBuiltInPresetInfo = (id: string): PresetInfo | undefined => {
  return BUILT_IN_PRESET_INFOS.find((info) => info.id === id);
};
