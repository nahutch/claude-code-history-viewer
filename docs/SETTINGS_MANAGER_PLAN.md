# Claude Code 설정 관리 기능 구현 계획

> 작성일: 2026-01-26
> 최종 수정: 2026-01-26
> 상태: 계획 단계

## 개요

Claude Code History Viewer에 Claude Code 설정을 관리하는 기능을 추가합니다.

### 목표

1. **모든 사용자 레벨 지원** - 초보자부터 파워 유저까지 단일 UI로
2. **프리셋 시스템** - Built-in 3개 + 사용자 커스텀 프리셋
3. **점진적 공개** - 필요한 만큼만 복잡하게
4. **양방향 동기화** - Visual ↔ JSON 실시간 반영

---

## 실제 사용자 리서치 결과

### 사용자 스펙트럼

```
일반 사용자 (60%)     중간 사용자 (25%)     파워 유저 (15%)
◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 기본값 그대로 │    │ CLAUDE.md만  │    │ MCP + Hooks  │
│              │    │ 작성         │    │ + 플러그인   │
└──────────────┘    └──────────────┘    └──────────────┘
       ↑                                        ↑
  Boris Cherny                            파워 유저 설정
  (창시자도 기본값 사용)
```

### 핵심 인용

> **Boris Cherny** (Claude Code 창시자):
> *"My setup might be surprisingly vanilla! Claude Code works great out of the box, so I personally don't customize it much."*

### 실제 사용 패턴

| 사용자 유형 | 비율 | 설정 패턴 |
|-------------|------|-----------|
| 기본값 사용 | ~60% | 설치 후 인증만 하고 바로 사용 |
| CLAUDE.md만 | ~25% | 프로젝트 컨텍스트만 작성 |
| Permission 커스텀 | ~10% | 간단한 allow 규칙 추가 |
| 풀 커스텀 | ~5% | MCP, Hooks, 플러그인 활용 |

### 실제 Permission 패턴 (커뮤니티)

**대부분의 설정:**
```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)", "Bash(git:*)", "Bash(ls:*)",
      "Write(*)", "Read(*)"
    ],
    "deny": []
  }
}
```
→ **"rm만 빼고 다 allow"** 패턴이 가장 흔함

### 커뮤니티에서 보고된 문제점

| 문제 | 출처 |
|------|------|
| Permission deny가 Read/Write에서 작동 안 함 | GitHub Issue #6631 |
| 와일드카드 신뢰성 없음 | 커뮤니티 보고 |
| ~/.claude.json이 혼란스러움 | Reddit: "chaotic grab bag" |

### 참고 자료

