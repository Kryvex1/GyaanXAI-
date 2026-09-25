import React from 'react';

interface AgentAvatarProps {
  size?: number;
  isThinking?: boolean;
  className?: string;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  size = 28,
  isThinking = false,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 flex items-center justify-center select-none ${className}`}
    >
      {/* Subtle, soft aura only while actively generating (no giant blinding blur) */}
      {isThinking && (
        <div
          style={{ width: size + 6, height: size + 6 }}
          className="absolute rounded-full bg-blue-500/20 blur-xs animate-pulse pointer-events-none"
        />
      )}

      {/* Official 4-Point Gemini Star Icon */}
      <svg
        viewBox="0 0 100 100"
        style={{ width: size, height: size }}
        className={`transition-all duration-300 ${
          isThinking ? 'animate-spin-slow scale-105' : 'scale-100'
        }`}
      >
        <defs>
          <linearGradient id="geminiStarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="35%" stopColor="#6366f1" />
            <stop offset="70%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
        <path
          d="M50 0 C50 27.6 27.6 50 0 50 C27.6 50 50 72.4 50 100 C50 72.4 72.4 50 100 50 C72.4 50 50 27.6 50 0 Z"
          fill="url(#geminiStarGradient)"
        />
      </svg>
    </div>
  );
};
