export interface SourceLink {
  title?: string;
  uri?: string;
}

export interface AttachedImage {
  data: string; // base64
  mimeType: string;
  name?: string;
}

export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  model: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: AttachedImage;
  sources?: SourceLink[];
  usage?: TokenUsage;
  isStreaming?: boolean;
  isError?: boolean;
}

export interface DailyUsageStats {
  date: string; // YYYY-MM-DD
  requestsCount: number;
  totalTokensUsed: number;
  promptTokensUsed: number;
  candidatesTokensUsed: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export type ToneType = 'balanced' | 'creative' | 'concise' | 'hinglish';

export interface ChatSettings {
  systemInstruction?: string;
  enableSearch: boolean;
  tone: ToneType;
  model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview' | 'gemini-flash-latest' | 'gemini-2.5-flash';
  customApiKey?: string;
}

