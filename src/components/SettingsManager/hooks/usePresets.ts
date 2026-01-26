/**
 * usePresets Hook
 *
 * Preset-specific operations with enhanced functionality.
 * Separates built-in and custom presets and provides utilities.
 */

import { useMemo, useCallback } from "react";
import { useClaudeSettings } from "./useClaudeSettings";
import { isBuiltinPresetId } from "@/types/claudeSettings";
import type { PresetInfo, Preset } from "@/types/claudeSettings";

export interface UsePresetsReturn {
  /** All presets */
  allPresets: PresetInfo[];
  /** Built-in presets only */
  builtInPresets: PresetInfo[];
  /** Custom presets only */
  customPresets: PresetInfo[];
  /** Currently active preset ID */
  activePresetId: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;

  /** Actions */
  actions: {
    /** Create a new custom preset */
    createPreset: (
      name: string,
      icon: string,
      description?: string
    ) => Promise<void>;
    /** Delete a custom preset */
    deletePreset: (id: string) => Promise<void>;
    /** Duplicate a preset (creates a custom copy) */
    duplicatePreset: (sourceId: string) => Promise<void>;
    /** Export preset as JSON file */
    exportPreset: (id: string) => void;
    /** Check if a preset is currently active */
    isPresetActive: (id: string) => boolean;
    /** Load all presets */
    loadPresets: () => Promise<void>;
  };
}

/**
 * Hook for preset-specific operations
 */
export function usePresets(): UsePresetsReturn {
  const { presets, activePresetId, isLoading, error, actions: settingsActions } =
    useClaudeSettings();

  // Separate built-in and custom presets
  const { builtInPresets, customPresets } = useMemo(() => {
    const builtIn: PresetInfo[] = [];
    const custom: PresetInfo[] = [];

    for (const preset of presets) {
      if (isBuiltinPresetId(preset.id)) {
        builtIn.push(preset);
      } else {
        custom.push(preset);
      }
    }

    return { builtInPresets: builtIn, customPresets: custom };
  }, [presets]);

  /**
   * Create a new custom preset
   */
  const createPreset = useCallback(
    async (name: string, icon: string, description?: string) => {
      await settingsActions.saveAsPreset(name, icon, description);
    },
    [settingsActions]
  );

  /**
   * Delete a custom preset
   */
  const deletePreset = useCallback(
    async (id: string) => {
      if (isBuiltinPresetId(id)) {
        throw new Error("Cannot delete built-in preset");
      }
      await settingsActions.deletePreset(id);
    },
    [settingsActions]
  );

  /**
   * Duplicate a preset (creates a custom copy)
   */
  const duplicatePreset = useCallback(
    async (sourceId: string) => {
      const sourcePreset = presets.find((p: PresetInfo) => p.id === sourceId);
      if (!sourcePreset) {
        throw new Error(`Preset not found: ${sourceId}`);
      }

      // Create new preset with " (Copy)" suffix
      const newName = `${sourcePreset.name} (Copy)`;
      await settingsActions.saveAsPreset(
        newName,
        sourcePreset.icon,
        sourcePreset.description
      );
    },
    [presets, settingsActions]
  );

  /**
   * Export preset as JSON file
   */
  const exportPreset = useCallback(
    (id: string) => {
      const preset = presets.find((p: PresetInfo) => p.id === id);
      if (!preset) {
        throw new Error(`Preset not found: ${id}`);
      }

      // Create a full Preset object for export
      const exportData: Preset = {
        id: preset.id,
        name: preset.name,
        icon: preset.icon,
        description: preset.description,
        type: isBuiltinPresetId(id) ? "builtin" : "custom",
        createdAt: preset.createdAt || new Date().toISOString(),
        updatedAt: preset.updatedAt || new Date().toISOString(),
        settings: preset.settings,
      };

      // Create blob and download
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [presets]
  );

  /**
   * Check if a preset is currently active
   */
  const isPresetActive = useCallback(
    (id: string) => {
      return activePresetId === id;
    },
    [activePresetId]
  );

  /**
   * Load all presets
   */
  const loadPresets = useCallback(async () => {
    await settingsActions.loadPresets();
  }, [settingsActions]);

  return {
    allPresets: presets,
    builtInPresets,
    customPresets,
    activePresetId,
    isLoading,
    error,
    actions: {
      createPreset,
      deletePreset,
      duplicatePreset,
      exportPreset,
      isPresetActive,
      loadPresets,
    },
  };
}
