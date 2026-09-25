import React, { useState } from 'react';

interface GyaanXLogoProps {
  size?: number;
  className?: string;
}

export const GyaanXLogo: React.FC<GyaanXLogoProps> = ({ size = 36, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState('/gyaanx-logo.jpg');

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden shrink-0 border border-blue-400/30 shadow-md shadow-blue-600/20 bg-[#0c1b3a] flex items-center justify-center select-none ${className}`}
    >
      {!imgError ? (
        <img
          src={imgSrc}
          alt="GyaanX AI"
          onError={() => {
            if (imgSrc === '/gyaanx-logo.jpg') {
              setImgSrc('https://imgh.in/host/mv78o8');
            } else {
              setImgError(true);
            }
          }}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-purple-600 flex items-center justify-center">
          <span
            style={{ fontSize: size * 0.52 }}
            className="font-extrabold text-white leading-none font-sans"
          >
            G
          </span>
        </div>
      )}
    </div>
  );
};
