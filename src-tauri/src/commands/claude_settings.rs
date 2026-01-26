//! Tauri commands for Claude Code settings management
//!
//! This module provides commands for reading, writing, and merging
//! Claude Code settings across different scopes (user, project, local).
//!
//! File paths:
//! - User: ~/.claude/settings.json
//! - Project: {project_path}/.claude/settings.json
//! - Local: {project_path}/.claude/settings.local.json
//! - Custom presets: ~/.claude-history-viewer/presets/*.json

use crate::models::{
    ClaudeCodeSettings, Preset, PresetInfo, PresetType, PermissionsConfig, SettingsScope,
};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::State;

/// Application state for Claude settings management
pub struct ClaudeSettingsState {
    /// Cached settings by scope key (scope:path)
    pub cache: Mutex<HashMap<String, ClaudeCodeSettings>>,
}

impl Default for ClaudeSettingsState {
    fn default() -> Self {
        Self {
            cache: Mutex::new(HashMap::new()),
        }
    }
}

/// Get the cache key for a scope and project path
fn get_cache_key(scope: &SettingsScope, project_path: Option<&str>) -> String {
    match scope {
        SettingsScope::User | SettingsScope::Managed => format!("{scope:?}"),
        SettingsScope::Project | SettingsScope::Local => {
            format!("{:?}:{}", scope, project_path.unwrap_or(""))
        }
    }
}

/// Get the settings file path for a given scope
fn get_settings_path(scope: &SettingsScope, project_path: Option<&str>) -> Result<PathBuf, String> {
    match scope {
        SettingsScope::Managed => {
            // macOS: /Library/Application Support/ClaudeCode/managed-settings.json
            // This is typically read-only and managed by IT
            #[cfg(target_os = "macos")]
            {
                Ok(PathBuf::from("/Library/Application Support/ClaudeCode/managed-settings.json"))
            }
            #[cfg(target_os = "linux")]
            {
                Ok(PathBuf::from("/etc/claude-code/managed-settings.json"))
            }
            #[cfg(target_os = "windows")]
            {
                Ok(PathBuf::from("C:\\ProgramData\\ClaudeCode\\managed-settings.json"))
            }
        }
        SettingsScope::User => {
            let home = dirs::home_dir().ok_or("Could not find home directory")?;
            Ok(home.join(".claude/settings.json"))
        }
        SettingsScope::Project => {
            let project = project_path.ok_or("Project path required for project scope")?;
            if project.is_empty() {
                return Err("Project path cannot be empty".to_string());
            }
            Ok(PathBuf::from(project).join(".claude/settings.json"))
        }
        SettingsScope::Local => {
            let project = project_path.ok_or("Project path required for local scope")?;
            if project.is_empty() {
                return Err("Project path cannot be empty".to_string());
            }
            Ok(PathBuf::from(project).join(".claude/settings.local.json"))
        }
    }
}

/// Get the presets folder path (~/.claude-history-viewer/presets)
fn get_presets_folder() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    Ok(home.join(".claude-history-viewer/presets"))
}

/// Ensure the presets folder exists
fn ensure_presets_folder() -> Result<PathBuf, String> {
    let folder = get_presets_folder()?;
    if !folder.exists() {
        fs::create_dir_all(&folder)
            .map_err(|e| format!("Failed to create presets folder: {e}"))?;
    }
    Ok(folder)
}

/// Read settings from disk (blocking)
fn read_settings_from_disk(path: &Path) -> Result<ClaudeCodeSettings, String> {
    if !path.exists() {
        return Ok(ClaudeCodeSettings::default());
    }

    let content =
        fs::read_to_string(path).map_err(|e| format!("Failed to read settings file: {e}"))?;

    if content.trim().is_empty() {
        return Ok(ClaudeCodeSettings::default());
    }

    serde_json::from_str(&content).map_err(|e| format!("Failed to parse settings: {e}"))
}

/// Write settings to disk with atomic write pattern (blocking)
fn write_settings_to_disk(path: &Path, settings: &ClaudeCodeSettings) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create settings directory: {e}"))?;
        }
    }

    // Write to temp file first (atomic write pattern)
    let temp_path = path.with_extension("json.tmp");
    let content = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {e}"))?;

    let mut file =
        fs::File::create(&temp_path).map_err(|e| format!("Failed to create temp file: {e}"))?;
    file.write_all(content.as_bytes())
        .map_err(|e| format!("Failed to write temp file: {e}"))?;
    file.sync_all()
        .map_err(|e| format!("Failed to sync temp file: {e}"))?;

    // Rename temp file to actual file (atomic on most filesystems)
    fs::rename(&temp_path, path).map_err(|e| format!("Failed to rename temp file: {e}"))?;

    Ok(())
}

