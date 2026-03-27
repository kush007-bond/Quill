// tableExtension.ts
// CodeMirror 6 extension that renders markdown tables as real, editable HTML tables.
// Drop this file into your project and import `tableExtension` into your CM setup.

import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { EditorState, Range, Extension } from "@codemirror/state";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedTable {
  headers: string[];
  alignments: ("left" | "center" | "right" | "none")[];
  rows: string[][];
}

interface TableRange {
  from: number;
  to: number;
  table: ParsedTable;
}

// ─── Markdown Table Parser ───────────────────────────────────────────────────

function parseCellContent(raw: string): string {
  return raw.trim();
}

function parseAlignment(sep: string): "left" | "center" | "right" | "none" {
  const trimmed = sep.trim();
  const left = trimmed.startsWith(":");
  const right = trimmed.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  if (left) return "left";
  return "none";
}

function parseRow(line: string): string[] | null {
  // Strip leading/trailing pipes and split
  let trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  trimmed = trimmed.slice(1, -1); // remove outer pipes
  return trimmed.split("|").map(parseCellContent);
}

function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;
  const inner = trimmed.slice(1, -1);
  const cells = inner.split("|");
  return cells.every((c) => /^\s*:?-{1,}:?\s*$/.test(c));
}

function parseMarkdownTable(text: string): ParsedTable | null {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null; // need at least header + separator

  // First line = headers
  const headers = parseRow(lines[0]);
  if (!headers || headers.length === 0) return null;

  // Second line = separator (alignment)
  if (!isSeparatorRow(lines[1])) return null;
  const sepCells = lines[1].trim().slice(1, -1).split("|");
  const alignments = sepCells.map(parseAlignment);

  // Remaining lines = data rows
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (!row) break; // stop at first non-table line
    // Pad or trim to match header count
    while (row.length < headers.length) row.push("");
    if (row.length > headers.length) row.length = headers.length;
    rows.push(row);
  }

  return { headers, alignments, rows };
}

// ─── Find Tables in Document ─────────────────────────────────────────────────

function findTables(state: EditorState): TableRange[] {
  const doc = state.doc;
  const text = doc.toString();
  const results: TableRange[] = [];

  // Regex to find blocks of consecutive lines starting with |
  const tableBlockRegex = /(?:^|\n)((?:\|[^\n]*\|[ \t]*\n?){2,})/g;
  let match: RegExpExecArray | null;

  while ((match = tableBlockRegex.exec(text)) !== null) {
    const block = match[1].trimEnd();
    const startOffset = match.index + (match[0].startsWith("\n") ? 1 : 0);

    const parsed = parseMarkdownTable(block);
    if (parsed) {
      // Calculate exact end: header + separator + data rows
      const lines = block.split("\n").filter((l) => l.trim().length > 0);
      const usedLines = 2 + parsed.rows.length; // header + sep + rows
      const usedText = lines.slice(0, usedLines).join("\n");
      const endOffset = startOffset + usedText.length;

      results.push({
        from: startOffset,
        to: endOffset,
        table: parsed,
      });
    }
  }

  return results;
}

// ─── Table Widget ────────────────────────────────────────────────────────────

class TableWidget extends WidgetType {
  constructor(
    private table: ParsedTable,
    private tableFrom: number,
    private tableTo: number
  ) {
    super();
  }

