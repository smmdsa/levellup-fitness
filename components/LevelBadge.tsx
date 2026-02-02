import React from 'react';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm border-2',
    md: 'w-12 h-12 text-lg border-4',
    lg: 'w-24 h-24 text-4xl border-4',
  };

  return (
    <div className={`relative flex items-center justify-center rounded-full bg-slate-800 border-indigo-500 text-indigo-400 font-bold glow-text ${sizeClasses[size]}`}>
      {level}
    </div>
  );
};
