import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import Editor, { EditorHandle } from '@/components/editor/Editor';
import Preview from '@/components/editor/Preview';
import Toolbar from '@/components/editor/Toolbar';
import SettingsPanel from '@/components/settings/SettingsPanel';
import AIChat from '@/components/ai/AIChat';
import AISettings from '@/components/ai/AISettings';
import { useDocumentStore } from '@/store/useDocumentStore';
import { Pencil, Columns, Eye, Maximize2, Minimize2, Moon, Sun, Menu, BrainCircuit } from 'lucide-react';
import { clsx } from 'clsx';

type EditorMode = 'source' | 'split' | 'preview' | 'ai';

const MODES = [
  { id: 'source',  label: 'Write',   Icon: Pencil       },
  { id: 'split',   label: 'Split',   Icon: Columns      },
  { id: 'preview', label: 'Preview', Icon: Eye          },
  { id: 'ai',      label: 'AI',      Icon: BrainCircuit },
] as const;

function getLS(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function setLS(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch { /* noop */ }
}

const MainLayout: React.FC = () => {
  const { documents, activeDocumentId, updateDocument } = useDocumentStore();

  const [mode,           setMode]           = useState<EditorMode>('source');
  const [focusMode,      setFocusMode]      = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [aiSettingsOpen, setAISettingsOpen] = useState(false);

  // OS dark mode sync: use stored preference if set, otherwise follow OS
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('quill-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  const [font,     setFont]     = useState(() => getLS('quill-font', 'Lora, serif'));
  const [fontSize, setFontSize] = useState(() => Number(getLS('quill-size', '17')));

  const editorRef = useRef<EditorHandle>(null);

  // Apply theme to DOM and persist manual preference
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    setLS('quill-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Follow OS dark mode when no manual preference is stored
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Only auto-switch if the user hasn't manually chosen a theme this session
      if (!localStorage.getItem('quill-theme')) setDarkMode(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Collapse sidebar by default on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    if (mq.matches) setSidebarOpen(false);
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleFont     = (f: string) => { setFont(f);     setLS('quill-font', f); };
  const handleFontSize = (s: number) => { setFontSize(s); setLS('quill-size', String(s)); };
  const handleDarkMode = (v: boolean) => setDarkMode(v);

  const activeDoc  = documents.find((d) => d.id === activeDocumentId);
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
  const showAI      = mode === 'ai';
  const showSidebar = !focusMode && sidebarOpen;

  return (
    <div className="flex h-screen bg-canvas text-primary overflow-hidden">

      {/* Sidebar — overlay on mobile, inline on desktop */}
      {showSidebar && (
        <>
          <div
            className="sm:hidden fixed inset-0 z-20 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed sm:relative z-30 sm:z-auto h-full">
            <Sidebar onSettings={() => setSettingsOpen(true)} />
          </div>
        </>
      )}

      {!showSidebar && !focusMode && <div className="hidden sm:block" />}

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* ── Header ─────────────────────────────────────────── */}
        <header
          className="flex-shrink-0 border-b border-border flex items-center justify-between px-3 sm:px-5 bg-canvas/80 backdrop-blur-sm z-10 gap-2 sm:gap-4"
          style={{ height: '52px', paddingTop: 'env(safe-area-inset-top)' }}
        >
          {!focusMode && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="sm:hidden p-1.5 rounded-md text-muted hover:bg-overlay hover:text-secondary transition-colors flex-shrink-0"
            >
              <Menu size={16} />
            </button>
          )}

          <input
            type="text"
            value={activeDoc?.title ?? ''}
            onChange={handleTitle}
            placeholder={showAI ? 'AI Assistant' : 'Untitled'}
            readOnly={showAI}
            className="flex-1 min-w-0 bg-transparent border-none text-[15px] font-serif text-primary focus:outline-none placeholder:text-muted truncate select-none"
            style={{ fontStyle: (activeDoc?.title || showAI) ? 'normal' : 'italic' }}
          />

          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 select-none">

            {/* Mode tabs */}
            <nav className="flex items-center bg-surface rounded-lg border border-border p-0.5 gap-0.5">
              {MODES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-md text-xs font-sans font-medium transition-all duration-150',
                    mode === id
                      ? id === 'ai'
                        ? 'bg-accent-subtle text-accent shadow-sm'
                        : 'bg-canvas text-primary shadow-sm'
                      : 'text-muted hover:text-secondary',
                  )}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{label}</span>
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

            {/* Focus mode (hidden in AI mode) */}
            {!showAI && (
              <button
                onClick={() => setFocusMode((f) => !f)}
                title={focusMode ? 'Exit focus mode' : 'Focus mode'}
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  focusMode
                    ? 'bg-accent-subtle text-accent'
                    : 'text-muted hover:bg-overlay hover:text-secondary',
                )}
              >
                {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}
          </div>
        </header>

        {/* ── Toolbar (editor modes only) ─────────────────────── */}
        {showEditor && activeDoc && (
          <Toolbar
            onAction={(action) => editorRef.current?.applyAction(action)}
            font={font}
            fontSize={fontSize}
            onFont={handleFont}
            onSize={handleFontSize}
            onInsertText={(text) => editorRef.current?.insertText(text)}
          />
        )}

        {/* ── Content area ───────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          {showAI ? (
            <AIChat onOpenSettings={() => setAISettingsOpen(true)} />
          ) : !activeDoc ? (
            <EmptyState />
          ) : (
            <div className="h-full flex divide-x divide-border">
              {showEditor && (
                <div
                  className={clsx(
                    'h-full overflow-auto scrollbar-hide',
                    mode === 'split' ? 'w-1/2' : 'w-full',
                  )}
                  style={{
                    '--editor-font-size': `${fontSize}px`,
                    '--editor-font': font,
                  } as React.CSSProperties}
                >
                  <Editor ref={editorRef} value={activeDoc.content} onChange={handleContent} />
                </div>
              )}

              {showPreview && (
                <div
                  className={clsx(
                    'h-full overflow-auto scrollbar-hide',
                    mode === 'split' ? 'w-1/2 bg-surface/30' : 'w-full',
                  )}
                >
                  <Preview content={activeDoc.content} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Status bar ─────────────────────────────────────── */}
        <footer
          className="flex-shrink-0 h-7 border-t border-border flex items-center justify-between px-3 sm:px-5 bg-surface/50 select-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] text-muted font-sans">
            {showAI ? (
              <span>AI mode</span>
            ) : (
              <>
                <span>{words.toLocaleString()} {words === 1 ? 'word' : 'words'}</span>
                <Dot />
                <span className="hidden sm:inline">{chars.toLocaleString()} {chars === 1 ? 'char' : 'chars'}</span>
                {paragraphs > 0 && (
                  <span className="hidden sm:inline">
                    <Dot />{paragraphs} {paragraphs === 1 ? 'para' : 'paras'}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] text-muted font-sans">
            {!showAI && (
              <>
                <span className="hidden sm:inline">{readMin} min read</span>
                {activeDoc && (
                  <>
                    <Dot />
                    <span>
                      Saved {activeDoc.updatedAt instanceof Date
                        ? activeDoc.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(activeDoc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </footer>
      </main>

      {/* Settings panels */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        darkMode={darkMode}
        onDarkMode={handleDarkMode}
        font={font}
        onFont={handleFont}
        fontSize={fontSize}
        onFontSize={handleFontSize}
      />

      <AISettings
        open={aiSettingsOpen}
        onClose={() => setAISettingsOpen(false)}
      />
    </div>
  );
};

const Dot = () => <span className="text-border" aria-hidden>·</span>;

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
