# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript type-check + Vite production build
npm run preview    # Preview production build locally
```

No test runner is configured. No linting (ESLint) or pre-commit hooks are set up.

## Architecture

Quill is a minimalist markdown writing app built with React 18 + Vite. The current codebase is an early-stage implementation — many features in `minimalist-writing-app-spec.md` are not yet built.

### Data Flow

```
User types → Editor (CodeMirror 6)
  → onChange → updateDocument (Zustand)
  → MainLayout re-renders
  → Preview (unified/remark/rehype) → HTML via dangerouslySetInnerHTML
```

### State Management

All state lives in `src/store/useDocumentStore.ts` (Zustand). There is **no persistence layer yet** — state is lost on page refresh. The store holds `documents[]`, `folders[]`, and `activeDocumentId`, with `updatedAt` auto-set on every `updateDocument` call.

### Editor Architecture

`Editor.tsx` wraps CodeMirror 6 and exposes an imperative `applyAction(action)` ref method for formatting. `MainLayout` holds the ref and passes it down; `Toolbar` triggers it via an `onAction` callback. The custom CodeMirror theme hides markdown syntax characters (`.cm-formatting { display: none }`) to reduce visual noise.

Editor modes (`'source' | 'split' | 'preview'`) are local state in `MainLayout`, not in the Zustand store.

### Theming

CSS variables for light/dark themes are defined in `src/index.css` and toggled via `data-theme="dark"` on the document root. Tailwind `tailwind.config.cjs` maps these variables to color utilities. Fonts: Lora (editor body), DM Sans (UI), JetBrains Mono (code) — loaded via Google Fonts in `index.html`.

### Path Alias

`@/` maps to `src/` (configured in both `tsconfig.json` and `vite.config.ts`).

## Key Gaps (per spec)

- No localStorage/IndexedDB persistence
- No folder hierarchy in UI (types defined, store not wired)
- No settings UI (`src/types/settings.ts` defines the shape)
- No search, export, encryption, or cloud sync
- `src/hooks/`, `src/utils/`, `src/components/ui/` are empty placeholders
