/**
 * CreatePresetModal Component
 *
 * Modal dialog for creating a new custom preset with:
 * - Name input
 * - Icon selector (emoji)
 * - Description input (optional)
 * - Base preset dropdown (optional)
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PresetInfo } from "@/types/claudeSettings";

// Common emoji presets for quick selection
const EMOJI_PRESETS = [
  "💼", // Briefcase
  "🏠", // Home
  "🔧", // Wrench
  "⚙️", // Gear
  "🎯", // Target
  "🚀", // Rocket
  "🔒", // Lock
  "🌟", // Star
  "💡", // Lightbulb
  "🎨", // Palette
  "📦", // Package
  "🔥", // Fire
];

export interface CreatePresetModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onOpenChange: (open: boolean) => void;
  /** Available presets to use as a base */
  availablePresets: PresetInfo[];
  /** Callback when the preset is created */
  onCreate: (data: {
    name: string;
    icon: string;
    description?: string;
    basedOn?: string;
  }) => void;
  /** Whether the creation is in progress */
  isLoading?: boolean;
}

export function CreatePresetModal({
  open,
  onOpenChange,
  availablePresets,
  onCreate,
  isLoading = false,
}: CreatePresetModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("⚙️");
  const [description, setDescription] = useState("");
  const [basedOn, setBasedOn] = useState<string | undefined>(undefined);

  const handleCreate = () => {
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      icon,
      description: description.trim() || undefined,
      basedOn,
    });

    // Reset form
    setName("");
    setIcon("⚙️");
    setDescription("");
    setBasedOn(undefined);
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset form
    setName("");
    setIcon("⚙️");
    setDescription("");
    setBasedOn(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New Preset</DialogTitle>
          <DialogDescription>
            Create a custom preset with your preferred settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="preset-name">Name</Label>
            <Input
              id="preset-name"
              placeholder="e.g., Work Mode"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <Label htmlFor="preset-icon">Icon</Label>
            <div className="flex gap-2">
              <Input
                id="preset-icon"
                placeholder="Enter emoji"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-20 text-center text-lg"
                maxLength={2}
                disabled={isLoading}
              />
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_PRESETS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setIcon(emoji)}
                    disabled={isLoading}
                    type="button"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="preset-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="preset-description"
              placeholder="What is this preset for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Base Preset Selector */}
          <div className="space-y-2">
            <Label htmlFor="preset-base">
              Base Preset <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Select
              value={basedOn}
              onValueChange={(value) =>
                setBasedOn(value === "scratch" ? undefined : value)
              }
              disabled={isLoading}
            >
              <SelectTrigger id="preset-base">
                <SelectValue placeholder="Start from scratch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scratch">Start from scratch</SelectItem>
                {availablePresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.icon} {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Copy settings from an existing preset to start with
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isLoading}
            type="button"
          >
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
