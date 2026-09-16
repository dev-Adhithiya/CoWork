import React from 'react';

interface CoWorkLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon';
  layout?: 'horizontal' | 'stacked';
}

export const CoWorkLogo: React.FC<CoWorkLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  layout = 'horizontal',
}) => {
  const iconDimensions = {
    sm: { width: 26, height: 16 },
    md: { width: 36, height: 22 },
    lg: { width: 56, height: 34 },
    xl: { width: 88, height: 54 },
    '2xl': { width: 140, height: 86 },
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
        width={iconDimensions.width * (variant === 'full' ? 2.6 : 1.5)}
        height={iconDimensions.height * (variant === 'full' ? 2.6 : 1.5)}
        className="flex-shrink-0 max-w-full transition-transform duration-300 hover:scale-105 object-contain"
        onError={(e) => {
          // Fallback if user hasn't uploaded logo.png yet
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

    </div>
  );
};

export default CoWorkLogo;
