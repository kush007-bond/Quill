export type AIProviderType = 'openai' | 'anthropic' | 'ollama' | 'lmstudio';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIConfig {
  provider: AIProviderType;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ProviderMeta {
  label: string;
  defaultModel: string;
  defaultBaseUrl?: string;
  requiresKey: boolean;
  modelSuggestions: string[];
}

export const PROVIDER_META: Record<AIProviderType, ProviderMeta> = {
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    requiresKey: true,
    modelSuggestions: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  anthropic: {
    label: 'Anthropic Claude',
    defaultModel: 'claude-haiku-4-5-20251001',
    requiresKey: true,
    modelSuggestions: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  },
  ollama: {
    label: 'Ollama (local)',
    defaultModel: 'llama3.2',
    defaultBaseUrl: 'http://localhost:11434',
    requiresKey: false,
    modelSuggestions: ['llama3.2', 'llama3.1', 'mistral', 'gemma3', 'qwen2.5', 'phi4'],
  },
  lmstudio: {
    label: 'LM Studio (local)',
    defaultModel: 'local-model',
    defaultBaseUrl: 'http://localhost:1234',
    requiresKey: false,
    modelSuggestions: ['local-model'],
  },
};
