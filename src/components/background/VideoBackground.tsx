
import React, { useState, useEffect } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackSrc?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  videoSrc,
  fallbackSrc = '/lovable-uploads/dj-background.mp4' 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(videoSrc);
  
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentSrc(videoSrc);
  }, [videoSrc]);
  
  const handleVideoLoaded = () => {
    console.log('Video loaded successfully:', currentSrc);
    setIsLoading(false);
  };
  
  const handleVideoError = () => {
    console.error('Error loading video from source:', currentSrc);
    
    // If current source failed and it's not already the fallback, try the fallback
    if (currentSrc !== fallbackSrc) {
      console.log('Attempting to load fallback video:', fallbackSrc);
      setCurrentSrc(fallbackSrc);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
      <div className="absolute inset-0 bg-black/50 z-10" /> {/* Overlay to darken the video */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-5">
          <div className="w-12 h-12 border-4 border-deckademics-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute w-full h-full object-cover"
        onLoadedData={handleVideoLoaded}
        onError={handleVideoError}
      >
        <source src={currentSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {hasError && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-5">
          <p className="text-white text-sm">Failed to load video background</p>
        </div>
      )}
    </div>
  );
};
