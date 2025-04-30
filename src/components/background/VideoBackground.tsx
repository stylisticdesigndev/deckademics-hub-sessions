
import React, { useState, useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackSrc: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc, fallbackSrc }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoExists, setVideoExists] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Reset states when component mounts or video source changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setVideoExists(false);
    
    console.log("VideoBackground mounted/updated with video source:", videoSrc);
    
    // Check if video reference exists and if the browser supports video
    if (!document.createElement('video').canPlayType) {
      console.error('Video element not supported by this browser');
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Verify the video file exists and is accessible
    const checkVideoAvailability = async () => {
      try {
        const response = await fetch(videoSrc, { method: 'HEAD', cache: 'no-store' });
        if (!response.ok) {
          console.error('Video file not accessible:', videoSrc, 'Status:', response.status);
          setHasError(true);
        } else {
          console.log('Video file is accessible:', videoSrc);
          setVideoExists(true);
        }
      } catch (error) {
        console.error('Error checking video availability:', error);
        setHasError(true);
      } finally {
        // If we can't even fetch the HEAD request, still try to load the video
        // as the video element's error handler will catch any issues
        if (!hasError && videoRef.current) {
          videoRef.current.load();
        }
      }
    };
    
    checkVideoAvailability();
    
    // Clean up function
    return () => {
      if (videoRef.current) {
        console.log('Cleaning up video element');
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [videoSrc]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video failed to load:', videoSrc, e);
    setHasError(true);
    setIsLoading(false);
  };
  
  const handleVideoLoaded = () => {
    console.log('Video loaded successfully:', videoSrc);
    setIsLoading(false);
    
    // Ensure video plays
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
        // If autoplay fails due to browser policies, we'll show the video anyway
        // but set loading to false
        setIsLoading(false);
      });
    }
  };
  
  // Attempt to reload the video if it initially fails
  useEffect(() => {
    if (hasError && videoRef.current && !isLoading) {
      const retryTimeout = setTimeout(() => {
        console.log("Attempting to reload video after error");
        setHasError(false);
        setIsLoading(true);
        
        if (videoRef.current) {
          // Add cache busting parameter to force a fresh load
          const cacheBuster = `?cb=${Date.now()}`;
          videoRef.current.src = videoSrc + cacheBuster;
          videoRef.current.load();
        }
      }, 3000); // Wait 3 seconds before retry
      
      return () => clearTimeout(retryTimeout);
    }
  }, [hasError, videoSrc, isLoading]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {!hasError ? (
        <video
          ref={videoRef}
          key={videoSrc + Date.now()} // Force remount with unique key
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
            onError={() => console.error("Failed to load fallback image")}
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
