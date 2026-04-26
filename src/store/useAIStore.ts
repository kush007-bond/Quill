import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIMessage, AIConfig } from '@/types/ai';

interface AIState {
  config: AIConfig;
  messages: AIMessage[];
  isLoading: boolean;
  setConfig: (updates: Partial<AIConfig>) => void;
  addMessage: (msg: AIMessage) => void;
  clearMessages: () => void;
  setLoading: (v: boolean) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      config: {
        provider: 'ollama',
        model: 'llama3.2',
        baseUrl: 'http://localhost:11434',
      },
      messages: [],
      isLoading: false,
      setConfig: (updates) => set((s) => ({ config: { ...s.config, ...updates } })),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      clearMessages: () => set({ messages: [] }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'quill-ai',
      // Only persist config — messages are ephemeral
      partialize: (s) => ({ config: s.config }),
    }
  )
);