/// Get built-in presets
fn get_builtin_presets() -> Vec<Preset> {
    vec![
        Preset {
            id: "builtin:cautious".to_string(),
            name: "Cautious".to_string(),
            icon: "🛡️".to_string(),
            description: Some("All actions require confirmation. Safety first.".to_string()),
            preset_type: PresetType::Builtin,
            based_on: None,
            created_at: None,
            updated_at: None,
            settings: ClaudeCodeSettings {
                permissions: Some(PermissionsConfig {
                    allow: vec![],
                    deny: vec![
                        "Bash(rm:*)".to_string(),
                        "Bash(rm -rf:*)".to_string(),
                        "Read(.env)".to_string(),
                        "Read(.env.*)".to_string(),
                    ],
                    ask: vec![
                        "Bash".to_string(),
                        "Edit".to_string(),
                        "Write".to_string(),
                        "Read".to_string(),
                    ],
                }),
                ..Default::default()
            },
        },
        Preset {
            id: "builtin:balanced".to_string(),
            name: "Balanced".to_string(),
            icon: "⚡".to_string(),
            description: Some("Safe actions auto-approved, risky ones ask.".to_string()),
            preset_type: PresetType::Builtin,
            based_on: None,
            created_at: None,
            updated_at: None,
            settings: ClaudeCodeSettings {
                permissions: Some(PermissionsConfig {
                    allow: vec![
                        "Bash(npm:*)".to_string(),
                        "Bash(pnpm:*)".to_string(),
                        "Bash(yarn:*)".to_string(),
                        "Bash(bun:*)".to_string(),
                        "Bash(git status:*)".to_string(),
                        "Bash(git diff:*)".to_string(),
                        "Bash(git add:*)".to_string(),
                        "Bash(git log:*)".to_string(),
                        "Bash(ls:*)".to_string(),
                        "Bash(cat:*)".to_string(),
                        "Bash(grep:*)".to_string(),
                        "Bash(find:*)".to_string(),
                        "Bash(echo:*)".to_string(),
                        "Bash(pwd:*)".to_string(),
                        "Bash(which:*)".to_string(),
                        "Read(src/**)".to_string(),
                        "Read(lib/**)".to_string(),
                        "Read(package.json)".to_string(),
                        "Read(tsconfig.json)".to_string(),
                        "WebFetch(domain:docs.*)".to_string(),
                        "WebFetch(domain:github.com)".to_string(),
                        "WebFetch(domain:stackoverflow.com)".to_string(),
                    ],
                    deny: vec![
                        "Bash(rm -rf:*)".to_string(),
                        "Bash(rm -r:*)".to_string(),
                        "Read(.env)".to_string(),
                        "Read(.env.*)".to_string(),
                        "Read(secrets/**)".to_string(),
                    ],
                    ask: vec![
                        "Bash(git push:*)".to_string(),
                        "Bash(git commit:*)".to_string(),
                        "Write".to_string(),
                        "Edit".to_string(),
                    ],
                }),
                ..Default::default()
            },
        },
        Preset {
            id: "builtin:yolo".to_string(),
            name: "Yolo".to_string(),
            icon: "🚀".to_string(),
            description: Some("Fast development, minimal confirmations.".to_string()),
            preset_type: PresetType::Builtin,
            based_on: None,
            created_at: None,
            updated_at: None,
            settings: ClaudeCodeSettings {
                permissions: Some(PermissionsConfig {
                    allow: vec![
                        "Bash".to_string(),
                        "Read".to_string(),
                        "Write".to_string(),
                        "Edit".to_string(),
                        "WebFetch".to_string(),
                    ],
                    deny: vec![
                        "Bash(rm -rf /)".to_string(),
                        "Read(.env)".to_string(),
                        "Read(.env.*)".to_string(),
                    ],
                    ask: vec![],
                }),
                ..Default::default()
            },
        },
    ]
}

