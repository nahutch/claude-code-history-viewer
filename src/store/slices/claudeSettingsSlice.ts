/**
 * Claude Settings Slice
 *
 * Manages Claude Code settings stored in:
 * - User: ~/.claude/settings.json
 * - Project: {project}/.claude/settings.json
 * - Local: {project}/.claude/settings.local.json
 *
 * Also manages presets (built-in and custom) stored in:
 * - Custom presets: ~/.claude-history-viewer/presets/*.json
 */

import { invoke } from "@tauri-apps/api/core";
import type { StateCreator } from "zustand";
import type {
  ClaudeCodeSettings,
  SettingsScope,
  Preset,
  PresetInfo,
  SettingsCache,
} from "../../types/claudeSettings";
import { isBuiltinPresetId } from "../../types/claudeSettings";
import { BUILT_IN_PRESET_INFOS } from "../../data/builtInPresets";
import type { FullAppStore } from "./types";

// ============================================================================
// State Interface
// ============================================================================

export interface ClaudeSettingsSliceState {
  /** Settings cache by scope */
  settingsCache: SettingsCache;
  /** Merged settings from all scopes (current project context) */
  mergedSettings: ClaudeCodeSettings | null;
  /** All available presets (built-in + custom) */
  presets: PresetInfo[];
  /** Currently active preset ID (if any) */
  activePresetId: string | null;
  /** Whether settings are currently loading */
  isLoadingSettings: boolean;
  /** Error message if settings operation failed */
  settingsError: string | null;
}

// ============================================================================
// Actions Interface
// ============================================================================

export interface ClaudeSettingsSliceActions {
  /**
   * Load settings for a specific scope
   * @param scope - The settings scope to load
   * @param projectPath - Required for project/local scopes
   */
  loadSettings: (scope: SettingsScope, projectPath?: string) => Promise<void>;

  /**
   * Save settings to a specific scope
   * @param scope - The settings scope to save to
   * @param settings - The settings to save
   * @param projectPath - Required for project/local scopes
   */
  saveSettings: (
    scope: SettingsScope,
    settings: ClaudeCodeSettings,
    projectPath?: string
  ) => Promise<void>;

  /**
   * Load merged settings from all applicable scopes
   * @param projectPath - Optional project path for project-specific settings
   */
  loadMergedSettings: (projectPath?: string) => Promise<void>;

  /**
   * Load all available presets (built-in + custom)
   */
  loadPresets: () => Promise<void>;

  /**
   * Apply a preset to a specific scope
   * @param presetId - The preset ID to apply
   * @param scope - The scope to apply the preset to
   * @param projectPath - Required for project/local scopes
   */
  applyPreset: (
    presetId: string,
    scope: SettingsScope,
    projectPath?: string
  ) => Promise<void>;

  /**
   * Save current merged settings as a new custom preset
   * @param name - Display name for the preset
   * @param icon - Icon (emoji or icon name)
   * @param description - Optional description
   */
  saveAsPreset: (name: string, icon: string, description?: string) => Promise<void>;

  /**
   * Delete a custom preset
   * @param id - The preset ID to delete (must be a custom preset)
   */
  deletePreset: (id: string) => Promise<void>;

  /**
   * Clear the settings error
   */
  clearSettingsError: () => void;
}

export type ClaudeSettingsSlice = ClaudeSettingsSliceState & ClaudeSettingsSliceActions;

// ============================================================================
// Initial State
// ============================================================================

export const initialClaudeSettingsState: ClaudeSettingsSliceState = {
  settingsCache: {},
  mergedSettings: null,
  presets: [],
  activePresetId: null,
  isLoadingSettings: false,
  settingsError: null,
};

// ============================================================================
// Slice Creator
// ============================================================================

export const createClaudeSettingsSlice: StateCreator<
  FullAppStore,
  [],
  [],
  ClaudeSettingsSlice
