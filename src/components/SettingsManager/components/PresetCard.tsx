/**
 * PresetCard Component
 *
 * Displays a preset as a card with:
 * - Icon and name
 * - Description
 * - Apply button
 * - Menu for custom presets (Edit, Duplicate, Export, Delete)
 * - Active state indicator
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Scale,
  Zap,
  MoreVertical,
  Pencil,
  Copy,
  Download,
  Trash2,
} from "lucide-react";
import type { PresetInfo } from "@/types/claudeSettings";
import { cn } from "@/lib/utils";

// Icon mapping for built-in presets
const PRESET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  scale: Scale,
  zap: Zap,
};

export interface PresetCardProps {
  /** Preset information */
  preset: PresetInfo;
  /** Whether this preset is currently active */
  isActive?: boolean;
  /** Callback when Apply button is clicked */
  onApply?: () => void;
  /** Callback when Edit is clicked (custom presets only) */
  onEdit?: () => void;
  /** Callback when Duplicate is clicked */
  onDuplicate?: () => void;
  /** Callback when Export is clicked */
  onExport?: () => void;
  /** Callback when Delete is clicked (custom presets only) */
  onDelete?: () => void;
  /** Whether the card is in a loading state */
  isLoading?: boolean;
}

export function PresetCard({
  preset,
  isActive = false,
  onApply,
  onEdit,
  onDuplicate,
  onExport,
  onDelete,
  isLoading = false,
}: PresetCardProps) {
  const isBuiltin = preset.type === "builtin";
  const IconComponent = PRESET_ICONS[preset.icon];

  return (
    <Card
      variant={isActive ? "glass" : "interactive"}
      className={cn(
        "relative",
        isActive && "ring-2 ring-primary/20"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {IconComponent ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <IconComponent className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                {preset.icon}
              </div>
            )}
            <div>
              <CardTitle className="text-base">{preset.name}</CardTitle>
              {isActive && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Applied
                </Badge>
              )}
            </div>
          </div>

          {!isBuiltin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onExport && (
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      {preset.description && (
        <CardContent className="pb-3">
          <CardDescription className="text-xs leading-relaxed">
            {preset.description}
          </CardDescription>
        </CardContent>
      )}

      <CardFooter>
        <Button
          variant={isActive ? "outline" : "default"}
          size="sm"
          className="w-full"
          onClick={onApply}
          disabled={isActive || isLoading}
        >
          {isActive ? "Applied" : "Apply"}
        </Button>
      </CardFooter>
    </Card>
  );
}
