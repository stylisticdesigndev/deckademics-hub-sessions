import React from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackSrc?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  videoSrc,
  fallbackSrc = '/lovable-uploads/5b45c1a0-05de-4bcc-9876-74d76c697871.png' 
}) => {
  // Since videos are causing issues, we'll just use the image directly
  // We'll still keep the videoSrc prop for backwards compatibility
  const backgroundSrc = fallbackSrc || videoSrc;
  
  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />
      
      {/* Static background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-5"
        style={{ backgroundImage: `url(${backgroundSrc})` }}
      />
    </div>
  );
};
