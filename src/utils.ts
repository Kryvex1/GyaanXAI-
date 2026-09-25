export function formatMessageTime(timestamp?: number): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatConversationTime(timestamp?: number): string {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

/**
 * Detects if the user is in India or international.
 * Returns appropriate language tone ('hinglish' for India, 'professional' / English for international)
 */
export function detectUserRegionAndTone(): { isIndia: boolean; tone: 'hinglish' | 'professional' } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (navigator.language || '').toLowerCase();
    const isIndia =
      tz.toLowerCase().includes('kolkata') ||
      tz.toLowerCase().includes('calcutta') ||
      tz.toLowerCase().includes('asia/colombo') ||
      lang.includes('-in') ||
      lang.startsWith('hi');

    return {
      isIndia,
      tone: isIndia ? 'hinglish' : 'professional',
    };
  } catch {
    return { isIndia: true, tone: 'hinglish' };
  }
}