  eq(other: TableWidget): boolean {
    return (
      this.tableFrom === other.tableFrom &&
      this.tableTo === other.tableTo &&
      JSON.stringify(this.table) === JSON.stringify(other.table)
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "cm-table-widget";
    wrapper.setAttribute("data-table-from", String(this.tableFrom));

    const table = document.createElement("table");
    table.className = "cm-rendered-table";

    const colCount = this.table.headers.length;

    // Colgroup for equal widths
    const colgroup = document.createElement("colgroup");
    for (let i = 0; i < colCount; i++) {
      const col = document.createElement("col");
      col.style.width = `${100 / colCount}%`;
      colgroup.appendChild(col);
    }
    table.appendChild(colgroup);

    // Header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    this.table.headers.forEach((h, colIdx) => {
      const th = document.createElement("th");
      th.textContent = h;
      th.contentEditable = "true";
      th.spellcheck = false;
      th.setAttribute("data-row", "-1");
      th.setAttribute("data-col", String(colIdx));
      this.applyAlignment(th, colIdx);
      this.attachCellEvents(th, view, -1, colIdx);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    this.table.rows.forEach((row, rowIdx) => {
      const tr = document.createElement("tr");
      row.forEach((cell, colIdx) => {
        const td = document.createElement("td");
        td.textContent = cell;
        td.contentEditable = "true";
        td.spellcheck = false;
        td.setAttribute("data-row", String(rowIdx));
        td.setAttribute("data-col", String(colIdx));
        this.applyAlignment(td, colIdx);
        this.attachCellEvents(td, view, rowIdx, colIdx);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Toolbar: add row / add column / delete row / delete column
    const toolbar = document.createElement("div");
    toolbar.className = "cm-table-toolbar";

    const addRowBtn = this.makeButton("+ Row", () =>
      this.addRow(view)
    );
    const addColBtn = this.makeButton("+ Column", () =>
      this.addColumn(view)
    );
    const delRowBtn = this.makeButton("− Row", () =>
      this.deleteRow(view)
    );
    const delColBtn = this.makeButton("− Column", () =>
      this.deleteColumn(view)
    );

    toolbar.append(addRowBtn, addColBtn, delRowBtn, delColBtn);

    wrapper.appendChild(table);
    wrapper.appendChild(toolbar);
    return wrapper;
  }

  private applyAlignment(el: HTMLElement, colIdx: number) {
    const align = this.table.alignments[colIdx] || "none";
    if (align !== "none") {
      el.style.textAlign = align;
    }
  }

  private makeButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "cm-table-btn";
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  private attachCellEvents(
    cell: HTMLElement,
    view: EditorView,
    rowIdx: number,
    colIdx: number
  ) {
    // On blur, sync the cell content back to the markdown source
    cell.addEventListener("blur", () => {
      const newContent = cell.textContent || "";
      this.updateCell(view, rowIdx, colIdx, newContent);
    });

    // Prevent CM from stealing focus
    cell.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    // Handle Tab / Shift+Tab navigation between cells
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        const allCells = cell
          .closest(".cm-table-widget")!
          .querySelectorAll<HTMLElement>("td, th");
        const arr = Array.from(allCells);
        const idx = arr.indexOf(cell);
        const next = e.shiftKey ? idx - 1 : idx + 1;
        if (next >= 0 && next < arr.length) {
          cell.blur(); // trigger save
          arr[next].focus();
          // Select all text in next cell
          const range = document.createRange();
          range.selectNodeContents(arr[next]);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
      }
    });
  }

  // ─── Markdown Rebuilders ─────────────────────────────────────────────────

  private rebuildMarkdown(table: ParsedTable): string {
    const colCount = table.headers.length;
    const lines: string[] = [];

    // Header line
    lines.push("| " + table.headers.map((h) => padCell(h)).join(" | ") + " |");

    // Separator line
    const seps = table.alignments.map((a) => {
      const base = "--------";
      if (a === "center") return ":" + base.slice(1, -1) + ":";
      if (a === "right") return base.slice(0, -1) + ":";
      if (a === "left") return ":" + base.slice(1);
      return base;
    });
    lines.push("| " + seps.join(" | ") + " |");

    // Data rows
    table.rows.forEach((row) => {
      const padded = row.map((c) => padCell(c));
      while (padded.length < colCount) padded.push(padCell(""));
      lines.push("| " + padded.join(" | ") + " |");
    });

    return lines.join("\n");
  }

  private updateCell(
    view: EditorView,
    rowIdx: number,
    colIdx: number,
    newContent: string
  ) {
    // Clone the table data
    const updated: ParsedTable = JSON.parse(JSON.stringify(this.table));

    if (rowIdx === -1) {
      // Header
      updated.headers[colIdx] = newContent;
    } else {
      updated.rows[rowIdx][colIdx] = newContent;
    }

    const newMarkdown = this.rebuildMarkdown(updated);

    view.dispatch({
      changes: { from: this.tableFrom, to: this.tableTo, insert: newMarkdown },
    });
  }

  private addRow(view: EditorView) {
    const updated: ParsedTable = JSON.parse(JSON.stringify(this.table));
    const emptyRow = new Array(updated.headers.length).fill("");
    updated.rows.push(emptyRow);

    const newMarkdown = this.rebuildMarkdown(updated);
    view.dispatch({
      changes: { from: this.tableFrom, to: this.tableTo, insert: newMarkdown },
    });
  }

  private addColumn(view: EditorView) {
    const updated: ParsedTable = JSON.parse(JSON.stringify(this.table));
    updated.headers.push(`Column ${updated.headers.length + 1}`);
    updated.alignments.push("none");
    updated.rows.forEach((row) => row.push(""));

    const newMarkdown = this.rebuildMarkdown(updated);
    view.dispatch({
      changes: { from: this.tableFrom, to: this.tableTo, insert: newMarkdown },
    });
  }

  private deleteRow(view: EditorView) {
    if (this.table.rows.length === 0) return;
    const updated: ParsedTable = JSON.parse(JSON.stringify(this.table));
    updated.rows.pop();

    const newMarkdown = this.rebuildMarkdown(updated);
    view.dispatch({
      changes: { from: this.tableFrom, to: this.tableTo, insert: newMarkdown },
    });
  }

  private deleteColumn(view: EditorView) {
    if (this.table.headers.length <= 1) return;
    const updated: ParsedTable = JSON.parse(JSON.stringify(this.table));
    updated.headers.pop();
    updated.alignments.pop();
    updated.rows.forEach((row) => row.pop());

    const newMarkdown = this.rebuildMarkdown(updated);
    view.dispatch({
      changes: { from: this.tableFrom, to: this.tableTo, insert: newMarkdown },
    });
  }

  ignoreEvent(event: Event): boolean {
    // Let all events through to the widget (clicks, keys, etc.)
    return true;
  }
}

function padCell(content: string, minWidth = 8): string {
  return content.padEnd(minWidth, " ");
}

// ─── View Plugin ─────────────────────────────────────────────────────────────

const tablePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const ranges: Range<Decoration>[] = [];
      const tables = findTables(view.state);

      for (const t of tables) {
        const widget = new TableWidget(t.table, t.from, t.to);
        ranges.push(
          Decoration.replace({
            widget,
            block: true,
          }).range(t.from, t.to)
        );
      }

      return Decoration.set(ranges, true);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const tableStyles = EditorView.baseTheme({
  ".cm-table-widget": {
    margin: "12px 0",
    maxWidth: "100%",
    overflowX: "auto",
  },
  ".cm-rendered-table": {
    width: "100%",
    borderCollapse: "collapse",
    border: "2px solid var(--table-border, #444)",
    fontFamily: "inherit",
    fontSize: "14px",
    tableLayout: "fixed",
  },
  ".cm-rendered-table th, .cm-rendered-table td": {
    border: "1px solid var(--table-border, #444)",
    padding: "8px 12px",
    minWidth: "60px",
    verticalAlign: "top",
    outline: "none",
    lineHeight: "1.5",
    wordWrap: "break-word",
    overflowWrap: "break-word",
  },
  ".cm-rendered-table th": {
    backgroundColor: "var(--table-header-bg, #2a2a2a)",
    fontWeight: "600",
    color: "var(--table-header-fg, #e0e0e0)",
  },
  ".cm-rendered-table td": {
    backgroundColor: "var(--table-cell-bg, transparent)",
    color: "var(--table-cell-fg, inherit)",
  },
  ".cm-rendered-table tr:nth-child(even) td": {
    backgroundColor: "var(--table-stripe-bg, rgba(255,255,255,0.03))",
  },
  ".cm-rendered-table td:focus, .cm-rendered-table th:focus": {
    boxShadow: "inset 0 0 0 2px var(--table-focus, #4a9eff)",
    backgroundColor: "var(--table-focus-bg, rgba(74,158,255,0.08))",
  },
  ".cm-table-toolbar": {
    display: "flex",
    gap: "6px",
    marginTop: "6px",
    flexWrap: "wrap",
  },
  ".cm-table-btn": {
    padding: "3px 10px",
    fontSize: "12px",
    border: "1px solid var(--table-border, #444)",
    borderRadius: "4px",
    backgroundColor: "var(--table-btn-bg, #1e1e1e)",
    color: "var(--table-btn-fg, #ccc)",
    cursor: "pointer",
    lineHeight: "1.4",
    "&:hover": {
      backgroundColor: "var(--table-btn-hover-bg, #333)",
    },
  },
});

// ─── CSS Variable Setup (call this or set vars in your own CSS) ──────────────

/**
 * Optional helper: injects CSS variables for light/dark modes.
 * You can skip this and define the vars in your own stylesheet instead.
 */
export const tableThemeVars = EditorView.theme({
  "&.cm-editor": {
    "--table-border": "#3a3a3a",
    "--table-header-bg": "#252528",
    "--table-header-fg": "#e0e0e0",
    "--table-cell-bg": "transparent",
    "--table-cell-fg": "inherit",
    "--table-stripe-bg": "rgba(255,255,255,0.025)",
    "--table-focus": "#4a9eff",
    "--table-focus-bg": "rgba(74,158,255,0.08)",
    "--table-btn-bg": "#1a1a1e",
    "--table-btn-fg": "#bbb",
    "--table-btn-hover-bg": "#2a2a2e",
  },
});

// Light mode overrides — apply conditionally or via a separate theme
export const tableThemeVarsLight = EditorView.theme({
  "&.cm-editor": {
    "--table-border": "#d0d0d0",
    "--table-header-bg": "#f0f0f3",
    "--table-header-fg": "#1a1a1a",
    "--table-cell-bg": "transparent",
    "--table-cell-fg": "inherit",
    "--table-stripe-bg": "rgba(0,0,0,0.025)",
    "--table-focus": "#2563eb",
    "--table-focus-bg": "rgba(37,99,235,0.08)",
    "--table-btn-bg": "#f5f5f5",
    "--table-btn-fg": "#444",
    "--table-btn-hover-bg": "#e5e5e5",
  },
});

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Main extension — add this to your CodeMirror extensions array.
 *
 * Usage:
 *   import { tableExtension } from "./tableExtension";
 *
 *   const view = new EditorView({
 *     extensions: [
 *       // ...your other extensions
 *       tableExtension(),
 *     ],
 *   });
 *
 * @param mode - "dark" | "light" — picks matching CSS variable set
 */
export function tableExtension(mode: "dark" | "light" = "dark"): Extension {
  return [
    tablePlugin,
    tableStyles,
    mode === "dark" ? tableThemeVars : tableThemeVarsLight,
  ];
}

/**
 * Helper to insert a fresh 3×3 table at the current cursor position.
 *
 * Usage:
 *   import { insertTable } from "./tableExtension";
 *   // wire to a toolbar button:
 *   <button onClick={() => insertTable(editorView)}>Insert Table</button>
 */
export function insertTable(
  view: EditorView,
  cols = 3,
  rows = 3
): void {
  const headers = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);
  const sep = Array.from({ length: cols }, () => "--------");
  const emptyRow = Array.from({ length: cols }, () => "Cell    ");

  const lines = [
    "| " + headers.map((h) => h.padEnd(8)).join(" | ") + " |",
    "| " + sep.join(" | ") + " |",
    ...Array.from({ length: rows }, () =>
      "| " + emptyRow.join(" | ") + " |"
    ),
  ];

  const cursor = view.state.selection.main.head;
  const insert = "\n" + lines.join("\n") + "\n";

  view.dispatch({
    changes: { from: cursor, insert },
    selection: { anchor: cursor + insert.length },
  });

  view.focus();
}
