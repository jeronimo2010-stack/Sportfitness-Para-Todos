/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole } from '../../types';

interface UserAvatarProps {
  user?: {
    name?: string;
    role?: UserRole | string;
    customAvatar?: string;
    avatar?: string;
  } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  border?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-24 h-24 text-3xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
  border = true,
}) => {
  const isCoach = user?.role === 'entrenador';
  
  // A photo is custom ONLY if user explicitly provided a customAvatar or uploaded image
  // Stock/unsplash images are excluded by default to honor:
  // "en las cuentas de coach no pongas foto, solo una C y en la cuenta de deportista una D pero en configuraciones agrega una opcion para poner una foto personalizadad"
  const rawCustom = user?.customAvatar;
  const isCustomPhoto = Boolean(
    rawCustom &&
    rawCustom.trim() !== '' &&
    !rawCustom.includes('unsplash.com')
  );

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const borderClass = border ? 'border-2 border-[#56A867]/60 shadow-sm' : '';

  if (isCustomPhoto && rawCustom) {
    return (
      <img
        src={rawCustom}
        alt={user?.name || (isCoach ? 'Coach' : 'Deportista')}
        className={`rounded-full object-cover shrink-0 select-none ${sizeClass} ${borderClass} ${className}`}
      />
    );
  }

  // Default badges:
  // Coach = "C"
  // Athlete / Deportista = "D"
  const letter = isCoach ? 'C' : 'D';

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-serif font-black select-none tracking-tight transition-transform ${sizeClass} ${borderClass} ${
        isCoach
          ? 'bg-gradient-to-br from-[#122317] to-[#0A160D] text-[#56A867] ring-1 ring-[#56A867]/30'
          : 'bg-gradient-to-br from-[#102019] to-[#091510] text-[#56A867] ring-1 ring-[#56A867]/30'
      } ${className}`}
      title={isCoach ? `Coach (C) • ${user?.name || ''}` : `Deportista (D) • ${user?.name || ''}`}
    >
      <span>{letter}</span>
    </div>
  );
};
