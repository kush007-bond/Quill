import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Bold, Italic, Strikethrough, Code,
  List, ListOrdered, CheckSquare,
  Quote, FileCode, Minus,
  Link, Image, Table,
  ArrowRight, Info,
  ChevronDown, ChevronUp,
  Mic, MicOff,
  LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';

// ── Shared constants ──────────────────────────────────────────────────────────
export const FONTS = [
  { label: 'Lora',           value: 'Lora, serif',                  style: 'Lora'               },
  { label: 'Merriweather',   value: '"Merriweather", serif',         style: 'Merriweather'       },
  { label: 'Source Serif 4', value: '"Source Serif 4", serif',       style: '"Source Serif 4"'   },
  { label: 'Playfair',       value: '"Playfair Display", serif',     style: '"Playfair Display"' },
  { label: 'EB Garamond',    value: '"EB Garamond", serif',          style: '"EB Garamond"'      },
  { label: 'Crimson Text',   value: '"Crimson Text", serif',         style: '"Crimson Text"'     },
  { label: 'Georgia',        value: 'Georgia, serif',                style: 'Georgia'            },
  { label: 'Inter',          value: 'Inter, system-ui, sans-serif',  style: 'Inter'              },
  { label: 'DM Sans',        value: '"DM Sans", sans-serif',         style: '"DM Sans"'          },
  { label: 'iA Writer Mono', value: '"iA Writer Mono", monospace',   style: 'monospace'          },
] as const;

export const SIZE_MIN = 11;
export const SIZE_MAX = 32;

// ── Toolbar props ─────────────────────────────────────────────────────────────
interface ToolbarProps {
  onAction: (action: string) => void;
  font: string;
  fontSize: number;
  onFont: (f: string) => void;
  onSize: (s: number) => void;
  onInsertText: (text: string) => void;
}

// ── Divider ───────────────────────────────────────────────────────────────────
const Divider = () => (
  <div className="w-px h-4 bg-border flex-shrink-0 mx-1" aria-hidden />
);

// ── Portal dropdown position ──────────────────────────────────────────────────
function usePortalPos(btnRef: React.RefObject<HTMLButtonElement | null>, open: boolean) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left + r.width / 2 });
  }, [open, btnRef]);
  return pos;
}

// ── Heading dropdown ──────────────────────────────────────────────────────────
const HEADINGS = [
  { level: 1, label: 'Heading 1', size: '15px', weight: '800' },
  { level: 2, label: 'Heading 2', size: '14px', weight: '700' },
  { level: 3, label: 'Heading 3', size: '13px', weight: '600' },
  { level: 4, label: 'Heading 4', size: '12px', weight: '600' },
  { level: 5, label: 'Heading 5', size: '12px', weight: '600' },
  { level: 6, label: 'Heading 6', size: '11px', weight: '500' },
] as const;

