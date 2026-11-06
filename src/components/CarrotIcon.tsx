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
  level = 2,
  theme,
}) => {
  const isMatteBlack = theme === 'matte-black';

  // Constant size, pure light-to-dark tonal progression (Level 1: Lightest -> Level 4: Darkest)
  let rootColor = '#fb923c';
  let leafColor = '#4ade80';
  let strokeColor = '#ea580c';
  let leafStroke = '#22c55e';

  if (isMatteBlack) {
    if (level === 1) {
      // Lightest: faint subtle zinc
      rootColor = '#52525b';
      leafColor = '#3f3f46';
      strokeColor = '#27272a';
      leafStroke = '#18181b';
    } else if (level === 2) {
      // Medium-light: silver zinc
      rootColor = '#a1a1aa';
      leafColor = '#71717a';
      strokeColor = '#52525b';
      leafStroke = '#3f3f46';
    } else if (level === 3) {
      // Medium-dark: bright silver-white
      rootColor = '#e4e4e7';
      leafColor = '#a1a1aa';
      strokeColor = '#71717a';
      leafStroke = '#52525b';
    } else {
      // Darkest / Highest intensity: pure radiant white
      rootColor = '#ffffff';
      leafColor = '#ffffff';
      strokeColor = '#e4e4e7';
      leafStroke = '#a1a1aa';
    }
  } else {
    if (level === 1) {
      // Lightest: soft, pale peach-orange and pale mint foliage
      rootColor = '#fed7aa';
      leafColor = '#bbf7d0';
      strokeColor = '#fdba74';
      leafStroke = '#86efac';
    } else if (level === 2) {
      // Medium-light: warm sunny golden orange
      rootColor = '#fb923c';
      leafColor = '#4ade80';
      strokeColor = '#ea580c';
      leafStroke = '#22c55e';
    } else if (level === 3) {
      // Medium-dark: rich deep vibrant carrot orange
      rootColor = '#ea580c';
      leafColor = '#16a34a';
      strokeColor = '#c2410c';
      leafStroke = '#15803d';
    } else {
      // Darkest / Highest intensity: deep saturated bold burnt-orange
      rootColor = '#c2410c';
      leafColor = '#15803d';
      strokeColor = '#7c2d12';
      leafStroke = '#14532d';
    }
  }

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
        strokeOpacity={level === 1 ? 0.35 : 0.6}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M10.2 13H13.8"
        stroke="#ffffff"
        strokeOpacity={level === 1 ? 0.3 : 0.55}
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M11 16H13"
        stroke="#ffffff"
        strokeOpacity={level === 1 ? 0.25 : 0.45}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

