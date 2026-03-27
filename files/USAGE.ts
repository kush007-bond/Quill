// ─── USAGE GUIDE ─────────────────────────────────────────────────────────────
//
// This file shows how to integrate tableExtension into your existing
// CodeMirror 6 + React + TypeScript editor setup.
//
// ─────────────────────────────────────────────────────────────────────────────

// 1️⃣  INSTALL — nothing extra needed, it uses @codemirror/view and @codemirror/state
//     which you already have.

// 2️⃣  IMPORT in your editor setup file (wherever you create the EditorView):

import { tableExtension, insertTable } from "./tableExtension";

// 3️⃣  ADD TO EXTENSIONS — drop it into your extensions array:
//
//     const view = new EditorView({
//       state: EditorState.create({
//         doc: initialContent,
//         extensions: [
//           // ... your existing extensions (markdown, keymaps, etc.)
//           tableExtension("dark"),   // or "light" to match your theme
//         ],
//       }),
//       parent: editorContainer,
//     });

// 4️⃣  ADD AN "INSERT TABLE" BUTTON in your toolbar React component:
//
//     import { insertTable } from "./tableExtension";
//
//     function Toolbar({ editorView }: { editorView: EditorView | null }) {
//       return (
//         <button
//           onClick={() => editorView && insertTable(editorView, 3, 3)}
//           title="Insert Table"
//         >
//           <TableIcon />  {/* from lucide-react */}
//           Insert Table
//         </button>
//       );
//     }

// 5️⃣  THEMING — The extension uses CSS custom properties so it works with your
//     existing light/dark toggle. You can override any of these in your own CSS:
//
//     /* In your global CSS or Tailwind @layer */
//     .cm-editor {
//       --table-border: #3a3a3a;
//       --table-header-bg: #252528;
//       --table-header-fg: #e0e0e0;
//       --table-cell-bg: transparent;
//       --table-cell-fg: inherit;
//       --table-stripe-bg: rgba(255,255,255,0.025);
//       --table-focus: #4a9eff;
//       --table-focus-bg: rgba(74,158,255,0.08);
//       --table-btn-bg: #1a1a1e;
//       --table-btn-fg: #bbb;
//       --table-btn-hover-bg: #2a2a2e;
//     }

// 6️⃣  HOW IT WORKS
//
//     a) When the user types or pastes a markdown table:
//        | Name   | Age | Role    |
//        | ------ | --- | ------- |
//        | Alice  | 30  | Engineer|
//
//     b) The extension detects it, hides the raw markdown, and replaces it
//        with a proper HTML <table> rendered inline in the editor.
//
//     c) Each cell is contentEditable — click to edit, Tab to move between cells.
//
//     d) On blur, the cell content is synced back to the underlying markdown,
//        so the source document stays valid markdown at all times.
//
//     e) The toolbar below each table lets users add/remove rows and columns.
//
//     f) insertTable() programmatically inserts a new empty table at the cursor.

// 7️⃣  FULL EXAMPLE — minimal React component wiring:

/*
import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { tableExtension, insertTable } from "./tableExtension";

export default function NoteEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const editorView = new EditorView({
      state: EditorState.create({
        doc: "# My Note\n\nStart typing...\n",
        extensions: [
          keymap.of(defaultKeymap),
          markdown(),
          tableExtension("dark"),  // ← here
        ],
      }),
      parent: containerRef.current,
    });

    setView(editorView);
    return () => editorView.destroy();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => view && insertTable(view, 3, 3)}>
          Insert Table
        </button>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
*/
