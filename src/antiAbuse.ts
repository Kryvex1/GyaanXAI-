/**
 * Anti-Abuse, Rate-Limiting & Multi-Account Bypass Prevention
 * 
 * Prevents users from:
 * 1. Spamming rapid requests (flood protection)
 * 2. Creating or switching accounts repeatedly on the same device after exhausting free daily quota
 * 3. Exceeding daily device and account token thresholds
 */

import { getTodayKey } from './quotaUtils.ts';

const DEVICE_ID_KEY = 'gyaanx_device_identity_token';
const DEVICE_USAGE_PREFIX = 'gyaanx_device_quota_';
const LAST_REQUEST_TIME_KEY = 'gyaanx_last_req_ts';
const RECENT_REQUESTS_KEY = 'gyaanx_recent_req_timestamps';

// Max free requests per device per day regardless of which account is logged in
export const MAX_DEVICE_DAILY_REQUESTS = 300;
// Max free tokens per device per day
export const MAX_DEVICE_DAILY_TOKENS = 5_000_000;
// Min interval between consecutive messages (in milliseconds)
export const MIN_REQUEST_INTERVAL_MS = 500; // 500ms
// Max requests allowed within a rolling 60-second window
export const MAX_REQUESTS_PER_MINUTE = 30;

export interface DeviceUsageRecord {
  date: string;
  requestsCount: number;
  tokensUsed: number;
  associatedAccounts: string[]; // List of user UIDs observed on this device
}

/**
 * Returns or generates a persistent device ID stored in localStorage and cookie
 */
export function getPersistentDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'fallback_device_id';
  }
}

/**
 * Loads device-level daily usage
 */
export function getDeviceDailyUsage(): DeviceUsageRecord {
  const today = getTodayKey();
  const key = `${DEVICE_USAGE_PREFIX}${today}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  const initial: DeviceUsageRecord = {
    date: today,
    requestsCount: 0,
    tokensUsed: 0,
    associatedAccounts: [],
  };
  saveDeviceDailyUsage(initial);
  return initial;
}

/**
 * Saves device-level daily usage
 */
export function saveDeviceDailyUsage(record: DeviceUsageRecord) {
  const key = `${DEVICE_USAGE_PREFIX}${record.date}`;
  try {
    localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // ignore
  }
}

/**
 * Records a request and tokens against this device
 */
export function recordDeviceUsage(userId?: string, tokens = 0): DeviceUsageRecord {
  const current = getDeviceDailyUsage();
  const updatedAccounts = new Set(current.associatedAccounts || []);
  if (userId) {
    updatedAccounts.add(userId);
  }

  const updated: DeviceUsageRecord = {
    ...current,
    requestsCount: current.requestsCount + 1,
    tokensUsed: current.tokensUsed + tokens,
    associatedAccounts: Array.from(updatedAccounts),
  };

  saveDeviceDailyUsage(updated);
  return updated;
}

export interface AbuseCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates request against rate limits and device quotas
 */
export function checkAbuseAndRateLimit(userId?: string): AbuseCheckResult {
  const now = Date.now();

  // 1. Minimum interval check (prevent rapid double click / spam)
  try {
    const lastTimeStr = sessionStorage.getItem(LAST_REQUEST_TIME_KEY);
    if (lastTimeStr) {
      const lastTime = parseInt(lastTimeStr, 10);
      if (now - lastTime < MIN_REQUEST_INTERVAL_MS) {
        return {
          allowed: false,
          reason: 'Please wait a moment before sending another message.',
        };
      }
    }
    sessionStorage.setItem(LAST_REQUEST_TIME_KEY, now.toString());
  } catch {
    // ignore
  }

  // 2. Rolling 1-minute rate limit
  try {
    const rawRecent = sessionStorage.getItem(RECENT_REQUESTS_KEY);
    let timestamps: number[] = rawRecent ? JSON.parse(rawRecent) : [];
    // Keep only timestamps within last 60 seconds
    timestamps = timestamps.filter((t) => now - t < 60000);

    if (timestamps.length >= MAX_REQUESTS_PER_MINUTE) {
      return {
        allowed: false,
        reason: 'Too many requests in a short period. Please wait 30 seconds.',
      };
    }

    timestamps.push(now);
    sessionStorage.setItem(RECENT_REQUESTS_KEY, JSON.stringify(timestamps));
  } catch {
    // ignore
  }

  // 3. Device-level daily quota check (prevents creating new accounts to bypass limits)
  const deviceUsage = getDeviceDailyUsage();

  if (deviceUsage.requestsCount >= MAX_DEVICE_DAILY_REQUESTS) {
    return {
      allowed: false,
      reason: `Daily message limit reached for this device (${MAX_DEVICE_DAILY_REQUESTS} requests/day). Switching accounts does not reset the device limit. Quota resets at midnight.`,
    };
  }

  if (deviceUsage.tokensUsed >= MAX_DEVICE_DAILY_TOKENS) {
    return {
      allowed: false,
      reason: 'Daily token limit reached for this device. Quota resets at midnight.',
    };
  }

  return { allowed: true };
}
