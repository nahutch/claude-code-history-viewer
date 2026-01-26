/**
 * Convert slider values to permission rules
 *
 * Slider values: 0 = Block, 1 = Ask, 2 = Allow
 */

import type { PermissionsConfig } from "@/types/claudeSettings";

export type SliderValue = 0 | 1 | 2;

export interface SliderValues {
  fileRead: SliderValue;
  fileEdit: SliderValue;
  fileCreate: SliderValue;
  buildCommands: SliderValue;
  gitCommands: SliderValue;
  dangerous: SliderValue;
  networkDocs: SliderValue;
  networkOther: SliderValue;
}

/**
 * Permission rule mappings for each slider category
 */
const SLIDER_RULES: Record<
  keyof SliderValues,
  Record<SliderValue, Partial<PermissionsConfig>>
> = {
  fileRead: {
    0: { deny: ["Read"] },
    1: { ask: ["Read"] },
    2: { allow: ["Read"] },
  },

  fileEdit: {
    0: { deny: ["Edit"] },
    1: { ask: ["Edit"] },
    2: { allow: ["Edit"] },
  },

  fileCreate: {
    0: { deny: ["Write"] },
    1: { ask: ["Write"] },
    2: { allow: ["Write"] },
  },

  buildCommands: {
    0: {
      deny: [
        "Bash(npm:*)",
        "Bash(pnpm:*)",
        "Bash(yarn:*)",
        "Bash(bun:*)",
        "Bash(pytest:*)",
        "Bash(cargo build:*)",
        "Bash(go build:*)",
      ],
    },
    1: {
      ask: [
        "Bash(npm:*)",
        "Bash(pnpm:*)",
        "Bash(yarn:*)",
        "Bash(bun:*)",
        "Bash(pytest:*)",
        "Bash(cargo build:*)",
        "Bash(go build:*)",
      ],
    },
    2: {
      allow: [
        "Bash(npm:*)",
        "Bash(pnpm:*)",
        "Bash(yarn:*)",
        "Bash(bun:*)",
        "Bash(pytest:*)",
        "Bash(cargo build:*)",
        "Bash(go build:*)",
      ],
    },
  },

  gitCommands: {
    0: { deny: ["Bash(git:*)"] },
    1: {
      allow: [
        "Bash(git status:*)",
        "Bash(git diff:*)",
        "Bash(git add:*)",
        "Bash(git log:*)",
      ],
      ask: ["Bash(git commit:*)", "Bash(git push:*)", "Bash(git reset:*)"],
    },
    2: { allow: ["Bash(git:*)"] },
  },

  dangerous: {
    0: {
      deny: [
        "Bash(rm -rf:*)",
        "Bash(rm -r:*)",
        "Bash(DROP:*)",
        "Bash(truncate:*)",
      ],
    },
    1: { ask: ["Bash(rm -rf:*)", "Bash(rm -r:*)", "Bash(DROP:*)"] },
    2: { allow: ["Bash(rm -rf:*)", "Bash(rm -r:*)"] }, // Still deny DROP
  },

  networkDocs: {
    0: {
      deny: [
        "WebFetch(domain:docs.*)",
        "WebFetch(domain:github.com)",
        "WebFetch(domain:stackoverflow.com)",
      ],
    },
    1: {
      ask: [
        "WebFetch(domain:docs.*)",
        "WebFetch(domain:github.com)",
        "WebFetch(domain:stackoverflow.com)",
      ],
    },
    2: {
      allow: [
        "WebFetch(domain:docs.*)",
        "WebFetch(domain:github.com)",
        "WebFetch(domain:stackoverflow.com)",
      ],
    },
  },

  networkOther: {
    0: { deny: ["WebFetch"] },
    1: { ask: ["WebFetch"] },
    2: { allow: ["WebFetch"] },
  },
};

/**
 * Convert slider values to a merged permissions configuration
 */
export function sliderToRules(values: SliderValues): PermissionsConfig {
  const merged: PermissionsConfig = {
    allow: [],
    deny: [],
    ask: [],
  };

  // Process each slider category
  for (const [category, value] of Object.entries(values) as [
    keyof SliderValues,
    SliderValue
  ][]) {
    const rules = SLIDER_RULES[category][value];

    if (rules.allow) {
      merged.allow = [...(merged.allow || []), ...rules.allow];
    }
    if (rules.deny) {
      merged.deny = [...(merged.deny || []), ...rules.deny];
    }
    if (rules.ask) {
      merged.ask = [...(merged.ask || []), ...rules.ask];
    }
  }

  // Remove duplicates
  merged.allow = [...new Set(merged.allow)];
  merged.deny = [...new Set(merged.deny)];
  merged.ask = [...new Set(merged.ask)];

  // Remove empty arrays
  if (merged.allow?.length === 0) delete merged.allow;
  if (merged.deny?.length === 0) delete merged.deny;
  if (merged.ask?.length === 0) delete merged.ask;

  return merged;
}

/**
 * Get label for slider value
 */
export function getSliderLabel(value: SliderValue): string {
  const labels: Record<SliderValue, string> = {
    0: "Block",
    1: "Ask",
    2: "Allow",
  };
  return labels[value];
}

/**
 * Get color class for slider value
 */
export function getSliderColor(value: SliderValue): string {
  const colors: Record<SliderValue, string> = {
    0: "text-red-500",
    1: "text-yellow-500",
    2: "text-green-500",
  };
  return colors[value];
}
