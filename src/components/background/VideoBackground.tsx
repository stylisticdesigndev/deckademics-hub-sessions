
import React, { useState, useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackSrc: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc, fallbackSrc }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Reset states and check video availability when component mounts or video source changes
  useEffect(() => {
    console.log("VideoBackground: Initializing with source:", videoSrc);
    setIsLoading(false); // Don't block the UI while loading
    setHasError(false);
    
    // Check if browser supports video
    if (!document.createElement('video').canPlayType) {
      console.error('VideoBackground: Video not supported by browser');
      setHasError(true);
      return;
    }
    
    // Load video directly without pre-checking
    if (videoRef.current) {
      videoRef.current.src = videoSrc;
      videoRef.current.load();
      console.log("VideoBackground: Video loading initiated");
    }
      
    return () => {
      // Clean up
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [videoSrc]);
  
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('VideoBackground: Video failed to load, showing fallback');
    setHasError(true);
  };
  
  const handleVideoLoaded = () => {
    console.log('VideoBackground: Video loaded successfully');
    
    // Ensure video plays
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('VideoBackground: Autoplay prevented, video will play on user interaction');
      });
    }
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {!hasError ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full"
          onError={handleVideoError}
          onLoadedData={handleVideoLoaded}
        />
      ) : (
        <div className="w-full h-full bg-black">
          <img 
            src={fallbackSrc} 
            alt="Background" 
            className="object-cover w-full h-full opacity-60"
            onError={() => console.error("VideoBackground: Failed to load fallback image")}
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"></div>
    </div>
  );
};