- [Boris Cherny on Threads](https://www.threads.com/@boris_cherny/post/DTBVlMIkpcm)
- [Claude Code Settings Docs](https://code.claude.com/docs/en/settings)
- [EESEL - Claude Code Permissions Guide](https://www.eesel.ai/blog/claude-code-permissions)
- [Korny's Blog - Better Claude Code Permissions](https://blog.korny.info/2025/10/10/better-claude-code-permissions)
- [GitHub Issue #6631](https://github.com/anthropics/claude-code/issues/6631)

---

## UI 컨셉: Progressive Disclosure (점진적 공개)

### 핵심 원칙

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   Surface Layer        →    Detail Layer       →    Raw Layer       │
│   (일반 사용자)              (중간 사용자)           (파워 유저)     │
│                                                                      │
│   ┌──────────────┐          ┌──────────────┐       ┌──────────────┐ │
│   │  프리셋      │    →     │  세부 조정   │   →   │  JSON 편집   │ │
│   │  원클릭      │          │  토글/선택   │       │  완전 제어   │ │
│   └──────────────┘          └──────────────┘       └──────────────┘ │
│                                                                      │
│   "이것만 고르면 끝"        "좀 더 조정하고 싶어"   "내가 다 할게"   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 양방향 동기화

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Quick Preset    │ ←──→ │  Fine Tune       │ ←──→ │  JSON Editor     │
│                  │      │                  │      │                  │
│  "Balanced" 선택 │  →   │  슬라이더 반영   │  →   │  JSON 자동 생성  │
│                  │      │                  │      │                  │
│  프리셋 표시     │  ←   │  변경 감지       │  ←   │  JSON 직접 수정  │
│  "Custom"으로    │      │                  │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘

어디서 수정하든 다른 뷰에 즉시 반영
```

---

## UI 설계

### 메인 화면 (Surface Layer)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚙️ SETTINGS                                              [{ } JSON] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─ Presets ─────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Built-in                                                      │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                  │  │
│  │  │ 🛡️        │  │ ⚡        │  │ 🚀        │                  │  │
│  │  │ Cautious  │  │ Balanced  │  │ Yolo      │                  │  │
│  │  │           │  │  ✓ 적용됨 │  │           │                  │  │
│  │  │  [적용]   │  │  [적용됨] │  │  [적용]   │                  │  │
│  │  └───────────┘  └───────────┘  └───────────┘                  │  │
│  │                                                                │  │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │  │
│  │                                                                │  │
│  │  My Presets                                          [+ New]   │  │
│  │  ┌───────────┐  ┌───────────┐                                 │  │
│  │  │ 💼        │  │ 🏠        │                                 │  │
│  │  │ Work Mode │  │ Personal  │                                 │  │
│  │  │           │  │           │                                 │  │
│  │  │ [적용] [⋮]│  │ [적용] [⋮]│                                 │  │
│  │  └───────────┘  └───────────┘                                 │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Fine Tune ───────────────────────────────── [∨ 펼치기] ──────┐  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Fine Tune 섹션 (Detail Layer)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─ Fine Tune ──────────────────────────────── [∧ 접기] ─────────┐  │
│  │                                                                │  │
│  │  📁 File Operations                                            │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ Read files        [━━━━━━━━━━━━━━━●] Always allow       │  │  │
│  │  │ Edit files        [━━━━━━━━●━━━━━━] Ask for changes     │  │  │
│  │  │ Create files      [━━━━━━━━●━━━━━━] Ask for new files   │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  🖥️ Terminal Commands                                          │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ Build & Test      [━━━━━━━━━━━━━━━●] Always allow       │  │  │
│  │  │  └ npm run, pytest, cargo build...                      │  │  │
│  │  │ Git commands      [━━━━━━━━●━━━━━━] Ask for push        │  │  │
│  │  │  └ commit: auto, push: ask                              │  │  │
│  │  │ Dangerous         [●━━━━━━━━━━━━━━] Always block        │  │  │
│  │  │  └ rm -rf, drop database...                             │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  🌐 Network                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ Documentation     [━━━━━━━━━━━━━━━●] Always allow       │  │  │
│  │  │  └ docs.*, github.com, stackoverflow...                 │  │  │
│  │  │ Other URLs        [━━━━━━━━●━━━━━━] Ask each time       │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  🔒 Protected Files                                [+ Add]     │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ .env              Never read                       [✕]  │  │  │
│  │  │ .env.*            Never read                       [✕]  │  │  │
│  │  │ secrets/          Never read                       [✕]  │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │                              [Reset to Preset] [Apply Changes] │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### JSON 에디터 (Raw Layer)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚙️ SETTINGS                                         [📝 Visual] ←  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─ Scope ───────────────────────────────────────────────────────┐  │
│  │  [👤 User]  [📁 Project]  [🔒 Local]                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Editor ──────────────────────────────────────────────────────┐  │
│  │  1  {                                                          │  │
│  │  2    "model": "opus",                                         │  │
│  │  3    "permissions": {                                         │  │
│  │  4      "allow": [                                             │  │
│  │  5        "Bash(npm:*)",                                       │  │
│  │  6        "Bash(git commit:*)",                                │  │
│  │  7        "Read(src/**)"                                       │  │
│  │  8      ],                                                     │  │
│  │  9      "deny": [                                              │  │
│  │ 10        "Read(.env)",                                        │  │
│  │ 11        "Bash(rm -rf:*)"                                     │  │
│  │ 12      ]                                                      │  │
│  │ 13    },                                                       │  │
│  │ 14    "hooks": { ... }                                         │  │
│  │ 15  }                                                          │  │
│  │                                                                │  │
│  │  ✓ Valid JSON                                                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  [Copy]  [Format]  [Import]  [Export]            [Save to User]     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 프리셋 시스템

### 프리셋 구분

| 구분 | Built-in | Custom |
|------|----------|--------|
| **개수** | 3개 고정 | 무제한 |
| **수정** | ❌ (복제만 가능) | ✅ |
| **삭제** | ❌ | ✅ |
| **복제** | ✅ → Custom으로 | ✅ |
| **내보내기** | ✅ | ✅ |
| **저장 위치** | 앱 번들 | `~/.claude/presets/` |

### Built-in 프리셋 정의

```typescript
const builtInPresets = {
  cautious: {
    id: 'builtin:cautious',
    name: 'Cautious',
    icon: '🛡️',
    type: 'builtin',
    description: '모든 작업에 확인 필요. 안전 최우선.',
    settings: {
      permissions: {
        allow: [],
        deny: ['Bash(rm:*)', 'Bash(rm -rf:*)', 'Read(.env)', 'Read(.env.*)'],
        ask: ['Bash', 'Edit', 'Write', 'Read']
      }
    }
  },

  balanced: {
    id: 'builtin:balanced',
    name: 'Balanced',
    icon: '⚡',
    type: 'builtin',
    description: '안전한 작업은 자동, 위험한 건 확인.',
    settings: {
      permissions: {
        allow: [
          'Bash(npm:*)', 'Bash(pnpm:*)', 'Bash(yarn:*)', 'Bash(bun:*)',
          'Bash(git status:*)', 'Bash(git diff:*)', 'Bash(git add:*)', 'Bash(git log:*)',
          'Bash(ls:*)', 'Bash(cat:*)', 'Bash(grep:*)', 'Bash(find:*)',
          'Bash(echo:*)', 'Bash(pwd:*)', 'Bash(which:*)',
          'Read(src/**)', 'Read(lib/**)', 'Read(package.json)', 'Read(tsconfig.json)',
          'WebFetch(domain:docs.*)', 'WebFetch(domain:github.com)',
          'WebFetch(domain:stackoverflow.com)'
        ],
        deny: [
          'Bash(rm -rf:*)', 'Bash(rm -r:*)',
          'Read(.env)', 'Read(.env.*)', 'Read(secrets/**)'
        ],
        ask: ['Bash(git push:*)', 'Bash(git commit:*)', 'Write', 'Edit']
      }
    }
  },

  yolo: {
    id: 'builtin:yolo',
    name: 'Yolo',
    icon: '🚀',
    type: 'builtin',
    description: '빠른 작업, 최소 확인. 개발 중 편의성.',
    settings: {
      permissions: {
        allow: ['Bash', 'Read', 'Write', 'Edit', 'WebFetch'],
        deny: ['Bash(rm -rf /)', 'Read(.env)', 'Read(.env.*)']
      }
    }
  }
};
```

### 커스텀 프리셋 생성 플로우

**방법 1: 직접 생성**
```
[+ New] 클릭 → 모달
├── Start from scratch
├── Copy from built-in preset → [Cautious ▼]
└── Save current settings as preset

Name: [________________]
Icon: [💼 ▼]

[Cancel]  [Create]
```

**방법 2: Fine Tune 후 저장**
```
Fine Tune 변경 감지 시:
⚠️ You've modified the "Balanced" preset

[Reset to Balanced]  [Save as New Preset]
```

### 커스텀 프리셋 메뉴 (⋮)

```
┌────────────────┐
│ Edit           │  → Fine Tune 열림
│ Rename         │
│ Duplicate      │
│ Export (.json) │
├────────────────┤
│ Delete         │
└────────────────┘
```

### 프리셋 데이터 구조

```typescript
interface Preset {
  // 메타데이터
  id: string;                    // 'builtin:balanced' 또는 'custom:uuid'
  name: string;
  icon: string;                  // 이모지
  description?: string;
  type: 'builtin' | 'custom';
  basedOn?: string;              // 복제 원본 프리셋 ID

  // 타임스탬프 (custom only)
  createdAt?: string;
  updatedAt?: string;

  // 실제 설정
  settings: Partial<ClaudeSettings>;
}
```

### 프리셋 저장 위치

```
~/.claude/
├── settings.json              ← 현재 활성 설정
└── presets/                   ← 커스텀 프리셋 저장소
    ├── my-work-setup.json
    ├── personal.json
    └── ...
```

---

## 슬라이더 → 규칙 변환

```typescript
// 슬라이더 값: 0 = Block, 1 = Ask, 2 = Allow

const sliderToRules = {
  fileRead: {
    0: { deny: ['Read'] },
    1: { ask: ['Read'] },
    2: { allow: ['Read'] }
  },

  fileEdit: {
    0: { deny: ['Edit', 'Write'] },
    1: { ask: ['Edit', 'Write'] },
    2: { allow: ['Edit', 'Write'] }
  },

  buildCommands: {
    0: { deny: ['Bash(npm:*)', 'Bash(pnpm:*)', 'Bash(yarn:*)', 'Bash(bun:*)'] },
    1: { ask: ['Bash(npm:*)', 'Bash(pnpm:*)', 'Bash(yarn:*)', 'Bash(bun:*)'] },
    2: { allow: ['Bash(npm:*)', 'Bash(pnpm:*)', 'Bash(yarn:*)', 'Bash(bun:*)'] }
  },

  gitCommands: {
    0: { deny: ['Bash(git:*)'] },
    1: {
      allow: ['Bash(git status:*)', 'Bash(git diff:*)', 'Bash(git add:*)', 'Bash(git log:*)'],
      ask: ['Bash(git commit:*)', 'Bash(git push:*)', 'Bash(git reset:*)']
    },
    2: { allow: ['Bash(git:*)'] }
  },

  dangerous: {
    0: { deny: ['Bash(rm -rf:*)', 'Bash(rm -r:*)', 'Bash(DROP:*)'] },
    1: { ask: ['Bash(rm -rf:*)', 'Bash(rm -r:*)'] },
    2: { allow: ['Bash(rm -rf:*)'] }  // 경고 표시 필수
  }
};
```

---

## Claude Code 설정 시스템 (참조)

### 설정 스코프 (4단계 계층)

| 스코프 | 위치 | 영향 범위 | Git 공유 | 용도 |
|--------|------|-----------|----------|------|
| **Managed** | 시스템 레벨 | 모든 사용자 | IT 배포 | 기업 정책 (readonly) |
| **User** | `~/.claude/settings.json` | 본인, 모든 프로젝트 | 아니오 | 전역 기본값 |
| **Project** | `.claude/settings.json` | 모든 협업자 | 예 | 팀 공유 설정 |
| **Local** | `.claude/settings.local.json` | 본인, 해당 프로젝트 | 아니오 | 개인 오버라이드 |

### 설정 우선순위 (높음 → 낮음)

1. Managed 설정 (덮어쓰기 불가)
2. CLI 인자
3. Local 프로젝트 설정
4. Shared 프로젝트 설정
5. User 설정

### 병합 동작

- **스칼라 값**: 높은 우선순위가 완전히 대체
- **객체 값**: 재귀적으로 병합
- **배열 값**: 대체 (병합 아님) ⚠️

---

## 기존 코드베이스 분석

### 현재 아키텍처

앱에는 이미 두 가지 설정 시스템이 존재:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React + Zustand)                  │
├─────────────────────────────────────────────────────────────────────┤
│  settingsSlice.ts              │  metadataSlice.ts                  │
│  ├─ excludeSidechain           │  ├─ userMetadata                   │
│  ├─ showSystemMessages         │  │   ├─ sessions: {}               │
│  └─ updateSettings             │  │   ├─ projects: {}               │
│      ├─ autoCheck              │  │   └─ settings: UserSettings     │
│      ├─ checkInterval          │  └─ CRUD actions (invoke)          │
│      └─ skippedVersions        │                                    │
├─────────────────────────────────────────────────────────────────────┤
│                         Storage Layer                               │
├─────────────────────────────────────────────────────────────────────┤
│  @tauri-apps/plugin-store      │  Rust Commands (Tauri IPC)         │
│  └─ settings.json              │  └─ ~/.claude-history-viewer/      │
│     (Tauri 앱 데이터 폴더)      │      └─ user-data.json             │
└─────────────────────────────────────────────────────────────────────┘
```

### 두 시스템 비교

| 구분 | settingsSlice | metadataSlice |
|------|---------------|---------------|
| **용도** | 앱 동작 설정 | 사용자 커스텀 데이터 |
| **저장소** | Tauri plugin-store | Rust 직접 JSON I/O |
| **경로** | `~/Library/Application Support/` | `~/.claude-history-viewer/` |
| **백엔드** | 프론트엔드만 (plugin) | Rust commands |
| **예시** | 업데이트 체크 주기 | 세션 이름, 태그, 숨김 |

### 재사용 가능한 패턴

**1. Zustand Slice 패턴** (`src/store/slices/`)
```typescript
export const createSettingsSlice: StateCreator<
  FullAppStore,
  [],
  [],
  SettingsSlice
> = (set, get) => ({
  ...initialState,
  // actions...
});
```

**2. Rust Command 패턴** (`src-tauri/src/commands/metadata.rs`)
```rust
#[tauri::command]
pub async fn load_user_metadata(
    state: State<'_, MetadataState>
) -> Result<UserMetadata, String> {
    // spawn_blocking for file I/O
    // Mutex로 캐싱
}
```

**3. Atomic Write 패턴** (데이터 무결성)
```rust
// 1. temp 파일에 쓰기
let temp_path = path.with_extension("json.tmp");
fs::File::create(&temp_path)?;
// 2. sync 후 rename (atomic)
file.sync_all()?;
fs::rename(&temp_path, &path)?;
```

**4. 타입 미러링** (Rust ↔ TypeScript)
```rust
#[serde(rename_all = "camelCase")]
pub struct UserSettings { ... }
```
```typescript
export interface UserSettings { ... }
```

### Settings Manager에서 재사용할 것

| 기존 코드 | Settings Manager 적용 |
|-----------|----------------------|
| `metadataSlice.ts` 구조 | `claudeSettingsSlice.ts` 생성 |
| `metadata.rs` 패턴 | `claude_settings.rs` 생성 |
| `UserMetadata` 타입 | `ClaudeCodeSettings` 타입 추가 |
| `plugin-store` | 프리셋 저장 (`presets` 키) |
| Atomic write | Claude 설정 파일 저장 시 적용 |

### 파일 경로 정리

| 대상 | 경로 | 관리 주체 |
|------|------|-----------|
| **Claude Code User 설정** | `~/.claude/settings.json` | Claude Code |
| **Claude Code Project 설정** | `.claude/settings.json` | Claude Code |
| **Claude Code Local 설정** | `.claude/settings.local.json` | Claude Code |
| **앱 프리셋** | `~/.claude-history-viewer/presets/` | 우리 앱 |
| **앱 메타데이터** | `~/.claude-history-viewer/user-data.json` | 우리 앱 |

---

## 구현 계획

### Phase 1: 데이터 레이어

**Rust 백엔드** (`src-tauri/src/commands/claude_settings.rs`)

```rust
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

/// Claude Code 설정 스코프
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SettingsScope {
    Managed,
    User,
    Project,
    Local,
}

/// 설정 상태 (기존 MetadataState 패턴 따름)
pub struct ClaudeSettingsState {
    pub cache: Mutex<Option<CachedSettings>>,
}

/// 설정 경로 반환
fn get_settings_path(scope: &SettingsScope, project_path: Option<&str>) -> Result<PathBuf, String> {
    match scope {
        SettingsScope::User => {
            let home = dirs::home_dir().ok_or("Could not find home directory")?;
            Ok(home.join(".claude/settings.json"))
        }
        SettingsScope::Project => {
            let project = project_path.ok_or("Project path required for project scope")?;
            Ok(PathBuf::from(project).join(".claude/settings.json"))
        }
        SettingsScope::Local => {
            let project = project_path.ok_or("Project path required for local scope")?;
            Ok(PathBuf::from(project).join(".claude/settings.local.json"))
        }
        SettingsScope::Managed => {
            // macOS: /Library/Application Support/ClaudeCode/managed-settings.json
            // 읽기 전용
            Err("Managed settings are read-only".into())
        }
    }
}

// Tauri commands (기존 metadata.rs 패턴)
#[tauri::command]
pub async fn read_claude_settings(
    scope: SettingsScope,
    project_path: Option<String>,
) -> Result<Value, String>;

#[tauri::command]
pub async fn write_claude_settings(
    scope: SettingsScope,
    project_path: Option<String>,
    settings: Value,
) -> Result<(), String>;

#[tauri::command]
pub async fn get_merged_settings(
    project_path: Option<String>,
) -> Result<Value, String>;

// 프리셋 commands (~/.claude-history-viewer/presets/ 관리)
#[tauri::command]
pub async fn list_presets() -> Result<Vec<PresetInfo>, String>;

#[tauri::command]
pub async fn save_preset(preset: Preset) -> Result<(), String>;

#[tauri::command]
pub async fn delete_preset(id: String) -> Result<(), String>;

#[tauri::command]
pub async fn apply_preset(
    id: String,
    scope: SettingsScope,
    project_path: Option<String>,
) -> Result<(), String>;
```

**TypeScript 타입** (`src/types/claudeSettings.ts`)

```typescript
/** Claude Code 설정 스코프 */
export type SettingsScope = 'managed' | 'user' | 'project' | 'local';

/** Permission 규칙 */
export interface PermissionsConfig {
  allow?: string[];
  deny?: string[];
  ask?: string[];
}

/** Claude Code 설정 (전체) */
export interface ClaudeCodeSettings {
  // 기본 설정
  model?: string;
  customApiKeyResponsibleUse?: boolean;

  // 권한 설정
  permissions?: PermissionsConfig;

  // 훅 설정
  hooks?: Record<string, HookConfig[]>;

  // MCP 서버
  mcpServers?: Record<string, McpServerConfig>;

  // 기타
  env?: Record<string, string>;
}

/** 프리셋 */
export interface Preset {
  id: string;                    // 'builtin:balanced' | 'custom:uuid'
  name: string;
  icon: string;                  // 이모지
  description?: string;
  type: 'builtin' | 'custom';
  basedOn?: string;              // 복제 원본
  createdAt?: string;
  updatedAt?: string;
  settings: Partial<ClaudeCodeSettings>;
}

/** 프리셋 목록 아이템 (경량) */
export interface PresetInfo {
  id: string;
  name: string;
  icon: string;
  type: 'builtin' | 'custom';
}
```

**Zustand Slice** (`src/store/slices/claudeSettingsSlice.ts`)

```typescript
// 기존 metadataSlice 패턴 따름
export interface ClaudeSettingsSliceState {
  /** 스코프별 설정 캐시 */
  settingsCache: Record<SettingsScope, ClaudeCodeSettings | null>;
  /** 병합된 설정 (현재 프로젝트 기준) */
  mergedSettings: ClaudeCodeSettings | null;
  /** 프리셋 목록 */
  presets: PresetInfo[];
  /** 현재 적용된 프리셋 ID */
  activePresetId: string | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 */
  error: string | null;
}

export interface ClaudeSettingsSliceActions {
  loadSettings: (scope: SettingsScope, projectPath?: string) => Promise<void>;
  saveSettings: (scope: SettingsScope, settings: ClaudeCodeSettings, projectPath?: string) => Promise<void>;
  loadMergedSettings: (projectPath?: string) => Promise<void>;
  loadPresets: () => Promise<void>;
  applyPreset: (presetId: string, scope: SettingsScope, projectPath?: string) => Promise<void>;
  saveAsPreset: (name: string, icon: string) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
}
```

### Phase 2: UI 컴포넌트

**파일 구조:**
```
src/components/SettingsManager/
├── index.ts                     ← 배럴 export
├── SettingsManager.tsx          ← 메인 컨테이너
├── components/
│   ├── PresetSelector.tsx       ← 프리셋 카드 그리드 (Surface)
│   ├── PresetCard.tsx           ← 개별 프리셋 카드
│   ├── FineTunePanel.tsx        ← 슬라이더 UI (Detail)
│   ├── ProtectedFilesList.tsx   ← 보호 파일 목록
│   ├── JsonEditor.tsx           ← Monaco 기반 편집기 (Raw)
│   ├── ScopeTabs.tsx            ← User/Project/Local 탭
│   └── CreatePresetModal.tsx    ← 프리셋 생성 다이얼로그
├── hooks/
│   ├── useClaudeSettings.ts     ← 설정 CRUD (store 연결)
│   ├── usePresets.ts            ← 프리셋 관리
│   └── useSettingsSync.ts       ← Visual ↔ JSON 양방향 동기화
└── utils/
    ├── sliderToRules.ts         ← 슬라이더 값 → permission 규칙 변환
    ├── rulesToSlider.ts         ← permission 규칙 → 슬라이더 값 역변환
    └── settingsMerger.ts        ← 스코프 병합 로직
```

**기존 UI 컴포넌트 재사용:**

| 기존 컴포넌트 | 위치 | Settings Manager 사용 |
|--------------|------|----------------------|
| `Card` variants | `ui/card.tsx` | PresetCard (glass, interactive) |
| `Button` | `ui/button.tsx` | 모든 버튼 |
| `Tabs` | `ui/tabs.tsx` | ScopeTabs |
| `Dialog` | `ui/dialog.tsx` | CreatePresetModal |
| `Slider` | (신규 필요) | FineTunePanel |
| `Switch` | (신규 필요) | 토글 옵션 |

**스타일 일관성** (기존 앱 분석 기반):
```typescript
// 기존 AnalyticsDashboard 색상 시스템 참고
const scopeColors = {
  user: 'text-blue-400',      // 개인
  project: 'text-green-400',  // 팀 공유
  local: 'text-orange-400',   // 로컬 전용
};

// 기존 Card variants 사용
<Card variant="glass">       // 프리셋 카드
<Card variant="interactive"> // 클릭 가능한 카드
```

### Phase 3: 양방향 동기화

```typescript
// useSettingsSync.ts
export function useSettingsSync() {
  const [visualState, setVisualState] = useState<VisualSettings>();
  const [jsonState, setJsonState] = useState<string>();

  // Visual → JSON
  useEffect(() => {
    if (visualState) {
      const json = visualToJson(visualState);
      setJsonState(JSON.stringify(json, null, 2));
    }
  }, [visualState]);

  // JSON → Visual
  useEffect(() => {
    if (jsonState) {
      try {
        const parsed = JSON.parse(jsonState);
        const visual = jsonToVisual(parsed);
        setVisualState(visual);
      } catch (e) {
        // JSON 파싱 에러 표시
      }
    }
  }, [jsonState]);

  return { visualState, setVisualState, jsonState, setJsonState };
}
```

---

## 우선순위

| 순위 | 기능 | 대상 사용자 |
|------|------|-------------|
| 1 | Built-in 프리셋 3개 | 일반 (60%) |
| 2 | Fine Tune 슬라이더 | 중간 (25%) |
| 3 | 커스텀 프리셋 저장/불러오기 | 중간 (25%) |
| 4 | JSON 에디터 | 파워 (15%) |
| 5 | 스코프 전환 (User/Project/Local) | 파워 (15%) |

---

## 파일 구조 (최종)

```
src/
├── components/
│   └── SettingsManager/
│       ├── index.ts
│       ├── SettingsManager.tsx
│       ├── components/
│       │   ├── PresetSelector.tsx
│       │   ├── PresetCard.tsx
│       │   ├── FineTunePanel.tsx
│       │   ├── ProtectedFilesList.tsx
│       │   ├── JsonEditor.tsx
│       │   ├── ScopeTabs.tsx
│       │   └── CreatePresetModal.tsx
│       ├── hooks/
│       │   ├── useClaudeSettings.ts
│       │   ├── usePresets.ts
│       │   └── useSettingsSync.ts
│       └── utils/
│           ├── sliderToRules.ts
│           ├── rulesToSlider.ts
│           └── settingsMerger.ts
├── store/
│   └── slices/
│       └── claudeSettingsSlice.ts    ← 신규 (기존 패턴 따름)
├── types/
│   └── claudeSettings.ts             ← 신규
├── data/
│   └── builtInPresets.ts             ← 신규
└── i18n/locales/
    └── *.json                        ← settingsManager.* 키 추가

src-tauri/src/
├── commands/
│   ├── mod.rs                        ← claude_settings 모듈 추가
│   └── claude_settings.rs            ← 신규
├── models/
│   ├── mod.rs                        ← claude_settings 모듈 추가
│   └── claude_settings.rs            ← 신규 (Rust 타입 정의)
└── lib.rs                            ← command 등록
```

### Store 통합

기존 `useAppStore.ts`에 slice 추가:

```typescript
// src/store/useAppStore.ts
import { createClaudeSettingsSlice } from './slices/claudeSettingsSlice';

export const useAppStore = create<FullAppStore>()(
  devtools(
    (...a) => ({
      ...createProjectSlice(...a),
      ...createSessionSlice(...a),
      ...createSearchSlice(...a),
      ...createSettingsSlice(...a),
      ...createMetadataSlice(...a),
      ...createClaudeSettingsSlice(...a),  // ← 추가
    }),
    { name: 'app-store' }
  )
);
```

### Tauri Command 등록

```rust
// src-tauri/src/lib.rs
mod commands;
use commands::claude_settings::*;

fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // 기존 commands...
            read_claude_settings,
            write_claude_settings,
            get_merged_settings,
            list_presets,
            save_preset,
            delete_preset,
            apply_preset,
        ])
        // ...
}
```

---

## 참고 자료

- [Claude Code Settings Documentation](https://code.claude.com/docs/en/settings)
- [EESEL - Claude Code Permissions Guide](https://www.eesel.ai/blog/claude-code-permissions)
- [EESEL - Claude Code Configuration Guide](https://www.eesel.ai/blog/claude-code-configuration)
- [Korny's Blog - Better Claude Code Permissions](https://blog.korny.info/2025/10/10/better-claude-code-permissions)
- [GitHub - ykdojo/claude-code-tips](https://github.com/ykdojo/claude-code-tips)
- [GitHub - affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
