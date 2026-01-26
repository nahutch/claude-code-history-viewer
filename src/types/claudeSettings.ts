/**
 * Claude Code Settings Types
 *
 * TypeScript types mirroring the Rust types in src-tauri/src/models/claude_settings.rs
 * These are used for managing Claude Code's settings.json files.
 */

// ============================================================================
// Settings Scope
// ============================================================================

/**
 * Claude Code settings scope
 * Defines where settings are stored and their priority in the merge order
 */
export type SettingsScope = "managed" | "user" | "project" | "local";

/**
 * Get the priority of a scope (higher = more important)
 * Used for merging settings from multiple scopes
 */
export const getScopePriority = (scope: SettingsScope): number => {
  const priorities: Record<SettingsScope, number> = {
    managed: 100,
    local: 30,
    project: 20,
    user: 10,
  };
  return priorities[scope];
};

// ============================================================================
// Permission Configuration
// ============================================================================

/**
 * Permission configuration for Claude Code
 * Defines what actions are allowed, denied, or require asking
 */
export interface PermissionsConfig {
  /** Actions that are always allowed (e.g., "Read(*)", "Bash(npm:*)") */
  allow?: string[];
  /** Actions that are always denied (e.g., "Bash(rm -rf:*)") */
  deny?: string[];
  /** Actions that require user confirmation */
  ask?: string[];
}

/**
 * Check if a permissions config is empty
 */
export const isPermissionsEmpty = (config: PermissionsConfig | undefined): boolean => {
  if (!config) return true;
  return (
    (!config.allow || config.allow.length === 0) &&
    (!config.deny || config.deny.length === 0) &&
    (!config.ask || config.ask.length === 0)
  );
};

// Note: hooks and mcpServers use flexible types to handle
// Claude Code's complex nested structures without breaking on schema changes

// ============================================================================
// Claude Code Settings
// ============================================================================

/**
 * Claude Code settings structure
 * Represents the full settings.json schema
 */
export interface ClaudeCodeSettings {
  /** Model to use (e.g., "opus", "sonnet") */
  model?: string;

  /** API key responsible use acknowledgment */
  customApiKeyResponsibleUse?: boolean;

  /** Permission configuration */
  permissions?: PermissionsConfig;

  /** Hook configurations (flexible structure) */
  hooks?: unknown;

  /** MCP server configurations (flexible structure) */
  mcpServers?: unknown;

  /** Environment variables */
  env?: Record<string, string>;

  /** Additional fields not explicitly defined (for forward compatibility) */
  [key: string]: unknown;
}

/**
 * Check if settings have any values
 */
export const isSettingsEmpty = (settings: ClaudeCodeSettings | null | undefined): boolean => {
  if (!settings) return true;

  // Check known fields
  if (settings.model !== undefined) return false;
  if (settings.customApiKeyResponsibleUse !== undefined) return false;
  if (!isPermissionsEmpty(settings.permissions)) return false;
  if (settings.hooks && typeof settings.hooks === "object" && Object.keys(settings.hooks).length > 0) return false;
  if (settings.mcpServers && typeof settings.mcpServers === "object" && Object.keys(settings.mcpServers).length > 0) return false;
  if (settings.env && Object.keys(settings.env).length > 0) return false;

  // Check for any extra fields
  const knownFields = new Set([
    "model",
    "customApiKeyResponsibleUse",
    "permissions",
    "hooks",
    "mcpServers",
    "env",
  ]);

  for (const key of Object.keys(settings)) {
    if (!knownFields.has(key)) {
      return false;
    }
  }

  return true;
};

// ============================================================================
// Preset Types
// ============================================================================

/**
 * Preset type enum
 */
export type PresetType = "builtin" | "custom";

/**
 * Full preset structure with settings
 */
export interface Preset {
  /** Unique identifier (e.g., "builtin:balanced", "custom:uuid") */
  id: string;

  /** Display name */
  name: string;

  /** Icon (emoji or icon name) */
  icon: string;

  /** Description of what this preset does */
  description?: string;

  /** Preset type (builtin or custom) */
  type: PresetType;

  /** ID of the preset this was based on (for copies) */
  basedOn?: string;

  /** Creation timestamp (ISO 8601) */
  createdAt?: string;

  /** Last update timestamp (ISO 8601) */
  updatedAt?: string;

  /** The actual settings this preset applies */
  settings: ClaudeCodeSettings;
}

/**
 * Lightweight preset info for listing (without full settings)
 */
export interface PresetInfo {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Icon (emoji or icon name) */
  icon: string;

  /** Preset type */
  type: PresetType;

  /** Description (optional) */
  description?: string;

  /** Creation timestamp (optional) */
  createdAt?: string;

  /** Last update timestamp (optional) */
  updatedAt?: string;

  /** The actual settings this preset applies (optional for lightweight listing) */
  settings: ClaudeCodeSettings;
}

/**
 * Convert a full Preset to PresetInfo
 */
export const toPresetInfo = (preset: Preset): PresetInfo => ({
  id: preset.id,
  name: preset.name,
  icon: preset.icon,
  type: preset.type,
  description: preset.description,
  createdAt: preset.createdAt,
  updatedAt: preset.updatedAt,
  settings: preset.settings,
});

/**
 * Check if a preset is built-in
 */
export const isBuiltinPreset = (preset: Preset | PresetInfo): boolean => {
  return preset.type === "builtin";
};

/**
 * Check if a preset ID indicates a built-in preset
 */
export const isBuiltinPresetId = (id: string): boolean => {
  return id.startsWith("builtin:");
};

// ============================================================================
// Settings Cache Type
// ============================================================================

/**
 * Cache for settings by scope
 */
export type SettingsCache = Partial<Record<SettingsScope, ClaudeCodeSettings | null>>;
