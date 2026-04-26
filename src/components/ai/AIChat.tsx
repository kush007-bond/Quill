import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Settings2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAIStore } from '@/store/useAIStore';
import { useDocumentStore } from '@/store/useDocumentStore';
import { sendAIMessage, extractDocumentEdit } from '@/lib/ai/providers';
import { AIMessage } from '@/types/ai';
import { PROVIDER_META } from '@/types/ai';
import Preview from '@/components/editor/Preview';

interface Props {
  onOpenSettings: () => void;
}

const AIChat: React.FC<Props> = ({ onOpenSettings }) => {
  const { config, messages, isLoading, addMessage, clearMessages, setLoading } = useAIStore();
  const { documents, activeDocumentId, updateDocument } = useDocumentStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeDoc = documents.find((d) => d.id === activeDocumentId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    addMessage(userMsg);
    setInput('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setLoading(true);

    try {
      const allMessages = [...messages, userMsg];
      const response = await sendAIMessage(config, allMessages, activeDoc?.content);

      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });

      const edit = extractDocumentEdit(response);
      if (edit && activeDoc) {
        updateDocument(activeDoc.id, { content: edit });
      }
    } catch (err) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `**Error:** ${err instanceof Error ? err.message : 'Unknown error. Check your provider settings.'}`,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const providerLabel = PROVIDER_META[config.provider].label;

  return (
    <div className="h-full flex flex-col bg-canvas">

      {/* Sub-header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-sans text-muted truncate">
            {providerLabel} · <span className="text-secondary">{config.model}</span>
          </span>
          {activeDoc && (
            <span className="hidden sm:inline text-[10px] font-sans text-muted/60 truncate">
              · context: "{activeDoc.title || 'Untitled'}"
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={clearMessages}
            disabled={messages.length === 0}
            title="Clear conversation"
            className="p-1.5 rounded-md text-muted hover:bg-overlay hover:text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onOpenSettings}
            title="AI settings"
            className="p-1.5 rounded-md text-muted hover:bg-overlay hover:text-secondary transition-colors"
          >
            <Settings2 size={13} />
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-5 space-y-5">
        {messages.length === 0 ? (
          <EmptyChat hasDoc={!!activeDoc} docTitle={activeDoc?.title} />
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {isLoading && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-border">
        <div className="flex items-end gap-2 bg-surface rounded-xl border border-border px-3 py-2 focus-within:border-accent transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything, or say 'edit the document to…'"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-[14px] font-sans text-primary placeholder:text-muted resize-none focus:outline-none min-h-[22px] max-h-36 overflow-y-auto leading-[22px] disabled:opacity-60"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={clsx(
              'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
              input.trim() && !isLoading
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-overlay text-muted cursor-not-allowed',
            )}
          >
            <Send size={13} />
          </button>
        </div>
        <p className="text-[10px] text-muted/50 font-sans mt-1.5 text-center select-none">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: AIMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const docEdit = !isUser ? extractDocumentEdit(message.content) : null;

  const displayContent = docEdit
    ? message.content.replace(
        /```document-edit\n[\s\S]*?```/,
        '_Document updated successfully._',
      )
    : message.content;

  return (
    <div className={clsx('flex gap-2.5 items-start', isUser && 'flex-row-reverse')}>
      <div
        className={clsx(
          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold font-sans tracking-wide',
          isUser ? 'bg-accent text-white' : 'bg-accent-subtle text-accent',
        )}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      <div
        className={clsx(
          'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-surface rounded-tl-sm text-primary',
        )}
      >
        {isUser ? (
          <p className="font-sans whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-stone max-w-none [&_p]:my-1 [&_pre]:text-[11px] [&_code]:text-[11px]">
            <Preview content={displayContent} />
          </div>
        )}
      </div>
    </div>
  );
};

const ThinkingBubble = () => (
  <div className="flex gap-2.5 items-start">
    <div className="w-6 h-6 rounded-full bg-accent-subtle flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold font-sans tracking-wide text-accent">
      AI
    </div>
    <div className="bg-surface rounded-2xl rounded-tl-sm px-3.5 py-3">
      <div className="flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const EmptyChat: React.FC<{ hasDoc: boolean; docTitle?: string }> = ({ hasDoc, docTitle }) => (
  <div className="h-full flex flex-col items-center justify-center gap-4 text-muted py-16">
    <div className="w-12 h-12 rounded-full bg-accent-subtle flex items-center justify-center">
      <span className="text-accent text-lg font-serif font-bold">AI</span>
    </div>
    <div className="text-center space-y-1.5 max-w-xs">
      <p className="font-serif italic text-[15px] text-secondary">
        How can I help you write?
      </p>
      <p className="text-[12px] font-sans leading-relaxed">
        {hasDoc
          ? `I have context from "${docTitle || 'Untitled'}". Ask me to edit it, or anything else.`
          : 'No document open — I can still answer questions and help generate content.'}
      </p>
    </div>
    <div className="flex flex-col gap-1.5 mt-2">
      {SUGGESTIONS.map((s) => (
        <div key={s} className="text-[11px] font-sans text-muted/70 bg-surface/60 rounded-lg px-3 py-1.5 text-center">
          "{s}"
        </div>
      ))}
    </div>
  </div>
);

const SUGGESTIONS = [
  'Make this more concise',
  'Add an introduction paragraph',
  'Fix grammar and spelling',
  'What should I write next?',
];

export default AIChat;
