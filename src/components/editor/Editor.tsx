import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { ViewPlugin, Decoration, ViewUpdate, keymap } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { autoformatKeymap, smartTypography } from './autoformat';
import { ImageWidget } from './widgets';
import { tableExtension, insertTable } from './tableExtension';
import { markdown } from '@codemirror/lang-markdown';
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface EditorHandle {
  applyAction: (action: string) => void;
  insertText: (text: string) => void;
}

// ── Custom highlight style — adds named CSS classes for theme to target ───────
const mdHighlight = HighlightStyle.define([
  { tag: t.url,       class: 'cm-md-url'  },
  { tag: t.monospace, class: 'cm-md-code' },
  { tag: t.link,      class: 'cm-md-link' },
]);

// ── HeaderMark (#) is always hidden — font size conveys the level ─────────────
const ALWAYS_HIDE = new Set(['HeaderMark']);

// ── These marks are hidden on every line except the cursor's line ─────────────
const HIDE_AWAY = new Set(['EmphasisMark', 'StrikethroughMark', 'CodeMark', 'LinkMark']);

// ── ATX heading node → CSS class added to the whole line ─────────────────────
const HEADING_CLASS: Record<string, string> = {
  ATXHeading1: 'cm-h1',
  ATXHeading2: 'cm-h2',
  ATXHeading3: 'cm-h3',
  ATXHeading4: 'cm-h4',
  ATXHeading5: 'cm-h5',
  ATXHeading6: 'cm-h6',
};

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const cursorLine = state.doc.lineAt(state.selection.main.head).number;

  type Entry = { from: number; to: number; dec: Decoration };
  const entries: Entry[] = [];
  const seenLines = new Set<number>();

  // ── Pass 1: collect image node ranges to widget-replace ──────────────────
  interface ImgRange { from: number; to: number; alt: string; src: string }
  const imgRanges: ImgRange[] = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from, to,
      enter(node) {
        if (node.name === 'Image') {
          const lineNum = state.doc.lineAt(node.from).number;
          if (lineNum !== cursorLine) {
            const raw = state.sliceDoc(node.from, node.to);
            const m = raw.match(/^!\[([^\]]*)\]\(([^)]*)\)/);
            if (m) imgRanges.push({ from: node.from, to: node.to, alt: m[1], src: m[2] });
          }
        }
      },
    });
  }

  // ── Pass 2: syntax decorations (headings, hiding marks) ──────────────────
  const isInsideImg = (from: number, to: number) =>
    imgRanges.some(r => from >= r.from && to <= r.to);

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from, to,
      enter(node) {
        // Line-level heading class (always applied)
        const hClass = HEADING_CLASS[node.name];
        if (hClass) {
          const lineFrom = state.doc.lineAt(node.from).from;
          if (!seenLines.has(lineFrom)) {
            seenLines.add(lineFrom);
            entries.push({ from: lineFrom, to: lineFrom, dec: Decoration.line({ class: hClass }) });
          }
        }

        // Always hide # marks
        if (ALWAYS_HIDE.has(node.name) && node.from < node.to) {
          entries.push({ from: node.from, to: node.to, dec: Decoration.replace({}) });
        }

        // Hide inline marks when cursor is on a different line,
        // but skip marks that belong to an Image widget range
        if (HIDE_AWAY.has(node.name) && node.from < node.to) {
          const nodeLine = state.doc.lineAt(node.from).number;
          if (nodeLine !== cursorLine && !isInsideImg(node.from, node.to)) {
            entries.push({ from: node.from, to: node.to, dec: Decoration.replace({}) });
          }
        }
      },
    });
  }

  // ── Pass 3: image widget entries ─────────────────────────────────────────
  for (const { from, to, alt, src } of imgRanges) {
    entries.push({ from, to, dec: Decoration.replace({ widget: new ImageWidget(src, alt) }) });
  }

  // Sort ascending by from, ties: zero-length line decs first
  entries.sort((a, b) => a.from !== b.from ? a.from - b.from : a.to - b.to);

  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to, dec } of entries) {
    builder.add(from, to, dec);
  }
  return builder.finish();
}

const markdownViewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

// ── Editor theme — uses CSS vars so MainLayout can drive font/size ────────────
const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: 'var(--editor-font-size, 17px)',
    backgroundColor: 'transparent',
  },
  '.cm-content': {
    fontFamily: 'var(--editor-font, var(--font-serif))',
    padding: '52px 0',
    lineHeight: '1.9',
    caretColor: 'var(--accent)',
  },
  '.cm-line':             { padding: '0 4px' },
  '.cm-gutters':          { display: 'none' },
  '&.cm-focused':         { outline: 'none' },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--accent)',
    borderLeftWidth: '1.5px',
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
    backgroundColor: 'var(--accent-subtle)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'var(--accent-subtle) !important',
  },
  '.cm-activeLine':       { backgroundColor: 'transparent' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },

  // ── Heading line sizes ────────────────────────────────────────────────────
  '.cm-line.cm-h1': { fontSize: '1.85em', fontWeight: '800', lineHeight: '1.3', color: 'var(--text-primary)' },
  '.cm-line.cm-h2': { fontSize: '1.50em', fontWeight: '700', lineHeight: '1.35', color: 'var(--text-primary)' },
  '.cm-line.cm-h3': { fontSize: '1.25em', fontWeight: '600', lineHeight: '1.4' },
  '.cm-line.cm-h4': { fontSize: '1.10em', fontWeight: '600', lineHeight: '1.5' },
  '.cm-line.cm-h5': { fontSize: '1.00em', fontWeight: '600', lineHeight: '1.6' },
  '.cm-line.cm-h6': { fontSize: '0.90em', fontWeight: '500', lineHeight: '1.6', opacity: '0.75' },

  // ── Custom highlight classes ──────────────────────────────────────────────
  '.cm-md-url':  { opacity: '0.4', fontSize: '0.78em' },
  '.cm-md-code': {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.85em',
    backgroundColor: 'var(--bg-overlay)',
    borderRadius: '3px',
    padding: '1px 4px',
  },
  '.cm-md-link': {
    color: 'var(--accent)',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    textUnderlineOffset: '3px',
  },
});

