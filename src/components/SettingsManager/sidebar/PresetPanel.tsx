/**
 * PresetPanel Component
 *
 * Unified preset panel for both Settings presets and MCP presets.
 * Clean, explicit interaction pattern:
 * - Hover shows "적용" (Apply) button
 * - Click Apply = Opens confirmation dialog with scope selection
 * - Dropdown menu for Edit/Delete
 * - No hover previews (cleaner UX)
 */

import * as React from "react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Settings2,
  Server,
  Play,
  User,
  FolderOpen,
  FileCode,
  Calendar,
  Hash,
  Cpu,
  Shield,
  Key,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileJson,
  AlertTriangle,
  Loader2,
  Check,
  Wand2,
} from "lucide-react";
import { useSettingsManager } from "../UnifiedSettingsManager";
import { useAppStore } from "@/store/useAppStore";
import { detectHomeDir, formatDisplayPath } from "@/utils/pathUtils";
import type {
  ClaudeCodeSettings,
  SettingsScope,
  ClaudeProject,
  PresetData,
  MCPPresetData,
  MCPServerConfig,
} from "@/types";
import { parseMCPServers, formatPresetDate, formatMCPPresetDate } from "@/types";
import { mergeSettings } from "@/utils/settingsMerger";

// ============================================================================
// Types
// ============================================================================

type PresetDialogMode = "view" | "edit" | "create" | "apply" | "delete";

interface SettingsSummary {
  totalKeys: number;
  model?: string;
  mcpCount: number;
  hasPermissions: boolean;
  hasApiKey: boolean;
  hasHooks: boolean;
  hasEnv: boolean;
}