> = (set, get) => ({
  ...initialClaudeSettingsState,

  loadSettings: async (scope: SettingsScope, projectPath?: string) => {
    set({ isLoadingSettings: true, settingsError: null });

    try {
      const settings = await invoke<ClaudeCodeSettings | null>("read_claude_settings", {
        scope,
        projectPath: projectPath ?? null,
      });

      set((state) => ({
        settingsCache: {
          ...state.settingsCache,
          [scope]: settings,
        },
        isLoadingSettings: false,
      }));
    } catch (error) {
      console.error(`Failed to load ${scope} settings:`, error);
      set({
        isLoadingSettings: false,
        settingsError: String(error),
      });
    }
  },

  saveSettings: async (
    scope: SettingsScope,
    settings: ClaudeCodeSettings,
    projectPath?: string
  ) => {
    set({ isLoadingSettings: true, settingsError: null });

    try {
      await invoke("write_claude_settings", {
        scope,
        projectPath: projectPath ?? null,
        settings,
      });

      // Update cache after successful save
      set((state) => ({
        settingsCache: {
          ...state.settingsCache,
          [scope]: settings,
        },
        isLoadingSettings: false,
      }));
    } catch (error) {
      console.error(`Failed to save ${scope} settings:`, error);
      set({
        isLoadingSettings: false,
        settingsError: String(error),
      });
    }
  },

  loadMergedSettings: async (projectPath?: string) => {
    set({ isLoadingSettings: true, settingsError: null });

    try {
      const merged = await invoke<ClaudeCodeSettings>("get_merged_settings", {
        projectPath: projectPath ?? null,
      });

      set({
        mergedSettings: merged,
        isLoadingSettings: false,
      });
    } catch (error) {
      console.error("Failed to load merged settings:", error);
      set({
        mergedSettings: null,
        isLoadingSettings: false,
        settingsError: String(error),
      });
    }
  },

  loadPresets: async () => {
    set({ settingsError: null });

    try {
      const customPresets = await invoke<PresetInfo[]>("list_presets");

      // Combine built-in presets with custom presets
      set({
        presets: [...BUILT_IN_PRESET_INFOS, ...customPresets],
      });
    } catch (error) {
      console.error("Failed to load presets:", error);
      // Still set built-in presets even if custom loading fails
      set({
        presets: [...BUILT_IN_PRESET_INFOS],
        settingsError: String(error),
      });
    }
  },

  applyPreset: async (
    presetId: string,
    scope: SettingsScope,
    projectPath?: string
  ) => {
    set({ isLoadingSettings: true, settingsError: null });

    try {
      await invoke("apply_preset", {
        id: presetId,
        scope,
        projectPath: projectPath ?? null,
      });

      set({
        activePresetId: presetId,
        isLoadingSettings: false,
      });
    } catch (error) {
      console.error(`Failed to apply preset ${presetId}:`, error);
      set({
        isLoadingSettings: false,
        settingsError: String(error),
      });
    }
  },

  saveAsPreset: async (name: string, icon: string, description?: string) => {
    const { mergedSettings } = get();

    if (!mergedSettings) {
      set({ settingsError: "No settings to save as preset" });
      return;
    }

    set({ isLoadingSettings: true, settingsError: null });

    try {
      // Create a new preset object
      const now = new Date().toISOString();
      const preset: Preset = {
        id: `custom:${crypto.randomUUID()}`,
        name,
        icon,
        description,
        type: "custom",
        createdAt: now,
        updatedAt: now,
        settings: mergedSettings,
      };

      await invoke("save_preset", { preset });

      // Reload presets to get the updated list
      await get().loadPresets();

      set({ isLoadingSettings: false });
    } catch (error) {
      console.error("Failed to save preset:", error);
      set({
        isLoadingSettings: false,
        settingsError: String(error),
      });
    }
  },

  deletePreset: async (id: string) => {
    // Prevent deleting built-in presets
    if (isBuiltinPresetId(id)) {
      set({ settingsError: "Cannot delete built-in preset" });
      return;
    }

    set({ isLoadingSettings: true, settingsError: null });

    try {
      await invoke("delete_preset", { id });

      // Clear active preset if it was the deleted one
      const { activePresetId } = get();
      if (activePresetId === id) {
        set({ activePresetId: null });
      }

      // Reload presets to get the updated list
      await get().loadPresets();

      set({ isLoadingSettings: false });
    } catch (error) {
      console.error(`Failed to delete preset ${id}:`, error);
      set({
        isLoadingSettings: false,
        settingsError: String(error),
      });
    }
  },

  clearSettingsError: () => {
    set({ settingsError: null });
  },
});
