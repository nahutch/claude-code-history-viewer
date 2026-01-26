/**
 * ProtectedFilesList Component
 *
 * Manage list of protected files/patterns that should never be read.
 * Typical patterns: .env, .env.*, secrets/, credentials.json, etc.
 */

import React, { useState } from "react";
import { Plus, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ProtectedFilesListProps {
  /** List of protected file patterns */
  files: string[];
  /** Callback when files list changes */
  onChange: (files: string[]) => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Default protected file patterns
 */
const DEFAULT_PATTERNS = [
  "Read(.env)",
  "Read(.env.*)",
  "Read(secrets/**)",
  "Read(**/.env)",
  "Read(**/secrets/**)",
];

/**
 * Validate a file pattern
 */
function validatePattern(pattern: string): boolean {
  if (!pattern.trim()) return false;

  // Must start with a tool name or be a path
  if (!pattern.includes("(") && !pattern.includes("/") && !pattern.includes(".")) {
    return false;
  }

  return true;
}

/**
 * Format pattern for display (remove "Read(" prefix if present)
 */
function formatPattern(pattern: string): string {
  if (pattern.startsWith("Read(") && pattern.endsWith(")")) {
    return pattern.slice(5, -1);
  }
  return pattern;
}

export function ProtectedFilesList({
  files,
  onChange,
  disabled = false,
}: ProtectedFilesListProps) {
  const [newPattern, setNewPattern] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const trimmed = newPattern.trim();

    if (!trimmed) {
      setError("Pattern cannot be empty");
      return;
    }

    if (!validatePattern(trimmed)) {
      setError("Invalid pattern format");
      return;
    }

    // Ensure pattern has Read() wrapper
    const formatted = trimmed.startsWith("Read(")
      ? trimmed
      : `Read(${trimmed})`;

    // Check for duplicates
    if (files.includes(formatted)) {
      setError("Pattern already exists");
      return;
    }

    onChange([...files, formatted]);
    setNewPattern("");
    setError("");
  };

  const handleRemove = (pattern: string) => {
    onChange(files.filter((f) => f !== pattern));
  };

  const handleAddDefault = (pattern: string) => {
    if (!files.includes(pattern)) {
      onChange([...files, pattern]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-orange-500" />
        <h4 className="font-semibold">Protected Files</h4>
      </div>

      <div className="pl-7 space-y-4">
        {/* Current protected files */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file}
                className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-orange-500" />
                  <span className="font-mono">{formatPattern(file)}</span>
                  <Badge variant="outline" className="text-xs">
                    Never read
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(file)}
                  disabled={disabled}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new pattern */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., .env, secrets/**, *.key"
              value={newPattern}
              onChange={(e) => {
                setNewPattern(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className={cn(error && "border-red-500")}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              disabled={disabled || !newPattern.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Quick add defaults */}
        {DEFAULT_PATTERNS.some((p) => !files.includes(p)) && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick add:</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_PATTERNS.filter((p) => !files.includes(p)).map(
                (pattern) => (
                  <Button
                    key={pattern}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddDefault(pattern)}
                    disabled={disabled}
                    className="h-7 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {formatPattern(pattern)}
                  </Button>
                )
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          These patterns will be added to the deny list. Use wildcards (*) for
          flexibility.
        </p>
      </div>
    </div>
  );
}
