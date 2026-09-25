import React from 'react';
import { X, Crown, Sparkles, Check, Zap, Image, Brain, Shield } from 'lucide-react';

interface ProModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel?: (model: string) => void;
  currentModel?: string;
}

export const ProModeModal: React.FC<ProModeModalProps> = ({
  isOpen,
  onClose,
  onSelectModel,
  currentModel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-md rounded-3xl bg-[#0e1424] border border-amber-500/30 p-6 shadow-2xl space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
            <Crown size={28} />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">GyaanX Pro Mode</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Maximum intelligence, higher daily limits, image generation, and multi-key auto failover.
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 pt-1">
          {[
            {
              icon: Brain,
              title: 'GyaanX Pro Engine',
              desc: 'Advanced reasoning, deep code logic & nuanced understanding.',
            },
            {
              icon: Zap,
              title: 'Higher Quota & Multi-Key Failover',
              desc: 'Continuous uptime with automatic fallback across API key pools.',
            },
            {
              icon: Image,
              title: 'ImgBB Cloud Vision Hosting',
              desc: 'High-speed image upload & instant visual breakdown.',
            },
            {
              icon: Shield,
              title: 'Zero Latency Priority',
              desc: 'Fastest response streaming with real-time web search grounding.',
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-2xl bg-[#131b2e] border border-[#1e2a44]"
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{f.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activate / Model Switcher */}
        <div className="pt-2 border-t border-[#182033] flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (onSelectModel) onSelectModel('gemini-3.8-flash');
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer text-center"
          >
            {currentModel === 'gemini-3.8-flash' ? 'GyaanX Pro Active ✓' : 'Switch to GyaanX Pro'}
          </button>
        </div>
      </div>
    </div>
  );
};
