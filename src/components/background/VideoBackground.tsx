
import React from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  isYouTube?: boolean;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc, isYouTube = false }) => {
  // Extract YouTube video ID if it's a YouTube URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (isYouTube) {
    const videoId = getYouTubeId(videoSrc) || '';
    return (
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute inset-0 bg-black/60 z-10" /> {/* Darker overlay for YouTube */}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="absolute w-full h-full object-cover"
          style={{ pointerEvents: 'none' }}
        />
      </div>
    );
  }

  // Standard video background
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
