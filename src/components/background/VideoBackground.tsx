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
  const initialLoadAttemptedRef = useRef(false);
  
  // Reset video state when source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentSrc(videoSrc);
    setPlayAttempts(0);
    initialLoadAttemptedRef.current = false;
    
    console.log('Video source changed to:', videoSrc);
  }, [videoSrc]);
  
  // Enhanced resize handler with better error recovery
  useEffect(() => {
    let resizeTimer: number | null = null;
    
    const handleResize = () => {
      // Clear any pending timer
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      
      // Set a new timer to delay handling resize
      resizeTimer = window.setTimeout(() => {
        if (!videoRef.current) {
          console.log('Video element not found on resize');
          return;
        }
        
        const video = videoRef.current;
        
        // If video is paused or ended, try to play it again
        if (video.paused || video.ended) {
          console.log('Video paused after resize, attempting to restart playback');
          
          // Try to play without reloading first
          try {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                console.warn('Failed to restart video after resize, will try reloading:', err);
                
                // If direct play fails, try reloading the video element
                try {
                  // Set current time to where it was
                  const currentTime = video.currentTime;
                  // Force reload the video
                  video.load();
                  // Restore playback position
                  video.currentTime = currentTime;
                  
                  // Try playing again after reload
                  const reloadPlayPromise = video.play();
                  if (reloadPlayPromise !== undefined) {
                    reloadPlayPromise.catch(reloadErr => {
                      console.warn('Failed to play after reload:', reloadErr);
                      // Only increment attempts if we're still having problems
                      setPlayAttempts(prev => prev + 1);
                    });
                  }
                } catch (reloadErr) {
                  console.error('Error during video reload:', reloadErr);
                }
              });
            }
          } catch (err) {
            console.error('Error during initial play attempt:', err);
          }
        }
      }, 500); // 500ms debounce
    };

    // Listen for window resize events
    window.addEventListener('resize', handleResize);
    
    // Listen for orientation changes (especially important on mobile)
    window.addEventListener('orientationchange', handleResize);
    
    // Check if the video is playing when entering/leaving fullscreen
    document.addEventListener('fullscreenchange', handleResize);
    
    return () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
    };
  }, []);
  
  // Fix for video playback attempts
  useEffect(() => {
    if (!videoRef.current || hasError) return;
    
    const attemptPlayback = async () => {
      if (!videoRef.current) return;
      
      const video = videoRef.current;
      
      try {
        initialLoadAttemptedRef.current = true;
        
        console.log(`Attempt ${playAttempts + 1} to play video from: ${currentSrc}`);
        
        // Wait for metadata to load first if needed
        if (video.readyState < 2) {
          await new Promise<void>((resolve) => {
            const handleCanPlay = () => {
              video.removeEventListener('canplay', handleCanPlay);
              resolve();
            };
            video.addEventListener('canplay', handleCanPlay);
            
            setTimeout(() => {
              video.removeEventListener('canplay', handleCanPlay);
              resolve();
            }, 3000);
          });
        }
        
        // Attempt to play the video
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Video started playing successfully');
          setIsLoading(false);
        }
      } catch (err) {
        console.warn(`Playback attempt ${playAttempts + 1} failed:`, err);
        
        if (playAttempts < 3) {
          const delay = Math.pow(2, playAttempts) * 500;
          console.log(`Scheduling retry ${playAttempts + 1} in ${delay}ms`);
          
          setTimeout(() => {
            setPlayAttempts(prev => prev + 1);
          }, delay);
        } else if (currentSrc !== fallbackSrc) {
          console.log('Multiple play attempts failed, switching to fallback video');
          // Add timestamp to avoid cache
          setCurrentSrc(`${fallbackSrc}?t=${Date.now()}`);
          setPlayAttempts(0);
        } else {
          console.error('All video playback attempts failed, showing error UI');
          setHasError(true);
          setIsLoading(false);
          
          toast({
            title: "Video Playback Issue",
            description: "We couldn't play the background video. You may try refreshing the page.",
            variant: "destructive"
          });
        }
      }
    };
    
    // Only attempt playback if the video isn't already playing
    if ((videoRef.current.paused || videoRef.current.ended) && !isLoading) {
      attemptPlayback();
    }
  }, [currentSrc, playAttempts, hasError, isLoading, fallbackSrc]);

  // Handler for when video metadata is loaded
  const handleVideoLoaded = () => {
    console.log('Video metadata loaded successfully:', currentSrc);
    setIsLoading(false);
    
    // If this is the first load and video is not playing, trigger play attempt
    if (!initialLoadAttemptedRef.current && videoRef.current && 
        (videoRef.current.paused || videoRef.current.ended)) {
      setPlayAttempts(prev => prev + 1);
    }
  };
  
  // Handler for video loading errors
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Error loading video from source:', currentSrc, e);
    
    // If we haven't tried the fallback yet, switch to it
    if (currentSrc !== fallbackSrc) {
      // Add timestamp to avoid cache
      console.log('Video loading failed, trying fallback with cachebuster:', fallbackSrc + '?t=' + Date.now());
      setCurrentSrc(fallbackSrc + '?t=' + Date.now());
      setPlayAttempts(0);
    } else {
      setHasError(true);
      setIsLoading(false);
      
      toast({
        title: "Video Background Issue",
        description: "We couldn't load the background video. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
      <div className="absolute inset-0 bg-black/50 z-10" />
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
                
                // Try loading from either the original source or fallback with cache busting
                const cacheBuster = `?t=${Date.now()}`;
                if (currentSrc === fallbackSrc && videoSrc !== fallbackSrc) {
                  setCurrentSrc(videoSrc + cacheBuster);
                } else {
                  setCurrentSrc(fallbackSrc + cacheBuster);
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
