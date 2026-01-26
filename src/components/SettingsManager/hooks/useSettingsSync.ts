/**
 * useSettingsSync Hook
 *
 * Manages bidirectional sync between Visual Editor (sliders) and JSON Editor.
 *
 * Flow:
 * - Visual State → sliderToRules() → merge → JSON state
 * - JSON State → parse → rulesToSlider() → visual state
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { sliderToRules } from "../utils/sliderToRules";
import { rulesToSlider } from "../utils/rulesToSlider";
// Note: areSliderValuesEqual available for future use
import type { SliderValues } from "../utils/sliderToRules";
import type { ClaudeCodeSettings, PermissionsConfig, PresetInfo } from "@/types/claudeSettings";

export interface UseSettingsSyncOptions {
  /** Initial settings to display */
  initialSettings: ClaudeCodeSettings | null;
  /** All available presets for detection */
  presets: PresetInfo[];
  /** Callback when settings change */
  onChange?: (settings: ClaudeCodeSettings) => void;
}

export interface UseSettingsSyncReturn {
  /** Current slider values (for Visual Editor) */
  visualState: SliderValues;
  /** Current JSON string (for JSON Editor) */
  jsonState: string;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Active preset ID (null if no match or "custom" if modified) */
  activePresetId: string | null;
  /** JSON parse error (if any) */
  jsonError: string | null;
  /** Update slider values (from Visual Editor) */
  updateVisualState: (newSliderValues: SliderValues) => void;
  /** Update JSON string (from JSON Editor) */
  updateJsonState: (newJson: string) => void;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Detect which preset matches the current permissions
 */
function detectActivePreset(
  permissions: PermissionsConfig | undefined,
  presets: PresetInfo[]
): string | null {
  if (!permissions) return null;

  for (const preset of presets) {
    if (!preset.settings.permissions) continue;

    // Deep compare permissions
    const presetPerms = preset.settings.permissions;
    const allowMatch =
      JSON.stringify(presetPerms.allow?.sort()) ===
      JSON.stringify(permissions.allow?.sort());
    const denyMatch =
      JSON.stringify(presetPerms.deny?.sort()) ===
      JSON.stringify(permissions.deny?.sort());
    const askMatch =
      JSON.stringify(presetPerms.ask?.sort()) ===
      JSON.stringify(permissions.ask?.sort());

    if (allowMatch && denyMatch && askMatch) {
      return preset.id;
    }
  }

  return null;
}

/**
 * Hook for bidirectional sync between Visual and JSON editors
 */
export function useSettingsSync({
  initialSettings,
  presets,
  onChange,
}: UseSettingsSyncOptions): UseSettingsSyncReturn {
  // Visual state (slider values)
  const [visualState, setVisualState] = useState<SliderValues>(() =>
    rulesToSlider(initialSettings?.permissions)
  );

  // JSON state (string representation)
  const [jsonState, setJsonState] = useState<string>(() =>
    JSON.stringify(initialSettings || {}, null, 2)
  );

  // JSON parse error
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Track dirty state
  const [isDirty, setIsDirty] = useState(false);

  // Initial settings for comparison
  const [initialJson] = useState<string>(() =>
    JSON.stringify(initialSettings || {}, null, 2)
  );

  // Detect active preset
  const activePresetId = useMemo(() => {
    try {
      const settings = JSON.parse(jsonState) as ClaudeCodeSettings;
      return detectActivePreset(settings.permissions, presets);
    } catch {
      return null;
    }
  }, [jsonState, presets]);

  // Update visual state from JSON when initialSettings changes
  useEffect(() => {
    if (initialSettings) {
      const newVisualState = rulesToSlider(initialSettings.permissions);
      setVisualState(newVisualState);

      const newJsonState = JSON.stringify(initialSettings, null, 2);
      setJsonState(newJsonState);
      setIsDirty(false);
      setJsonError(null);
    }
  }, [initialSettings]);

  /**
   * Update slider values → convert to JSON
   */
  const updateVisualState = useCallback(
    (newSliderValues: SliderValues) => {
      setVisualState(newSliderValues);

      // Convert sliders to permissions rules
      const newPermissions = sliderToRules(newSliderValues);

      // Parse current JSON to preserve other fields
      let currentSettings: ClaudeCodeSettings;
      try {
        currentSettings = JSON.parse(jsonState);
      } catch {
        // If JSON is invalid, start with empty settings
        currentSettings = {};
      }

      // Merge new permissions
      const updatedSettings: ClaudeCodeSettings = {
        ...currentSettings,
        permissions: newPermissions,
      };

      // Update JSON state
      const newJson = JSON.stringify(updatedSettings, null, 2);
      setJsonState(newJson);
      setJsonError(null);

      // Mark as dirty
      setIsDirty(newJson !== initialJson);

      // Notify parent
      onChange?.(updatedSettings);
    },
    [jsonState, initialJson, onChange]
  );

  /**
   * Update JSON string → parse and convert to sliders (debounced)
   */
  const updateJsonState = useCallback(
    (newJson: string) => {
      setJsonState(newJson);

      // Mark as dirty
      setIsDirty(newJson !== initialJson);

      // Try to parse and update visual state
      try {
        const settings = JSON.parse(newJson) as ClaudeCodeSettings;
        setJsonError(null);

        // Convert to slider values
        const newSliderValues = rulesToSlider(settings.permissions);
        setVisualState(newSliderValues);

        // Notify parent
        onChange?.(settings);
      } catch (error) {
        // Store error but don't update visual state
        setJsonError(error instanceof Error ? error.message : "Invalid JSON");
      }
    },
    [initialJson, onChange]
  );

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    if (initialSettings) {
      const newVisualState = rulesToSlider(initialSettings.permissions);
      setVisualState(newVisualState);

      const newJsonState = JSON.stringify(initialSettings, null, 2);
      setJsonState(newJsonState);
      setIsDirty(false);
      setJsonError(null);
    }
  }, [initialSettings]);

  return {
    visualState,
    jsonState,
    isDirty,
    activePresetId,
    jsonError,
    updateVisualState,
    updateJsonState,
    reset,
  };
}
