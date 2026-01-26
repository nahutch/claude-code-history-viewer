//! Claude Code settings models
//!
//! This module contains data structures for Claude Code's settings system,
//! including scopes (managed, user, project, local), permissions, and presets.
//!
//! File paths:
//! - User: ~/.claude/settings.json
//! - Project: {project_path}/.claude/settings.json
//! - Local: {project_path}/.claude/settings.local.json
//! - Custom presets: ~/.claude-history-viewer/presets/*.json

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

/// Claude Code settings scope
/// Defines where settings are stored and their priority in the merge order
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SettingsScope {
    /// System-level managed settings (read-only, highest priority)
    Managed,
    /// User-level settings (~/.claude/settings.json)
    User,
    /// Project-level shared settings ({project}/.claude/settings.json)
    Project,
    /// Project-level local settings ({project}/.claude/settings.local.json)
    Local,
}

impl SettingsScope {
    /// Get the priority of this scope (higher = more important)
    /// Used for merging settings from multiple scopes
    pub fn priority(&self) -> u8 {
        match self {
            SettingsScope::Managed => 100,
            SettingsScope::Local => 30,
            SettingsScope::Project => 20,
            SettingsScope::User => 10,
        }
    }
}

/// Permission configuration for Claude Code
/// Defines what actions are allowed, denied, or require asking
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PermissionsConfig {
    /// Actions that are always allowed (e.g., "Read(*)", "Bash(npm:*)")
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub allow: Vec<String>,

    /// Actions that are always denied (e.g., "Bash(rm -rf:*)")
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub deny: Vec<String>,

    /// Actions that require user confirmation
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub ask: Vec<String>,
}

impl PermissionsConfig {
    /// Check if the config has any rules defined
    pub fn is_empty(&self) -> bool {
        self.allow.is_empty() && self.deny.is_empty() && self.ask.is_empty()
    }
}

// Note: hooks and mcpServers use flexible Value types to handle
// Claude Code's complex nested structures without breaking on schema changes

/// Claude Code settings structure
/// Represents the full settings.json schema
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeCodeSettings {
    /// Model to use (e.g., "opus", "sonnet")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,

    /// API key responsible use acknowledgment
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_api_key_responsible_use: Option<bool>,

    /// Permission configuration
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permissions: Option<PermissionsConfig>,

    /// Hook configurations (flexible structure to handle Claude's complex hook schema)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hooks: Option<Value>,

    /// MCP server configurations (flexible structure)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mcp_servers: Option<Value>,

    /// Environment variables
    #[serde(skip_serializing_if = "Option::is_none")]
    pub env: Option<HashMap<String, String>>,

    /// Additional fields not explicitly defined (for forward compatibility)
    #[serde(flatten)]
    pub extra: HashMap<String, Value>,
}

impl ClaudeCodeSettings {
    /// Create a new empty settings instance
    pub fn new() -> Self {
        Self::default()
    }

    /// Check if settings have any values
    pub fn is_empty(&self) -> bool {
        self.model.is_none()
            && self.custom_api_key_responsible_use.is_none()
            && self.permissions.is_none()
            && self.hooks.is_none()
            && self.mcp_servers.is_none()
            && self.env.is_none()
            && self.extra.is_empty()
    }

    /// Merge another settings into this one
    /// The other settings take priority (override this)
    pub fn merge(&mut self, other: &ClaudeCodeSettings) {
        if other.model.is_some() {
            self.model.clone_from(&other.model);
        }
        if other.custom_api_key_responsible_use.is_some() {
            self.custom_api_key_responsible_use = other.custom_api_key_responsible_use;
        }
        if let Some(ref other_perms) = other.permissions {
            if let Some(ref mut self_perms) = self.permissions {
                // Merge permission arrays (other takes priority, but we concatenate)
                // Note: Claude Code actually replaces arrays, so we follow that behavior
                if !other_perms.allow.is_empty() {
                    self_perms.allow.clone_from(&other_perms.allow);
                }
                if !other_perms.deny.is_empty() {
                    self_perms.deny.clone_from(&other_perms.deny);
                }
                if !other_perms.ask.is_empty() {
                    self_perms.ask.clone_from(&other_perms.ask);
                }
            } else {
                self.permissions = Some(other_perms.clone());
            }
        }
        if other.hooks.is_some() {
            self.hooks.clone_from(&other.hooks);
        }
        if other.mcp_servers.is_some() {
            self.mcp_servers.clone_from(&other.mcp_servers);
        }
        if other.env.is_some() {
            self.env.clone_from(&other.env);
        }
        // Merge extra fields
        for (key, value) in &other.extra {
            self.extra.insert(key.clone(), value.clone());
        }
    }
}

