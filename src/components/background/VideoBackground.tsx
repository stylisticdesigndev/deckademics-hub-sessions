
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  
  // Reset video state when source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentSrc(videoSrc);
  }, [videoSrc]);
  
  // Handle resizing and ensure playback continues
  useEffect(() => {
    const handleResize = () => {
      // Attempt to restart playback if video exists and is paused
      if (videoRef.current && videoRef.current.paused) {
        const playPromise = videoRef.current.play();
        
        // Handle the play promise properly
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Successfully restarted video playback after resize');
            })
            .catch(err => {
              console.warn('Could not play video after resize:', err);
              // Don't set error state here, just log warning
            });
        }
      }
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Try to enforce video playback
  useEffect(() => {
    if (!isLoading && !hasError && videoRef.current) {
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Auto-play attempt failed:', err);
          // Many browsers require user interaction before autoplay
        });
      }
    }
  }, [isLoading, hasError]);
  
  const handleVideoLoaded = () => {
    console.log('Video loaded successfully:', currentSrc);
    setIsLoading(false);
    
    // Try to play the video immediately after loading
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Video autoplay prevented by browser:', error);
        });
      }
    }
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
        ref={videoRef}
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
