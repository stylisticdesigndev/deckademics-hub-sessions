import React from 'react';
import vinylRecord from '@/assets/vinyl-record.png';

interface VinylLoaderProps {
  message?: string;
}

const VinylLoader = ({ message = 'Loading...' }: VinylLoaderProps) => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <img
          src={vinylRecord}
          alt="Loading"
          className="h-32 w-32 animate-spin-vinyl"
        />
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
};

export default VinylLoader;