/// Preset type enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PresetType {
    /// Built-in preset (cannot be modified or deleted)
    Builtin,
    /// Custom user-created preset
    Custom,
}

/// Full preset structure with settings
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Preset {
    /// Unique identifier (e.g., "builtin:balanced", "custom:uuid")
    pub id: String,

    /// Display name
    pub name: String,

    /// Icon (emoji)
    pub icon: String,

    /// Description of what this preset does
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Preset type (builtin or custom)
    #[serde(rename = "type")]
    pub preset_type: PresetType,

    /// ID of the preset this was based on (for copies)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub based_on: Option<String>,

    /// Creation timestamp (ISO 8601)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,

    /// Last update timestamp (ISO 8601)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,

    /// The actual settings this preset applies
    pub settings: ClaudeCodeSettings,
}

impl Preset {
    /// Create a new custom preset
    pub fn new_custom(name: String, icon: String, settings: ClaudeCodeSettings) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: format!("custom:{}", uuid::Uuid::new_v4()),
            name,
            icon,
            description: None,
            preset_type: PresetType::Custom,
            based_on: None,
            created_at: Some(now.clone()),
            updated_at: Some(now),
            settings,
        }
    }

    /// Check if this is a built-in preset
    pub fn is_builtin(&self) -> bool {
        self.preset_type == PresetType::Builtin
    }
}

/// Lightweight preset info for listing (without full settings)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PresetInfo {
    /// Unique identifier
    pub id: String,

    /// Display name
    pub name: String,

    /// Icon (emoji)
    pub icon: String,

    /// Preset type
    #[serde(rename = "type")]
    pub preset_type: PresetType,

    /// Description (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

