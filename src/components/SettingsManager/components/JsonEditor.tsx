/**
 * JsonEditor Component
 *
 * Raw JSON editor for direct settings manipulation.
 * Provides syntax validation, formatting, and copy functionality.
 */

import { useState } from "react";
import { Copy, Check, AlertCircle, CheckCircle, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface JsonEditorProps {
  /** Current JSON string */
  value: string;
  /** Callback when JSON changes */
  onChange: (json: string) => void;
  /** Whether editor is read-only */
  readOnly?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** External error message */
  error?: string | null;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate JSON string
 */
function validateJson(json: string): ValidationResult {
  if (!json.trim()) {
    return { valid: false, error: "JSON is empty" };
  }

  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { valid: false, error: "Settings must be a JSON object" };
    }
    return { valid: true };
  } catch (err) {
    if (err instanceof Error) {
      return { valid: false, error: err.message };
    }
    return { valid: false, error: "Invalid JSON" };
  }
}

/**
 * Format JSON string
 */
function formatJson(json: string): string {
  try {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return json;
  }
}

export function JsonEditor({
  value,
  onChange,
  readOnly = false,
  isLoading = false,
  error = null,
}: JsonEditorProps) {
  const [copied, setCopied] = useState(false);

  // Use external error or validate locally
  const validation: ValidationResult = error
    ? { valid: false, error }
    : validateJson(value);

  const handleChange = (newText: string) => {
    onChange(newText);
  };

  const handleFormat = () => {
    const formatted = formatJson(value);
    onChange(formatted);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Calculate line count for line numbers
  const lineCount = value.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">JSON Editor</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Validation status */}
          {validation.valid ? (
            <div className="flex items-center gap-1 text-xs text-green-500">
              <CheckCircle className="h-3 w-3" />
              <span>Valid JSON</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              <span>Invalid</span>
            </div>
          )}

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFormat}
            disabled={readOnly || !validation.valid || isLoading}
          >
            Format
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={isLoading}
          >
            {copied ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          className={cn(
            "rounded-md border bg-muted/30 font-mono text-sm",
            validation.valid
              ? "border-border"
              : "border-red-500 border-2"
          )}
        >
          {/* Line numbers */}
          <div className="flex">
            <div className="flex-shrink-0 border-r border-border bg-muted/50 px-3 py-3 text-right text-xs text-muted-foreground select-none">
              {lineNumbers.map((num) => (
                <div key={num} className="leading-6">
                  {num}
                </div>
              ))}
            </div>

            {/* Text area */}
            <Textarea
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              readOnly={readOnly}
              disabled={isLoading}
              className={cn(
                "flex-1 border-0 bg-transparent font-mono text-sm resize-none focus-visible:ring-0",
                "min-h-[400px] leading-6 p-3"
              )}
              spellCheck={false}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              }}
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {!validation.valid && validation.error && (
        <div className="rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">JSON Error</p>
              <p className="text-xs mt-1 opacity-90">{validation.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          Edit the settings directly as JSON. Changes will be reflected in the
          visual editor.
        </p>
        <p className="text-muted-foreground/70">
          Tip: Use the Format button to clean up indentation and spacing.
        </p>
      </div>
    </div>
  );
}
