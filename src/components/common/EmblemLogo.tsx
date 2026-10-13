/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface EmblemLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  className?: string;
}

export const EmblemLogo: React.FC<EmblemLogoProps> = ({
  size = 'md',
  withText = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    sm: 'w-9 h-9 rounded-full',
    md: 'w-14 h-14 rounded-full',
    lg: 'w-28 h-28 rounded-2xl',
    xl: 'w-48 h-48 sm:w-56 sm:h-56 rounded-3xl',
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative ${sizeMap[size]} bg-black border-2 border-[#56A867]/60 overflow-hidden flex items-center justify-center shadow-[0_0_25px_rgba(86,168,103,0.3)] group transition-all duration-300 hover:border-[#56A867] hover:shadow-[0_0_35px_rgba(86,168,103,0.5)] shrink-0`}
      >
        {!imageError ? (
          <img
            src="/logo.png"
            alt="Fitness Para Todos"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith('logo.jpg')) {
                target.src = '/logo.jpg';
              } else {
                setImageError(true);
              }
            }}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Fallback SVG if image not accessible */
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-[#56A867] p-1.5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="46" stroke="#56A867" strokeWidth="2.5" />
            <path
              d="M 50 15 C 65 25 80 40 85 65 C 75 58 65 55 50 62 C 35 55 25 58 15 65 C 20 40 35 25 50 15 Z"
              fill="#121216"
              stroke="#56A867"
              strokeWidth="2"
            />
            <line x1="20" y1="50" x2="80" y2="50" stroke="#56A867" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="50" cy="36" r="5" fill="#FFFFFF" />
          </svg>
        )}
      </div>

      {withText && (
        <div className="flex flex-col text-left">
          <span className={`font-serif font-bold text-white tracking-wide leading-tight ${textSizeMap[size]}`}>
            Fitness Para Todos
          </span>
          <span className="text-[10px] tracking-[0.2em] text-[#56A867] uppercase font-mono font-semibold">
            Todos los Cuerpos • Tu Mejor Versión
          </span>
        </div>
      )}
    </div>
  );
};