impl From<&Preset> for PresetInfo {
    fn from(preset: &Preset) -> Self {
        Self {
            id: preset.id.clone(),
            name: preset.name.clone(),
            icon: preset.icon.clone(),
            preset_type: preset.preset_type.clone(),
            description: preset.description.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ===== SettingsScope Tests =====

    #[test]
    fn test_settings_scope_serialization() {
        assert_eq!(
            serde_json::to_string(&SettingsScope::User).unwrap(),
            "\"user\""
        );
        assert_eq!(
            serde_json::to_string(&SettingsScope::Project).unwrap(),
            "\"project\""
        );
        assert_eq!(
            serde_json::to_string(&SettingsScope::Local).unwrap(),
            "\"local\""
        );
        assert_eq!(
            serde_json::to_string(&SettingsScope::Managed).unwrap(),
            "\"managed\""
        );
    }

    #[test]
    fn test_settings_scope_deserialization() {
        let scope: SettingsScope = serde_json::from_str("\"user\"").unwrap();
        assert_eq!(scope, SettingsScope::User);

        let scope: SettingsScope = serde_json::from_str("\"project\"").unwrap();
        assert_eq!(scope, SettingsScope::Project);
    }

    #[test]
    fn test_settings_scope_priority() {
        assert!(SettingsScope::Managed.priority() > SettingsScope::Local.priority());
        assert!(SettingsScope::Local.priority() > SettingsScope::Project.priority());
        assert!(SettingsScope::Project.priority() > SettingsScope::User.priority());
    }

    // ===== PermissionsConfig Tests =====

    #[test]
    fn test_permissions_config_default_is_empty() {
        let perms = PermissionsConfig::default();
        assert!(perms.is_empty());
        assert!(perms.allow.is_empty());
        assert!(perms.deny.is_empty());
        assert!(perms.ask.is_empty());
    }

    #[test]
    fn test_permissions_config_with_values() {
        let perms = PermissionsConfig {
            allow: vec!["Read(*)".to_string()],
            deny: vec!["Bash(rm -rf:*)".to_string()],
            ask: vec!["Write(*)".to_string()],
        };
        assert!(!perms.is_empty());
    }

    #[test]
    fn test_permissions_config_serialization() {
        let perms = PermissionsConfig {
            allow: vec!["Bash(npm:*)".to_string(), "Read(*)".to_string()],
            deny: vec!["Bash(rm -rf:*)".to_string()],
            ask: vec![],
        };

        let json = serde_json::to_string(&perms).unwrap();
        assert!(json.contains("\"allow\""));
        assert!(json.contains("\"deny\""));
        // ask is empty so should be skipped
        assert!(!json.contains("\"ask\""));
    }

    #[test]
    fn test_permissions_config_deserialization() {
        let json = r#"{
            "allow": ["Bash(npm:*)", "Read(*)"],
            "deny": ["Bash(rm -rf:*)"]
        }"#;

        let perms: PermissionsConfig = serde_json::from_str(json).unwrap();
        assert_eq!(perms.allow.len(), 2);
        assert_eq!(perms.deny.len(), 1);
        assert!(perms.ask.is_empty());
    }

    // ===== ClaudeCodeSettings Tests =====

    #[test]
    fn test_claude_code_settings_default_is_empty() {
        let settings = ClaudeCodeSettings::default();
        assert!(settings.is_empty());
    }

    #[test]
    fn test_claude_code_settings_with_model() {
        let settings = ClaudeCodeSettings {
            model: Some("opus".to_string()),
            ..Default::default()
        };
        assert!(!settings.is_empty());
    }

    #[test]
    fn test_claude_code_settings_serialization_round_trip() {
        let settings = ClaudeCodeSettings {
            model: Some("opus".to_string()),
            permissions: Some(PermissionsConfig {
                allow: vec!["Read(*)".to_string()],
                deny: vec!["Bash(rm -rf:*)".to_string()],
                ask: vec![],
            }),
            ..Default::default()
        };

        let json = serde_json::to_string_pretty(&settings).unwrap();
        let deserialized: ClaudeCodeSettings = serde_json::from_str(&json).unwrap();

        assert_eq!(settings, deserialized);
    }

    #[test]
    fn test_claude_code_settings_merge_model() {
        let mut base = ClaudeCodeSettings {
            model: Some("sonnet".to_string()),
            ..Default::default()
        };
        let override_settings = ClaudeCodeSettings {
            model: Some("opus".to_string()),
            ..Default::default()
        };

        base.merge(&override_settings);
        assert_eq!(base.model, Some("opus".to_string()));
    }

    #[test]
    fn test_claude_code_settings_merge_permissions() {
        let mut base = ClaudeCodeSettings {
            permissions: Some(PermissionsConfig {
                allow: vec!["Read(*)".to_string()],
                deny: vec![],
                ask: vec![],
            }),
            ..Default::default()
        };
        let override_settings = ClaudeCodeSettings {
            permissions: Some(PermissionsConfig {
                allow: vec!["Write(*)".to_string()],
                deny: vec!["Bash(rm -rf:*)".to_string()],
                ask: vec![],
            }),
            ..Default::default()
        };

        base.merge(&override_settings);

        let perms = base.permissions.unwrap();
        // Arrays are replaced, not merged
        assert_eq!(perms.allow, vec!["Write(*)".to_string()]);
        assert_eq!(perms.deny, vec!["Bash(rm -rf:*)".to_string()]);
    }

    #[test]
    fn test_claude_code_settings_merge_preserves_base_when_override_empty() {
        let mut base = ClaudeCodeSettings {
            model: Some("sonnet".to_string()),
            ..Default::default()
        };
        let override_settings = ClaudeCodeSettings::default();

        base.merge(&override_settings);
        assert_eq!(base.model, Some("sonnet".to_string()));
    }

    #[test]
    fn test_claude_code_settings_extra_fields() {
        let json = r#"{
            "model": "opus",
            "someNewField": "value",
            "anotherField": 123
        }"#;

        let settings: ClaudeCodeSettings = serde_json::from_str(json).unwrap();
        assert_eq!(settings.model, Some("opus".to_string()));
        assert!(settings.extra.contains_key("someNewField"));
        assert!(settings.extra.contains_key("anotherField"));
    }

