
import React, { useState, useEffect } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackSrc?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  videoSrc,
  fallbackSrc = '/lovable-uploads/5b45c1a0-05de-4bcc-9876-74d76c697871.png' 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    console.log('Video source set to:', videoSrc);
    
    // Attempt to preload the video to check if it's accessible
    const preloadVideo = new Image();
    preloadVideo.src = fallbackSrc; // Preload the fallback image in case we need it
    
    const testVideo = document.createElement('video');
    testVideo.src = videoSrc;
    testVideo.onloadeddata = () => {
      console.log('Video preload successful');
      setIsLoading(false);
    };
    
    testVideo.onerror = () => {
      console.error('Video preload failed, switching to fallback');
      setHasError(true);
      setIsLoading(false);
    };
    
    // Clean up
    return () => {
      testVideo.src = '';
      testVideo.onloadeddata = null;
      testVideo.onerror = null;
    };
  }, [videoSrc, fallbackSrc]);

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
          preload="auto"
        >
          <source src={videoSrc} type="video/mp4" />
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
