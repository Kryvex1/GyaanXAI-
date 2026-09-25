import React from 'react';

interface EmptyStateProps {
  userName?: string | null;
  onSelectPrompt?: (prompt: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ userName }) => {
  const getGreetingName = (): string => {
    if (!userName) return '';
    const trimmed = userName.trim();
    if (trimmed.includes('@')) {
      const localPart = trimmed.split('@')[0];
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
    return trimmed.split(' ')[0];
  };

  const name = getGreetingName();

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto px-4 py-8 text-center select-none animate-in fade-in duration-300">
      {/* 4-Point GyaanX Star Icon */}
      <div className="mb-6 relative flex items-center justify-center">
        {/* Soft atmospheric backlight */}
        <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/25 to-indigo-500/20 blur-xl pointer-events-none" />

        <svg
          viewBox="0 0 100 100"
          className="w-12 h-12 sm:w-14 sm:h-14 relative drop-shadow-md"
        >
          <defs>
            <linearGradient id="gyaanxStarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#6366f1" />
              <stop offset="70%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <path
            d="M50 0 C50 27.6 27.6 50 0 50 C27.6 50 50 72.4 50 100 C50 72.4 72.4 50 100 50 C72.4 50 50 27.6 50 0 Z"
            fill="url(#gyaanxStarGradient)"
          />
        </svg>
      </div>

      {/* Greeting */}
      <h1 className="text-3xl sm:text-4xl md:text-[40px] font-medium tracking-tight text-white mb-2 font-sans">
        {name ? `Ask away, ${name}!` : 'What can I help with today?'}
      </h1>
      <p className="text-sm text-slate-400 font-normal">
        GyaanX is ready to assist with code, answers, ideas, and analysis.
      </p>
    </div>
  );
};
