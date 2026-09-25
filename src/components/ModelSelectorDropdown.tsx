import React, { useRef, useEffect } from 'react';
import { Check, Zap, Sparkles, Cpu, Compass, Brain } from 'lucide-react';

export type GyaanXModelId =
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.8-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-flash-latest';

export interface ModelOptionItem {
  id: GyaanXModelId;
  name: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
}

interface ModelSelectorDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: GyaanXModelId) => void;
  extendedThinking?: boolean;
  onToggleExtendedThinking?: () => void;
}

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
  extendedThinking = false,
  onToggleExtendedThinking,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Clean, Minimal Model List (No Bloatware Text)
  const models: ModelOptionItem[] = [
    {
      id: 'gemini-3.1-flash-lite',
      name: 'GyaanX Turbo',
      badge: 'Fastest',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: <Zap size={15} className="text-emerald-400" />,
    },
    {
      id: 'gemini-3.8-flash',
      name: 'GyaanX Flash',
      badge: 'Vision & Smart',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      icon: <Sparkles size={15} className="text-blue-400" />,
    },
    {
      id: 'gemini-3.1-pro-preview',
      name: 'GyaanX Pro',
      badge: 'Deep Logic',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      icon: <Cpu size={15} className="text-purple-400" />,
    },
    {
      id: 'gemini-flash-latest',
      name: 'GyaanX Core',
      badge: 'Stable',
      badgeColor: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
      icon: <Compass size={15} className="text-sky-400" />,
    },
  ];

  return (
    <>
      {/* Full-screen backdrop blur */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xl z-40 transition-all duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Compact & Clean Frosted Dropdown Card */}
      <div
        ref={dropdownRef}
        className="fixed sm:absolute top-16 left-3 sm:left-0 right-3 sm:right-auto mt-1 sm:w-76 rounded-2xl bg-[#090e1a]/95 border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-50 p-2 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out backdrop-blur-2xl ring-1 ring-white/10 select-none"
      >
        <div className="space-y-1">
          {models.map((item) => {
            const isSelected =
              selectedModel === item.id ||
              (!selectedModel && item.id === 'gemini-3.1-flash-lite');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectModel(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    isSelected ? 'bg-blue-500/20 border-blue-400/30' : 'bg-white/5 border-white/10'
                  }`}>
                    {item.icon}
                  </div>
                  <span className="font-medium text-[13.5px] tracking-tight truncate">{item.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <div className="w-4 flex items-center justify-center">
                    {isSelected && <Check size={14} className="text-blue-400 stroke-[2.5]" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-1.5 border-t border-white/10" />

        {/* Extended Reasoning Mode */}
        <button
          type="button"
          onClick={() => {
            if (onToggleExtendedThinking) {
              onToggleExtendedThinking();
            }
            onClose();
          }}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-all duration-150 active:scale-[0.98] cursor-pointer ${
            extendedThinking
              ? 'bg-purple-600/20 text-white border border-purple-500/40'
              : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-purple-950/60 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Brain size={14} className="text-purple-400" />
            </div>
            <span className="font-medium text-[13px] tracking-tight truncate">Reasoning Mode</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              CoT
            </span>
            <div className="w-4 flex items-center justify-center">
              {extendedThinking && <Check size={14} className="text-purple-400 stroke-[2.5]" />}
            </div>
          </div>
        </button>
      </div>
    </>
  );
};
