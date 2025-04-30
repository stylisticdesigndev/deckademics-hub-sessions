
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
    setIsLoading(true);
    setHasError(false);
    
    // Check if browser supports video
    if (!document.createElement('video').canPlayType) {
      console.error('VideoBackground: Video not supported by browser');
      setHasError(true);
      setIsLoading(false);
      return;
    }
    
    // Create a new image element to test if the fallback exists
    const img = new Image();
    img.onerror = () => {
      console.error('VideoBackground: Fallback image not found:', fallbackSrc);
    };
    img.src = fallbackSrc;
    
    // Add cache buster to video URL
    const timestamp = Date.now();
    const videoUrl = videoSrc.includes('?') 
      ? `${videoSrc}&cb=${timestamp}` 
      : `${videoSrc}?cb=${timestamp}`;
      
    console.log("VideoBackground: Using URL with cache buster:", videoUrl);
    
    // Pre-check if video file exists
    fetch(videoUrl, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          console.error(`VideoBackground: Video file not accessible (Status ${response.status}):`, videoUrl);
          throw new Error(`Video file check failed with status ${response.status}`);
        }
        return response;
      })
      .then(() => {
        console.log("VideoBackground: Video file confirmed accessible");
        if (videoRef.current) {
          videoRef.current.src = videoUrl;
          videoRef.current.load();
        }
      })
      .catch(error => {
        console.error("VideoBackground: Error checking video:", error);
        setHasError(true);
        setIsLoading(false);
      });
      
    return () => {
      // Clean up
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [videoSrc, fallbackSrc]);
  
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('VideoBackground: Video failed to load:', e);
    setHasError(true);
    setIsLoading(false);
  };
  
  const handleVideoLoaded = () => {
    console.log('VideoBackground: Video loaded successfully');
    setIsLoading(false);
    
    // Ensure video plays
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('VideoBackground: Error playing video:', error);
        // Still show video even if autoplay fails due to browser policies
        setIsLoading(false);
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
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="w-8 h-8 border-4 border-deckademics-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="absolute inset-0 bg-black/40"></div>
    </div>
  );
};
