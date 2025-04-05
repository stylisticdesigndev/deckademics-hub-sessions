
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className, 
  size = 'md',
  withText = true 
}) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14'
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };
  
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative", sizes[size])}>
        <img 
          src="/lovable-uploads/22a8ecc1-e830-4e13-9ae9-a41f938c8809.png" 
          alt="Deckademics Logo" 
          className={cn(sizes[size], "aspect-square object-contain")}
        />
      </div>
      {withText && (
        <span className={cn(
          "font-bold tracking-tight text-white",
          textSizes[size]
        )}>
          Deckademics
        </span>
      )}
    </Link>
  );
};
