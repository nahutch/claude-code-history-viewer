/**
 * SandboxSection Component
 *
 * Accordion section for sandbox/security settings:
 * - Enable/disable bash sandboxing
 * - Auto-approve sandboxed commands
 * - Excluded commands list
 * - Network configuration
 */

import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Plus,
  X,
  Terminal,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClaudeCodeSettings, SandboxConfig, SandboxNetworkConfig } from "@/types";

// ============================================================================
// Types
// ============================================================================

interface SandboxSectionProps {
  settings: ClaudeCodeSettings;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (updates: Partial<ClaudeCodeSettings>) => void;
  readOnly: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const SandboxSection: React.FC<SandboxSectionProps> = React.memo(({
  settings,
  isExpanded,
  onToggle,
  onChange,
  readOnly,
}) => {
  const { t } = useTranslation();
  const [newExcludedCommand, setNewExcludedCommand] = useState("");
  const [newUnixSocket, setNewUnixSocket] = useState("");

  const sandbox = settings.sandbox || {};

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const updateSandbox = (updates: Partial<SandboxConfig>) => {
    onChange({
      sandbox: {
        ...sandbox,
        ...updates,
      },
    });
  };

  const updateNetwork = (updates: Partial<SandboxNetworkConfig>) => {
    updateSandbox({
      network: {
        ...sandbox.network,
        ...updates,
      },
    });
  };

  const handleBooleanChange = (key: keyof SandboxConfig) => (checked: boolean) => {
    updateSandbox({ [key]: checked });
  };

  const handleNetworkBooleanChange = (key: keyof SandboxNetworkConfig) => (checked: boolean) => {
    updateNetwork({ [key]: checked });
  };

  const handleAddExcludedCommand = () => {
    if (!newExcludedCommand.trim()) return;
    const current = sandbox.excludedCommands || [];
    if (!current.includes(newExcludedCommand.trim())) {
      updateSandbox({
        excludedCommands: [...current, newExcludedCommand.trim()],
      });
    }
    setNewExcludedCommand("");
  };

  const handleRemoveExcludedCommand = (cmd: string) => {
    const current = sandbox.excludedCommands || [];
    updateSandbox({
      excludedCommands: current.filter((c) => c !== cmd),
    });
  };

  const handleAddUnixSocket = () => {
    if (!newUnixSocket.trim()) return;
    const current = sandbox.network?.allowUnixSockets || [];
    if (!current.includes(newUnixSocket.trim())) {
      updateNetwork({
        allowUnixSockets: [...current, newUnixSocket.trim()],
      });
    }
    setNewUnixSocket("");
  };

  const handleRemoveUnixSocket = (socket: string) => {
    const current = sandbox.network?.allowUnixSockets || [];
    updateNetwork({
      allowUnixSockets: current.filter((s) => s !== socket),
    });
  };

  const handlePortChange = (key: "httpProxyPort" | "socksProxyPort") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value, 10);
    updateNetwork({ [key]: isNaN(value) ? undefined : value });
  };

  // -------------------------------------------------------------------------
  // Computed
  // -------------------------------------------------------------------------

