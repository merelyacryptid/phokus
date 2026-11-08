import React from 'react';
import type { ThemeMode } from '../types';

interface CarrotIconProps {
  className?: string;
  size?: number;
  level?: 1 | 2 | 3 | 4;
  theme?: ThemeMode;
}

export const CarrotIcon: React.FC<CarrotIconProps> = ({
  className = "w-4 h-4",
  size = 14,
  level: _level = 2,
  theme,
}) => {
  const isMatteBlack = theme === 'matte-black';

  // Carrot color stays constant; activity intensity is indicated by the cell background
  const rootColor = isMatteBlack ? '#ffffff' : '#fb923c';
  const leafColor = isMatteBlack ? '#e4e4e7' : '#4ade80';
  const strokeColor = isMatteBlack ? '#52525b' : '#ea580c';
  const leafStroke = isMatteBlack ? '#3f3f46' : '#22c55e';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Leaves (green top foliage) */}
      <path
        d="M11 7C10.5 4 8.5 2.5 7.5 3C7 4.5 9 6.5 10.5 7.5"
        fill={leafColor}
        stroke={leafStroke}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M12 6.5C12 3 13 1 14 1.5C14.5 3 13.5 5 12.5 6.8"
        fill={leafColor}
        stroke={leafStroke}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M13 7.5C14.5 5.5 17 4.5 17.5 5.5C17 7 14.5 8 13.5 8"
        fill={leafColor}
        stroke={leafStroke}
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* Carrot body (tapered orange root) */}
      <path
        d="M8.5 7.5C7 8.5 7.5 11 9 13.5C10.5 16 11.5 21 12 22C12.5 21 13.5 16 15 13.5C16.5 11 17 8.5 15.5 7.5C14 6.5 10 6.5 8.5 7.5Z"
        fill={rootColor}
        stroke={strokeColor}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Cute horizontal ridge highlights */}
      <path
        d="M9.8 10H14.2"
        stroke="#ffffff"
        strokeOpacity={0.6}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M10.2 13H13.8"
        stroke="#ffffff"
        strokeOpacity={0.55}
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M11 16H13"
        stroke="#ffffff"
        strokeOpacity={0.45}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

