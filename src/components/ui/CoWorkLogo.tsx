import React from 'react';

interface CoWorkLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon';
  layout?: 'horizontal' | 'stacked';
  textClassName?: string;
}

export const CoWorkLogo: React.FC<CoWorkLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  layout = 'horizontal',
  textClassName = '',
}) => {
  const iconDimensions = {
    sm: { width: 26, height: 16 },
    md: { width: 36, height: 22 },
    lg: { width: 56, height: 34 },
    xl: { width: 88, height: 54 },
    '2xl': { width: 140, height: 86 },
  }[size];

  const textSizes = {
    sm: 'text-sm font-bold tracking-tight',
    md: 'text-lg font-bold tracking-tight',
    lg: 'text-2xl font-bold tracking-tight',
    xl: 'text-3xl font-extrabold tracking-tight',
    '2xl': 'text-5xl font-extrabold tracking-tight',
  }[size];

  const isStacked = layout === 'stacked';

  return (
    <div
      className={`inline-flex select-none ${
        isStacked ? 'flex-col items-center gap-3' : 'items-center gap-3'
      } ${className}`}
    >
      {/* Interlocking 'cw' logo mark */}
      <svg
        width={iconDimensions.width}
        height={iconDimensions.height}
        viewBox="0 0 185 105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
      >
        {/* 'c' letter - Vibrant Royal Blue */}
        <path
          d="M 80 30 A 34 34 0 1 0 80 76"
          stroke="#2B6BF3"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />

        {/* 'w' letter - Midnight Slate in light mode, Clean White in dark mode */}
        <path
          d="M 80 53 L 98 74 L 118 45 L 138 74 L 156 40"
          className="stroke-[#0F172A] dark:stroke-white"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Wordmark: "co work" (bold lowercase) */}
      {variant === 'full' && (
        <span
          className={`font-sans ${textSizes} tracking-tight text-[#0F172A] dark:text-white transition-colors duration-200 ${textClassName}`}
        >
          co work
        </span>
      )}
    </div>
  );
};

export default CoWorkLogo;