const HeadingDropdown: React.FC<{ onAction: (a: string) => void }> = ({ onAction }) => {
  const [open, setOpen] = useState(false);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const pos     = usePortalPos(btnRef, open);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !dropRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        title="Headings"
        className={clsx(
          'flex items-center gap-0.5 px-2 h-7 rounded text-[11px] font-sans font-bold tracking-tight transition-all duration-100 active:scale-95',
          open ? 'bg-overlay text-primary' : 'text-secondary hover:bg-overlay hover:text-primary'
        )}
      >
        <span>H</span>
        <ChevronDown size={9} strokeWidth={2.5} />
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateX(-50%)', zIndex: 9999 }}
          className="bg-surface border border-border rounded-xl shadow-xl overflow-hidden w-max"
        >
          {HEADINGS.map(({ level, label, size, weight }) => (
            <button
              key={level}
              onClick={() => { onAction(`h${level}`); setOpen(false); }}
              className="w-full px-3 py-1.5 text-left text-secondary hover:bg-overlay hover:text-primary transition-colors duration-75 font-serif whitespace-nowrap"
              style={{ fontSize: size, fontWeight: weight }}
            >
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

// ── Font dropdown ─────────────────────────────────────────────────────────────
const FontDropdown: React.FC<{ font: string; onFont: (f: string) => void }> = ({ font, onFont }) => {
  const [open, setOpen] = useState(false);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const pos     = usePortalPos(btnRef, open);

  const current = FONTS.find((f) => f.value === font) ?? FONTS[0];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !dropRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        title="Font family"
        className={clsx(
          'flex items-center gap-0.5 px-2 h-7 rounded text-[11px] font-sans transition-all duration-100 active:scale-95 max-w-[90px]',
          open ? 'bg-overlay text-primary' : 'text-secondary hover:bg-overlay hover:text-primary'
        )}
        style={{ fontFamily: current.style }}
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown size={9} strokeWidth={2.5} className="flex-shrink-0" />
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateX(-50%)', zIndex: 9999 }}
          className="bg-surface border border-border rounded-xl shadow-xl overflow-hidden w-max"
        >
          {FONTS.map(({ label, value, style }) => (
            <button
              key={value}
              onClick={() => { onFont(value); setOpen(false); }}
              className={clsx(
                'w-full px-4 py-2 text-left text-[13px] transition-colors duration-75 whitespace-nowrap',
                font === value
                  ? 'bg-accent-subtle text-accent font-medium'
                  : 'text-secondary hover:bg-overlay hover:text-primary'
              )}
              style={{ fontFamily: style }}
            >
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

// ── Size stepper ──────────────────────────────────────────────────────────────
const SizeStepper: React.FC<{ fontSize: number; onSize: (n: number) => void }> = ({ fontSize, onSize }) => {
  const step = (delta: number) =>
    onSize(Math.min(SIZE_MAX, Math.max(SIZE_MIN, fontSize + delta)));

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <button
        onClick={() => step(-1)}
        disabled={fontSize <= SIZE_MIN}
        title="Decrease font size"
        className="w-5 h-7 flex items-center justify-center rounded text-muted hover:bg-overlay hover:text-primary disabled:opacity-30 transition-colors"
      >
        <ChevronDown size={11} strokeWidth={2.5} />
      </button>
      <input
        type="number"
        min={SIZE_MIN}
        max={SIZE_MAX}
        value={fontSize}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n)) onSize(Math.min(SIZE_MAX, Math.max(SIZE_MIN, n)));
        }}
        title="Font size (px)"
        className="w-9 h-7 rounded bg-overlay text-center text-[11px] font-sans font-semibold text-primary border border-transparent focus:border-accent focus:outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        onClick={() => step(1)}
        disabled={fontSize >= SIZE_MAX}
        title="Increase font size"
        className="w-5 h-7 flex items-center justify-center rounded text-muted hover:bg-overlay hover:text-primary disabled:opacity-30 transition-colors"
      >
        <ChevronUp size={11} strokeWidth={2.5} />
      </button>
    </div>
  );
};

// ── Voice button ──────────────────────────────────────────────────────────────
const VoiceButton: React.FC<{ onInsert: (text: string) => void }> = ({ onInsert }) => {
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);

  const toggle = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Voice typing is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const recog = new SR();
    recog.continuous    = true;
    recog.interimResults = false;
    recog.lang          = 'en-US';

    recog.onresult = (e: { results: SpeechRecognitionResultList; resultIndex: number }) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript;
      }
      if (transcript) onInsert(transcript + ' ');
    };

    recog.onerror = () => { setListening(false); };
    recog.onend   = () => { setListening(false); };

    recog.start();
    recogRef.current = recog;
    setListening(true);
  };

  return (
    <button
      onClick={toggle}
      title={listening ? 'Stop voice typing' : 'Voice typing'}
      className={clsx(
        'flex items-center justify-center w-7 h-7 rounded transition-all duration-100 flex-shrink-0',
        listening
          ? 'bg-red-500/20 text-red-400 animate-pulse'
          : 'text-secondary hover:bg-overlay hover:text-primary'
      )}
    >
      {listening ? <MicOff size={14} strokeWidth={2} /> : <Mic size={14} strokeWidth={2} />}
    </button>
  );
};

