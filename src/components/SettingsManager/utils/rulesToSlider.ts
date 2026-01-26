/**
 * Convert permission rules to slider values
 *
 * Reverse conversion: analyzes allow/deny/ask arrays to determine slider position
 */

import type { PermissionsConfig } from "@/types/claudeSettings";
import type { SliderValue, SliderValues } from "./sliderToRules";

/**
 * Check if pattern matches any item in an array
 */
function matchesAny(patterns: string[], target: string | string[]): boolean {
  const targets = Array.isArray(target) ? target : [target];

  for (const pattern of patterns) {
    for (const t of targets) {
      // Exact match
      if (pattern === t) return true;

      // Wildcard match (simple implementation)
      if (pattern.includes("*")) {
        const regex = new RegExp(
          "^" + pattern.replace(/\*/g, ".*").replace(/\(/g, "\\(").replace(/\)/g, "\\)") + "$"
        );
        if (regex.test(t)) return true;
      }

      // Prefix match (e.g., "Read" matches "Read(*)")
      if (t.startsWith(pattern + "(") || pattern.startsWith(t + "(")) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Determine slider value based on permissions config
 */
function determineSliderValue(
  config: PermissionsConfig | undefined,
  allowPatterns: string[],
  denyPatterns: string[],
  askPatterns: string[]
): SliderValue {
  if (!config) return 1; // Default to Ask if no config

  const { allow = [], deny = [], ask = [] } = config;

  // Check deny first (highest priority)
  if (matchesAny(deny, denyPatterns)) {
    return 0; // Block
  }

  // Check allow
  if (matchesAny(allow, allowPatterns)) {
    return 2; // Allow
  }

  // Check ask
  if (matchesAny(ask, askPatterns)) {
    return 1; // Ask
  }

  // Default to Ask for safety
  return 1;
}

/**
 * Convert permissions config to slider values
 */
export function rulesToSlider(config: PermissionsConfig | undefined): SliderValues {
  return {
    fileRead: determineSliderValue(
      config,
      ["Read", "Read(*)"],
      ["Read", "Read(*)"],
      ["Read", "Read(*)"]
    ),

    fileEdit: determineSliderValue(
      config,
      ["Edit", "Edit(*)"],
      ["Edit", "Edit(*)"],
      ["Edit", "Edit(*)"]
    ),

    fileCreate: determineSliderValue(
      config,
      ["Write", "Write(*)"],
      ["Write", "Write(*)"],
      ["Write", "Write(*)"]
    ),

    buildCommands: determineSliderValue(
      config,
      [
        "Bash(npm:*)",
        "Bash(pnpm:*)",
        "Bash(yarn:*)",
        "Bash(bun:*)",
        "Bash(pytest:*)",
        "Bash(cargo build:*)",
        "Bash(go build:*)",
      ],
      [
        "Bash(npm:*)",
        "Bash(pnpm:*)",
        "Bash(yarn:*)",
        "Bash(bun:*)",
        "Bash(pytest:*)",
        "Bash(cargo build:*)",
        "Bash(go build:*)",
      ],
      [
        "Bash(npm:*)",
        "Bash(pnpm:*)",
        "Bash(yarn:*)",
        "Bash(bun:*)",
        "Bash(pytest:*)",
        "Bash(cargo build:*)",
        "Bash(go build:*)",
      ]
    ),

    gitCommands: determineSliderValue(
      config,
      ["Bash(git:*)"],
      ["Bash(git:*)"],
      ["Bash(git commit:*)", "Bash(git push:*)", "Bash(git reset:*)"]
    ),

    dangerous: determineSliderValue(
      config,
      ["Bash(rm -rf:*)", "Bash(rm -r:*)"],
      ["Bash(rm -rf:*)", "Bash(rm -r:*)", "Bash(DROP:*)"],
      ["Bash(rm -rf:*)", "Bash(rm -r:*)"]
    ),

    networkDocs: determineSliderValue(
      config,
      [
        "WebFetch(domain:docs.*)",
        "WebFetch(domain:github.com)",
        "WebFetch(domain:stackoverflow.com)",
      ],
      [
        "WebFetch(domain:docs.*)",
        "WebFetch(domain:github.com)",
        "WebFetch(domain:stackoverflow.com)",
      ],
      [
        "WebFetch(domain:docs.*)",
        "WebFetch(domain:github.com)",
        "WebFetch(domain:stackoverflow.com)",
      ]
    ),

    networkOther: determineSliderValue(
      config,
      ["WebFetch", "WebFetch(*)"],
      ["WebFetch", "WebFetch(*)"],
      ["WebFetch", "WebFetch(*)"]
    ),
  };
}

/**
 * Check if slider values match the current permissions config
 * Used to detect if preset has been modified
 */
export function areSliderValuesEqual(
  sliderValues: SliderValues,
  config: PermissionsConfig | undefined
): boolean {
  const configSliderValues = rulesToSlider(config);

  return (
    sliderValues.fileRead === configSliderValues.fileRead &&
    sliderValues.fileEdit === configSliderValues.fileEdit &&
    sliderValues.fileCreate === configSliderValues.fileCreate &&
    sliderValues.buildCommands === configSliderValues.buildCommands &&
    sliderValues.gitCommands === configSliderValues.gitCommands &&
    sliderValues.dangerous === configSliderValues.dangerous &&
    sliderValues.networkDocs === configSliderValues.networkDocs &&
    sliderValues.networkOther === configSliderValues.networkOther
  );
}
