import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import Editor, { EditorHandle } from '@/components/editor/Editor';
import Preview from '@/components/editor/Preview';
import Toolbar from '@/components/editor/Toolbar';
import { useDocumentStore } from '@/store/useDocumentStore';
import { Pencil, Columns, Eye, Maximize2, Minimize2, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';

type EditorMode = 'source' | 'split' | 'preview';

const MODES = [
  { id: 'source',  label: 'Write',   Icon: Pencil  },
  { id: 'split',   label: 'Split',   Icon: Columns },
  { id: 'preview', label: 'Preview', Icon: Eye     },
] as const;

// ── Helpers to read/write localStorage safely ─────────────────────────────────
function getLS(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function setLS(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch { /* noop */ }
}

// ── Main layout ───────────────────────────────────────────────────────────────
const MainLayout: React.FC = () => {
  const { documents, activeDocumentId, updateDocument } = useDocumentStore();

  const [mode,      setMode]     = useState<EditorMode>('source');
  const [focusMode, setFocusMode] = useState(false);
  const [darkMode,  setDarkMode]  = useState(() => getLS('quill-theme', 'light') === 'dark');
  const [font,      setFont]      = useState(() => getLS('quill-font', 'Lora, serif'));
  const [fontSize,  setFontSize]  = useState(() => Number(getLS('quill-size', '17')));

  const editorRef = useRef<EditorHandle>(null);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    setLS('quill-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleFont = (f: string) => { setFont(f); setLS('quill-font', f); };
  const handleSize = (s: number) => { setFontSize(s); setLS('quill-size', String(s)); };

  const activeDoc = documents.find((d) => d.id === activeDocumentId);

  const words      = activeDoc?.content.split(/\s+/).filter(Boolean).length ?? 0;
  const chars      = activeDoc?.content.replace(/\n/g, '').length ?? 0;
  const paragraphs = activeDoc?.content.split(/\n\s*\n/).filter(Boolean).length ?? 0;
  const readMin    = Math.max(1, Math.ceil(words / 200));

  const handleContent = (content: string) => {
    if (activeDoc) updateDocument(activeDoc.id, { content });
  };

  const handleTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeDoc) updateDocument(activeDoc.id, { title: e.target.value });
  };

  const showEditor  = mode === 'source' || mode === 'split';
  const showPreview = mode === 'preview' || mode === 'split';

  return (
    <div className="flex h-screen bg-canvas text-primary overflow-hidden">
      {!focusMode && <Sidebar />}

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* ── Header ─────────────────────────────────────────── */}
        <header
          className="flex-shrink-0 border-b border-border flex items-center justify-between px-5 bg-canvas/80 backdrop-blur-sm z-10 gap-4"
          style={{ height: '52px' }}
        >
          {/* Title */}
          <input
            type="text"
            value={activeDoc?.title ?? ''}
            onChange={handleTitle}
            placeholder="Untitled"
            className="flex-1 min-w-0 bg-transparent border-none text-[15px] font-serif text-primary focus:outline-none placeholder:text-muted truncate select-none"
            style={{ fontStyle: activeDoc?.title ? 'normal' : 'italic' }}
          />

          {/* Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0 select-none">

            {/* Mode tabs */}
            <nav className="flex items-center bg-surface rounded-lg border border-border p-0.5 gap-0.5">
              {MODES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-sans font-medium transition-all duration-150',
                    mode === id
                      ? 'bg-canvas text-primary shadow-sm'
                      : 'text-muted hover:text-secondary'
                  )}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </nav>

            {/* Dark / light toggle */}
            <button
              onClick={() => setDarkMode((d) => !d)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-md transition-colors text-muted hover:bg-overlay hover:text-secondary"
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Focus mode */}
            <button
              onClick={() => setFocusMode((f) => !f)}
              title={focusMode ? 'Exit focus mode' : 'Focus mode — hide sidebar'}
              className={clsx(
                'p-1.5 rounded-md transition-colors',
                focusMode
                  ? 'bg-accent-subtle text-accent hover:bg-accent-subtle'
                  : 'text-muted hover:bg-overlay hover:text-secondary'
              )}
            >
              {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </header>

        {/* ── Toolbar ────────────────────────────────────────── */}
        {showEditor && activeDoc && (
          <Toolbar
            onAction={(action) => editorRef.current?.applyAction(action)}
            font={font}
            fontSize={fontSize}
            onFont={handleFont}
            onSize={handleSize}
            onInsertText={(text) => editorRef.current?.insertText(text)}
          />
        )}

        {/* ── Editing area ───────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          {!activeDoc ? (
            <EmptyState />
          ) : (
            <div className="h-full flex divide-x divide-border">
              {showEditor && (
                <div
                  className={clsx(
                    'h-full overflow-auto scrollbar-hide',
                    mode === 'split' ? 'w-1/2' : 'w-full'
                  )}
                  style={{
                    '--editor-font-size': `${fontSize}px`,
                    '--editor-font': font,
                  } as React.CSSProperties}
                >
                  <Editor
                    ref={editorRef}
                    value={activeDoc.content}
                    onChange={handleContent}
                  />
                </div>
              )}

              {showPreview && (
                <div
                  className={clsx(
                    'h-full overflow-auto scrollbar-hide',
                    mode === 'split' ? 'w-1/2 bg-surface/30' : 'w-full'
                  )}
                >
                  <Preview content={activeDoc.content} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Status bar ─────────────────────────────────────── */}
        <footer className="flex-shrink-0 h-7 border-t border-border flex items-center justify-between px-5 bg-surface/50 select-none">
          <div className="flex items-center gap-2.5 text-[11px] text-muted font-sans">
            <span>{words.toLocaleString()} {words === 1 ? 'word' : 'words'}</span>
            <Dot />
            <span>{chars.toLocaleString()} {chars === 1 ? 'char' : 'chars'}</span>
            {paragraphs > 0 && (
              <>
                <Dot />
                <span>{paragraphs} {paragraphs === 1 ? 'paragraph' : 'paragraphs'}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-[11px] text-muted font-sans">
            <span>{readMin} min read</span>
            {activeDoc && (
              <>
                <Dot />
                <span>
                  Saved {activeDoc.updatedAt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
};

const Dot = () => (
  <span className="text-border" aria-hidden>·</span>
);

const EmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center gap-3 text-muted">
    <div className="w-10 h-10 rounded-full bg-overlay flex items-center justify-center">
      <Pencil size={16} className="text-secondary" />
    </div>
    <p className="font-serif italic text-[15px]">
      Select a document or create a new one to start writing.
    </p>
  </div>
);

export default MainLayout;