// ── Icon button ───────────────────────────────────────────────────────────────
interface IconTool {
  icon: LucideIcon;
  action: string;
  label: string;
  shortcut?: string;
}

const IconBtn: React.FC<{ tool: IconTool; onAction: (a: string) => void }> = ({
  tool: { icon: Icon, action, label, shortcut },
  onAction,
}) => (
  <button
    onClick={() => onAction(action)}
    title={shortcut ? `${label}  (${shortcut})` : label}
    className="flex items-center justify-center w-7 h-7 rounded text-secondary hover:bg-overlay hover:text-primary active:scale-95 transition-all duration-100 flex-shrink-0"
  >
    <Icon size={14} strokeWidth={2} />
  </button>
);

// ── Tool groups ───────────────────────────────────────────────────────────────
const inlineTools: IconTool[] = [
  { icon: Bold,          action: 'bold',          label: 'Bold',          shortcut: 'Ctrl+B' },
  { icon: Italic,        action: 'italic',        label: 'Italic',        shortcut: 'Ctrl+I' },
  { icon: Strikethrough, action: 'strikethrough', label: 'Strikethrough'                     },
  { icon: Code,          action: 'inlineCode',    label: 'Inline Code',   shortcut: 'Ctrl+`' },
];

const listTools: IconTool[] = [
  { icon: List,        action: 'bullet',    label: 'Bullet list'    },
  { icon: ListOrdered, action: 'number',    label: 'Numbered list'  },
  { icon: CheckSquare, action: 'task',      label: 'Task / checkbox'},
  { icon: ArrowRight,  action: 'arrowList', label: 'Arrow list'     },
];

const blockTools: IconTool[] = [
  { icon: Quote,    action: 'quote', label: 'Blockquote'   },
  { icon: Info,     action: 'note',  label: 'Note callout' },
  { icon: FileCode, action: 'code',  label: 'Code block'   },
  { icon: Minus,    action: 'hr',    label: 'Divider'      },
];

const insertTools: IconTool[] = [
  { icon: Link, action: 'link', label: 'Link', shortcut: 'Ctrl+K' },
];

// ── Table insert dialog ───────────────────────────────────────────────────────
function buildTableMarkdown(rows: number, cols: number): string {
  const headers  = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);
  const sep      = Array.from({ length: cols }, () => '--------');
  const cellRow  = Array.from({ length: cols }, () => 'Cell    ');
  const lines    = [
    '| ' + headers.map(h => h.padEnd(8)).join(' | ') + ' |',
    '| ' + sep.join(' | ') + ' |',
    ...Array.from({ length: rows }, () => '| ' + cellRow.join(' | ') + ' |'),
  ];
  return '\n' + lines.join('\n') + '\n';
}

const GRID_ROWS = 8;
const GRID_COLS = 7;

