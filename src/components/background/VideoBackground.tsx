
import React, { useState, useEffect } from 'react';

interface VideoBackgroundProps {
  videoSrc?: string;
  fallbackSrc?: string;
}

/**
 * Background component that displays a video or falls back to a static image
 * if the video cannot be loaded or is not provided
 */
export const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  videoSrc,
  fallbackSrc = '/lovable-uploads/5b45c1a0-05de-4bcc-9876-74d76c697871.png' 
}) => {
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Reset video error state when videoSrc changes
  useEffect(() => {
    if (videoSrc) {
      setVideoError(false);
      setIsVideoLoaded(false);
    }
  }, [videoSrc]);

  // Handle video load success
  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    console.log("Video loaded successfully:", videoSrc);
  };

  // Handle video load error
  const handleVideoError = () => {
    setVideoError(true);
    console.error("Failed to load video:", videoSrc);
  };

  // Determine if we should show the static image fallback
  const shouldShowFallback = !videoSrc || videoError;

  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />
      
      {!shouldShowFallback && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover z-5 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          style={{ transition: 'opacity 0.5s ease-in-out' }}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Always render the fallback image (it will be hidden if video loads) */}
      <div 
        className={`absolute inset-0 bg-cover bg-center z-5 ${!shouldShowFallback && isVideoLoaded ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          backgroundImage: `url('${fallbackSrc}')`,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />
    </div>
  );
};
