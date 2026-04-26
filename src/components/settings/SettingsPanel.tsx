import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
  onDarkMode: (v: boolean) => void;
  font: string;
  onFont: (v: string) => void;
  fontSize: number;
  onFontSize: (v: number) => void;
}

const FONTS = [
  { label: 'Lora (Serif)',        value: 'Lora, serif' },
  { label: 'DM Sans (Sans-serif)', value: 'DM Sans, sans-serif' },
  { label: 'JetBrains Mono',      value: '"JetBrains Mono", monospace' },
  { label: 'Georgia',             value: 'Georgia, serif' },
  { label: 'System UI',           value: 'system-ui, sans-serif' },
];

const SIZES = [14, 15, 16, 17, 18, 20, 22];

const SettingsPanel: React.FC<Props> = ({
  open, onClose,
  darkMode, onDarkMode,
  font, onFont,
  fontSize, onFontSize,
}) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-surface border-l border-border flex flex-col shadow-xl">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-sans font-semibold text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted hover:text-secondary hover:bg-overlay transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 font-sans">

          {/* Appearance */}
          <section>
            <p className="text-[11px] uppercase tracking-widest text-muted mb-3">Appearance</p>

            <label className="flex items-center justify-between py-2">
              <span className="text-sm text-secondary">Dark mode</span>
              <button
                onClick={() => onDarkMode(!darkMode)}
                className={clsx(
                  'relative w-9 h-5 rounded-full transition-colors',
                  darkMode ? 'bg-accent' : 'bg-border'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    darkMode ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </button>
            </label>
          </section>

          {/* Typography */}
          <section>
            <p className="text-[11px] uppercase tracking-widest text-muted mb-3">Typography</p>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-secondary mb-1.5">Font family</p>
                <select
                  value={font}
                  onChange={(e) => onFont(e.target.value)}
                  className="w-full bg-canvas border border-border rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent"
                >
                  {FONTS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs text-secondary mb-1.5">Font size</p>
                <div className="flex flex-wrap gap-1.5">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => onFontSize(s)}
                      className={clsx(
                        'px-2.5 py-1 rounded text-xs border transition-colors',
                        fontSize === s
                          ? 'bg-accent text-white border-accent'
                          : 'border-border text-secondary hover:border-accent hover:text-accent'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <p className="text-[11px] uppercase tracking-widest text-muted mb-3">About</p>
            <p className="text-xs text-muted leading-relaxed">
              Quill — minimalist markdown editor.<br />
              Version 0.1.0
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
