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
// Primary key is automatically loaded from process.env.GEMINI_API_KEY.
// Additional server keys can be added here or via GEMINI_API_KEYS env var.
const GLOBAL_SERVER_API_KEYS: string[] = [];

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

  // 2. Primary Environment Key (AI Studio automatically provides GEMINI_API_KEY)
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }

  // 3. Additional backup keys from environment
  if (process.env.GEMINI_API_KEYS) {
    const envKeys = process.env.GEMINI_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean);
    keys.push(...envKeys);
  }

  // 4. Global Server Keys configured by Admin / dynamic pool
  keys.push(...GLOBAL_SERVER_API_KEYS.filter(Boolean));
  keys.push(...dynamicKeyPool);

  // Deduplicate and fallback
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));
  return uniqueKeys.length > 0 ? uniqueKeys : [process.env.GEMINI_API_KEY || ''];
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
    return 'GyaanX AI servers are temporarily experiencing high demand. Please retry in a few moments.';
  }
  if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
    return 'Invalid API key. Please check your credentials or update your key in Settings.';
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota') || message.includes('429')) {
    return 'Gemini API rate limit reached. Please wait a moment, or add your personal Gemini API key in Profile settings to continue immediately.';
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
  // Sanitize models to modern active Gemini models
  const sanitizeModel = (m?: string): string => {
    if (!m || m === 'gemini-2.5-flash' || m.includes('2.5') || m.includes('2.0') || m.includes('1.5')) {
      return 'gemini-3.1-flash-lite';
    }
    return m;
  };

  const primaryModel = sanitizeModel(preferredModel);
  // Prioritize 3.1-flash-lite as first fallback because of its generous quota and reliability
  const candidateModels = [
    primaryModel,
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];
  const models = Array.from(new Set(candidateModels.filter(Boolean)));
  let lastErr: any = null;

  for (let keyIdx = 0; keyIdx < keyPool.length; keyIdx++) {
    const currentKey = keyPool[keyIdx];
    const ai = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
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
        const statusCode = err?.status || err?.code || 500;
        console.warn(`[GyaanX Fallback] Model ${model} returned status ${statusCode}, switching to fallback...`);

        // If we already sent partial response, do not try to splice into ongoing stream
        if (receivedAny) {
          throw err;
        }

        await new Promise((r) => setTimeout(r, 60));
      }
    }
  }

  const cleanMessage = extractCleanErrorMessage(lastErr);
  const failureError = new Error(cleanMessage);
  (failureError as any).status = 429;
  throw failureError;
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

    const defaultSystemInstruction =
      'You are GyaanX AI, a state-of-the-art, highly intelligent, chill, sharp and engaging AI companion. ' +
      'CORE DIRECTIVES: ' +
      '1. MIRROR USER LANGUAGE & VIBE: Always respond in the exact same language and vibe the user speaks to you in. ' +
      'If the user speaks casual Hinglish / Hindi slang / humor / banter / memes, match their exact casual desi vibe, jokes, and language naturally without sounding like an artificial bot or preaching. ' +
      'If the user speaks English, respond in crisp, high-signal English. ' +
      'If the user is playful, sarcastic, or joking, match their wit and humor naturally. ' +
      '2. ELITE READABILITY & BEAUTIFUL FORMATTING (CRITICAL): ' +
      'Never dump a dense, uninterrupted wall of text like a textbook. ' +
      'Always structure your explanations with generous whitespace, clear paragraph breaks, bold key concepts, bullet points with breathing room, clean section headers (###), and numbered steps when explaining processes. ' +
      'Start with a direct, punchy answer or summary. Break down complex points step-by-step with intuitive analogies or practical examples. ' +
      '3. NO PREACHY DISCLAIMERS: Never give robotic canned disclaimer scripts, boilerplate lectures, or unnecessary formal filler. ' +
      '4. BE DIRECT & HIGH-IQ: Give sharp, actionable, accurate answers with clean formatting, bullet points, and code blocks when needed. ' +
      '5. IDENTITY: You are GyaanX AI. You have your own cool, sharp personality.';

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
    const isRateLimit = String(error?.message || error).includes('429') || String(error?.message || error).includes('RESOURCE_EXHAUSTED');
    if (isRateLimit) {
      console.warn('[GyaanX Stream] Rate limit hit:', extractCleanErrorMessage(error));
    } else {
      console.error('Error in /api/chat/stream:', error);
    }
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

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`GyaanX AI Server listening on port ${PORT}`);
  });
}

startServer();
