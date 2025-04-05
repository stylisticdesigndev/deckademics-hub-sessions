
import React from 'react';
import { Disc3, Music } from 'lucide-react';
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
        <Disc3 
          className={cn(
            "text-deckademics-primary animate-spin-slow", 
            sizes[size]
          )} 
        />
        <Music 
          className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white", 
            size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-7 w-7'
          )} 
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
