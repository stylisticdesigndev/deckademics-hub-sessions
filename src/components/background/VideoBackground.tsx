
import React, { useState, useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackSrc: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc, fallbackSrc }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Reset states when video source changes
    setHasError(false);
    setIsLoading(true);
    
    console.log("VideoBackground component mounted with video source:", videoSrc);
    
    // Check if the video exists before trying to play it
    const checkVideoAvailability = async () => {
      try {
        const response = await fetch(videoSrc, { method: 'HEAD' });
        if (!response.ok) {
          console.error('Video file not available:', videoSrc);
          setHasError(true);
        }
      } catch (error) {
        console.error('Error checking video availability:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkVideoAvailability();
    
    return () => {
      // Cleanup if needed
    };
  }, [videoSrc]);

  const handleVideoError = () => {
    console.error('Video failed to load:', videoSrc);
    setHasError(true);
    setIsLoading(false);
  };
  
  const handleVideoLoaded = () => {
    console.log('Video loaded successfully');
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {!hasError ? (
        <video
          ref={videoRef}
          key={videoSrc} // Add key to force remount when src changes
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full"
          onError={handleVideoError}
          onLoadedData={handleVideoLoaded}
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
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="w-8 h-8 border-4 border-deckademics-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="absolute inset-0 bg-black/40"></div>
    </div>
  );
};
