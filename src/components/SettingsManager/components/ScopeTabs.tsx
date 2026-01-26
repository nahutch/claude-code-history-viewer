/**
 * ScopeTabs Component
 *
 * Tab selector for different settings scopes:
 * - User: Global settings for all projects
 * - Project: Shared settings (Git-tracked)
 * - Local: Local overrides (not tracked)
 */

import React from "react";
import { User, FolderOpen, Lock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SettingsScope } from "@/types/claudeSettings";
import { cn } from "@/lib/utils";

export interface ScopeTabsProps {
  /** Current active scope */
  activeScope: SettingsScope;
  /** Callback when scope changes */
  onScopeChange: (scope: SettingsScope) => void;
  /** Whether project/local scopes are available */
  hasProject?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

interface ScopeConfig {
  value: SettingsScope;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const SCOPE_CONFIGS: ScopeConfig[] = [
  {
    value: "user",
    label: "User",
    icon: User,
    description: "Global settings for all projects",
    color: "text-blue-500",
  },
  {
    value: "project",
    label: "Project",
    icon: FolderOpen,
    description: "Shared with team (Git-tracked)",
    color: "text-green-500",
  },
  {
    value: "local",
    label: "Local",
    icon: Lock,
    description: "Personal overrides (not tracked)",
    color: "text-orange-500",
  },
];

export function ScopeTabs({
  activeScope,
  onScopeChange,
  hasProject = false,
  disabled = false,
}: ScopeTabsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Settings Scope
        </h3>
        {!hasProject && (
          <p className="text-xs text-muted-foreground">
            Open a project to access project/local scopes
          </p>
        )}
      </div>

      <Tabs
        value={activeScope}
        onValueChange={(value) => onScopeChange(value as SettingsScope)}
      >
        <TabsList className="grid w-full grid-cols-3">
          {SCOPE_CONFIGS.map((scope) => {
            const Icon = scope.icon;
            const isDisabled =
              disabled ||
              (!hasProject && scope.value !== "user") ||
              scope.value === "managed";

            return (
              <TabsTrigger
                key={scope.value}
                value={scope.value}
                disabled={isDisabled}
                className="relative"
              >
                <Icon
                  className={cn(
                    "mr-2 h-4 w-4",
                    activeScope === scope.value && scope.color
                  )}
                />
                {scope.label}
                {scope.value === "managed" && (
                  <span className="ml-2 text-xs opacity-50">RO</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Active scope description */}
      <div className="rounded-md bg-muted/50 px-3 py-2">
        <p className="text-sm text-muted-foreground">
          {SCOPE_CONFIGS.find((s) => s.value === activeScope)?.description}
        </p>
      </div>

      {/* Scope priority info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Merge Priority (highest to lowest):</p>
        <ol className="list-decimal list-inside space-y-0.5 pl-2">
          <li>Managed (read-only, IT-controlled)</li>
          <li>Local (personal overrides)</li>
          <li>Project (team shared)</li>
          <li>User (global defaults)</li>
        </ol>
      </div>
    </div>
  );
}
