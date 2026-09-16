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
      {/* Logo Image */}
      <img
        src="/logo.png"
        alt="Co-Work Logo"
        width={iconDimensions.width * 1.5}
        height={iconDimensions.height * 1.5}
        className="flex-shrink-0 transition-transform duration-300 hover:scale-105 object-contain"
        onError={(e) => {
          // Fallback if user hasn't uploaded logo.png yet
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

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
