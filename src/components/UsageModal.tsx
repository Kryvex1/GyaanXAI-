import React from 'react';
import { X, Gauge, Zap, Calendar, AlertCircle, ArrowUpRight } from 'lucide-react';
import { DailyUsageStats } from '../types.ts';
import { getModelQuota } from '../quotaUtils.ts';

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyStats: DailyUsageStats;
  currentModel: string;
}

export const UsageModal: React.FC<UsageModalProps> = ({
  isOpen,
  onClose,
  dailyStats,
  currentModel,
}) => {
  if (!isOpen) return null;

  const spec = getModelQuota(currentModel);

  // Token calculations
  const totalTokensUsed = dailyStats.totalTokensUsed;
  const tokenDayLimit = spec.tpd;
  const tokensRemaining = Math.max(0, tokenDayLimit - totalTokensUsed);
  const tokenUsedPercent = Math.min(100, Math.round((totalTokensUsed / tokenDayLimit) * 100));

  // Request calculations
  const requestsUsed = dailyStats.requestsCount;
  const requestDayLimit = spec.rpd;
  const requestsRemaining = Math.max(0, requestDayLimit - requestsUsed);
  const requestUsedPercent = Math.min(100, Math.round((requestsUsed / requestDayLimit) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#0d131f] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Gauge size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white">API Quota & Token Limit</h2>
              <p className="text-[11px] text-slate-400">Real-time daily usage tracking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Active Model Indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Current Active Model</span>
              <span className="text-xs font-semibold text-white">{spec.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-medium">Date (Reset at 00:00 UTC)</span>
              <span className="text-xs font-mono text-slate-300">{dailyStats.date}</span>
            </div>
          </div>

          {/* Tokens Remaining Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-900 border border-indigo-500/30 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-indigo-400" />
                <span className="text-xs font-semibold text-white">Daily Tokens Remaining</span>
              </div>
              <span className="text-xs font-mono font-medium text-emerald-400">
                {tokensRemaining.toLocaleString()} left
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-sky-400 to-indigo-500"
                style={{ width: `${Math.max(tokenUsedPercent, 1)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Used: {totalTokensUsed.toLocaleString()} tokens ({tokenUsedPercent}%)</span>
              <span>Total Limit: {(tokenDayLimit / 1000000).toFixed(0)}M / day</span>
            </div>

            {/* Token breakdown */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Prompt (Input) Tokens:</span>
                <span className="font-mono text-slate-300 font-medium">{dailyStats.promptTokensUsed.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Output (Generated) Tokens:</span>
                <span className="font-mono text-slate-300 font-medium">{dailyStats.candidatesTokensUsed.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Requests Remaining Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-sky-400" />
                <span className="text-xs font-semibold text-white">Requests (RPD) Limit</span>
              </div>
              <span className="text-xs font-mono font-medium text-sky-400">
                {requestsRemaining} / {requestDayLimit} left
              </span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-sky-400 transition-all duration-500"
                style={{ width: `${Math.max(requestUsedPercent, 1)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Used today: {requestsUsed} requests</span>
              <span>Rate limit: {spec.rpm} RPM</span>
            </div>
          </div>

          {/* Quota policy info */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-slate-400" />
            <div className="space-y-1">
              <p className="text-[11.5px] leading-relaxed">
                Tokens and daily quotas reset automatically every 24 hours. GyaanX AI extracts precise token counts from every response via <code className="text-sky-300 font-mono">usageMetadata</code>.
              </p>
              <a
                href="https://ai.google.dev/gemini-api/docs/rate-limits"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 underline font-medium"
              >
                Official Gemini Rate Limits Docs <ArrowUpRight size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
