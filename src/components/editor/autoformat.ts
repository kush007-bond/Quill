/**
 * autoformat.ts
 * CodeMirror 6 extensions that provide lightweight auto-formatting:
 *
 *  • Smart Enter  — continues list items; empty-item Enter exits the list
 *  • Tab          — indents a list item by 2 spaces
 *  • Shift-Tab    — de-indents a list item by up to 2 spaces
 *  • Smart typo   — replaces `--` with `—` and `...` with `…`
 */

import type { KeyBinding } from '@codemirror/view';
import { EditorView } from '@codemirror/view';

// ── List-prefix detection ─────────────────────────────────────────────────────

interface Prefix { indent: string; prefix: string }

/**
 * If the line starts with a recognized list marker, return the indentation
 * and the continuation prefix to use on the next line.
 * Returns null if the line is not a list item.
 */
function detectPrefix(lineText: string): Prefix | null {
  // Task list  (always continue as unchecked)
  const task = lineText.match(/^(\s*)([-*+] \[[ x]\] )/);
  if (task) return { indent: task[1], prefix: `${task[1]}- [ ] ` };

  // Arrow list
  const arrow = lineText.match(/^(\s*)(→ )/);
  if (arrow) return { indent: arrow[1], prefix: `${arrow[1]}→ ` };

  // Unordered list
  const ul = lineText.match(/^(\s*)([-*+] )/);
  if (ul) return { indent: ul[1], prefix: `${ul[1]}${ul[2]}` };

  // Ordered list — increment the number
  const ol = lineText.match(/^(\s*)(\d+)\. /);
  if (ol) {
    const next = parseInt(ol[2], 10) + 1;
    return { indent: ol[1], prefix: `${ol[1]}${next}. ` };
  }

  return null;
}

/** Returns the text after the list prefix on a line, or the full line if none. */
function contentAfterPrefix(lineText: string): string {
  return lineText
    .replace(/^\s*[-*+] \[[ x]\] /, '')
    .replace(/^\s*→ /, '')
    .replace(/^\s*[-*+] /, '')
    .replace(/^\s*\d+\. /, '');
}

// ── Enter handler ─────────────────────────────────────────────────────────────

function handleEnter(view: EditorView): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  if (from !== to) return false;                  // has selection — let default handle

  const line     = state.doc.lineAt(from);
  const lineText = line.text;
  const info     = detectPrefix(lineText);
  if (!info) return false;

  const content = contentAfterPrefix(lineText).trim();

  if (!content) {
    // Empty list item → remove the prefix, place cursor at indent level
    view.dispatch({
      changes:   { from: line.from, to: line.to, insert: info.indent },
      selection: { anchor: line.from + info.indent.length },
      userEvent: 'input',
    });
    return true;
  }

  // Non-empty item → insert new line with same prefix
  const insert = `\n${info.prefix}`;
  view.dispatch({
    changes:   { from, to: from, insert },
    selection: { anchor: from + insert.length },
    userEvent: 'input',
  });
  return true;
}

// ── Tab / Shift-Tab handlers ──────────────────────────────────────────────────

function handleTab(view: EditorView): boolean {
  const { state } = view;
  const { from } = state.selection.main;
  const line     = state.doc.lineAt(from);
  if (!detectPrefix(line.text)) return false;

  view.dispatch({
    changes:   { from: line.from, to: line.from, insert: '  ' },
    selection: { anchor: from + 2 },
    userEvent: 'input',
  });
  return true;
}

function handleShiftTab(view: EditorView): boolean {
  const { state } = view;
  const { from } = state.selection.main;
  const line     = state.doc.lineAt(from);
  if (!detectPrefix(line.text)) return false;

  const spaces = line.text.match(/^( {1,2})/);
  if (!spaces) return false;

  const n = spaces[1].length;
  view.dispatch({
    changes:   { from: line.from, to: line.from + n, insert: '' },
    selection: { anchor: Math.max(line.from, from - n) },
    userEvent: 'input',
  });
  return true;
}

// ── Exported keymap ───────────────────────────────────────────────────────────

export const autoformatKeymap: readonly KeyBinding[] = [
  { key: 'Enter',     run: handleEnter    },
  { key: 'Tab',       run: handleTab      },
  { key: 'Shift-Tab', run: handleShiftTab },
];

// ── Smart typography (input handler) ─────────────────────────────────────────
// Runs on every character typed; returns true to swallow the input and replace it.

export const smartTypography = EditorView.inputHandler.of(
  (view, from, _to, text) => {
    if (text.length !== 1) return false;

    const doc = view.state.doc;

    // `--` → `—`  (em dash)
    if (text === '-') {
      const prev = from >= 1 ? doc.sliceString(from - 1, from) : '';
      if (prev === '-') {
        view.dispatch({
          changes:   { from: from - 1, to: from, insert: '—' },
          selection: { anchor: from },        // cursor after the em dash
          userEvent: 'input.smarttype',
        });
        return true;
      }
    }

    // `...` → `…`  (ellipsis)
    if (text === '.') {
      const prev2 = from >= 2 ? doc.sliceString(from - 2, from) : '';
      if (prev2 === '..') {
        view.dispatch({
          changes:   { from: from - 2, to: from, insert: '…' },
          selection: { anchor: from - 1 },    // cursor after the ellipsis
          userEvent: 'input.smarttype',
        });
        return true;
      }
    }

    return false;
  }
);
