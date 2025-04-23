
import React, { useState, useEffect } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [videoSrc]);
  
  const handleVideoLoaded = () => {
    setIsLoading(false);
  };
  
  const handleVideoError = () => {
    console.error('Error loading video from source:', videoSrc);
    setIsLoading(false);
    setHasError(true);
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
        <source src={videoSrc} type="video/mp4" />
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
