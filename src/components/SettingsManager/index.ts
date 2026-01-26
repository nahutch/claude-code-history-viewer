/**
 * Settings Manager - Barrel Export
 *
 * Main entry point for the Settings Manager feature.
 */

export { SettingsManager } from "./SettingsManager";
export type { SettingsManagerProps } from "./SettingsManager";

export { PresetCard } from "./components/PresetCard";
export type { PresetCardProps } from "./components/PresetCard";

export { PresetSelector } from "./components/PresetSelector";
export type { PresetSelectorProps } from "./components/PresetSelector";

export { CreatePresetModal } from "./components/CreatePresetModal";
export type { CreatePresetModalProps } from "./components/CreatePresetModal";

export { FineTunePanel } from "./components/FineTunePanel";
export type { FineTunePanelProps } from "./components/FineTunePanel";

export { ProtectedFilesList } from "./components/ProtectedFilesList";
export type { ProtectedFilesListProps } from "./components/ProtectedFilesList";

export { JsonEditor } from "./components/JsonEditor";
export type { JsonEditorProps } from "./components/JsonEditor";

export { ScopeTabs } from "./components/ScopeTabs";
export type { ScopeTabsProps } from "./components/ScopeTabs";

// Utils
export { sliderToRules, getSliderLabel, getSliderColor } from "./utils/sliderToRules";
export type { SliderValue, SliderValues } from "./utils/sliderToRules";
export { rulesToSlider, areSliderValuesEqual } from "./utils/rulesToSlider";

// Hooks
export { useSettingsSync } from "./hooks/useSettingsSync";
export type { UseSettingsSyncOptions, UseSettingsSyncReturn } from "./hooks/useSettingsSync";

export { useClaudeSettings } from "./hooks/useClaudeSettings";
export type { UseClaudeSettingsReturn } from "./hooks/useClaudeSettings";

export { usePresets } from "./hooks/usePresets";
export type { UsePresetsReturn } from "./hooks/usePresets";
