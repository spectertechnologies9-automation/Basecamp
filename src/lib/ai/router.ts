import { queryOne } from '@/lib/db';

export interface AIRouteMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRouteOptions {
  messages: AIRouteMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AIConfig {
  provider: 'omni' | 'grok' | 'qwen' | 'gemini';
  default_model?: string;
  omni_key?: string;
  grok_key?: string;
  qwen_key?: string;
  gemini_key?: string;
}

export async function getActiveAIConfig(): Promise<AIConfig> {
  let dbConfig: Partial<AIConfig> = {};
  try {
    const row = await queryOne<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['ai_config']);
    if (row?.value) {
      dbConfig = JSON.parse(row.value);
    }
  } catch {
    // Database fallback
  }

  const omni_key = dbConfig.omni_key || process.env.OPENROUTER_API_KEY || process.env.OMNI_ROUTE_API_KEY;
  const grok_key = dbConfig.grok_key || process.env.XAI_API_KEY;
  const qwen_key = dbConfig.qwen_key || process.env.DASHSCOPE_API_KEY;
  const gemini_key = dbConfig.gemini_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  let provider = dbConfig.provider || 'gemini';
  if (provider === 'omni' && !omni_key) {
    if (grok_key) provider = 'grok';
    else if (qwen_key) provider = 'qwen';
    else provider = 'gemini';
  } else if (provider === 'grok' && !grok_key) {
    if (qwen_key) provider = 'qwen';
    else if (omni_key) provider = 'omni';
    else provider = 'gemini';
  } else if (provider === 'qwen' && !qwen_key) {
    if (omni_key) provider = 'omni';
    else if (grok_key) provider = 'grok';
    else provider = 'gemini';
  }

  return {
    provider,
    default_model: dbConfig.default_model,
    omni_key,
    grok_key,
    qwen_key,
    gemini_key,
  };
}

export async function executeAIRoute(options: AIRouteOptions): Promise<string> {
  const config = await getActiveAIConfig();
  const { messages, temperature = 0.3, maxTokens = 1500, jsonMode = false } = options;

  // 1. Omni Route / OpenRouter (Primary)
  if ((config.provider === 'omni' || !config.provider) && config.omni_key) {
    try {
      const primaryModel = config.default_model || 'meta-llama/llama-3.3-70b-instruct';
      const modelsToTry = [primaryModel, 'deepseek/deepseek-chat', 'meta-llama/llama-3.3-70b-instruct'];

      for (const model of Array.from(new Set(modelsToTry))) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.omni_key}`,
              'HTTP-Referer': 'https://specteros.local',
              'X-Title': 'SPECTER OS',
            },
            body: JSON.stringify({
              model,
              messages,
              temperature,
              max_tokens: maxTokens,
              response_format: jsonMode ? { type: 'json_object' } : undefined,
            }),
          });

          if (res.ok) {
            const json = await res.json();
            const content = json.choices?.[0]?.message?.content;
            if (content) return content;
          }
        } catch {
          // try next model
        }
      }
    } catch (e) {
      console.warn('Omni Route error, attempting fallback:', e);
    }
  }

  // 2. xAI Grok (Fallback 1)
  if (config.grok_key) {
    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.grok_key}`,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (e) {
      console.warn('xAI Grok direct error, attempting next fallback:', e);
    }
  }

  // 3. Alibaba Qwen (DashScope API or OpenRouter)
  if ((config.provider === 'qwen' || config.qwen_key) && config.qwen_key) {
    try {
      const res = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.qwen_key}`,
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (e) {
      console.warn('Qwen error, attempting fallback:', e);
    }
  }

  // 4. Google Gemini (Native SDK or REST)
  if (config.gemini_key) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: config.gemini_key });

      const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
      const conversationMsgs = messages
        .filter((m) => m.role !== 'system')
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: conversationMsgs || 'Analyze and report.',
        config: {
          systemInstruction: systemMsg,
          temperature,
          responseMimeType: jsonMode ? 'application/json' : undefined,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (e) {
      console.warn('Gemini error, using grounded fallback:', e);
    }
  }

  // 5. Grounded deterministic fallback
  return '';
}
