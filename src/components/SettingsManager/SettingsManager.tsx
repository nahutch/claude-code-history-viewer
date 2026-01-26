/**
 * SettingsManager Component
 *
 * Main container for Claude Code settings management.
 * Provides a progressive disclosure UI:
 * - Surface Layer: Quick preset selection
 * - Detail Layer: Fine-tune panel with sliders
 * - Raw Layer: JSON editor with scope selector
 */

import { useState, useEffect } from "react";
import { PresetSelector } from "./components/PresetSelector";
import { CreatePresetModal } from "./components/CreatePresetModal";
import { FineTunePanel } from "./components/FineTunePanel";
import { JsonEditor } from "./components/JsonEditor";
import { ScopeTabs } from "./components/ScopeTabs";
import { Button } from "@/components/ui/button";
import { Code2, Eye, AlertCircle, Save, FileJson, FolderOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useClaudeSettings } from "./hooks/useClaudeSettings";
import { usePresets } from "./hooks/usePresets";
import { useSettingsSync } from "./hooks/useSettingsSync";
import type { SettingsScope, ClaudeCodeSettings } from "@/types/claudeSettings";

export interface SettingsManagerProps {
  /** Current project path (for project/local scope settings) */
  projectPath?: string;
  /** Settings scope to manage (defaults to 'user') */
  scope?: SettingsScope;
}

