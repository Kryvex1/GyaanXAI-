import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// ============================================================================
// 🔑 GLOBAL BACKEND API KEYS (All users access these automatically)
// ============================================================================
// Kisi bhi user ko apni API key daalne ki zaroorat nahi hai.
// Jab bhi nayi key lagani ho, bas yahan list me add kar do:
const GLOBAL_SERVER_API_KEYS: string[] = [
  'AQ.Ab8RN6KHqfP8civ3oxmdGDkAYw-Mw4nSQcfZdNhzRRiztPzhDA', // Default primary key
  // 'AIzaSyYourNewBackupKey2...',                           // Backup key 2
  // 'AIzaSyYourNewBackupKey3...',                           // Backup key 3
];

// In-memory dynamic key pool
const dynamicKeyPool: string[] = [];

// Helper to assemble candidate API keys in priority order
const getKeyPool = (userProvidedKeys?: string | string[]): string[] => {
  const keys: string[] = [];

  // 1. User custom keys if provided (optional)
  if (Array.isArray(userProvidedKeys)) {
    keys.push(...userProvidedKeys.filter(Boolean));
  } else if (typeof userProvidedKeys === 'string' && userProvidedKeys.trim()) {
    const split = userProvidedKeys.split(/[,\n]/).map((k) => k.trim()).filter(Boolean);
    keys.push(...split);
  }

  // 2. Global Server Keys configured by Admin (All users use these!)
  keys.push(...GLOBAL_SERVER_API_KEYS.filter(Boolean));

  // 3. Dynamically registered keys
  keys.push(...dynamicKeyPool);

  // 4. Environment keys if defined
  if (process.env.GEMINI_API_KEYS) {
    const envKeys = process.env.GEMINI_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean);
    keys.push(...envKeys);
  }
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }

  // Deduplicate
  return Array.from(new Set(keys.filter(Boolean)));
};

interface MessagePayload {
  role: 'user' | 'assistant' | 'model';
  content: string;
  image?: {
    data: string;
    mimeType: string;
  };
}

// Helper to format messages for Google GenAI
const formatContents = (messages: MessagePayload[]) => {
  return messages.map((m) => {
    const parts: any[] = [];
    if (m.image && m.image.data && m.image.mimeType) {
      // If data is URL or base64
      const base64Data = m.image.data.includes('base64,')
        ? m.image.data.split('base64,')[1]
        : m.image.data;

      parts.push({
        inlineData: {
          mimeType: m.image.mimeType,
          data: base64Data,
        },
      });
    }
    if (m.content) {
      parts.push({ text: m.content });
    }
    if (parts.length === 0) {
      parts.push({ text: ' ' });
    }
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });
};

// Clean user-friendly error formatting
const extractCleanErrorMessage = (err: any): string => {
  if (!err) return 'An unexpected error occurred.';
  let message = err.message || String(err);

  try {
    if (message.includes('"message":')) {
      const parsed = JSON.parse(message);
      if (parsed?.error?.message) {
        try {
          const nested = JSON.parse(parsed.error.message);
          if (nested?.error?.message) {
            return nested.error.message;
          }
        } catch {
          return parsed.error.message;
        }
      }
    }
  } catch {
    // ignore
  }

  if (message.includes('503') || message.includes('high demand') || message.includes('UNAVAILABLE')) {
    return 'GyaanX AI servers are temporarily experiencing high demand. Retrying...';
  }
  if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
    return 'Invalid API key. Please check your credentials.';
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota') || message.includes('429')) {
    return 'Quota limit reached on current key. Switching to backup key...';
  }

  return message;
};

// Stream handler with Multi-Key Failover and Multi-Model Fallback
async function streamWithKeyAndModelFallback(
  keyPool: string[],
  contents: any[],
  config: any,
  preferredModel: string | undefined,
  onChunk: (text: string) => void,
  onSources: (sources: any[]) => void,
  onUsage: (usage: { promptTokens: number; candidatesTokens: number; totalTokens: number; model: string }) => void
) {
  const candidateModels = [
    preferredModel || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
  ];
  const models = Array.from(new Set(candidateModels.filter(Boolean)));
  let lastErr: any = null;

  for (let keyIdx = 0; keyIdx < keyPool.length; keyIdx++) {
    const currentKey = keyPool[keyIdx];
    const ai = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: {
        headers: {
          'User-Agent': 'gyaanx-ai',
        },
      },
    });

    for (const model of models) {
      let receivedAny = false;
      try {
        const responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config,
        });

        const collectedSources: Array<{ title?: string; uri?: string }> = [];
        let lastUsage: any = null;

        for await (const chunk of responseStream) {
          receivedAny = true;
          const text = chunk.text;
          if (text) {
            onChunk(text);
          }

          if (chunk.usageMetadata) {
            lastUsage = chunk.usageMetadata;
          }

          const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks && Array.isArray(chunks)) {
            for (const c of chunks) {
              if (c.web?.uri) {
                collectedSources.push({
                  title: c.web.title || c.web.uri,
                  uri: c.web.uri,
                });
              }
            }
          }
        }

        if (collectedSources.length > 0) {
          const uniqueSources = Array.from(
            new Map(collectedSources.map((item) => [item.uri, item])).values()
          );
          onSources(uniqueSources);
        }

        if (lastUsage) {
          onUsage({
            promptTokens: lastUsage.promptTokenCount || 0,
            candidatesTokens: lastUsage.candidatesTokenCount || 0,
            totalTokens: lastUsage.totalTokenCount || 0,
            model,
          });
        }

        // Successfully finished generation on this key & model
        return;
      } catch (err: any) {
        lastErr = err;
        const errMsg = String(err?.message || err);
        console.warn(`[GyaanX Fallback] Error with key ${keyIdx + 1}/${keyPool.length} on model ${model}:`, errMsg);

        // If we already sent partial response, do not try to splice into ongoing stream
        if (receivedAny) {
          throw err;
        }

        // If quota exhausted (429 or RESOURCE_EXHAUSTED), break inner model loop to switch key immediately!
        if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429') || errMsg.includes('quota')) {
          console.log(`[GyaanX Auto-Failover] Quota exhausted on key ${keyIdx + 1}, switching to next key in pool...`);
          break; // break to next key in keyPool
        }

        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  throw lastErr;
}

