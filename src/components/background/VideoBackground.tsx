
import React, { useState, useEffect } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackSrc: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc, fallbackSrc }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Reset error state when video source changes
    setHasError(false);
    
    // No need for async check since we're using the onError handler
    console.log("VideoBackground component mounted with video source:", videoSrc);
  }, [videoSrc]);

  const handleVideoError = () => {
    console.error('Video failed to load:', videoSrc);
    setHasError(true);
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {!hasError ? (
        <video
          key={videoSrc} // Add key to force remount when src changes
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full"
          onError={handleVideoError}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full h-full bg-black">
          <img 
            src={fallbackSrc} 
            alt="Background" 
            className="object-cover w-full h-full opacity-60"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40"></div>
    </div>
  );
};