interface MCPSummary {
  serverCount: number;
  serverNames: string[];
  hasStdio: boolean;
  hasHttp: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getSettingsPresetSummary(preset: PresetData): SettingsSummary {
  try {
    const settings = JSON.parse(preset.settings) as ClaudeCodeSettings;
    const keys = Object.keys(settings);
    const mcpServers = settings.mcpServers || {};

    return {
      totalKeys: keys.length,
      model: settings.model,
      mcpCount: Object.keys(mcpServers).length,
      hasPermissions: "permissions" in settings,
      hasApiKey: "apiKeyHelper" in settings || "primaryApiKey" in settings,
      hasHooks:
        "hooks" in settings && Object.keys(settings.hooks || {}).length > 0,
      hasEnv: "env" in settings && Object.keys(settings.env || {}).length > 0,
    };
  } catch {
    return {
      totalKeys: 0,
      mcpCount: 0,
      hasPermissions: false,
      hasApiKey: false,
      hasHooks: false,
      hasEnv: false,
    };
  }
}

function getMCPPresetSummary(preset: MCPPresetData): MCPSummary {
  try {
    const servers = parseMCPServers(preset.servers);
    const serverNames = Object.keys(servers);
    const serverConfigs = Object.values(servers) as MCPServerConfig[];

    return {
      serverCount: serverNames.length,
      serverNames: serverNames.slice(0, 5),
      hasStdio: serverConfigs.some((s) => !s.type || s.type === "stdio"),
      hasHttp: serverConfigs.some((s) => s.type === "http"),
    };
  } catch {
    return {
      serverCount: 0,
      serverNames: [],
      hasStdio: false,
      hasHttp: false,
    };
  }
}

// ============================================================================
// Preset Item Component (Clean, Direct Interaction)
// ============================================================================

interface PresetItemProps {
  name: string;
  type: "settings" | "mcp";
  description?: string;
  badge?: string; // e.g., "opus", "3 servers"
  isReadOnly: boolean;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Clean preset item with explicit apply button:
 * - Hover shows "적용" button
 * - Click Apply = Opens confirmation dialog
 * - Subtle type indication via left border color
 */
const PresetItem: React.FC<PresetItemProps> = React.memo(
  ({ name, type, description, badge, isReadOnly, onApply, onEdit, onDelete }) => {
    const { t } = useTranslation();

    // Type-based styling
    const borderColor = type === "settings"
      ? "border-l-blue-500/70"
      : "border-l-purple-500/70";

    return (
      <div
        className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-md border-l-2 ${borderColor} hover:bg-muted/50 transition-colors duration-100`}
      >
        {/* Icon */}
        {type === "settings" ? (
          <Settings2 className="w-3.5 h-3.5 text-blue-500/70 shrink-0" />
        ) : (
          <Server className="w-3.5 h-3.5 text-purple-500/70 shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">{name}</span>
            {badge && (
              <span className="text-[10px] text-muted-foreground/70 font-mono shrink-0">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[10px] text-muted-foreground/60 truncate">
              {description}
            </p>
          )}
        </div>

        {/* Action buttons - show on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
          {/* Apply button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-green-600 hover:text-green-700 hover:bg-green-500/10"
            onClick={onApply}
          >
            <Play className="w-3 h-3 mr-1" />
            {t("settingsManager.presets.apply")}
          </Button>

          {/* Edit/Delete dropdown */}
          {!isReadOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-3 h-3 mr-2" />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }
);

PresetItem.displayName = "PresetItem";

// ============================================================================
// Main Component
// ============================================================================

export const PresetPanel: React.FC = () => {
  const { t } = useTranslation();
  const {
    allSettings,
    saveSettings,
    isReadOnly,
    settingsPresets,
    mcpPresets,
    mcpServers,
    saveMCPServers,
    activeScope,
    projectPath,
  } = useSettingsManager();

  // Dialog state
  const [dialogMode, setDialogMode] = useState<PresetDialogMode | null>(null);
  const [dialogType, setDialogType] = useState<"settings" | "mcp">("settings");
  const [selectedSettingsPreset, setSelectedSettingsPreset] =
    useState<PresetData | null>(null);
  const [selectedMCPPreset, setSelectedMCPPreset] =
    useState<MCPPresetData | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formContentError, setFormContentError] = useState<string | null>(null);
  const [formNameError, setFormNameError] = useState<string | null>(null);
  const [isJsonExpanded, setIsJsonExpanded] = useState(false);

  // Loading/success state
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Apply preset state
  const [targetScope, setTargetScope] = useState<SettingsScope>(activeScope);
  const [targetProject, setTargetProject] = useState<string | undefined>(
    projectPath
  );

  // Get projects from app store
  const projects = useAppStore((state) => state.projects);

  // Check if target scope needs project selection
  const needsProject = targetScope === "project" || targetScope === "local";

  // Available scopes
  const availableScopes: {
    value: SettingsScope;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "user",
      label: t("settingsManager.scope.user"),
      icon: <User className="w-4 h-4" />,
    },
    {
      value: "project",
      label: t("settingsManager.scope.project"),
      icon: <FolderOpen className="w-4 h-4" />,
    },
    {
      value: "local",
      label: t("settingsManager.scope.local"),
      icon: <FileCode className="w-4 h-4" />,
    },
  ];

  // Group projects by directory
  const groupedProjects = useMemo(() => {
    const groups = new Map<string, ClaudeProject[]>();
    projects.forEach((project) => {
      const parts = project.actual_path.split("/");
      parts.pop();
      const parentPath = parts.join("/") || "/";
      const existing = groups.get(parentPath) ?? [];
      existing.push(project);
      groups.set(parentPath, existing);
    });

    const homeDir = detectHomeDir(projects.map((p) => p.actual_path));

    return Array.from(groups.entries())
      .map(([path, projs]) => ({
        path,
        name: formatDisplayPath(path, homeDir),
        projects: projs.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }, [projects]);

  // Get current MCP servers for the active scope
  const getCurrentMCPServers = () => {
    switch (activeScope) {
      case "user":
        return mcpServers.userClaudeJson;
      case "project":
        return mcpServers.projectMcpFile;
      case "local":
        return mcpServers.localClaudeJson;
      default:
        return {};
    }
  };

  const currentMCPServers = getCurrentMCPServers();
  const hasMCPServers = Object.keys(currentMCPServers).length > 0;

  // Compute effective settings (merged from all scopes) for preset saving
  const effectiveSettings = useMemo(() => {
    if (!allSettings) return {};
    const merged = mergeSettings(allSettings);
    return merged.effective;
  }, [allSettings]);
  const hasEffectiveSettings = Object.keys(effectiveSettings).length > 0;

  // ============================================================================
  // Dialog Handlers
  // ============================================================================

  const openDialog = (
    mode: PresetDialogMode,
    type: "settings" | "mcp",
    preset?: PresetData | MCPPresetData
  ) => {
    setDialogMode(mode);
    setDialogType(type);
    setIsJsonExpanded(false);

    if (type === "settings") {
      setSelectedSettingsPreset((preset as PresetData) ?? null);
      setSelectedMCPPreset(null);
    } else {
      setSelectedMCPPreset((preset as MCPPresetData) ?? null);
      setSelectedSettingsPreset(null);
    }

    if (mode === "create") {
      setFormName("");
      setFormDescription("");
      setFormContent("");
      setFormContentError(null);
      setFormNameError(null);
    } else if (mode === "edit" && preset) {
      setFormName(preset.name);
      setFormDescription(preset.description ?? "");
      // Initialize content for editing
      if (type === "settings") {
        try {
          const parsed = JSON.parse((preset as PresetData).settings);
          setFormContent(JSON.stringify(parsed, null, 2));
        } catch {
          setFormContent((preset as PresetData).settings);
        }
      } else {
        try {
          const parsed = JSON.parse((preset as MCPPresetData).servers);
          setFormContent(JSON.stringify(parsed, null, 2));
        } catch {
          setFormContent((preset as MCPPresetData).servers);
        }
      }
      setFormContentError(null);
      setFormNameError(null);
    } else if (mode === "apply") {
      setTargetScope(activeScope === "managed" ? "user" : activeScope);
      setTargetProject(projectPath);
      setIsApplying(false);
      setApplySuccess(false);
    }
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedSettingsPreset(null);
    setSelectedMCPPreset(null);
    setFormName("");
    setFormDescription("");
    setFormContent("");
    setFormContentError(null);
    setFormNameError(null);
    setIsJsonExpanded(false);
    setIsApplying(false);
    setApplySuccess(false);
  };

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  const validatePresetName = (name: string, excludeId?: string): boolean => {
    const trimmedName = name.trim();
    if (!trimmedName) return true; // Empty will be handled by disabled state

    const presets = dialogType === "settings"
      ? settingsPresets.presets
      : mcpPresets.presets;

    const isDuplicate = presets.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== excludeId
    );

    if (isDuplicate) {
      setFormNameError(t("settingsManager.presets.duplicateName"));
      return false;
    }

    setFormNameError(null);
    return true;
  };

  const validateJson = (json: string): boolean => {
    if (!json.trim()) {
      setFormContentError(null);
      return true;
    }
    try {
      JSON.parse(json);
      setFormContentError(null);
      return true;
    } catch {
      setFormContentError(t("settingsManager.presets.invalidJson"));
      return false;
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(formContent);
      setFormContent(JSON.stringify(parsed, null, 2));
      setFormContentError(null);
    } catch {
      setFormContentError(t("settingsManager.presets.invalidJson"));
    }
  };

  // ============================================================================
  // Settings Preset Actions
  // ============================================================================

  const handleSaveSettingsPreset = async () => {
    if (!formName.trim()) return;
    if (!validatePresetName(formName)) return;

    // Save effective settings (merged from all scopes) instead of just current scope
    await settingsPresets.savePreset({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      settings: JSON.stringify(effectiveSettings, null, 2),
    });

    closeDialog();
  };

  const handleUpdateSettingsPreset = async () => {
    if (!formName.trim() || !selectedSettingsPreset) return;
    if (!validatePresetName(formName, selectedSettingsPreset.id)) return;

    // Validate JSON
    if (!validateJson(formContent)) return;

    await settingsPresets.savePreset({
      id: selectedSettingsPreset.id,
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      settings: formContent,
    });

    closeDialog();
  };

  const handleDeleteSettingsPreset = async () => {
    if (!selectedSettingsPreset) return;
    await settingsPresets.deletePreset(selectedSettingsPreset.id);
    closeDialog();
  };

  const handleApplySettingsPreset = async () => {
    if (!selectedSettingsPreset) return;
    if (needsProject && !targetProject) return;

    setIsApplying(true);
    try {
      const settings = JSON.parse(
        selectedSettingsPreset.settings
      ) as ClaudeCodeSettings;
      await saveSettings(settings, targetScope, targetProject);
      setApplySuccess(true);
      // Auto-close after showing success
      setTimeout(() => {
        closeDialog();
      }, 1000);
    } catch (e) {
      console.error("Failed to apply settings preset:", e);
      setIsApplying(false);
    }
  };

  // ============================================================================
  // MCP Preset Actions
  // ============================================================================

  const handleSaveMCPPreset = async () => {
    if (!formName.trim()) return;
    if (!validatePresetName(formName)) return;

    await mcpPresets.savePreset({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      servers: JSON.stringify(currentMCPServers, null, 2),
    });

    closeDialog();
  };

  const handleUpdateMCPPreset = async () => {
    if (!formName.trim() || !selectedMCPPreset) return;
    if (!validatePresetName(formName, selectedMCPPreset.id)) return;

    // Validate JSON
    if (!validateJson(formContent)) return;

    await mcpPresets.savePreset({
      id: selectedMCPPreset.id,
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      servers: formContent,
    });

    closeDialog();
  };

  const handleDeleteMCPPreset = async () => {
    if (!selectedMCPPreset) return;
    await mcpPresets.deletePreset(selectedMCPPreset.id);
    closeDialog();
  };

  const handleApplyMCPPreset = async () => {
    if (!selectedMCPPreset) return;
    if (needsProject && !targetProject) return;

    setIsApplying(true);
    try {
      const servers = parseMCPServers(selectedMCPPreset.servers);
      const mcpSource =
        targetScope === "user"
          ? "user_claude_json"
          : targetScope === "project"
            ? "project_mcp"
            : targetScope === "local"
              ? "local_claude_json"
              : "user_claude_json";

      await saveMCPServers(mcpSource, servers, targetProject);
      setApplySuccess(true);
      // Auto-close after showing success
      setTimeout(() => {
        closeDialog();
      }, 1000);
    } catch (e) {
      console.error("Failed to apply MCP preset:", e);
      setIsApplying(false);
    }
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Summary of effective settings (for preset creation dialog)
  const settingsSummary = useMemo(() => {
    const keys = Object.keys(effectiveSettings);
    const hasMcp =
      "mcpServers" in effectiveSettings &&
      Object.keys(effectiveSettings.mcpServers || {}).length > 0;

    return {
      totalKeys: keys.length,
      isEmpty: keys.length === 0,
      mcpCount: hasMcp ? Object.keys(effectiveSettings.mcpServers || {}).length : 0,
    };
  }, [effectiveSettings]);

  const selectedPresetSummary = useMemo(() => {
    if (dialogType === "settings" && selectedSettingsPreset) {
      return getSettingsPresetSummary(selectedSettingsPreset);
    }
    if (dialogType === "mcp" && selectedMCPPreset) {
      return getMCPPresetSummary(selectedMCPPreset);
    }
    return null;
  }, [dialogType, selectedSettingsPreset, selectedMCPPreset]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-2">
      {/* Unified Preset List - Settings and MCP combined */}
      <div className="space-y-1">
        {/* Settings Presets */}
        {settingsPresets.presets.map((preset) => {
          const summary = getSettingsPresetSummary(preset);
          const badge = summary.model || (summary.mcpCount > 0 ? `MCP: ${summary.mcpCount}` : undefined);
          return (
            <PresetItem
              key={`settings-${preset.id}`}
              name={preset.name}
              type="settings"
              description={preset.description}
              badge={badge}
              isReadOnly={isReadOnly}
              onApply={() => openDialog("apply", "settings", preset)}
              onEdit={() => openDialog("edit", "settings", preset)}
              onDelete={() => openDialog("delete", "settings", preset)}
            />
          );
        })}

        {/* MCP Presets */}
        {mcpPresets.presets.map((preset) => {
          const summary = getMCPPresetSummary(preset);
          const badge = `${summary.serverCount}`;
          return (
            <PresetItem
              key={`mcp-${preset.id}`}
              name={preset.name}
              type="mcp"
              description={preset.description}
              badge={badge}
              isReadOnly={isReadOnly}
              onApply={() => openDialog("apply", "mcp", preset)}
              onEdit={() => openDialog("edit", "mcp", preset)}
              onDelete={() => openDialog("delete", "mcp", preset)}
            />
          );
        })}

        {/* Empty state */}
        {settingsPresets.presets.length === 0 && mcpPresets.presets.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 text-center">
            {t("settingsManager.presets.empty")}
          </p>
        )}

        {/* Save buttons */}
        {!isReadOnly && (
          <div className="flex flex-col gap-1 pt-2 border-t border-border/30 mt-2">
            {hasEffectiveSettings && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-8 text-xs text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors duration-150"
                onClick={() => openDialog("create", "settings")}
              >
                <Settings2 className="w-3.5 h-3.5 mr-2" />
                {t("settingsManager.presets.saveSettings")}
              </Button>
            )}
            {hasMCPServers && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-8 text-xs text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 transition-colors duration-150"
                onClick={() => openDialog("create", "mcp")}
              >
                <Server className="w-3.5 h-3.5 mr-2" />
                {t("settingsManager.presets.saveMCP")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* View/Edit Dialog */}
      {/* ================================================================== */}
      <Dialog
        open={dialogMode === "view" || dialogMode === "edit"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {dialogType === "settings" ? (
                <Settings2 className="w-5 h-5" />
              ) : (
                <Server className="w-5 h-5" />
              )}
              {dialogMode === "edit"
                ? t("settingsManager.presets.editTitle")
                : selectedSettingsPreset?.name ?? selectedMCPPreset?.name}
            </DialogTitle>
            {dialogMode === "view" &&
              (selectedSettingsPreset?.description ||
                selectedMCPPreset?.description) && (
                <DialogDescription>
                  {selectedSettingsPreset?.description ??
                    selectedMCPPreset?.description}
                </DialogDescription>
              )}
          </DialogHeader>

          {dialogMode === "edit" ? (
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
              <div>
                <Label htmlFor="edit-name">
                  {t("settingsManager.presets.name")}
                </Label>
                <Input
                  id="edit-name"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormNameError(null);
                  }}
                  onBlur={() => validatePresetName(formName, selectedSettingsPreset?.id ?? selectedMCPPreset?.id)}
                  className={`mt-1.5 ${formNameError ? "border-destructive" : ""}`}
                  autoFocus
                />
                {formNameError && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {formNameError}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-desc">
                  {t("settingsManager.presets.description")}
                </Label>
                <Textarea
                  id="edit-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1.5 resize-none"
                  rows={2}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-content" className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    {dialogType === "settings"
                      ? t("settingsManager.presets.settingsContent")
                      : t("settingsManager.mcp.servers")}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={formatJson}
                    type="button"
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    {t("settingsManager.presets.formatJson")}
                  </Button>
                </div>
                <Textarea
                  id="edit-content"
                  value={formContent}
                  onChange={(e) => {
                    setFormContent(e.target.value);
                    setFormContentError(null);
                  }}
                  onBlur={() => validateJson(formContent)}
                  className={`mt-1.5 font-mono text-xs min-h-[200px] ${formContentError ? "border-destructive" : ""}`}
                  placeholder="{ }"
                />
                {formContentError && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {formContentError}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {dialogType === "settings" && selectedSettingsPreset
                    ? formatPresetDate(selectedSettingsPreset.createdAt)
                    : selectedMCPPreset
                      ? formatMCPPresetDate(selectedMCPPreset.createdAt)
                      : ""}
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4" />
                  {dialogType === "settings"
                    ? t("settingsManager.presets.settingsCount", {
                        count: (selectedPresetSummary as SettingsSummary)
                          ?.totalKeys,
                      })
                    : `${(selectedPresetSummary as MCPSummary)?.serverCount} ${t("settingsManager.mcp.unified.servers")}`}
                </div>
              </div>

              {/* Summary badges */}
              {dialogType === "settings" && selectedPresetSummary && (
                <div className="bg-muted border rounded-lg p-3">
                  <div className="text-sm font-medium mb-2">
                    {t("settingsManager.presets.includedSettings")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedPresetSummary as SettingsSummary).model && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        <Cpu className="w-3 h-3 mr-1" />
                        {(selectedPresetSummary as SettingsSummary).model}
                      </Badge>
                    )}
                    {(selectedPresetSummary as SettingsSummary).mcpCount >
                      0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Server className="w-3 h-3 mr-1" />
                        MCP:{" "}
                        {(selectedPresetSummary as SettingsSummary).mcpCount}
                      </Badge>
                    )}
                    {(selectedPresetSummary as SettingsSummary)
                      .hasPermissions && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Permissions
                      </Badge>
                    )}
                    {(selectedPresetSummary as SettingsSummary).hasApiKey && (
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-500/50 text-amber-600"
                      >
                        <Key className="w-3 h-3 mr-1" />
                        API Key
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {dialogType === "mcp" && selectedPresetSummary && (
                <div className="bg-muted border rounded-lg p-3">
                  <div className="text-sm font-medium mb-2">
                    {t("settingsManager.mcp.servers")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedPresetSummary as MCPSummary).serverNames.map(
                      (name) => (
                        <Badge
                          key={name}
                          variant="outline"
                          className="text-xs font-mono"
                        >
                          {name}
                        </Badge>
                      )
                    )}
                    {(selectedPresetSummary as MCPSummary).serverCount > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +
                        {(selectedPresetSummary as MCPSummary).serverCount - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* JSON Preview */}
              <Collapsible
                open={isJsonExpanded}
                onOpenChange={setIsJsonExpanded}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between px-3 h-9"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <FileJson className="w-4 h-4" />
                      {t("settingsManager.presets.viewJson")}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isJsonExpanded ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-[200px] font-mono mt-2">
                    {dialogType === "settings"
                      ? JSON.stringify(
                          JSON.parse(selectedSettingsPreset?.settings ?? "{}"),
                          null,
                          2
                        )
                      : JSON.stringify(
                          parseMCPServers(selectedMCPPreset?.servers ?? "{}"),
                          null,
                          2
                        )}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          <DialogFooter className="shrink-0">
            {dialogMode === "view" ? (
              <>
                <Button variant="outline" onClick={closeDialog}>
                  {t("common.close")}
                </Button>
                <Button
                  onClick={() => {
                    if (dialogType === "settings" && selectedSettingsPreset) {
                      openDialog("apply", "settings", selectedSettingsPreset);
                    } else if (dialogType === "mcp" && selectedMCPPreset) {
                      openDialog("apply", "mcp", selectedMCPPreset);
                    }
                  }}
                >
                  {t("settingsManager.presets.apply")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={closeDialog}>
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={
                    dialogType === "settings"
                      ? handleUpdateSettingsPreset
                      : handleUpdateMCPPreset
                  }
                  disabled={!formName.trim()}
                >
                  {t("common.save")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* Create Dialog */}
      {/* ================================================================== */}
      <Dialog
        open={dialogMode === "create"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {dialogType === "settings" ? (
                <Settings2 className="w-5 h-5" />
              ) : (
                <Server className="w-5 h-5" />
              )}
              {dialogType === "settings"
                ? t("settingsManager.presets.createTitle")
                : t("settingsManager.mcp.saveAsPreset")}
            </DialogTitle>
            <DialogDescription>
              {t("settingsManager.presets.sourceScope")}:{" "}
              <span className="font-medium text-foreground">
                {t(`settingsManager.scope.${activeScope}`)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 min-h-0 pr-1 space-y-4">
            {(dialogType === "settings" && settingsSummary.isEmpty) ||
            (dialogType === "mcp" && !hasMCPServers) ? (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {t("settingsManager.presets.emptyWarningTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("settingsManager.presets.emptyWarningDesc")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Card */}
                <div className="bg-muted border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {dialogType === "settings"
                        ? t("settingsManager.presets.settingsCount", {
                            count: settingsSummary.totalKeys,
                          })
                        : `${Object.keys(currentMCPServers).length} ${t("settingsManager.mcp.unified.servers")}`}
                    </span>
                  </div>
                  {dialogType === "mcp" && (
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(currentMCPServers)
                        .slice(0, 5)
                        .map((name) => (
                          <Badge
                            key={name}
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {name}
                          </Badge>
                        ))}
                      {Object.keys(currentMCPServers).length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{Object.keys(currentMCPServers).length - 5}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create-name">
                      {t("settingsManager.presets.name")}
                    </Label>
                    <Input
                      id="create-name"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        setFormNameError(null);
                      }}
                      onBlur={() => validatePresetName(formName)}
                      placeholder={t("settingsManager.presets.namePlaceholder")}
                      className={`mt-1.5 ${formNameError ? "border-destructive" : ""}`}
                      autoFocus
                    />
                    {formNameError && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {formNameError}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="create-desc">
                      {t("settingsManager.presets.description")}
                    </Label>
                    <Textarea
                      id="create-desc"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder={t(
                        "settingsManager.presets.descriptionPlaceholder"
                      )}
                      className="mt-1.5 resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                {/* JSON Preview */}
                <Collapsible
                  open={isJsonExpanded}
                  onOpenChange={setIsJsonExpanded}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between px-3 h-9"
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <FileJson className="w-4 h-4" />
                        {t("settingsManager.presets.viewJson")}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isJsonExpanded ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-[120px] font-mono mt-2">
                      {dialogType === "settings"
                        ? JSON.stringify(effectiveSettings, null, 2)
                        : JSON.stringify(currentMCPServers, null, 2)}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </div>

          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={closeDialog}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={
                dialogType === "settings"
                  ? handleSaveSettingsPreset
                  : handleSaveMCPPreset
              }
              disabled={
                !formName.trim() ||
                (dialogType === "settings" && settingsSummary.isEmpty) ||
                (dialogType === "mcp" && !hasMCPServers)
              }
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* Apply Dialog */}
      {/* ================================================================== */}
      <Dialog
        open={dialogMode === "apply"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "settings"
                ? t("settingsManager.presets.loadPresetConfirmTitle")
                : t("settingsManager.mcp.loadPresetConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "settings"
                ? t("settingsManager.unified.presets.applyPresetDesc", {
                    name: selectedSettingsPreset?.name,
                  })
                : t("settingsManager.unified.presets.applyMCPPresetDesc", {
                    name: selectedMCPPreset?.name,
                  })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Scope Selection */}
            <div>
              <Label className="text-sm font-medium">
                {t("settingsManager.unified.presets.targetScope")}
              </Label>
              <Select
                value={targetScope}
                onValueChange={(value) => {
                  setTargetScope(value as SettingsScope);
                  if (value === "user") {
                    setTargetProject(undefined);
                  } else {
                    setTargetProject(projectPath);
                  }
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableScopes.map((scope) => (
                    <SelectItem key={scope.value} value={scope.value}>
                      <div className="flex items-center gap-2">
                        {scope.icon}
                        <span>{scope.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Selection */}
            {needsProject && (
              <div>
                <Label className="text-sm font-medium">
                  {t("settingsManager.unified.presets.targetProject")}
                </Label>
                <Select
                  value={targetProject ?? ""}
                  onValueChange={(value) =>
                    setTargetProject(value || undefined)
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue
                      placeholder={t(
                        "settingsManager.unified.presets.selectProject"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {groupedProjects.map((group) => (
                      <SelectGroup key={group.path}>
                        <SelectLabel className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1.5">
                          {group.name}
                        </SelectLabel>
                        {group.projects.map((proj) => (
                          <SelectItem
                            key={proj.actual_path}
                            value={proj.actual_path}
                          >
                            <div className="flex items-center gap-2">
                              <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{proj.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isApplying}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={
                dialogType === "settings"
                  ? handleApplySettingsPreset
                  : handleApplyMCPPreset
              }
              disabled={(needsProject && !targetProject) || isApplying}
              className="min-w-[80px]"
            >
              {applySuccess ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-green-500" />
                  {t("settingsManager.presets.applied")}
                </>
              ) : isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  {t("settingsManager.presets.applying")}
                </>
              ) : (
                t("settingsManager.presets.apply")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* Delete Confirmation Dialog */}
      {/* ================================================================== */}
      <Dialog
        open={dialogMode === "delete"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              {t("settingsManager.presets.deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("settingsManager.presets.deleteConfirmDesc", {
                name: selectedSettingsPreset?.name ?? selectedMCPPreset?.name,
              })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={
                dialogType === "settings"
                  ? handleDeleteSettingsPreset
                  : handleDeleteMCPPreset
              }
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
