import { DailyUsageStats, TokenUsage } from './types.ts';

// Official Gemini API free-tier quotas per model
export interface ModelQuotaSpec {
  modelId: string;
  name: string;
  rpm: number; // Requests per minute
  rpd: number; // Requests per day
  tpm: number; // Tokens per minute
  tpd: number; // Tokens per day
}

export const MODEL_QUOTA_SPECS: Record<string, ModelQuotaSpec> = {
  'gemini-2.5-flash': {
    modelId: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    rpm: 15,
    rpd: 1500,
    tpm: 1000000,
    tpd: 10000000, // 10M tokens / day
  },
  'gemini-3.1-flash-lite': {
    modelId: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    rpm: 30,
    rpd: 1500,
    tpm: 1000000,
    tpd: 10000000,
  },
  'gemini-3.8-flash': {
    modelId: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    rpm: 10,
    rpd: 500,
    tpm: 250000,
    tpd: 2500000,
  },
};

const STATS_STORAGE_KEY = 'gemini_daily_usage_stats_v1';

export function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function loadDailyStats(): DailyUsageStats {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      const parsed: DailyUsageStats = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading daily stats', e);
  }

  // Reset or initialize new day
  const fresh: DailyUsageStats = {
    date: today,
    requestsCount: 0,
    totalTokensUsed: 0,
    promptTokensUsed: 0,
    candidatesTokensUsed: 0,
  };
  saveDailyStats(fresh);
  return fresh;
}

export function saveDailyStats(stats: DailyUsageStats) {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving daily stats', e);
  }
}

export function recordUsage(usage: TokenUsage): DailyUsageStats {
  const current = loadDailyStats();
  const updated: DailyUsageStats = {
    ...current,
    requestsCount: current.requestsCount + 1,
    totalTokensUsed: current.totalTokensUsed + (usage.totalTokens || 0),
    promptTokensUsed: current.promptTokensUsed + (usage.promptTokens || 0),
    candidatesTokensUsed: current.candidatesTokensUsed + (usage.candidatesTokens || 0),
  };
  saveDailyStats(updated);
  return updated;
}