// ── Placeholder text per action ───────────────────────────────────────────────
const PLACEHOLDER: Record<string, string> = {
  h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3',
  h4: 'Heading 4', h5: 'Heading 5', h6: 'Heading 6',
  task: 'Task item', arrowList: 'Point', note: 'your note here',
  quote: 'Quote text', bullet: 'List item', number: 'List item',
};

// ── Editor component ──────────────────────────────────────────────────────────
const Editor = forwardRef<EditorHandle, EditorProps>(({ value, onChange }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef      = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    applyAction: (action: string) => {
      const view = viewRef.current;
      if (!view) return;

      const { state } = view;
      const { from, to } = state.selection.main;
      const sel    = state.sliceDoc(from, to);
      const hasSel = sel.length > 0;

      type Cmd =
        | { wrap: [string, string] }
        | { prefix: string }
        | { insert: string };

      // Table is handled by tableExtension's insertTable helper
      if (action === 'table') {
        insertTable(view, 3, 3);
        return;
      }

      const commands: Record<string, Cmd> = {
        bold:          { wrap: ['**', '**'] },
        italic:        { wrap: ['*', '*'] },
        strikethrough: { wrap: ['~~', '~~'] },
        inlineCode:    { wrap: ['`', '`'] },
        h1: { prefix: '# ' },  h2: { prefix: '## ' }, h3: { prefix: '### ' },
        h4: { prefix: '#### ' }, h5: { prefix: '##### ' }, h6: { prefix: '###### ' },
        bullet:    { prefix: '- ' },
        number:    { prefix: '1. ' },
        task:      { prefix: '- [ ] ' },
        arrowList: { prefix: '→ ' },
        quote:     { prefix: '> ' },
        note:      { prefix: '> **Note:** ' },
        code:      { wrap: ['```\n', '\n```'] },
        hr:        { insert: '\n\n---\n\n' },
        link:      { wrap: ['[', '](url)'] },
      };

      const cmd = commands[action];
      if (!cmd) return;

      if ('wrap' in cmd) {
        const [open, close] = cmd.wrap;
        const inner = hasSel ? sel
          : action === 'bold'          ? 'bold text'
          : action === 'italic'        ? 'italic text'
          : action === 'strikethrough' ? 'text'
          : action === 'inlineCode'    ? 'code'
          : action === 'code'          ? 'code block'
          : action === 'link'          ? 'link text'
          : 'text';
        const text = `${open}${inner}${close}`;
        view.dispatch(state.update({
          changes:   { from, to, insert: text },
          selection: { anchor: from + open.length, head: from + open.length + inner.length },
          userEvent: 'input.format',
        }));

      } else if ('prefix' in cmd) {
        const line     = state.doc.lineAt(from);
        const lineText = state.sliceDoc(line.from, line.to);

        const content      = hasSel ? sel : (lineText || (PLACEHOLDER[action] ?? 'List item'));
        const dispatchFrom = hasSel ? from : line.from;
        const dispatchTo   = hasSel ? to   : line.to;
        const text         = `${cmd.prefix}${content}`;

        view.dispatch(state.update({
          changes:   { from: dispatchFrom, to: dispatchTo, insert: text },
          selection: { anchor: dispatchFrom + cmd.prefix.length, head: dispatchFrom + text.length },
          userEvent: 'input.format',
        }));

      } else {
        const text = cmd.insert;
        view.dispatch(state.update({
          changes:   { from, to, insert: text },
          selection: { anchor: from + text.length, head: from + text.length },
          userEvent: 'input.format',
        }));
      }

      view.focus();
    },

    insertText: (text: string) => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes:   { from, to, insert: text },
        selection: { anchor: from + text.length },
        scrollIntoView: true,
      });
      view.focus();
    },
  }));

  // Mount editor once
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        markdown(),
        EditorView.lineWrapping,
        editorTheme,
        syntaxHighlighting(mdHighlight),
        markdownViewPlugin,
        keymap.of(autoformatKeymap),
        smartTypography,
        tableExtension(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. switching documents)
  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full max-w-[68ch] mx-auto overflow-auto scrollbar-hide"
    />
  );
});

Editor.displayName = 'Editor';
export default Editor;