/// Read custom presets from disk (blocking)
fn read_custom_presets() -> Result<Vec<Preset>, String> {
    let folder = get_presets_folder()?;
    if !folder.exists() {
        return Ok(vec![]);
    }

    let mut presets = Vec::new();
    let entries =
        fs::read_dir(&folder).map_err(|e| format!("Failed to read presets folder: {e}"))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "json") {
            match fs::read_to_string(&path) {
                Ok(content) => match serde_json::from_str::<Preset>(&content) {
                    Ok(preset) => {
                        if preset.preset_type == PresetType::Custom {
                            presets.push(preset);
                        }
                    }
                    Err(e) => {
                        log::warn!("Failed to parse preset file {:?}: {}", path, e);
                    }
                },
                Err(e) => {
                    log::warn!("Failed to read preset file {:?}: {}", path, e);
                }
            }
        }
    }

    Ok(presets)
}

/// Save a preset to disk (blocking)
fn save_preset_to_disk(preset: &Preset) -> Result<(), String> {
    if preset.preset_type == PresetType::Builtin {
        return Err("Cannot save built-in presets".to_string());
    }

    let folder = ensure_presets_folder()?;
    let filename = format!("{}.json", preset.id.replace(':', "-"));
    let path = folder.join(filename);

    let content =
        serde_json::to_string_pretty(preset).map_err(|e| format!("Failed to serialize preset: {e}"))?;

    // Atomic write pattern
    let temp_path = path.with_extension("json.tmp");
    let mut file =
        fs::File::create(&temp_path).map_err(|e| format!("Failed to create temp file: {e}"))?;
    file.write_all(content.as_bytes())
        .map_err(|e| format!("Failed to write temp file: {e}"))?;
    file.sync_all()
        .map_err(|e| format!("Failed to sync temp file: {e}"))?;
    fs::rename(&temp_path, &path).map_err(|e| format!("Failed to rename temp file: {e}"))?;

    Ok(())
}

/// Delete a preset from disk (blocking)
fn delete_preset_from_disk(id: &str) -> Result<(), String> {
    if id.starts_with("builtin:") {
        return Err("Cannot delete built-in presets".to_string());
    }

    let folder = get_presets_folder()?;
    let filename = format!("{}.json", id.replace(':', "-"));
    let path = folder.join(filename);

    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete preset: {e}"))?;
    }

    Ok(())
}

// ===== Tauri Commands =====

/// Read Claude Code settings from a specific scope
#[tauri::command]
pub async fn read_claude_settings(
    scope: SettingsScope,
    project_path: Option<String>,
    state: State<'_, ClaudeSettingsState>,
) -> Result<ClaudeCodeSettings, String> {
    let path = get_settings_path(&scope, project_path.as_deref())?;
    let cache_key = get_cache_key(&scope, project_path.as_deref());

    // Check cache first
    {
        let cache = state
            .cache
            .lock()
            .map_err(|e| format!("Failed to lock cache: {e}"))?;
        if let Some(cached) = cache.get(&cache_key) {
            return Ok(cached.clone());
        }
    }

    // Read from disk
    let settings = tauri::async_runtime::spawn_blocking(move || read_settings_from_disk(&path))
        .await
        .map_err(|e| format!("Task join error: {e}"))??;

    // Update cache
    {
        let mut cache = state
            .cache
            .lock()
            .map_err(|e| format!("Failed to lock cache: {e}"))?;
        cache.insert(cache_key, settings.clone());
    }

    Ok(settings)
}

/// Write Claude Code settings to a specific scope
#[tauri::command]
pub async fn write_claude_settings(
    scope: SettingsScope,
    project_path: Option<String>,
    settings: ClaudeCodeSettings,
    state: State<'_, ClaudeSettingsState>,
) -> Result<(), String> {
    if scope == SettingsScope::Managed {
        return Err("Cannot write to managed settings".to_string());
    }

    let path = get_settings_path(&scope, project_path.as_deref())?;
    let cache_key = get_cache_key(&scope, project_path.as_deref());
    let settings_clone = settings.clone();

    // Write to disk
    tauri::async_runtime::spawn_blocking(move || write_settings_to_disk(&path, &settings_clone))
        .await
        .map_err(|e| format!("Task join error: {e}"))??;

    // Update cache
    {
        let mut cache = state
            .cache
            .lock()
            .map_err(|e| format!("Failed to lock cache: {e}"))?;
        cache.insert(cache_key, settings);
    }

    Ok(())
}