// SSE Streaming chat endpoint
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const { messages, settings = {}, customApiKey } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const clientKey = (customApiKey as string) || (req.headers['x-gemini-key'] as string);
    const keyPool = getKeyPool(clientKey);

    const contents = formatContents(messages);

    const isHinglish = settings.tone === 'hinglish' || !settings.tone;

    const defaultSystemInstruction = isHinglish
      ? 'You are GyaanX AI, a modern, highly intelligent, chill and sharp AI assistant. ' +
        'Language style: Natural, relatable conversational Hinglish (Hindi + English) with cool desi tech swag. ' +
        'Personality: Friendly, witty ("Are bhai", "Ekdum killer", "Chal dekhte hain"), helpful, without robotic filler. ' +
        'Tone Optimization Rules: ' +
        '1. Be direct, crisp, and high-signal. Avoid empty pleasantries or repeating the prompt. ' +
        '2. For photo analysis, breakdown key elements (Background, Style, Look, Vibe, Overall) using clean emojis. ' +
        '3. Use neat Markdown formatting with clean bullet points and syntax-highlighted code blocks where applicable.'
      : 'You are GyaanX AI, a modern, sharp, and highly intelligent AI assistant. ' +
        'Language style: Clean, clear, concise, and professional English. ' +
        'Tone Optimization Rules: ' +
        '1. Be direct, actionable, and high-signal. Avoid filler. ' +
        '2. Use neat Markdown formatting, structured bullet points, and syntax-highlighted code blocks.';

    await streamWithKeyAndModelFallback(
      keyPool,
      contents,
      {
        systemInstruction: settings.systemInstruction || defaultSystemInstruction,
        tools: settings.enableSearch ? [{ googleSearch: {} }] : undefined,
      },
      settings.model,
      (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      },
      (sources) => {
        res.write(`data: ${JSON.stringify({ sources })}\n\n`);
      },
      (usage) => {
        res.write(`data: ${JSON.stringify({ usage })}\n\n`);
      }
    );

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error in /api/chat/stream:', error);
    const errorMessage = extractCleanErrorMessage(error);
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

// Non-streaming chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, settings = {}, customApiKey } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  try {
    const clientKey = (customApiKey as string) || (req.headers['x-gemini-key'] as string);
    const keyPool = getKeyPool(clientKey);
    const contents = formatContents(messages);

    let fullText = '';
    let sourcesList: any[] = [];
    let usageData: any = null;

    await streamWithKeyAndModelFallback(
      keyPool,
      contents,
      {
        systemInstruction: settings.systemInstruction || 'You are GyaanX AI, a helpful, sharp and direct AI assistant.',
        tools: settings.enableSearch ? [{ googleSearch: {} }] : undefined,
      },
      settings.model,
      (chunk) => {
        fullText += chunk;
      },
      (srcs) => {
        sourcesList = srcs;
      },
      (usg) => {
        usageData = usg;
      }
    );

    res.json({
      text: fullText,
      sources: sourcesList,
      usage: usageData,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: extractCleanErrorMessage(error) });
  }
});

// Key management endpoint to add fallback keys
app.post('/api/keys', (req: Request, res: Response) => {
  const { key } = req.body;
  if (key && typeof key === 'string' && key.trim()) {
    dynamicKeyPool.unshift(key.trim());
    res.json({ success: true, totalKeysInPool: dynamicKeyPool.length });
  } else {
    res.status(400).json({ error: 'Valid key string required' });
  }
});

// In production, serve built frontend
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// In development, mount Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`GyaanX AI Server listening on port ${PORT}`);
  });
}

startServer();
