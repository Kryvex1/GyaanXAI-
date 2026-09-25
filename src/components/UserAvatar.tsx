import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  className?: string;
  size?: number;
  photoURL?: string | null;
  displayName?: string | null;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  className = '',
  size = 32,
  photoURL,
  displayName,
}) => {
  const [imgError, setImgError] = useState(false);

  // If user uploaded or has a valid photoURL
  if (photoURL && !imgError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-full overflow-hidden shrink-0 border border-slate-700/80 shadow-xs bg-[#101726] flex items-center justify-center select-none ${className}`}
      >
        <img
          src={photoURL}
          alt={displayName || 'User'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  // Normal clean default avatar (Initial or sleek User icon)
  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() : null;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full shrink-0 border border-slate-700/80 bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-200 flex items-center justify-center font-semibold select-none shadow-xs ${className}`}
      title={displayName || 'User profile'}
    >
      {initial ? (
        <span style={{ fontSize: size * 0.42 }} className="leading-none text-slate-200 font-sans">
          {initial}
        </span>
      ) : (
        <UserIcon size={size * 0.52} className="text-slate-300" />
      )}
    </div>
  );
};
