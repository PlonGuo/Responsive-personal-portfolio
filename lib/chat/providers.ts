import 'server-only';
import type { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAI } from '@ai-sdk/openai';

type ChatProvider = Pick<Parameters<typeof streamText>[0], 'model' | 'providerOptions' | 'maxOutputTokens' | 'temperature'> & { name: 'deepseek' | 'openai' };

export function getChatProviders(fetcher: typeof fetch): ChatProvider[] {
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  return [
    ...(deepseekKey ? [{ name: 'deepseek' as const,
      model: createDeepSeek({ apiKey: deepseekKey, baseURL: 'https://api.deepseek.com', fetch: fetcher })
        .chat(process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash'),
      maxOutputTokens: 1024, temperature: 0.7,
      providerOptions: { deepseek: { thinking: { type: 'disabled' as const } } },
    }] : []),
    ...(openaiKey ? [{ name: 'openai' as const,
      model: createOpenAI({ apiKey: openaiKey, baseURL: 'https://api.openai.com/v1', fetch: fetcher })
        .chat(process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini'),
      // Keep Chat Completions' existing parameter, without also sending max_tokens.
      providerOptions: { openai: { maxCompletionTokens: 1024 } },
    }] : []),
  ];
}