const TableInsertDialog: React.FC<{ onInsert: (text: string) => void }> = ({ onInsert }) => {
  const [open, setOpen]   = useState(false);
  const [rows, setRows]   = useState(3);
  const [cols, setCols]   = useState(3);

  const close = () => setOpen(false);

  const handleInsert = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      onInsert(buildTableMarkdown(rows, cols));
    } finally {
      close();
    }
  };

  const stepper = (
    label: string,
    val: number,
    set: (n: number) => void,
    min: number,
    max: number,
  ) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-sans text-muted uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => set(Math.max(min, val - 1))}
          disabled={val <= min}
          className="w-6 h-6 rounded flex items-center justify-center text-secondary hover:bg-overlay disabled:opacity-30 transition-colors text-sm font-bold"
        >−</button>
        <span className="w-7 text-center text-[14px] font-semibold text-primary font-sans">{val}</span>
        <button
          onClick={() => set(Math.min(max, val + 1))}
          disabled={val >= max}
          className="w-6 h-6 rounded flex items-center justify-center text-secondary hover:bg-overlay disabled:opacity-30 transition-colors text-sm font-bold"
        >+</button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Insert table"
        className="flex items-center justify-center w-7 h-7 rounded text-secondary hover:bg-overlay hover:text-primary active:scale-95 transition-all duration-100 flex-shrink-0"
      >
        <Table size={14} strokeWidth={2} />
      </button>

      {open && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            className="bg-surface border border-border rounded-2xl shadow-2xl p-6 w-[320px] flex flex-col gap-5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <p className="text-[15px] font-serif font-semibold text-primary text-center">
              Insert Table
            </p>

            {/* Row / col steppers */}
            <div className="flex justify-center gap-8">
              {stepper('Rows',    rows, setRows, 1, 10)}
              {stepper('Columns', cols, setCols, 1, 8)}
            </div>

            {/* Animated grid preview */}
            <div className="flex flex-col items-center gap-2">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                  gap: '3px',
                  width: '100%',
                }}
              >
                {Array.from({ length: (GRID_ROWS + 1) * GRID_COLS }, (_, idx) => {
                  const r = Math.floor(idx / GRID_COLS);
                  const c = idx % GRID_COLS;
                  const isHeader  = r === 0;
                  const inRange   = r <= rows && c < cols;   // r=0 is header row
                  return (
                    <div
                      key={idx}
                      style={{
                        height: '11px',
                        borderRadius: '2px',
                        backgroundColor: isHeader && inRange
                          ? 'var(--accent)'
                          : inRange
                            ? 'var(--bg-overlay)'
                            : 'transparent',
                        border: inRange ? '1px solid var(--border)' : '1px solid transparent',
                        opacity: inRange ? 1 : 0.15,
                        transform: inRange ? 'scale(1)' : 'scale(0.6)',
                        transition: 'all 0.14s ease',
                        transitionDelay: inRange
                          ? `${(r * GRID_COLS + c) * 8}ms`
                          : '0ms',
                      }}
                    />
                  );
                })}
              </div>
              <span className="text-[11px] font-sans text-muted">
                {rows} {rows === 1 ? 'row' : 'rows'} × {cols} {cols === 1 ? 'column' : 'columns'}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleInsert}
                className="flex-1 h-8 rounded-lg bg-accent text-white text-[12px] font-sans font-medium hover:opacity-90 active:scale-95 transition-all"
              >
                Insert
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); close(); }}
                className="flex-1 h-8 rounded-lg bg-overlay text-secondary text-[12px] font-sans font-medium hover:bg-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// ── Image button (file picker → base64 embed) ─────────────────────────────────
const ImageButton: React.FC<{ onInsert: (text: string) => void }> = ({ onInsert }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const name = file.name.replace(/\.[^.]+$/, '');
      onInsert(`![${name}](${dataUrl})`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        title="Insert image"
        className="flex items-center justify-center w-7 h-7 rounded text-secondary hover:bg-overlay hover:text-primary active:scale-95 transition-all duration-100 flex-shrink-0"
      >
        <Image size={14} strokeWidth={2} />
      </button>
    </>
  );
};

// ── Toolbar ───────────────────────────────────────────────────────────────────
const Toolbar: React.FC<ToolbarProps> = ({ onAction, font, fontSize, onFont, onSize, onInsertText }) => (
  <div className="flex items-center px-3 h-10 bg-surface border-b border-border select-none overflow-x-auto scrollbar-hide flex-shrink-0 gap-0.5">

    <HeadingDropdown onAction={onAction} />
    <Divider />

    {inlineTools.map((t) => <IconBtn key={t.action} tool={t} onAction={onAction} />)}
    <Divider />

    {listTools.map((t) => <IconBtn key={t.action} tool={t} onAction={onAction} />)}
    <Divider />

    {blockTools.map((t) => <IconBtn key={t.action} tool={t} onAction={onAction} />)}
    <Divider />

    {insertTools.map((t) => <IconBtn key={t.action} tool={t} onAction={onAction} />)}
    <TableInsertDialog onInsert={onInsertText} />
    <ImageButton onInsert={onInsertText} />
    <Divider />

    <FontDropdown font={font} onFont={onFont} />
    <Divider />

    <SizeStepper fontSize={fontSize} onSize={onSize} />
    <Divider />

    <VoiceButton onInsert={onInsertText} />

  </div>
);

export default Toolbar;
