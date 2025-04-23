import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';

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
  const [playAttempts, setPlayAttempts] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  
  // Reset video state when source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentSrc(videoSrc);
    setPlayAttempts(0);
  }, [videoSrc]);
  
  // Enhanced resize handler with debouncing
  useEffect(() => {
    let resizeTimer: number | null = null;
    
    const handleResize = () => {
      // Clear any pending timer
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      
      // Set a new timer to delay handling resize
      resizeTimer = window.setTimeout(() => {
        if (!videoRef.current) return;
        
        // Force reload the video element if it's not playing
        if (videoRef.current.paused || videoRef.current.ended) {
          console.log('Attempting to restart video after resize...');
          
          // Try several approaches to restart playback
          try {
            // First try: reload the video source
            const currentTime = videoRef.current.currentTime;
            videoRef.current.load();
            videoRef.current.currentTime = currentTime;
            
            // Second try: play the video
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log('Successfully restarted video after resize');
              }).catch(err => {
                console.warn('Failed to restart video after resize:', err);
                // Mark as error only after multiple attempts
                if (playAttempts > 2) {
                  setHasError(true);
                } else {
                  setPlayAttempts(prev => prev + 1);
                }
              });
            }
          } catch (err) {
            console.error('Error during video restart:', err);
          }
        }
      }, 500); // 500ms debounce
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [playAttempts]);
  
  // Attempt to play video when not loading and no errors
  useEffect(() => {
    if (!isLoading && !hasError && videoRef.current) {
      const attemptPlay = () => {
        if (!videoRef.current) return;
        
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Auto-play attempt failed:', err);
            
            // Retry with user interaction simulation if browser blocks autoplay
            if (playAttempts < 3) {
              console.log(`Retry attempt ${playAttempts + 1}/3`);
              setPlayAttempts(prev => prev + 1);
              
              // Slight delay before retry
              setTimeout(attemptPlay, 1000);
            } else if (!hasError) {
              // After multiple failed attempts, show a silent warning
              console.error('Multiple play attempts failed');
              // We don't set hasError here to keep trying to play without showing error UI
            }
          });
        }
      };
      
      attemptPlay();
    }
  }, [isLoading, hasError, playAttempts]);
  
  const handleVideoLoaded = () => {
    console.log('Video loaded successfully:', currentSrc);
    setIsLoading(false);
    setPlayAttempts(0);
    
    // Try to play the video immediately after loading
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Video autoplay prevented by browser:', error);
          // We'll retry in the useEffect
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
      // Reset play attempts for fallback
      setPlayAttempts(0);
    } else {
      setIsLoading(false);
      setHasError(true);
      
      // Notify the user about the error
      toast({
        title: "Video Background Issue",
        description: "We couldn't load the background video. Please try refreshing the page.",
        variant: "destructive"
      });
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
      {hasError && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-5">
          <div className="text-center p-4">
            <p className="text-white text-sm mb-3">Failed to load video background</p>
            <button 
              className="px-4 py-2 bg-deckademics-primary text-white rounded-md hover:bg-opacity-80 transition-colors"
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                setPlayAttempts(0);
                
                // Try loading from either the original source or fallback
                if (currentSrc === fallbackSrc && videoSrc !== fallbackSrc) {
                  setCurrentSrc(videoSrc);
                } else {
                  // Force reload the current source with cache busting
                  setCurrentSrc(`${currentSrc.split('?')[0]}?t=${Date.now()}`);
                }
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
