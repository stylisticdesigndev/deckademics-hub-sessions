
import React, { useState, useEffect } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackSrc?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  videoSrc,
  fallbackSrc = '/lovable-uploads/5b45c1a0-05de-4bcc-9876-74d76c697871.png' // Using the provided image as fallback
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(videoSrc);
  
  // Reset video state when source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentSrc(videoSrc);
    
    console.log('Video source set to:', videoSrc);
  }, [videoSrc]);

  // Handler for when video metadata is loaded
  const handleVideoLoaded = () => {
    console.log('Video metadata loaded successfully:', currentSrc);
    setIsLoading(false);
  };
  
  // Handler for video loading errors
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error occurred, switching to fallback:', e);
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />
      
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-5">
          <div className="w-12 h-12 border-4 border-deckademics-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {!hasError ? (
        <video
          autoPlay
          muted
          playsInline
          loop
          className="absolute w-full h-full object-cover"
          onLoadedData={handleVideoLoaded}
          onError={handleVideoError}
          preload="auto"
        >
          <source src={currentSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        /* Fallback to image if video fails */
        <div 
          className="absolute inset-0 bg-cover bg-center z-5"
          style={{ backgroundImage: `url(${fallbackSrc})` }}
        />
      )}
    </div>
  );
};
