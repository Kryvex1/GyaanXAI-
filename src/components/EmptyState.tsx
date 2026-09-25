import React from 'react';
import { GyaanXLogo } from './GyaanXLogo.tsx';

interface EmptyStateProps {
  onSelectPrompt?: (prompt: string) => void;
  isIndia?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto px-4 py-12 text-center select-none animate-in fade-in duration-300">
      {/* Official GyaanX Logo */}
      <div className="mb-5 relative">
        <GyaanXLogo size={68} className="shadow-2xl shadow-blue-500/25 ring-4 ring-blue-500/10" />
      </div>

      {/* Professional Title & Subtitle */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2.5">
        How can I help you today?
      </h1>
      <p className="text-sm font-normal text-slate-400 max-w-md mx-auto leading-relaxed">
        GyaanX Intelligence is ready for multimodal analysis, code generation, reasoning, and real-time research.
      </p>
    </div>
  );
};
