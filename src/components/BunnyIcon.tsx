import React from 'react';

interface BunnyIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

// Minimalist modern SVG bunny silhouette / line art
export const BunnyIcon: React.FC<BunnyIconProps> = ({
  className = "w-5 h-5",
  size = 20,
  strokeWidth = 2
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Left Ear */}
      <path d="M7.5 12C6.2 8.5 6 3 8 2C10 1 10.5 7 10 12" />
      {/* Right Ear */}
      <path d="M16.5 12C17.8 8.5 18 3 16 2C14 1 13.5 7 14 12" />
      {/* Head & Cheeks */}
      <circle cx="12" cy="15.5" r="5.5" />
      {/* Cute minimal nose */}
      <path d="M11.5 16L12 16.5L12.5 16" />
      {/* Eyes */}
      <circle cx="9.5" cy="14" r="0.75" fill="currentColor" />
      <circle cx="14.5" cy="14" r="0.75" fill="currentColor" />
    </svg>
  );
};

// Bunny ears for logo "phokus"
export const BunnyEarsLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M9 22C6.5 16 7 4 10.5 3C13.5 2 13.5 13 13 22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 22C25.5 16 25 4 21.5 3C18.5 2 18.5 13 19 22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 24C8 28.4183 11.5817 30 16 30C20.4183 30 24 28.4183 24 24C24 21 21 21 16 21C11 21 8 21 8 24Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

