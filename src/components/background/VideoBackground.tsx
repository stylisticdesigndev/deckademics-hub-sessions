
import React, { useState, useEffect } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackSrc: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc, fallbackSrc }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states when video source changes
    setHasError(false);
    setIsLoading(true);
    
    // Check if the video exists before trying to play it
    const checkVideoExists = async () => {
      try {
        const response = await fetch(videoSrc, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`Video file not accessible: ${videoSrc}`, response.status);
          setHasError(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Error checking video existence: ${videoSrc}`, error);
        setHasError(true);
        setIsLoading(false);
      }
    };
    
    checkVideoExists();
  }, [videoSrc]);

  const handleVideoError = () => {
    console.error('Video failed to load:', videoSrc);
    setHasError(true);
    setIsLoading(false);
  };

  const handleVideoLoaded = () => {
    console.log('Video loaded successfully:', videoSrc);
    setIsLoading(false);
  };

  // Show a console log to track rendering
  console.log('VideoBackground rendering with src:', videoSrc, 'hasError:', hasError);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {!hasError ? (
        <video
          key={videoSrc} // Add key to force remount when src changes
          autoPlay
          loop
          muted
          playsInline
          className={`object-cover w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onError={handleVideoError}
          onLoadedData={handleVideoLoaded}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <img 
          src={fallbackSrc} 
          alt="Background" 
          className="object-cover w-full h-full"
        />
      )}
      <div className="absolute inset-0 bg-black/40"></div>
    </div>
  );
};
