
import React, { useState, useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackSrc: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc, fallbackSrc }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Reset states when component mounts or video source changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    
    console.log("VideoBackground mounted/updated with video source:", videoSrc);
    
    // Check if video reference exists and if the browser supports video
    if (!videoRef.current || !document.createElement('video').canPlayType) {
      console.error('Video element not supported or not available');
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Verify the video file exists and is accessible
    const checkVideoAvailability = async () => {
      try {
        const response = await fetch(videoSrc, { method: 'HEAD' });
        if (!response.ok) {
          console.error('Video file not accessible:', videoSrc, 'Status:', response.status);
          setHasError(true);
        }
      } catch (error) {
        console.error('Error checking video availability:', error);
        setHasError(true);
      } finally {
        // We set loading to false in the video events, not here
        // to ensure we wait for the video to actually be ready
      }
    };
    
    checkVideoAvailability();
    
    // Force video to reload when source changes
    if (videoRef.current) {
      videoRef.current.load();
    }
    
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

  const handleVideoError = () => {
    console.error('Video failed to load:', videoSrc);
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

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {!hasError ? (
        <video
          ref={videoRef}
          key={videoSrc} // Force remount when src changes
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
