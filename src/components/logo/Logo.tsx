
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'header';
}

export const Logo: React.FC<LogoProps> = ({ 
  className, 
  size = 'md'
}) => {
  const sizes = {
    sm: 'h-10 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    header: 'h-full w-auto'
  };
  
  return (
    <Link to="/" className={cn("flex items-center", className)}>
      <div className={cn("relative", sizes[size])}>
        <img 
          src="/lovable-uploads/22a8ecc1-e830-4e13-9ae9-a41f938c8809.png" 
          alt="Deckademics Logo" 
          className={cn(sizes[size], "object-contain")}
        />
      </div>
    </Link>
  );
};
