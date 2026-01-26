/**
 * FineTunePanel Component
 *
 * Detail layer for fine-tuning permissions with slider controls.
 * Provides category-based permission sliders for granular control.
 */

import { useState } from "react";
import { ChevronDown, AlertTriangle, FileText, Terminal, Globe } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getSliderLabel,
  getSliderColor,
  type SliderValue,
  type SliderValues,
} from "../utils/sliderToRules";

export interface FineTunePanelProps {
  /** Current slider values */
  sliderValues: SliderValues;
  /** Callback when slider values change */
  onChange: (sliderValues: SliderValues) => void;
  /** Whether the panel is open by default */
  defaultOpen?: boolean;
  /** Loading state */
  isLoading?: boolean;
}

interface SliderControlProps {
  label: string;
  description?: string;
  value: SliderValue;
  onChange: (value: SliderValue) => void;
  showWarning?: boolean;
}

function SliderControl({
  label,
  description,
  value,
  onChange,
  showWarning,
}: SliderControlProps) {
  const labelText = getSliderLabel(value);
  const colorClass = getSliderColor(value);

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">{label}</label>
            {showWarning && value === 2 && (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <span className={cn("text-sm font-semibold", colorClass)}>
          {labelText}
        </span>
      </div>

      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0] as SliderValue)}
        min={0}
        max={2}
        step={1}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Block</span>
        <span>Ask</span>
        <span>Allow</span>
      </div>
    </div>
  );
}

export function FineTunePanel({
  sliderValues,
  onChange,
  defaultOpen = false,
  isLoading = false,
}: FineTunePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleSliderChange = (category: keyof SliderValues, value: SliderValue) => {
    const newValues = { ...sliderValues, [category]: value };
    onChange(newValues);
  };

  const handleReset = () => {
    // Reset to default "Ask" values
    const defaultValues: SliderValues = {
      fileRead: 1,
      fileEdit: 1,
      fileCreate: 1,
      buildCommands: 1,
      gitCommands: 1,
      dangerous: 0,
      networkDocs: 1,
      networkOther: 1,
    };
    onChange(defaultValues);
  };

  return (
    <Card variant="glass" className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Fine Tune</h3>
              <span className="text-xs text-muted-foreground">
                Adjust individual permission settings
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-6 p-4 pt-0">
            {/* File Operations */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h4 className="font-semibold">File Operations</h4>
              </div>

              <div className="space-y-4 pl-7">
                <SliderControl
                  label="Read files"
                  description="Access to reading files in the project"
                  value={sliderValues.fileRead}
                  onChange={(v) => handleSliderChange("fileRead", v)}
                />

                <SliderControl
                  label="Edit files"
                  description="Modify existing files"
                  value={sliderValues.fileEdit}
                  onChange={(v) => handleSliderChange("fileEdit", v)}
                />

                <SliderControl
                  label="Create files"
                  description="Create new files and directories"
                  value={sliderValues.fileCreate}
                  onChange={(v) => handleSliderChange("fileCreate", v)}
                />
              </div>
            </section>

            {/* Terminal Commands */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold">Terminal Commands</h4>
              </div>

              <div className="space-y-4 pl-7">
                <SliderControl
                  label="Build & Test"
                  description="npm, pnpm, yarn, pytest, cargo build..."
                  value={sliderValues.buildCommands}
                  onChange={(v) => handleSliderChange("buildCommands", v)}
                />

                <SliderControl
                  label="Git commands"
                  description="status: auto, commit/push: ask"
                  value={sliderValues.gitCommands}
                  onChange={(v) => handleSliderChange("gitCommands", v)}
                />

                <SliderControl
                  label="Dangerous"
                  description="rm -rf, DROP database..."
                  value={sliderValues.dangerous}
                  onChange={(v) => handleSliderChange("dangerous", v)}
                  showWarning
                />
              </div>
            </section>

            {/* Network */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" />
                <h4 className="font-semibold">Network</h4>
              </div>

              <div className="space-y-4 pl-7">
                <SliderControl
                  label="Documentation"
                  description="docs.*, github.com, stackoverflow..."
                  value={sliderValues.networkDocs}
                  onChange={(v) => handleSliderChange("networkDocs", v)}
                />

                <SliderControl
                  label="Other URLs"
                  description="All other web requests"
                  value={sliderValues.networkOther}
                  onChange={(v) => handleSliderChange("networkOther", v)}
                />
              </div>
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset to Default
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
