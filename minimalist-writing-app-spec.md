# ✍️ Quill — Minimalist Writing App
### Product Requirements Document · Technical Requirements Document · Design System

> *"The best tool disappears. Only the words remain."*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Requirements Document (PRD)](#2-product-requirements-document-prd)
3. [Technical Requirements Document (TRD)](#3-technical-requirements-document-trd)
4. [Feature Catalogue](#4-feature-catalogue)
5. [Design System](#5-design-system)
   - Typography
   - Color Theory & Palette
   - Design Style & Philosophy

---

## 1. Executive Summary

**Product Name:** Quill
**Category:** Productivity / Writing Tools
**Tagline:** *Write deeply. Ship freely.*
**Target Platforms:** Web (PWA), Desktop (Electron), iOS, Android
**Primary Audience:** Writers, bloggers, novelists, researchers, developers, students, and knowledge workers who need a focused environment to produce long-form content.

**Core Problem:**
Modern writing tools are either feature-bloated (Google Docs, Notion) and full of distractions, or too opinionated and locked into their own ecosystems. Writers lose focus, flow, and ultimately output.

**Core Solution:**
A distraction-free, markdown-native writing environment that prioritises the writing experience above all else — with power features hidden until needed, never in the way.

---

## 2. Product Requirements Document (PRD)

### 2.1 Vision & Goals

| Goal | Description |
|------|-------------|
| **Focus First** | The interface should fade away; only text remains |
| **Markdown Native** | Markdown is a first-class citizen, not an afterthought |
| **Speed** | App opens in under 1 second; zero loading screens for local files |
| **Portability** | Files are plain `.md` — no vendor lock-in, no proprietary formats |
| **Privacy** | Local-first architecture; cloud sync is opt-in, never mandatory |
| **Extensibility** | Plugin/theme system for power users |

---

### 2.2 User Personas

#### 🧑‍💻 The Developer-Writer (Alex, 31)
> Writes technical blogs, documentation, and changelogs. Needs code block syntax highlighting, Git-friendly file structure, and keyboard-only navigation.

#### 📖 The Novelist (Maya, 44)
> Writing a 90,000-word novel in chapters. Needs document organisation, word count targets, full-screen immersion, and minimal visual interruption.

#### 🎓 The Researcher (Priya, 26)
> Academic writing, note-taking, and reference management. Needs footnotes, citations, tables, and export to PDF/Word.

#### 📝 The Journaller (Sam, 22)
> Daily entries, mood tracking, and private writing. Needs streak tracking, calendar view, encryption, and templates.

---

### 2.3 User Stories

#### Core Writing
- As a writer, I want to open the app and immediately start typing with no modal dialogs, so I can capture thoughts instantly.
- As a writer, I want real-time markdown preview so I can see how my document looks as I write.
- As a writer, I want to toggle between source, split, and preview modes with a single keystroke.
- As a writer, I want auto-save every few seconds so I never lose work.

#### Organisation
- As a writer, I want to organise documents into folders/notebooks so I can keep projects separate.
- As a writer, I want to tag documents so I can find them across projects.
- As a writer, I want to search across all my documents by content or title.

#### Focus & Flow
- As a writer, I want a full-screen focus mode that hides all UI chrome.
- As a writer, I want a typewriter mode that keeps my cursor centred on screen.
- As a writer, I want ambient sound options (rain, café, white noise) to help me concentrate.
- As a writer, I want session timers (Pomodoro) to structure my writing time.

#### Goals & Progress
- As a writer, I want to set a daily word count goal and see my progress.
- As a writer, I want a writing streak to keep me motivated.

#### Publishing & Export
- As a writer, I want to export documents to PDF, HTML, DOCX, and ePub.
- As a blogger, I want to publish directly to Ghost, Medium, or Dev.to.

---

### 2.4 Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| **Performance** | < 100ms keystroke-to-render latency |
| **Startup Time** | < 1 second cold start (desktop) |
| **Offline** | 100% functional without internet |
| **File Compatibility** | Plain `.md` files, UTF-8, universal |
| **Accessibility** | WCAG 2.1 AA compliant |
| **Security** | Optional AES-256 encryption at rest |
| **Sync Conflict** | Last-write-wins with conflict copy generation |
| **Max File Size** | Handles 500,000+ word documents without lag |
| **Platforms** | Web (Chrome, Firefox, Safari), macOS, Windows, Linux, iOS, Android |

---

### 2.5 Success Metrics

| Metric | Target |
|--------|--------|
| Daily Active Users (DAU) | 10,000 within 6 months |
| Session Length | Avg. > 25 minutes |
| Day-7 Retention | > 40% |
| NPS Score | > 60 |
| Words Written Per Session | > 500 words avg. |
| Export / Publish Conversions | > 15% of power users per week |

---

## 3. Technical Requirements Document (TRD)

### 3.1 Technology Stack

#### Frontend (Web & Desktop)
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **React 18** + TypeScript | Ecosystem, performance, familiarity |
| Editor Core | **CodeMirror 6** | Extensible, performant, markdown-aware |
| Markdown Parser | **unified** + **remark** + **rehype** | Best-in-class AST pipeline |
| State Management | **Zustand** | Lightweight, unopinionated |
| Styling | **Tailwind CSS** + CSS Variables | Utility-first with custom design tokens |
| Desktop Shell | **Tauri** (Rust) | Smaller footprint than Electron, native performance |
| PWA | Vite + Workbox | Service worker, offline-first |

#### Backend (Cloud Sync — Optional)
| Layer | Choice | Rationale |
|-------|--------|-----------|
| API | **Hono** (Edge Runtime) | Ultra-fast, Cloudflare Workers compatible |
| Database | **Turso** (libSQL) | Edge SQLite, fast global reads |
| File Storage | **Cloudflare R2** | S3-compatible, cheap egress |
| Auth | **Clerk** | Passwordless, social login, fast integration |
| Real-time Sync | **Yjs** (CRDT) | Conflict-free collaborative sync |

#### Mobile
| Layer | Choice |
|-------|--------|
| Framework | React Native + Expo |
| Editor | Custom CodeMirror port / react-native-markdown-editor |

---

### 3.2 Architecture

```
┌─────────────────────────────────────────────────┐
│                  Quill Client                    │
│                                                  │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  Editor   │  │ File Tree │  │  Preview    │  │
│  │(CodeMirror│  │(Sidebar)  │  │  Panel      │  │
│  │    6)     │  │           │  │  (rehype)   │  │
│  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘  │
│        │              │               │          │
│  ┌─────▼──────────────▼───────────────▼──────┐   │
│  │             Zustand Store                  │   │
│  │   (documents, settings, sync status)      │   │
│  └─────────────────────┬──────────────────────┘  │
│                        │                         │
│  ┌─────────────────────▼──────────────────────┐  │
│  │          Local Storage Layer               │  │
│  │   File System API / IndexedDB / SQLite     │  │
│  └─────────────────────┬──────────────────────┘  │
└────────────────────────│────────────────────────-┘
                         │ (Optional)
                    ┌────▼────┐
                    │  Cloud  │
                    │  Sync   │
                    │  (Yjs)  │
                    └─────────┘
```

---

### 3.3 Data Model

```typescript
interface Document {
  id: string;                    // UUID v4
  title: string;
  content: string;               // Raw markdown
  tags: string[];
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  readingTimeMinutes: number;
  isEncrypted: boolean;
  isFavourite: boolean;
  isPinned: boolean;
  publishedTo?: PublishTarget[];
  frontmatter?: Record<string, unknown>;
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  icon?: string;
  createdAt: Date;
}

interface WritingSession {
  id: string;
  documentId: string;
  startedAt: Date;
  endedAt: Date;
  wordsWritten: number;
  wordsDeleted: number;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'sepia' | 'system';
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  lineWidth: number;           // Max chars per line (e.g. 65–80)
  spellcheck: boolean;
  typewriterMode: boolean;
  focusMode: boolean;
  dailyWordGoal: number;
  ambientSound: AmbientSound | null;
  keyboardShortcuts: Record<string, string>;
  editorMode: 'source' | 'split' | 'preview';
}
```

---

### 3.4 File System Design

```
~/Quill/
├── Documents/
│   ├── Novel Project/
│   │   ├── Chapter 01.md
│   │   ├── Chapter 02.md
│   │   └── _notes.md
│   ├── Blog Posts/
│   │   └── 2025-03-my-post.md
│   └── Journal/
│       └── 2025-03-15.md
├── Templates/
│   ├── blog-post.md
│   └── daily-note.md
├── .quill/
│   ├── settings.json
│   ├── cache.db             (SQLite — metadata, search index)
│   └── sync.log
```

---

### 3.5 Markdown Extensions Supported

| Extension | Syntax |
|-----------|--------|
| Tables | GFM Tables |
| Task Lists | `- [ ] item` |
| Footnotes | `[^1]` |
| Frontmatter | YAML between `---` |
| Math | KaTeX `$...$` / `$$...$$` |
| Mermaid Diagrams | ` ```mermaid ` |
| Code Highlighting | Shiki (200+ languages) |
| Callouts | `> [!NOTE]` (Obsidian style) |
| Wiki Links | `[[Page Name]]` |
| Embed | `![[image.png]]` |
| Citations | `[@author2025]` (Pandoc style) |
| Emoji | `:smile:` |

---

### 3.6 Keyboard Shortcuts (Defaults)

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| New document | `⌘N` | `Ctrl+N` |
| Open file | `⌘O` | `Ctrl+O` |
| Save | `⌘S` | `Ctrl+S` |
| Focus mode | `⌘.` | `Ctrl+.` |
| Toggle sidebar | `⌘\` | `Ctrl+\` |
| Toggle preview | `⌘P` | `Ctrl+P` |
| Bold | `⌘B` | `Ctrl+B` |
| Italic | `⌘I` | `Ctrl+I` |
| Command palette | `⌘K` | `Ctrl+K` |
| Word count panel | `⌘Shift+W` | `Ctrl+Shift+W` |
| Find / Replace | `⌘F` | `Ctrl+F` |
| Typewriter mode | `⌘T` | `Ctrl+T` |
| Export | `⌘E` | `Ctrl+E` |
| Publish | `⌘Shift+P` | `Ctrl+Shift+P` |

---

### 3.7 Security Requirements

- All local files stored as plain UTF-8 markdown (readable without app)
- Optional per-document AES-256-GCM encryption (password-derived via PBKDF2)
- No telemetry unless explicitly opted in
- Cloud sync uses TLS 1.3; tokens stored in OS Keychain
- Encryption keys never leave the device
- GDPR-compliant: full data export + delete on request

---

### 3.8 Performance Targets

| Operation | Target |
|-----------|--------|
| App cold start | < 800ms |
| Keystroke latency | < 16ms (60fps) |
| Markdown re-render | < 50ms |
| Full-text search (10k docs) | < 200ms |
| Export to PDF | < 3s (100-page doc) |
| Sync (100 docs) | < 5s on 4G |
| Memory footprint | < 150MB (desktop) |

---

## 4. Feature Catalogue

### 🖊️ Core Editor

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Markdown Source Mode** | Pure markdown editing with syntax highlighting |
| 2 | **Live Preview Mode** | Side-by-side rendered preview |
| 3 | **Reading / Distraction-Free Mode** | Renders only the document, no UI chrome |
| 4 | **Typewriter Scrolling** | Active line stays vertically centred |
| 5 | **Focus Paragraph Mode** | Dims all paragraphs except current one |
| 6 | **Smart Markdown Shortcuts** | `**` auto-closes bold, `---` renders HR, etc. |
| 7 | **Auto-Pair Brackets** | `(`, `[`, `{`, `"`, `` ` `` auto-pair |
| 8 | **Code Block Syntax Highlighting** | 200+ languages via Shiki |
| 9 | **Inline Math Rendering** | KaTeX for `$x^2$` and display math |
| 10 | **Mermaid Diagram Support** | Flowcharts, sequence, Gantt rendered inline |
| 11 | **Image Paste & Drop** | Drag/paste images, auto-saves locally |
| 12 | **Table Editor** | Visual table creation and column resizing |
| 13 | **Inline Emoji Picker** | `:` triggers emoji autocomplete |
| 14 | **Frontmatter Editor** | YAML/TOML frontmatter side panel |
| 15 | **Multi-Cursor Editing** | `Alt+Click` or `Ctrl+D` for multiple cursors |
| 16 | **Column / Block Selection** | `Alt+Drag` rectangular selection |
| 17 | **Folding / Collapse Sections** | Fold headings and code blocks |
| 18 | **Vim Mode** | Full Vim keybindings toggle |
| 19 | **Emacs Mode** | Emacs keybindings toggle |
| 20 | **Custom Keybindings** | Remap any shortcut |

---

### 📁 File & Organisation

| # | Feature | Description |
|---|---------|-------------|
| 21 | **Folder / Notebook System** | Nested folders with custom colour + icon |
| 22 | **Smart Folders** | Auto-populate based on tags/date/query |
| 23 | **Tagging System** | Multi-tag support with colour coding |
| 24 | **Pinning & Favourites** | Pin important docs to top |
| 25 | **File Versioning / History** | Auto-snapshot every N minutes; diff viewer |
| 26 | **Trash / Recovery** | Soft delete with 30-day recovery window |
| 27 | **Rename In-Place** | Click title to rename without dialog |
| 28 | **Move Between Folders** | Drag-and-drop in sidebar or command palette |
| 29 | **Duplicate Document** | One-click duplication |
| 30 | **Merge Documents** | Append one doc to another |
| 31 | **Archive Mode** | Archive old docs without deleting |
| 32 | **Recently Opened** | Quick access list with timestamps |
| 33 | **Star System** | 1-5 star rating per document |

---

### 🔍 Search & Discovery

| # | Feature | Description |
|---|---------|-------------|
| 34 | **Full-Text Search** | Instant across all documents |
| 35 | **Regex Search** | Power search with regex syntax |
| 36 | **Find & Replace** | In-document with case/whole-word options |
| 37 | **Global Find & Replace** | Across all documents |
| 38 | **Tag Browser** | Visual tag cloud with doc counts |
| 39 | **Calendar View** | Browse docs by creation/edit date |
| 40 | **Command Palette** | `⌘K` for every action — no mouse needed |
| 41 | **Backlinks Panel** | See all docs that link to current doc |
| 42 | **Graph View** | Visual map of inter-document links |
| 43 | **Quick Switcher** | Fuzzy-search open recent files |

---

### 🎯 Focus & Productivity

| # | Feature | Description |
|---|---------|-------------|
| 44 | **Focus Mode** | Full-screen, zero chrome, centred text |
| 45 | **Pomodoro Timer** | Built-in 25/5 timer with notifications |
| 46 | **Custom Session Timer** | Set any work/break interval |
| 47 | **Daily Word Goal** | Set target; animated progress ring |
| 48 | **Session Word Goal** | Per-session target separate from daily |
| 49 | **Writing Streaks** | Daily streak counter with calendar heatmap |
| 50 | **Do Not Disturb Mode** | Suppresses OS notifications while writing |
| 51 | **Ambient Sound Player** | Rain, café, fireplace, lo-fi, white noise, forest |
| 52 | **Custom Sound Upload** | Upload your own ambient audio |
| 53 | **Ambient Volume Control** | Independent volume slider |
| 54 | **Time Blocking** | Schedule writing sessions with reminders |
| 55 | **Distraction Report** | How many times you left the writing window |

---

### 📊 Stats & Analytics

| # | Feature | Description |
|---|---------|-------------|
| 56 | **Live Word Count** | In status bar, updates as you type |
| 57 | **Character Count** | With and without spaces |
| 58 | **Sentence Count** | Useful for readability tracking |
| 59 | **Paragraph Count** | Instant document overview |
| 60 | **Reading Time Estimate** | Based on 200 wpm average |
| 61 | **Writing Speed (WPM)** | Live words-per-minute during session |
| 62 | **Session History** | Log of every writing session |
| 63 | **Heatmap Calendar** | GitHub-style contribution graph for words written |
| 64 | **Weekly Summary** | Words written, sessions, best streak |
| 65 | **All-Time Statistics** | Cumulative words, documents, time spent |
| 66 | **Readability Score** | Flesch-Kincaid, Gunning Fog Index |
| 67 | **Vocabulary Richness** | Type-Token Ratio and unique word count |
| 68 | **Most Productive Hours** | Chart of when you write best |

---

### 🎨 Customisation & Themes

| # | Feature | Description |
|---|---------|-------------|
| 69 | **Built-in Themes** | Light, Dark, Sepia, OLED Black, Nord, Solarized, Gruvbox |
| 70 | **Custom Theme Editor** | Tweak every colour token visually |
| 71 | **Theme Import/Export** | Share themes as JSON |
| 72 | **Font Selection** | Choose editor + UI font separately |
| 73 | **Font Size Control** | Slider from 12px–24px |
| 74 | **Line Height Control** | 1.2 to 2.5 |
| 75 | **Line Width (Measure)** | Set max characters per line (55–90) |
| 76 | **Paragraph Spacing** | Extra space between paragraphs toggle |
| 77 | **Focused Line Highlight** | Current line background colour |
| 78 | **Cursor Style** | Block, line, underline, beam |
| 79 | **Cursor Blink Rate** | Adjustable or off |
| 80 | **Monospace Toggle** | Switch writing area to monospace any time |
| 81 | **Letter Spacing** | Fine-tune tracking |
| 82 | **First Line Indent Toggle** | Classic print-style indented paragraphs |

---

### 📤 Export & Publishing

| # | Feature | Description |
|---|---------|-------------|
| 83 | **Export to PDF** | Print-quality with custom CSS themes |
| 84 | **Export to HTML** | Self-contained single file |
| 85 | **Export to DOCX** | Microsoft Word compatible |
| 86 | **Export to ePub** | For e-readers; cover image support |
| 87 | **Export to LaTeX** | Academic publishing |
| 88 | **Export to RTF** | Legacy word processor compatible |
| 89 | **Export to Plain Text** | Strips all markdown syntax |
| 90 | **Custom Export Templates** | Style PDF/HTML with custom CSS |
| 91 | **Batch Export** | Export entire folder at once |
| 92 | **Publish to Ghost** | One-click Ghost CMS integration |
| 93 | **Publish to Medium** | Via Medium API |
| 94 | **Publish to Dev.to** | Via Dev.to API |
| 95 | **Publish to Substack** | Via Substack integration |
| 96 | **Publish to Hashnode** | Via Hashnode API |
| 97 | **Copy as HTML** | Clipboard-ready rendered HTML |
| 98 | **Copy as Rich Text** | Paste into Gmail / Notion / Docs |
| 99 | **Share Link** | Generate a temporary read-only public URL |
| 100 | **Scheduled Publishing** | Set a publish date/time for a post |

---

### ☁️ Sync & Backup

| # | Feature | Description |
|---|---------|-------------|
| 101 | **Local-First Storage** | Works 100% offline; cloud is optional |
| 102 | **iCloud Sync** | Native macOS/iOS file sync |
| 103 | **Dropbox Sync** | Via Dropbox API |
| 104 | **Google Drive Sync** | Via Google Drive API |
| 105 | **Quill Cloud Sync** | End-to-end encrypted proprietary sync |
| 106 | **Git Integration** | Commit to a Git repo on save |
| 107 | **GitHub Sync** | Sync vault to a GitHub repository |
| 108 | **WebDAV Sync** | Self-hosted server support |
| 109 | **Sync Conflict Resolver** | Visual diff to choose version |
| 110 | **Auto Backup** | Scheduled ZIP backup to local folder |
| 111 | **Export Vault** | Download all documents as ZIP |

---

### 🤝 Collaboration

| # | Feature | Description |
|---|---------|-------------|
| 112 | **Real-Time Collaboration** | Multi-cursor co-editing via Yjs CRDT |
| 113 | **Comments & Annotations** | Inline threaded comments on selections |
| 114 | **Suggestion Mode** | Track changes like Google Docs |
| 115 | **Share Document** | Invite collaborators by email |
| 116 | **Permission Levels** | View / Comment / Edit per collaborator |
| 117 | **Presence Indicators** | See who's editing, where their cursor is |
| 118 | **Shared Workspaces** | Team vaults with shared folder structure |

---

### 🤖 AI Features *(Optional Module)*

| # | Feature | Description |
|---|---------|-------------|
| 119 | **AI Writing Assistant** | Inline suggestions via `/ai` command |
| 120 | **Continue Writing** | AI continues from cursor position |
| 121 | **Rewrite / Improve** | Rephrase selected text |
| 122 | **Summarise** | Condense long selections |
| 123 | **Expand** | Flesh out bullet points into prose |
| 124 | **Tone Adjustment** | Make text more formal / casual / academic |
| 125 | **Grammar Check** | AI-powered grammar and style suggestions |
| 126 | **Outline Generator** | Generate a chapter/article outline |
| 127 | **Title Suggestions** | 5 title options for current doc |
| 128 | **Auto-Tag** | Suggest tags based on document content |
| 129 | **Chat with Doc** | Ask questions about your document |
| 130 | **Translation** | Translate document to any language |

---

### 📱 Mobile-Specific

| # | Feature | Description |
|---|---------|-------------|
| 131 | **Swipe Gestures** | Swipe to open sidebar, close, navigate |
| 132 | **Haptic Feedback** | Subtle haptics on formatting actions |
| 133 | **Floating Markdown Toolbar** | Above keyboard, formatting shortcuts |
| 134 | **Widget (iOS/Android)** | Today's word count on home screen |
| 135 | **Quick Note from Lock Screen** | One-tap note creation |
| 136 | **Share Sheet Integration** | Share from Safari/Chrome into Quill |
| 137 | **Voice Dictation** | Tap mic to dictate |
| 138 | **Handwriting Input** | Apple Pencil / stylus support |

---

### 🔌 Integrations & Extensions

| # | Feature | Description |
|---|---------|-------------|
| 139 | **Plugin System** | Install community plugins from a registry |
| 140 | **Zapier / Make Integration** | Automate workflows |
| 141 | **Readwise Sync** | Import Kindle highlights as notes |
| 142 | **Notion Import** | Import Notion pages as markdown |
| 143 | **Obsidian Vault Import** | One-click import from Obsidian vault |
| 144 | **Bear Import** | Import from Bear notes |
| 145 | **Zotero Integration** | Pull citations from Zotero library |
| 146 | **Grammarly Integration** | Browser extension passthrough |
| 147 | **Open in External Editor** | Open file in VS Code, Typora, etc. |
| 148 | **Custom Webhooks** | Trigger on save/publish events |

---

### 🔒 Privacy & Security

| # | Feature | Description |
|---|---------|-------------|
| 149 | **Per-Document Encryption** | AES-256-GCM with password derivation |
| 150 | **Vault-Level Encryption** | Encrypt entire vault at rest |
| 151 | **Biometric Lock** | Face ID / Touch ID on mobile & Mac |
| 152 | **Auto-Lock Timeout** | Lock after N minutes of inactivity |
| 153 | **Incognito Mode** | Writes to memory only; nothing saved to disk |
| 154 | **Redaction Mode** | Mask sensitive text (names, numbers) |
| 155 | **Audit Log** | Full log of access and changes |

---

### ♿ Accessibility

| # | Feature | Description |
|---|---------|-------------|
| 156 | **Screen Reader Support** | Full ARIA labelling |
| 157 | **High-Contrast Theme** | WCAG AA contrast ratio throughout |
| 158 | **Dyslexia Font** | OpenDyslexic font option |
| 159 | **Reduced Motion Mode** | Disables all animations |
| 160 | **Keyboard-Only Navigation** | 100% operable without a mouse |
| 161 | **Text-to-Speech Playback** | Read document aloud |
| 162 | **Font Weight Control** | Adjustable from Light (200) to Bold (700) |
| 163 | **Line Focus Mode** | Highlight only current line |

---

## 5. Design System

### 5.1 Design Philosophy

**Direction:** *Warm Editorial Minimalism*

Quill's design takes inspiration from the tactile quality of a well-made notebook — cream pages, ink on paper, measured margins. It rejects the clinical coldness of most productivity apps in favour of something that feels *inviting*. The interface should feel like sitting down with a good pen; everything in its place, nothing unnecessary, but never sterile.

> The goal is not to look minimal. The goal is to *feel* minimal.

**Three design principles:**
1. **Negative space is a feature** — generous margins create psychological breathing room
2. **Typography carries the weight** — no icons, gradients, or decorations where good type suffices
3. **Reveal on demand** — UI chrome appears on hover/focus, retreats when you write

---

### 5.2 Typography

All fonts are **free** (Google Fonts or open-source) unless marked *(Freemium)*.

#### Editor / Writing Font
> The most important typographic decision — the user spends 95% of their time reading this font.

| Font | Style | Why |
|------|-------|-----|
| **[Lora](https://fonts.google.com/specimen/Lora)** ⭐ *Primary Recommendation* | Serif | A contemporary serif with roots in calligraphy. Balanced contrast, warm, designed for screens. Feels like writing on paper. |
| **[Crimson Pro](https://fonts.google.com/specimen/Crimson+Pro)** *Alternative* | Serif | Scholarly, elegant, excellent for long-form prose. Inspired by old-style typefaces. |
| **[Newsreader](https://fonts.google.com/specimen/Newsreader)** *Alternative* | Serif | Designed for editorial/reading use. Crisp, optical sizes make it shine in body text. |

**Monospace option (for code/technical writing):**
| Font | Why |
|------|-----|
| **[JetBrains Mono](https://www.jetbrains.com/lp/mono/)** ⭐ | Open source, ligatures, designed for long reading sessions. Minimal eye strain. |

---

#### UI Font
> Used for labels, buttons, sidebar, menus — should be invisible, serving content.

| Font | Style | Why |
|------|-------|-----|
| **[DM Sans](https://fonts.google.com/specimen/DM+Sans)** ⭐ *Primary Recommendation* | Sans-serif | Geometric but warm. Excellent legibility at small sizes. Optical sizing support. |
| **[Geist](https://vercel.com/font)** *Alternative* | Sans-serif | Vercel's open-source font. Precise, modern, great for UI strings. Free. |

---

#### Font Scale

```
Display  (H1): 2.25rem  / 36px  — Lora, weight 700
H2:            1.75rem  / 28px  — Lora, weight 600
H3:            1.375rem / 22px  — Lora, weight 600
H4:            1.125rem / 18px  — DM Sans, weight 600
Body:          1.0625rem / 17px — Lora, weight 400
UI Label:      0.875rem / 14px  — DM Sans, weight 400
Caption:       0.75rem  / 12px  — DM Sans, weight 400
```

**Line heights:**
- Headings: `1.25`
- Body prose: `1.75` *(generous — crucial for readability)*
- UI elements: `1.4`

**Max line width (measure):** `68ch` — the optimal reading line length for prose. Adjustable by user.

---

### 5.3 Color Theory & Palette

#### Theory Foundation

Quill uses an **analogous warm-neutral** palette — colours that live close together on the wheel in the yellow-orange-tan region, creating harmony without boredom. These are then heavily desaturated toward near-neutrals. A single warm **amber/ink accent** is used sparingly for interactive states.

This approach is inspired by the physical writing experience: aged paper, ink, a leather desk pad. Warm neutrals reduce eye strain versus pure white `#FFFFFF` backgrounds, which have been shown to cause more fatigue during extended reading.

---

#### Light Theme — *"Paper"*

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Canvas | `--bg-canvas` | `#F8F5F0` | Writing area background — warm off-white |
| Surface | `--bg-surface` | `#F2EDE6` | Sidebar, panels |
| Overlay | `--bg-overlay` | `#EAE4DC` | Modals, hover states |
| Border | `--border` | `#DDD7CE` | Dividers, input borders |
| Text Primary | `--text-primary` | `#1C1917` | Body copy — near-black, warm |
| Text Secondary | `--text-secondary` | `#5C5248` | Labels, captions |
| Text Muted | `--text-muted` | `#9E9890` | Placeholders, timestamps |
| Accent | `--accent` | `#C2692A` | Links, active states, caret — warm amber |
| Accent Hover | `--accent-hover` | `#A3551F` | Deepened for hover |
| Accent Subtle | `--accent-subtle` | `#F5E8DC` | Highlighted text background |
| Danger | `--danger` | `#C0392B` | Errors, destructive actions |
| Success | `--success` | `#2E7D52` | Saved, synced, published |

---

#### Dark Theme — *"Ink"*

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Canvas | `--bg-canvas` | `#16130F` | Writing area — near-black, warm tint |
| Surface | `--bg-surface` | `#1E1A14` | Sidebar, panels |
| Overlay | `--bg-overlay` | `#2A2419` | Modals, popovers |
| Border | `--border` | `#3A3228` | Dividers |
| Text Primary | `--text-primary` | `#E8E0D4` | Body copy — warm off-white |
| Text Secondary | `--text-secondary` | `#A89E90` | Labels |
| Text Muted | `--text-muted` | `#6B6358` | Placeholders |
| Accent | `--accent` | `#E8884A` | Links, caret — glowing amber |
| Accent Hover | `--accent-hover` | `#F09A62` | Lighter for dark-mode hover |
| Accent Subtle | `--accent-subtle` | `#2E2010` | Highlighted text background |
| Danger | `--danger` | `#E05555` | Errors |
| Success | `--success` | `#4CAF80` | Saved, synced |

---

#### Sepia Theme — *"Manuscript"*

| Role | Token | Hex |
|------|-------|-----|
| Canvas | `--bg-canvas` | `#F4EDDE` |
| Text Primary | `--text-primary` | `#3B2A1A` |
| Accent | `--accent` | `#8B5A2B` |
| Border | `--border` | `#D4C5A9` |

---

#### OLED Black Theme — *"Void"*

| Role | Token | Hex |
|------|-------|-----|
| Canvas | `--bg-canvas` | `#000000` |
| Surface | `--bg-surface` | `#0A0A0A` |
| Text Primary | `--text-primary` | `#E0D9CC` |
| Accent | `--accent` | `#D4845A` |

---

### 5.4 Design Style

#### Style Name: *Warm Editorial Minimalism*

**Influences:**
- iA Writer (focused writing, typographic rigour)
- Notion Calendar (clean UI geometry)
- Craig Mod's reading essays (love of margin, paper, ink)
- Swiss International Typographic Style (grid discipline)

---

#### Spatial System

All spacing follows an **8px base grid**:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight insets (icon padding) |
| `--space-2` | 8px | Base unit |
| `--space-3` | 12px | Small gaps |
| `--space-4` | 16px | Default padding |
| `--space-5` | 24px | Section separation |
| `--space-6` | 32px | Component gaps |
| `--space-8` | 48px | Major section breaks |
| `--space-10` | 64px | Page-level margins |

**Editor side margins:** `--space-10` (64px) minimum, expanding to `auto` on wide screens. This is deliberate — the margin IS the design.

---

#### UI Components

| Element | Style |
|---------|-------|
| **Sidebar** | 240px wide, surface background, no visible border in dark mode — merges with canvas via subtle shadow |
| **Buttons** | Flat, no shadow, 4px border-radius. Primary: accent fill. Secondary: ghost with border. |
| **Inputs** | Bottom-border only (not boxed) — editorial newspaper style |
| **Modals** | Centred, 600px max-width, gentle overlay backdrop `rgba(0,0,0,0.4)` |
| **Tooltips** | Dark pill-shaped, 11px DM Sans, appears after 600ms delay |
| **Status Bar** | 32px footer strip — word count, sync status, reading time. Muted. Barely visible. |
| **Scrollbar** | 4px wide, rounded, accent colour, fades on idle |
| **Selection** | `accent-subtle` background — warm amber glow |
| **Caret** | Accent colour `--accent`, 2px width, gentle blink |

---

#### Motion & Animation

| Type | Duration | Easing |
|------|----------|--------|
| UI panel slide | 200ms | `ease-out` |
| Focus mode transition | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Modal appear | 180ms | `ease-out` |
| Hover states | 120ms | `ease` |
| Typewriter scroll | 150ms | `ease-in-out` |
| Progress ring | 600ms | `ease-in-out` |

**Principle:** Animations should be *perceived* but not *noticed*. If a user consciously registers an animation, it's too long or too dramatic.

---

#### Iconography

- **Library:** [Phosphor Icons](https://phosphoricons.com/) — free, MIT licensed
- **Style:** `Regular` weight for UI, `Light` for decorative
- **Size:** 16px for inline UI, 20px for toolbar, 24px for feature callouts
- **Colour:** Always `--text-secondary` at rest, `--text-primary` on active/hover

---

#### Logo & Wordmark

| Element | Detail |
|---------|--------|
| **Symbol** | A single quill nib drawn as a minimal 2-stroke SVG |
| **Wordmark** | "Quill" in Lora Italic, tracking `-0.02em` |
| **Colour** | Accent `#C2692A` (light) / `#E8884A` (dark) |
| **Usage** | Top-left of sidebar, 24px height |

---

### 5.5 Free Font Resource Summary

| Font | Use | Source | License |
|------|-----|--------|---------|
| Lora | Writing body | Google Fonts | OFL (Free) |
| Crimson Pro | Writing body alt | Google Fonts | OFL (Free) |
| Newsreader | Writing body alt | Google Fonts | OFL (Free) |
| DM Sans | UI elements | Google Fonts | OFL (Free) |
| Geist | UI elements alt | vercel.com/font | OFL (Free) |
| JetBrains Mono | Code blocks | jetbrains.com | OFL (Free) |
| OpenDyslexic | Accessibility | opendyslexic.org | Bitstream (Free) |
| Phosphor Icons | Icons | phosphoricons.com | MIT (Free) |

> ✅ All fonts and icons above are 100% free for commercial use. No freemium limits.

---

*Document version: 1.0 — March 2025*
*Prepared for Quill — Minimalist Writing App*
