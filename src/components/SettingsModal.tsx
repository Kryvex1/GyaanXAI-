import React from 'react';
import { X, Sliders, Download, Check, Key } from 'lucide-react';
import { ChatSettings, ToneType, Conversation } from '../types.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onUpdateSettings: (newSettings: ChatSettings) => void;
  activeConversation?: Conversation | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  activeConversation,
}) => {
  if (!isOpen) return null;

  const modelOptions = [
    {
      id: 'gemini-3.8-flash' as const,
      name: 'GyaanX Flash (Gemini 3.8)',
      badge: 'Recommended',
      desc: 'Next-gen intelligence, high speed, and native search grounding support.',
    },
    {
      id: 'gemini-3.1-flash-lite' as const,
      name: 'GyaanX Flash Lite (Gemini 3.1)',
      badge: 'High Throughput',
      desc: 'Optimized for lightweight tasks and low latency.',
    },
  ];

  const toneOptions: Array<{ id: ToneType; label: string; desc: string }> = [
    {
      id: 'hinglish',
      label: 'Hinglish Friendly 🇮🇳 (India)',
      desc: 'Natural mix of Hindi & English — friendly, chill desi tech vibes.',
    },
    {
      id: 'balanced',
      label: 'International English 🌐',
      desc: 'Default clear, intelligent, and structured English communication.',
    },
    {
      id: 'concise',
      label: 'Concise & Direct',
      desc: 'Short, sharp, to-the-point answers with zero conversational fluff.',
    },
    {
      id: 'creative',
      label: 'Creative & Warm',
      desc: 'Rich, engaging descriptions, brainstorming, and storytelling.',
    },
  ];

  const handleExportMarkdown = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;

    const lines = [
      `# ${activeConversation.title}`,
      `*Exported on ${new Date().toLocaleString()}*\n`,
    ];

    activeConversation.messages.forEach((msg) => {
      const sender = msg.role === 'user' ? 'You' : 'GyaanX AI';
      lines.push(`### ${sender}`);
      lines.push(`${msg.content}\n`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl bg-[#0e1424] border border-[#1b253b] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1b253b]">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-blue-400" />
            <h2 className="font-semibold text-sm text-white">Chat & Model Preferences</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* AI Model Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              GyaanX AI Engine Model
            </label>
            <div className="space-y-2">
              {modelOptions.map((opt) => {
                const isSelected = (settings.model || 'gemini-2.5-flash') === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => onUpdateSettings({ ...settings, model: opt.id })}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-blue-500/60 bg-[#151f33] shadow-xs'
                        : 'border-[#1b253b] bg-[#101728] hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {opt.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-400 border border-blue-800/40">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
                    </div>
                    {isSelected && <Check size={15} className="text-blue-400 shrink-0 mt-0.5" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Tone & Regional Language
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {toneOptions.map((tone) => {
                const isSelected = (settings.tone || 'hinglish') === tone.id;
                return (
                  <div
                    key={tone.id}
                    onClick={() => onUpdateSettings({ ...settings, tone: tone.id })}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500/60 bg-[#151f33]'
                        : 'border-[#1b253b] bg-[#101728] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {tone.label}
                      </span>
                      {isSelected && <Check size={13} className="text-blue-400" />}
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-snug">{tone.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Key Pool / Custom API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key size={13} className="text-amber-400" />
                API Key Pool (Multi-Key Auto Failover)
              </label>
              <span className="text-[10.5px] text-slate-500">Optional</span>
            </div>
            <textarea
              rows={2}
              value={settings.customApiKey || ''}
              onChange={(e) => onUpdateSettings({ ...settings, customApiKey: e.target.value })}
              placeholder="Enter one or multiple keys (comma-separated). Agar ek ka quota khatam hoga toh dusra automatically chalega."
              className="w-full bg-[#101728] border border-[#1b253b] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[10.5px] text-slate-500 mt-1">
              Supports multiple keys with seamless quota fallback.
            </p>
          </div>

          {/* Export Conversation */}
          {activeConversation && activeConversation.messages.length > 0 && (
            <div className="pt-2 border-t border-[#1b253b] flex items-center justify-between">
              <div className="text-xs">
                <span className="font-semibold text-slate-300 block">Export Chat</span>
                <span className="text-[11px] text-slate-500">Download current session as Markdown</span>
              </div>
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151f33] hover:bg-[#1c2944] text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span>Export (.md)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