/// Get merged settings from all applicable scopes
/// Priority (highest to lowest): Managed > Local > Project > User
#[tauri::command]
pub async fn get_merged_settings(
    project_path: Option<String>,
    state: State<'_, ClaudeSettingsState>,
) -> Result<ClaudeCodeSettings, String> {
    let mut merged = ClaudeCodeSettings::default();

    // Read and merge in priority order (lowest first so higher can override)
    let scopes = if project_path.is_some() {
        vec![
            SettingsScope::User,
            SettingsScope::Project,
            SettingsScope::Local,
            SettingsScope::Managed,
        ]
    } else {
        vec![SettingsScope::User, SettingsScope::Managed]
    };

    for scope in scopes {
        let path = match get_settings_path(&scope, project_path.as_deref()) {
            Ok(p) => p,
            Err(_) => continue, // Skip if path can't be determined
        };

        let settings = tauri::async_runtime::spawn_blocking(move || read_settings_from_disk(&path))
            .await
            .map_err(|e| format!("Task join error: {e}"))??;

        merged.merge(&settings);
    }

    // Update cache with merged result
    let cache_key = format!("merged:{}", project_path.as_deref().unwrap_or(""));
    {
        let mut cache = state
            .cache
            .lock()
            .map_err(|e| format!("Failed to lock cache: {e}"))?;
        cache.insert(cache_key, merged.clone());
    }

    Ok(merged)
}

/// List all available presets (built-in + custom)
#[tauri::command]
pub async fn list_presets() -> Result<Vec<PresetInfo>, String> {
    let builtin = get_builtin_presets();
    let custom = tauri::async_runtime::spawn_blocking(read_custom_presets)
        .await
        .map_err(|e| format!("Task join error: {e}"))??;

    let mut infos: Vec<PresetInfo> = builtin.iter().map(PresetInfo::from).collect();
    infos.extend(custom.iter().map(PresetInfo::from));

    Ok(infos)
}

/// Get a specific preset by ID
#[tauri::command]
pub async fn get_preset(id: String) -> Result<Preset, String> {
    // Check built-in first
    for preset in get_builtin_presets() {
        if preset.id == id {
            return Ok(preset);
        }
    }

    // Check custom presets
    let custom = tauri::async_runtime::spawn_blocking(read_custom_presets)
        .await
        .map_err(|e| format!("Task join error: {e}"))??;

    for preset in custom {
        if preset.id == id {
            return Ok(preset);
        }
    }

    Err(format!("Preset not found: {id}"))
}

