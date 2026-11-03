import React from 'react';

interface CarrotIconProps {
  className?: string;
  size?: number;
  level?: 1 | 2 | 3 | 4;
}

export const CarrotIcon: React.FC<CarrotIconProps> = ({
  className = "w-4 h-4",
  size = 16,
  level = 2,
}) => {
  // Vibrant carrot colors based on focus duration level
  const rootColor = 
    level === 1 ? '#fb923c' : // 0.1 - 1.0 hr (soft orange)
    level === 2 ? '#f97316' : // 1.0 - 2.0 hrs (vibrant orange)
    level === 3 ? '#ea580c' : // 2.0 - 3.5 hrs (rich golden orange)
    '#f43f5e';               // 3.5+ hrs (legendary focus rose-orange)

  const leafColor = 
    level === 1 ? '#86efac' :
    level === 2 ? '#22c55e' :
    level === 3 ? '#16a34a' :
    '#10b981';

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
        stroke="#15803d"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M12 6.5C12 3 13 1 14 1.5C14.5 3 13.5 5 12.5 6.8"
        fill={leafColor}
        stroke="#15803d"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M13 7.5C14.5 5.5 17 4.5 17.5 5.5C17 7 14.5 8 13.5 8"
        fill={leafColor}
        stroke="#15803d"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* Carrot body (tapered orange root) */}
      <path
        d="M8.5 7.5C7 8.5 7.5 11 9 13.5C10.5 16 11.5 21 12 22C12.5 21 13.5 16 15 13.5C16.5 11 17 8.5 15.5 7.5C14 6.5 10 6.5 8.5 7.5Z"
        fill={rootColor}
        stroke="#9a3412"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Cute horizontal ridge highlights */}
      <path
        d="M9.8 10H14.2"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M10.2 13H13.8"
        stroke="#ffffff"
        strokeOpacity="0.5"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M11 16H13"
        stroke="#ffffff"
        strokeOpacity="0.4"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

