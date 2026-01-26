/**
 * PresetSelector Component
 *
 * Displays a grid of preset cards organized by:
 * - Built-in presets (top section)
 * - Custom presets (bottom section with "New" button)
 */

import { PresetCard } from "./PresetCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { PresetInfo } from "@/types/claudeSettings";

export interface PresetSelectorProps {
  /** All available presets (built-in + custom) */
  presets: PresetInfo[];
  /** ID of the currently active preset */
  activePresetId: string | null;
  /** Callback when a preset's Apply button is clicked */
  onApplyPreset: (presetId: string) => void;
  /** Callback when the New Preset button is clicked */
  onCreateNew: () => void;
  /** Callback when Edit is clicked on a custom preset */
  onEditPreset?: (presetId: string) => void;
  /** Callback when Duplicate is clicked */
  onDuplicatePreset?: (presetId: string) => void;
  /** Callback when Export is clicked */
  onExportPreset?: (presetId: string) => void;
  /** Callback when Delete is clicked on a custom preset */
  onDeletePreset?: (presetId: string) => void;
  /** Whether presets are currently loading */
  isLoading?: boolean;
}

export function PresetSelector({
  presets,
  activePresetId,
  onApplyPreset,
  onCreateNew,
  onEditPreset,
  onDuplicatePreset,
  onExportPreset,
  onDeletePreset,
  isLoading = false,
}: PresetSelectorProps) {
  // Separate built-in and custom presets
  const builtinPresets = presets.filter((p) => p.type === "builtin");
  const customPresets = presets.filter((p) => p.type === "custom");

  return (
    <div className="space-y-6">
      {/* Built-in Presets Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Built-in
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builtinPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isActive={activePresetId === preset.id}
              onApply={() => onApplyPreset(preset.id)}
              onDuplicate={() => onDuplicatePreset?.(preset.id)}
              onExport={() => onExportPreset?.(preset.id)}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Custom Presets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">
            My Presets
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNew}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>

        {customPresets.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No custom presets yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Click &quot;New&quot; to create your first preset
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isActive={activePresetId === preset.id}
                onApply={() => onApplyPreset(preset.id)}
                onEdit={() => onEditPreset?.(preset.id)}
                onDuplicate={() => onDuplicatePreset?.(preset.id)}
                onExport={() => onExportPreset?.(preset.id)}
                onDelete={() => onDeletePreset?.(preset.id)}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