  const summaryParts: string[] = [];
  if (sandbox.enabled) summaryParts.push(t("settingsManager.sandbox.enabled"));
  if (sandbox.autoAllowBashIfSandboxed) summaryParts.push("auto-allow");
  if ((sandbox.excludedCommands?.length || 0) > 0) {
    summaryParts.push(`${sandbox.excludedCommands?.length} excluded`);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger
        className={cn(
          "flex items-center justify-between w-full py-3 px-4 rounded-lg",
          "border border-border/40 transition-colors duration-150",
          "text-muted-foreground hover:text-accent hover:bg-accent/10 hover:border-border/60",
          isExpanded && "bg-accent/10 border-border/60 text-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "color-mix(in oklch, var(--warning) 15%, transparent)",
            }}
          >
            <Shield className="w-4 h-4 text-yellow-600" />
          </div>
          <span className="font-medium text-sm">
            {t("settingsManager.sandbox.title")}
          </span>
        </div>
        {summaryParts.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {summaryParts.join(" · ")}
          </span>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pl-10 pr-4 pb-4 pt-2 space-y-5">
          {/* Platform Note */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/30">
            <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {t("settingsManager.sandbox.platformNote")}
            </p>
          </div>

          {/* ============================================================= */}
          {/* Core Sandbox Settings */}
          {/* ============================================================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Terminal className="w-3.5 h-3.5" />
              {t("settingsManager.sandbox.coreSettings")}
            </div>

            {/* Enable Sandbox */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="sandbox-enabled">
                  {t("settingsManager.sandbox.enableSandbox")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settingsManager.sandbox.enableSandboxDesc")}
                </p>
              </div>
              <Switch
                id="sandbox-enabled"
                checked={sandbox.enabled ?? false}
                onCheckedChange={handleBooleanChange("enabled")}
                disabled={readOnly}
              />
            </div>

            {/* Auto-Allow Bash */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="auto-allow-bash">
                  {t("settingsManager.sandbox.autoAllowBash")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settingsManager.sandbox.autoAllowBashDesc")}
                </p>
              </div>
              <Switch
                id="auto-allow-bash"
                checked={sandbox.autoAllowBashIfSandboxed ?? true}
                onCheckedChange={handleBooleanChange("autoAllowBashIfSandboxed")}
                disabled={readOnly || !sandbox.enabled}
              />
            </div>

            {/* Allow Unsandboxed Commands */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="allow-unsandboxed">
                  {t("settingsManager.sandbox.allowUnsandboxed")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settingsManager.sandbox.allowUnsandboxedDesc")}
                </p>
              </div>
              <Switch
                id="allow-unsandboxed"
                checked={sandbox.allowUnsandboxedCommands ?? true}
                onCheckedChange={handleBooleanChange("allowUnsandboxedCommands")}
                disabled={readOnly || !sandbox.enabled}
              />
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* ============================================================= */}
          {/* Excluded Commands */}
          {/* ============================================================= */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{t("settingsManager.sandbox.excludedCommands")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("settingsManager.sandbox.excludedCommandsDesc")}
              </p>
            </div>

            {/* Excluded Commands List */}
            <div className="flex flex-wrap gap-1.5">
              {(sandbox.excludedCommands || []).map((cmd) => (
                <Badge
                  key={cmd}
                  variant="secondary"
                  className="h-6 px-2 font-mono text-xs gap-1"
                >
                  {cmd}
                  {!readOnly && (
                    <button
                      onClick={() => handleRemoveExcludedCommand(cmd)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {(sandbox.excludedCommands?.length || 0) === 0 && (
                <span className="text-xs text-muted-foreground italic">
                  {t("settingsManager.sandbox.noExcludedCommands")}
                </span>
              )}
            </div>

            {/* Add Excluded Command */}
            {!readOnly && sandbox.enabled && (
              <div className="flex gap-2">
                <Input
                  value={newExcludedCommand}
                  onChange={(e) => setNewExcludedCommand(e.target.value)}
                  placeholder={t("settingsManager.sandbox.excludedCommandPlaceholder")}
                  className="flex-1 h-8 text-sm font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleAddExcludedCommand()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddExcludedCommand}
                  disabled={!newExcludedCommand.trim()}
                  className="h-8"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          <Separator className="opacity-50" />

          {/* ============================================================= */}
          {/* Network Settings */}
          {/* ============================================================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Globe className="w-3.5 h-3.5" />
              {t("settingsManager.sandbox.networkSettings")}
            </div>

            {/* Allow Local Binding */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="allow-local-binding">
                  {t("settingsManager.sandbox.allowLocalBinding")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settingsManager.sandbox.allowLocalBindingDesc")}
                </p>
              </div>
              <Switch
                id="allow-local-binding"
                checked={sandbox.network?.allowLocalBinding ?? false}
                onCheckedChange={handleNetworkBooleanChange("allowLocalBinding")}
                disabled={readOnly || !sandbox.enabled}
              />
            </div>

            {/* Proxy Ports */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="http-proxy-port">
                  {t("settingsManager.sandbox.httpProxyPort")}
                </Label>
                <Input
                  id="http-proxy-port"
                  type="number"
                  min={1}
                  max={65535}
                  value={sandbox.network?.httpProxyPort ?? ""}
                  onChange={handlePortChange("httpProxyPort")}
                  placeholder="8080"
                  className="h-8 text-sm"
                  disabled={readOnly || !sandbox.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="socks-proxy-port">
                  {t("settingsManager.sandbox.socksProxyPort")}
                </Label>
                <Input
                  id="socks-proxy-port"
                  type="number"
                  min={1}
                  max={65535}
                  value={sandbox.network?.socksProxyPort ?? ""}
                  onChange={handlePortChange("socksProxyPort")}
                  placeholder="1080"
                  className="h-8 text-sm"
                  disabled={readOnly || !sandbox.enabled}
                />
              </div>
            </div>

            {/* Unix Sockets */}
            <div className="space-y-2">
              <Label>{t("settingsManager.sandbox.allowedUnixSockets")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("settingsManager.sandbox.allowedUnixSocketsDesc")}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(sandbox.network?.allowUnixSockets || []).map((socket) => (
                  <Badge
                    key={socket}
                    variant="outline"
                    className="h-6 px-2 font-mono text-xs gap-1"
                  >
                    {socket}
                    {!readOnly && sandbox.enabled && (
                      <button
                        onClick={() => handleRemoveUnixSocket(socket)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {!readOnly && sandbox.enabled && (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newUnixSocket}
                    onChange={(e) => setNewUnixSocket(e.target.value)}
                    placeholder="/var/run/docker.sock"
                    className="flex-1 h-8 text-sm font-mono"
                    onKeyDown={(e) => e.key === "Enter" && handleAddUnixSocket()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddUnixSocket}
                    disabled={!newUnixSocket.trim()}
                    className="h-8"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

SandboxSection.displayName = "SandboxSection";
