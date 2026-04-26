import { AIConfig, AIMessage } from '@/types/ai';

function buildSystemPrompt(documentContent?: string): string {
  let prompt = `You are a helpful writing assistant integrated into Quill, a minimalist markdown editor.

You can answer questions, generate content, and edit the user's document.

When the user asks you to edit, rewrite, or update their document, respond with the complete updated document wrapped exactly like this:
\`\`\`document-edit
(full updated markdown content here)
\`\`\`

Always output the complete document — never partial edits. For all other responses, use regular markdown formatting.`;

  if (documentContent !== undefined) {
    prompt += `\n\nCurrent document content:\n\`\`\`markdown\n${documentContent}\n\`\`\``;
  } else {
    prompt += '\n\nNo document is currently open.';
  }
  return prompt;
}

async function callOpenAICompatible(
  config: AIConfig,
  messages: AIMessage[],
  system: string,
): Promise<string> {
  const base =
    config.provider === 'lmstudio'
      ? (config.baseUrl ?? 'http://localhost:1234')
      : 'https://api.openai.com';

  const res = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function callAnthropic(
  config: AIConfig,
  messages: AIMessage[],
  system: string,
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey ?? '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 8096,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text as string;
}

async function callOllama(
  config: AIConfig,
  messages: AIMessage[],
  system: string,
): Promise<string> {
  const base = config.baseUrl ?? 'http://localhost:11434';
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.message.content as string;
}

export async function sendAIMessage(
  config: AIConfig,
  messages: AIMessage[],
  documentContent?: string,
): Promise<string> {
  const system = buildSystemPrompt(documentContent);
  switch (config.provider) {
    case 'openai':
    case 'lmstudio':
      return callOpenAICompatible(config, messages, system);
    case 'anthropic':
      return callAnthropic(config, messages, system);
    case 'ollama':
      return callOllama(config, messages, system);
  }
}

export function extractDocumentEdit(content: string): string | null {
  const match = content.match(/```document-edit\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}