export function SettingsManager({
  projectPath,
  scope = "user",
}: SettingsManagerProps) {
  const [showJsonMode, setShowJsonMode] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeScope, setActiveScope] = useState<SettingsScope>(scope);

  // Use custom hooks
  const { settingsCache, isLoading, error, actions: settingsActions } =
    useClaudeSettings();
  const { allPresets, actions: presetActions } = usePresets();

  // Get current scope settings
  const currentScopeSettings = settingsCache?.[activeScope] || null;

  // Bidirectional sync between Visual and JSON modes
  const {
    visualState,
    jsonState,
    isDirty,
    activePresetId,
    jsonError,
    updateVisualState,
    updateJsonState,
    reset: _reset,
  } = useSettingsSync({
    initialSettings: currentScopeSettings,
    presets: allPresets,
  });

  // Load presets and settings on mount
  useEffect(() => {
    const loadData = async () => {
      await settingsActions.loadPresets();
      await settingsActions.load(activeScope, projectPath);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScope, projectPath]);

  // Handle mode switch - sync state
  const handleModeToggle = () => {
    // When switching modes, ensure state is synced
    if (showJsonMode) {
      // Switching to Visual mode - JSON should already be synced to visual
      setShowJsonMode(false);
    } else {
      // Switching to JSON mode - visual should already be synced to JSON
      setShowJsonMode(true);
    }
  };

  const handleApplyPreset = async (presetId: string) => {
    await settingsActions.applyPreset(presetId, activeScope, projectPath);
    // Reload settings after applying preset
    await settingsActions.load(activeScope, projectPath);
  };

  const handleCreatePreset = async (data: {
    name: string;
    icon: string;
    description?: string;
    basedOn?: string;
  }) => {
    await presetActions.createPreset(data.name, data.icon, data.description);
    setCreateModalOpen(false);
  };

  const handleDuplicatePreset = async (presetId: string) => {
    try {
      await presetActions.duplicatePreset(presetId);
    } catch (error) {
      console.error("Failed to duplicate preset:", error);
      alert("Failed to duplicate preset");
    }
  };

  const handleExportPreset = (presetId: string) => {
    try {
      presetActions.exportPreset(presetId);
    } catch (error) {
      console.error("Failed to export preset:", error);
      alert("Failed to export preset");
    }
  };

  const handleEditPreset = (presetId: string) => {
    // TODO: Implement preset editing modal
    console.log("Edit preset:", presetId);
  };

  const handleDeletePreset = async (presetId: string) => {
    if (confirm("Are you sure you want to delete this preset?")) {
      await presetActions.deletePreset(presetId);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Parse JSON and save
      const settings = JSON.parse(jsonState) as ClaudeCodeSettings;
      await settingsActions.save(activeScope, settings, projectPath);
      // Reload to sync
      await settingsActions.load(activeScope, projectPath);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings: Invalid JSON");
    }
  };

  const handleScopeChange = (newScope: SettingsScope) => {
    setActiveScope(newScope);
    settingsActions.load(newScope, projectPath);
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage Claude Code permissions and behaviors
          </p>
          {isDirty && (
            <p className="mt-1 flex items-center text-xs text-amber-600">
              <AlertCircle className="mr-1 h-3 w-3" />
              Unsaved changes
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Save Button (when dirty) */}
          {isDirty && (
            <Button
              variant="default"
              onClick={handleSaveSettings}
              disabled={isLoading || !!jsonError}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}

          {/* JSON/Visual Mode Toggle */}
          <Button
            variant="outline"
            onClick={handleModeToggle}
            disabled={isLoading}
          >
            {showJsonMode ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Visual Mode
              </>
            ) : (
              <>
                <Code2 className="mr-2 h-4 w-4" />
                JSON Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {(error || jsonError) && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-start">
            <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="mt-1">{error || jsonError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Mode: Preset Selection */}
      {!showJsonMode && (
        <div className="space-y-6">
          {/* Current Settings Summary */}
          <Card variant="glass" className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <FileJson className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Current Settings</h3>
                  <p className="text-xs text-muted-foreground">
                    Scope: <span className="font-medium text-foreground">{activeScope}</span>
                    {projectPath && (
                      <span className="ml-2">
                        <FolderOpen className="inline h-3 w-3 mr-1" />
                        {projectPath.split('/').pop()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {currentScopeSettings ? (
                  <span className="text-green-500">Loaded</span>
                ) : isLoading ? (
                  <span>Loading...</span>
                ) : (
                  <span className="text-amber-500">No settings file</span>
                )}
              </div>
            </div>

            {/* Quick summary of current permissions */}
            {currentScopeSettings?.permissions && (
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-green-500 font-medium">Allow</span>
                  <p className="text-muted-foreground">
                    {currentScopeSettings.permissions.allow?.length || 0} rules
                  </p>
                </div>
                <div>
                  <span className="text-red-500 font-medium">Deny</span>
                  <p className="text-muted-foreground">
                    {currentScopeSettings.permissions.deny?.length || 0} rules
                  </p>
                </div>
                <div>
                  <span className="text-yellow-500 font-medium">Ask</span>
                  <p className="text-muted-foreground">
                    {currentScopeSettings.permissions.ask?.length || 0} rules
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Scope Selector for Visual Mode */}
          <section>
            <ScopeTabs
              activeScope={activeScope}
              onScopeChange={handleScopeChange}
              hasProject={!!projectPath}
              disabled={isLoading}
            />
          </section>

          {/* Preset Selector (Surface Layer) */}
          <section>
            <PresetSelector
              presets={allPresets}
              activePresetId={activePresetId}
              onApplyPreset={handleApplyPreset}
              onCreateNew={() => setCreateModalOpen(true)}
              onEditPreset={handleEditPreset}
              onDuplicatePreset={handleDuplicatePreset}
              onExportPreset={handleExportPreset}
              onDeletePreset={handleDeletePreset}
              isLoading={isLoading}
            />
          </section>

          {/* Fine Tune Panel (Detail Layer) */}
          <section>
            <FineTunePanel
              sliderValues={visualState}
              onChange={updateVisualState}
              isLoading={isLoading}
            />
          </section>
        </div>
      )}

      {/* JSON Mode (Raw Layer) */}
      {showJsonMode && (
        <div className="space-y-6">
          {/* Scope Selector */}
          <section>
            <ScopeTabs
              activeScope={activeScope}
              onScopeChange={handleScopeChange}
              hasProject={!!projectPath}
              disabled={isLoading}
            />
          </section>

          {/* JSON Editor */}
          <section>
            <JsonEditor
              value={jsonState}
              onChange={updateJsonState}
              isLoading={isLoading}
              error={jsonError}
            />
          </section>
        </div>
      )}

      {/* Create Preset Modal */}
      <CreatePresetModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        availablePresets={allPresets}
        onCreate={handleCreatePreset}
        isLoading={isLoading}
      />
    </div>
  );
}
