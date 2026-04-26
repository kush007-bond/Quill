import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useAIStore } from '@/store/useAIStore';
import { AIProviderType, PROVIDER_META } from '@/types/ai';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PROVIDERS: AIProviderType[] = ['ollama', 'lmstudio', 'openai', 'anthropic'];

const AISettings: React.FC<Props> = ({ open, onClose }) => {
  const { config, setConfig } = useAIStore();
  const [showKey, setShowKey] = useState(false);

  if (!open) return null;

  const meta = PROVIDER_META[config.provider];

  const handleProvider = (provider: AIProviderType) => {
    const m = PROVIDER_META[provider];
    setConfig({
      provider,
      model: m.defaultModel,
      baseUrl: m.defaultBaseUrl,
      apiKey: undefined,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-surface border-l border-border flex flex-col shadow-xl">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-sans font-semibold text-primary">AI Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted hover:text-secondary hover:bg-overlay transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 font-sans">

          {/* Provider */}
          <section>
            <p className="text-[11px] uppercase tracking-widest text-muted mb-3">Provider</p>
            <div className="space-y-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleProvider(p)}
                  className={clsx(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border',
                    config.provider === p
                      ? 'bg-accent-subtle border-accent text-accent'
                      : 'border-border text-secondary hover:bg-overlay hover:text-primary'
                  )}
                >
                  <span className="font-medium">{PROVIDER_META[p].label}</span>
                  {!PROVIDER_META[p].requiresKey && (
                    <span className="ml-2 text-[10px] text-muted">(runs locally)</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Model */}
          <section>
            <p className="text-[11px] uppercase tracking-widest text-muted mb-3">Model</p>
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ model: e.target.value })}
              placeholder={meta.defaultModel}
              className="w-full bg-canvas border border-border rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {meta.modelSuggestions.map((m) => (
                <button
                  key={m}
                  onClick={() => setConfig({ model: m })}
                  className={clsx(
                    'px-2 py-0.5 rounded text-[11px] border transition-colors',
                    config.model === m
                      ? 'bg-accent text-white border-accent'
                      : 'border-border text-muted hover:border-accent hover:text-accent'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          {/* Base URL (local providers) */}
          {meta.defaultBaseUrl && (
            <section>
              <p className="text-[11px] uppercase tracking-widest text-muted mb-3">Base URL</p>
              <input
                type="text"
                value={config.baseUrl ?? meta.defaultBaseUrl}
                onChange={(e) => setConfig({ baseUrl: e.target.value })}
                placeholder={meta.defaultBaseUrl}
                className="w-full bg-canvas border border-border rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </section>
          )}

          {/* API Key (cloud providers) */}
          {meta.requiresKey && (
            <section>
              <p className="text-[11px] uppercase tracking-widest text-muted mb-3">API Key</p>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey ?? ''}
                  onChange={(e) => setConfig({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-canvas border border-border rounded-md px-3 py-1.5 pr-9 text-sm text-primary focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                >
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <p className="text-[10px] text-muted mt-1.5 leading-relaxed">
                Key is stored in browser local storage — never transmitted except directly to the provider.
              </p>
            </section>
          )}

        </div>
      </div>
    </>
  );
};

export default AISettings;
