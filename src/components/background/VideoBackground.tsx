
import React from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc }) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
      <div className="absolute inset-0 bg-black/50 z-10" /> {/* Overlay to darken the video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