/// Save a custom preset
#[tauri::command]
pub async fn save_preset(preset: Preset) -> Result<(), String> {
    if preset.preset_type == PresetType::Builtin {
        return Err("Cannot save built-in presets. Use a copy instead.".to_string());
    }

    tauri::async_runtime::spawn_blocking(move || save_preset_to_disk(&preset))
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

/// Delete a custom preset
#[tauri::command]
pub async fn delete_preset(id: String) -> Result<(), String> {
    if id.starts_with("builtin:") {
        return Err("Cannot delete built-in presets".to_string());
    }

    tauri::async_runtime::spawn_blocking(move || delete_preset_from_disk(&id))
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

/// Apply a preset to a specific scope
#[tauri::command]
pub async fn apply_preset(
    id: String,
    scope: SettingsScope,
    project_path: Option<String>,
    state: State<'_, ClaudeSettingsState>,
) -> Result<(), String> {
    if scope == SettingsScope::Managed {
        return Err("Cannot apply preset to managed settings".to_string());
    }

    // Get the preset
    let preset = get_preset(id).await?;

    // Write the preset's settings to the specified scope
    write_claude_settings(scope, project_path, preset.settings, state).await
}

/// Invalidate the settings cache (useful after external changes)
#[tauri::command]
pub async fn invalidate_settings_cache(
    state: State<'_, ClaudeSettingsState>,
) -> Result<(), String> {
    let mut cache = state
        .cache
        .lock()
        .map_err(|e| format!("Failed to lock cache: {e}"))?;
    cache.clear();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::sync::{LazyLock, Mutex as StdMutex, MutexGuard};
    use tempfile::TempDir;

    /// Static mutex to serialize tests that modify the HOME environment variable.
    static TEST_ENV_MUTEX: LazyLock<StdMutex<()>> = LazyLock::new(|| StdMutex::new(()));

    /// Sets up a test environment with a temporary HOME directory.
    fn setup_test_env() -> (MutexGuard<'static, ()>, TempDir) {
        let guard = TEST_ENV_MUTEX.lock().unwrap();
        let temp_dir = TempDir::new().unwrap();
        env::set_var("HOME", temp_dir.path());
        (guard, temp_dir)
    }

    // ===== Path Helper Tests =====

    #[test]
    fn test_get_settings_path_user() {
        let (_guard, temp) = setup_test_env();
        let path = get_settings_path(&SettingsScope::User, None).unwrap();
        assert!(path.to_string_lossy().contains(".claude/settings.json"));
        drop(temp);
    }

    #[test]
    fn test_get_settings_path_project() {
        let path = get_settings_path(&SettingsScope::Project, Some("/my/project")).unwrap();
        assert_eq!(
            path,
            PathBuf::from("/my/project/.claude/settings.json")
        );
    }

    #[test]
    fn test_get_settings_path_local() {
        let path = get_settings_path(&SettingsScope::Local, Some("/my/project")).unwrap();
        assert_eq!(
            path,
            PathBuf::from("/my/project/.claude/settings.local.json")
        );
    }

    #[test]
    fn test_get_settings_path_project_requires_path() {
        let result = get_settings_path(&SettingsScope::Project, None);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Project path required"));
    }

    #[test]
    fn test_get_settings_path_local_requires_path() {
        let result = get_settings_path(&SettingsScope::Local, None);
        assert!(result.is_err());
    }

    #[test]
    fn test_get_settings_path_empty_project_path() {
        let result = get_settings_path(&SettingsScope::Project, Some(""));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("cannot be empty"));
    }

    #[test]
    fn test_get_presets_folder() {
        let (_guard, temp) = setup_test_env();
        let folder = get_presets_folder().unwrap();
        assert!(folder
            .to_string_lossy()
            .contains(".claude-history-viewer/presets"));
        drop(temp);
    }

    // ===== Cache Key Tests =====

    #[test]
    fn test_get_cache_key_user() {
        let key = get_cache_key(&SettingsScope::User, None);
        assert_eq!(key, "User");
    }

    #[test]
    fn test_get_cache_key_project() {
        let key = get_cache_key(&SettingsScope::Project, Some("/my/project"));
        assert_eq!(key, "Project:/my/project");
    }

    #[test]
    fn test_get_cache_key_local() {
        let key = get_cache_key(&SettingsScope::Local, Some("/my/project"));
        assert_eq!(key, "Local:/my/project");
    }

    // ===== Read/Write Settings Tests =====

    #[test]
    fn test_read_settings_from_disk_nonexistent() {
        let path = PathBuf::from("/nonexistent/path/settings.json");
        let settings = read_settings_from_disk(&path).unwrap();
        assert!(settings.is_empty());
    }

    #[test]
    fn test_read_settings_from_disk_empty_file() {
        let (_guard, temp) = setup_test_env();
        let path = temp.path().join("empty.json");
        fs::write(&path, "").unwrap();

        let settings = read_settings_from_disk(&path).unwrap();
        assert!(settings.is_empty());
        drop(temp);
    }

    #[test]
    fn test_read_settings_from_disk_valid() {
        let (_guard, temp) = setup_test_env();
        let path = temp.path().join("settings.json");
        fs::write(&path, r#"{"model": "opus"}"#).unwrap();

        let settings = read_settings_from_disk(&path).unwrap();
        assert_eq!(settings.model, Some("opus".to_string()));
        drop(temp);
    }

    #[test]
    fn test_read_settings_from_disk_invalid_json() {
        let (_guard, temp) = setup_test_env();
        let path = temp.path().join("invalid.json");
        fs::write(&path, "not valid json").unwrap();

        let result = read_settings_from_disk(&path);
        assert!(result.is_err());
        drop(temp);
    }

    #[test]
    fn test_write_settings_to_disk() {
        let (_guard, temp) = setup_test_env();
        let path = temp.path().join("write_test.json");

        let settings = ClaudeCodeSettings {
            model: Some("sonnet".to_string()),
            ..Default::default()
        };

        write_settings_to_disk(&path, &settings).unwrap();

        // Verify file exists and content is correct
        assert!(path.exists());
        let content = fs::read_to_string(&path).unwrap();
        assert!(content.contains("sonnet"));

        // Verify no temp file left behind
        let temp_path = path.with_extension("json.tmp");
        assert!(!temp_path.exists());

        drop(temp);
    }

    #[test]
    fn test_write_settings_creates_parent_dirs() {
        let (_guard, temp) = setup_test_env();
        let path = temp.path().join("nested/dir/settings.json");

        let settings = ClaudeCodeSettings::default();
        write_settings_to_disk(&path, &settings).unwrap();

        assert!(path.exists());
        drop(temp);
    }

    // ===== Built-in Presets Tests =====

    #[test]
    fn test_get_builtin_presets_count() {
        let presets = get_builtin_presets();
        assert_eq!(presets.len(), 3);
    }

    #[test]
    fn test_get_builtin_presets_ids() {
        let presets = get_builtin_presets();
        let ids: Vec<&str> = presets.iter().map(|p| p.id.as_str()).collect();
        assert!(ids.contains(&"builtin:cautious"));
        assert!(ids.contains(&"builtin:balanced"));
        assert!(ids.contains(&"builtin:yolo"));
    }

    #[test]
    fn test_get_builtin_presets_all_builtin_type() {
        let presets = get_builtin_presets();
        for preset in presets {
            assert_eq!(preset.preset_type, PresetType::Builtin);
            assert!(preset.is_builtin());
        }
    }

    #[test]
    fn test_builtin_cautious_has_ask_rules() {
        let presets = get_builtin_presets();
        let cautious = presets.iter().find(|p| p.id == "builtin:cautious").unwrap();
        let perms = cautious.settings.permissions.as_ref().unwrap();
        assert!(!perms.ask.is_empty());
        assert!(perms.allow.is_empty());
    }

    #[test]
    fn test_builtin_balanced_has_allow_and_deny() {
        let presets = get_builtin_presets();
        let balanced = presets.iter().find(|p| p.id == "builtin:balanced").unwrap();
        let perms = balanced.settings.permissions.as_ref().unwrap();
        assert!(!perms.allow.is_empty());
        assert!(!perms.deny.is_empty());
    }

    #[test]
    fn test_builtin_yolo_has_broad_allow() {
        let presets = get_builtin_presets();
        let yolo = presets.iter().find(|p| p.id == "builtin:yolo").unwrap();
        let perms = yolo.settings.permissions.as_ref().unwrap();
        // Yolo allows Bash, Read, Write, Edit, WebFetch without wildcards
        assert!(perms.allow.contains(&"Bash".to_string()));
        assert!(perms.allow.contains(&"Read".to_string()));
    }

    // ===== Custom Presets Tests =====

    #[test]
    fn test_save_preset_to_disk_custom() {
        let (_guard, temp) = setup_test_env();

        // Create presets folder
        let presets_folder = temp.path().join(".claude-history-viewer/presets");
        fs::create_dir_all(&presets_folder).unwrap();

        let preset = Preset::new_custom(
            "Test Preset".to_string(),
            "🧪".to_string(),
            ClaudeCodeSettings::default(),
        );
        let preset_id = preset.id.clone();

        save_preset_to_disk(&preset).unwrap();

        // Verify file exists
        let filename = format!("{}.json", preset_id.replace(':', "-"));
        let path = presets_folder.join(filename);
        assert!(path.exists());

        drop(temp);
    }

    #[test]
    fn test_save_preset_to_disk_builtin_fails() {
        let preset = Preset {
            id: "builtin:test".to_string(),
            name: "Test".to_string(),
            icon: "🧪".to_string(),
            description: None,
            preset_type: PresetType::Builtin,
            based_on: None,
            created_at: None,
            updated_at: None,
            settings: ClaudeCodeSettings::default(),
        };

        let result = save_preset_to_disk(&preset);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Cannot save built-in"));
    }

    #[test]
    fn test_delete_preset_from_disk_builtin_fails() {
        let result = delete_preset_from_disk("builtin:cautious");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Cannot delete built-in"));
    }

    #[test]
    fn test_delete_preset_from_disk_custom() {
        let (_guard, temp) = setup_test_env();

        // Create presets folder and a test preset file
        let presets_folder = temp.path().join(".claude-history-viewer/presets");
        fs::create_dir_all(&presets_folder).unwrap();

        let preset_path = presets_folder.join("custom-test-id.json");
        fs::write(&preset_path, "{}").unwrap();
        assert!(preset_path.exists());

        delete_preset_from_disk("custom:test-id").unwrap();
        assert!(!preset_path.exists());

        drop(temp);
    }

    #[test]
    fn test_read_custom_presets_empty_folder() {
        let (_guard, temp) = setup_test_env();
        let presets_folder = temp.path().join(".claude-history-viewer/presets");
        fs::create_dir_all(&presets_folder).unwrap();

        let presets = read_custom_presets().unwrap();
        assert!(presets.is_empty());

        drop(temp);
    }

    #[test]
    fn test_read_custom_presets_with_presets() {
        let (_guard, temp) = setup_test_env();
        let presets_folder = temp.path().join(".claude-history-viewer/presets");
        fs::create_dir_all(&presets_folder).unwrap();

        // Create a valid preset file
        let preset = Preset::new_custom(
            "My Preset".to_string(),
            "🎯".to_string(),
            ClaudeCodeSettings::default(),
        );
        let content = serde_json::to_string(&preset).unwrap();
        fs::write(presets_folder.join("my-preset.json"), content).unwrap();

        let presets = read_custom_presets().unwrap();
        assert_eq!(presets.len(), 1);
        assert_eq!(presets[0].name, "My Preset");

        drop(temp);
    }

    #[test]
    fn test_read_custom_presets_ignores_invalid_json() {
        let (_guard, temp) = setup_test_env();
        let presets_folder = temp.path().join(".claude-history-viewer/presets");
        fs::create_dir_all(&presets_folder).unwrap();

        // Create an invalid JSON file
        fs::write(presets_folder.join("invalid.json"), "not json").unwrap();

        // Should not panic, just skip the invalid file
        let presets = read_custom_presets().unwrap();
        assert!(presets.is_empty());

        drop(temp);
    }

    #[test]
    fn test_read_custom_presets_ignores_builtin_type() {
        let (_guard, temp) = setup_test_env();
        let presets_folder = temp.path().join(".claude-history-viewer/presets");
        fs::create_dir_all(&presets_folder).unwrap();

        // Create a preset file with builtin type (should be ignored)
        let preset = Preset {
            id: "builtin:fake".to_string(),
            name: "Fake Builtin".to_string(),
            icon: "🎭".to_string(),
            description: None,
            preset_type: PresetType::Builtin,
            based_on: None,
            created_at: None,
            updated_at: None,
            settings: ClaudeCodeSettings::default(),
        };
        let content = serde_json::to_string(&preset).unwrap();
        fs::write(presets_folder.join("fake-builtin.json"), content).unwrap();

        let presets = read_custom_presets().unwrap();
        assert!(presets.is_empty());

        drop(temp);
    }

    // ===== Integration-style Tests =====

    #[test]
    fn test_round_trip_settings() {
        let (_guard, temp) = setup_test_env();
        let path = temp.path().join("roundtrip.json");

        let original = ClaudeCodeSettings {
            model: Some("opus".to_string()),
            permissions: Some(PermissionsConfig {
                allow: vec!["Read(*)".to_string()],
                deny: vec!["Bash(rm:*)".to_string()],
                ask: vec!["Write".to_string()],
            }),
            ..Default::default()
        };

        write_settings_to_disk(&path, &original).unwrap();
        let loaded = read_settings_from_disk(&path).unwrap();

        assert_eq!(original.model, loaded.model);
        assert_eq!(
            original.permissions.as_ref().unwrap().allow,
            loaded.permissions.as_ref().unwrap().allow
        );

        drop(temp);
    }

    #[test]
    fn test_settings_merge_priority() {
        // User settings
        let mut user = ClaudeCodeSettings {
            model: Some("sonnet".to_string()),
            permissions: Some(PermissionsConfig {
                allow: vec!["Read(*)".to_string()],
                deny: vec![],
                ask: vec![],
            }),
            ..Default::default()
        };

        // Project settings (higher priority)
        let project = ClaudeCodeSettings {
            model: Some("opus".to_string()),
            ..Default::default()
        };

        user.merge(&project);

        // Project's model should override user's
        assert_eq!(user.model, Some("opus".to_string()));
        // User's permissions should be preserved (project had none)
        assert!(user.permissions.is_some());
    }
}
