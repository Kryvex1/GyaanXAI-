import React from 'react';
import { X, Sparkles, Compass, FileText, Wrench, Globe, Image, Terminal, Bot, ArrowRight } from 'lucide-react';

interface QuickModalProps {
  isOpen: boolean;
  type: 'explore' | 'prompts' | 'tools' | 'search';
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const QuickModal: React.FC<QuickModalProps> = ({
  isOpen,
  type,
  onClose,
  onSelectPrompt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#0e1424] border border-[#1b253b] p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#1b253b] pb-3">
          <div className="flex items-center gap-2.5">
            {type === 'explore' && <Compass className="text-blue-400" size={20} />}
            {type === 'prompts' && <FileText className="text-blue-400" size={20} />}
            {type === 'tools' && <Wrench className="text-blue-400" size={20} />}
            {type === 'search' && <Sparkles className="text-blue-400" size={20} />}
            <h3 className="text-base font-bold text-white capitalize">
              {type === 'explore' && 'Explore GyaanX AI'}
              {type === 'prompts' && 'Smart Prompts Library'}
              {type === 'tools' && 'AI Tools & Capabilities'}
              {type === 'search' && 'Search & Highlights'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Explore Content */}
        {type === 'explore' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-400">
              Discover what you can create with GyaanX AI:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { title: 'Poster & Photo Breakdown', desc: 'Upload any image for style, color, mood & vibe analysis.' },
                { title: 'Desi Swag Hinglish Chat', desc: 'Chill, witty and relatable Indian conversational vibes.' },
                { title: 'Fullstack Code Architect', desc: 'React, TypeScript, Express and modern CSS solutions.' },
                { title: 'Live Search Grounding', desc: 'Grounded real-time data powered by Google search.' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#12192c] border border-[#1d273e] space-y-1">
                  <h4 className="font-semibold text-white">{item.title}</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompts Content */}
        {type === 'prompts' && (
          <div className="space-y-2 text-xs">
            <p className="text-slate-400 mb-2">Click any prompt to start instantly:</p>
            {[
              'Are bhai! Ek killer Matrix poster style me meri image ka swag analyse kar 🚀',
              'Website design me modern glassmorphism and clean typography ke rules batao',
              'Ek scalable anime streaming recommendation backend structure bana',
              'Bhai kya chal rha h tech industry me aaj kal? Quick breakdown de',
              'TypeScript code optimize kar aur zero-error production pattern me convert kar',
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (onSelectPrompt) onSelectPrompt(p);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl bg-[#12192c] hover:bg-[#18233d] border border-[#1d273e] hover:border-blue-500/40 text-slate-200 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-[12.5px] leading-snug">{p}</span>
                <ArrowRight size={14} className="text-slate-500 group-hover:text-blue-400 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}

        {/* Tools Content */}
        {type === 'tools' && (
          <div className="space-y-2 text-xs">
            <p className="text-slate-400 mb-2">GyaanX AI Integrated Engine Tools:</p>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#12192c] border border-[#1d273e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="text-sky-400" size={18} />
                  <div>
                    <h4 className="font-semibold text-white">Google Search Grounding</h4>
                    <p className="text-slate-400 text-[11px]">Real-time facts, citations, and live sources</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px]">
                  Active
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#12192c] border border-[#1d273e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Image className="text-emerald-400" size={18} />
                  <div>
                    <h4 className="font-semibold text-white">Vision & Image Analysis</h4>
                    <p className="text-slate-400 text-[11px]">Multimodal analysis of photos, posters & UI</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                  Ready
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#12192c] border border-[#1d273e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Terminal className="text-indigo-400" size={18} />
                  <div>
                    <h4 className="font-semibold text-white">Code Intelligence</h4>
                    <p className="text-slate-400 text-[11px]">Multi-language debugging, terminal formatting</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 text-[10px]">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Search Modal Content */}
        {type === 'search' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-400">Search messages or prompt suggestions:</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onSelectPrompt) onSelectPrompt('Ye dekho bro');
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl bg-[#12192c] hover:bg-[#18233d] border border-[#1d273e] text-slate-200"
              >
                💬 <strong>Ye dekho bro</strong> – Image matrix poster
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSelectPrompt) onSelectPrompt('Bhai kya chal rha h...');
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl bg-[#12192c] hover:bg-[#18233d] border border-[#1d273e] text-slate-200"
              >
                💬 <strong>Bhai kya chal rha h...</strong> – Casual conversation
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSelectPrompt) onSelectPrompt('Website Design');
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl bg-[#12192c] hover:bg-[#18233d] border border-[#1d273e] text-slate-200"
              >
                💬 <strong>Website Design</strong> – UI/UX discussion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