    // ===== Preset Tests =====

    #[test]
    fn test_preset_new_custom() {
        let settings = ClaudeCodeSettings {
            model: Some("opus".to_string()),
            ..Default::default()
        };
        let preset = Preset::new_custom("My Preset".to_string(), "💼".to_string(), settings);

        assert!(preset.id.starts_with("custom:"));
        assert_eq!(preset.name, "My Preset");
        assert_eq!(preset.icon, "💼");
        assert_eq!(preset.preset_type, PresetType::Custom);
        assert!(!preset.is_builtin());
        assert!(preset.created_at.is_some());
        assert!(preset.updated_at.is_some());
    }

    #[test]
    fn test_preset_is_builtin() {
        let preset = Preset {
            id: "builtin:balanced".to_string(),
            name: "Balanced".to_string(),
            icon: "⚡".to_string(),
            description: Some("Safe balance".to_string()),
            preset_type: PresetType::Builtin,
            based_on: None,
            created_at: None,
            updated_at: None,
            settings: ClaudeCodeSettings::default(),
        };

        assert!(preset.is_builtin());
    }

    #[test]
    fn test_preset_serialization_round_trip() {
        let preset = Preset {
            id: "builtin:cautious".to_string(),
            name: "Cautious".to_string(),
            icon: "🛡️".to_string(),
            description: Some("Safe mode".to_string()),
            preset_type: PresetType::Builtin,
            based_on: None,
            created_at: None,
            updated_at: None,
            settings: ClaudeCodeSettings {
                permissions: Some(PermissionsConfig {
                    allow: vec![],
                    deny: vec!["Bash(rm:*)".to_string()],
                    ask: vec!["Bash".to_string()],
                }),
                ..Default::default()
            },
        };

        let json = serde_json::to_string_pretty(&preset).unwrap();
        let deserialized: Preset = serde_json::from_str(&json).unwrap();

        assert_eq!(preset.id, deserialized.id);
        assert_eq!(preset.name, deserialized.name);
        assert_eq!(preset.preset_type, deserialized.preset_type);
    }

    // ===== PresetInfo Tests =====

    #[test]
    fn test_preset_info_from_preset() {
        let preset = Preset {
            id: "builtin:yolo".to_string(),
            name: "Yolo".to_string(),
            icon: "🚀".to_string(),
            description: Some("Fast mode".to_string()),
            preset_type: PresetType::Builtin,
            based_on: None,
            created_at: None,
            updated_at: None,
            settings: ClaudeCodeSettings::default(),
        };

        let info = PresetInfo::from(&preset);

        assert_eq!(info.id, "builtin:yolo");
        assert_eq!(info.name, "Yolo");
        assert_eq!(info.icon, "🚀");
        assert_eq!(info.preset_type, PresetType::Builtin);
        assert_eq!(info.description, Some("Fast mode".to_string()));
    }

    // ===== Flexible hooks/mcpServers Tests =====

    #[test]
    fn test_settings_with_complex_hooks() {
        // Test that complex nested hook structures are parsed correctly
        let json = r#"{
            "hooks": {
                "PreToolUse": [
                    {
                        "matcher": "Bash",
                        "hooks": [
                            {
                                "type": "command",
                                "command": "echo test"
                            }
                        ]
                    }
                ]
            }
        }"#;

        let settings: ClaudeCodeSettings = serde_json::from_str(json).unwrap();
        assert!(settings.hooks.is_some());
    }

    #[test]
    fn test_settings_with_mcp_servers() {
        // Test various MCP server configurations
        let json = r#"{
            "mcpServers": {
                "test-server": {
                    "command": "node",
                    "args": ["server.js"]
                }
            }
        }"#;

        let settings: ClaudeCodeSettings = serde_json::from_str(json).unwrap();
        assert!(settings.mcp_servers.is_some());
    }
}
