/**
 * useClaudeSettings Hook
 *
 * Facade hook for easy access to Claude settings store with error handling.
 * Provides a simplified API for common settings operations.
 */

import { useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { ClaudeCodeSettings, SettingsScope, PresetInfo, SettingsCache } from "@/types/claudeSettings";

export interface UseClaudeSettingsReturn {
  /** Current merged settings */
  settings: ClaudeCodeSettings | null;
  /** All available presets */
  presets: PresetInfo[];
  /** Currently active preset ID */
  activePresetId: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message (if any) */
  error: string | null;
  /** Settings cache by scope */
  settingsCache: SettingsCache;

  /** Actions */
  actions: {
    /** Load settings for a specific scope */
    load: (scope: SettingsScope, projectPath?: string) => Promise<void>;
    /** Save settings to a specific scope */
    save: (
      scope: SettingsScope,
      settings: ClaudeCodeSettings,
      projectPath?: string
    ) => Promise<void>;
    /** Load merged settings from all scopes */
    loadMerged: (projectPath?: string) => Promise<void>;
    /** Apply a preset */
    applyPreset: (
      presetId: string,
      scope: SettingsScope,
      projectPath?: string
    ) => Promise<void>;
    /** Save current settings as a new preset */
    saveAsPreset: (name: string, icon: string, description?: string) => Promise<void>;
    /** Delete a custom preset */
    deletePreset: (id: string) => Promise<void>;
    /** Load all presets */
    loadPresets: () => Promise<void>;
    /** Clear error */
    clearError: () => void;
  };
}

/**
 * Hook for accessing Claude settings store
 */
export function useClaudeSettings(): UseClaudeSettingsReturn {
  const store = useAppStore();

  const actions = {
    load: useCallback(
      async (scope: SettingsScope, projectPath?: string) => {
        try {
          await store.loadSettings(scope, projectPath);
        } catch (error) {
          console.error("Failed to load settings:", error);
          throw error;
        }
      },
      [store]
    ),

    save: useCallback(
      async (
        scope: SettingsScope,
        settings: ClaudeCodeSettings,
        projectPath?: string
      ) => {
        try {
          await store.saveSettings(scope, settings, projectPath);
        } catch (error) {
          console.error("Failed to save settings:", error);
          throw error;
        }
      },
      [store]
    ),

    loadMerged: useCallback(
      async (projectPath?: string) => {
        try {
          await store.loadMergedSettings(projectPath);
        } catch (error) {
          console.error("Failed to load merged settings:", error);
          throw error;
        }
      },
      [store]
    ),

    applyPreset: useCallback(
      async (presetId: string, scope: SettingsScope, projectPath?: string) => {
        try {
          await store.applyPreset(presetId, scope, projectPath);
        } catch (error) {
          console.error("Failed to apply preset:", error);
          throw error;
        }
      },
      [store]
    ),

    saveAsPreset: useCallback(
      async (name: string, icon: string, description?: string) => {
        try {
          await store.saveAsPreset(name, icon, description);
        } catch (error) {
          console.error("Failed to save preset:", error);
          throw error;
        }
      },
      [store]
    ),

    deletePreset: useCallback(
      async (id: string) => {
        try {
          await store.deletePreset(id);
        } catch (error) {
          console.error("Failed to delete preset:", error);
          throw error;
        }
      },
      [store]
    ),

    loadPresets: useCallback(async () => {
      try {
        await store.loadPresets();
      } catch (error) {
        console.error("Failed to load presets:", error);
        throw error;
      }
    }, [store]),

    clearError: useCallback(() => {
      store.clearSettingsError();
    }, [store]),
  };

  return {
    settings: store.mergedSettings,
    presets: store.presets,
    activePresetId: store.activePresetId,
    isLoading: store.isLoadingSettings,
    error: store.settingsError,
    settingsCache: store.settingsCache,
    actions,
  };
}
