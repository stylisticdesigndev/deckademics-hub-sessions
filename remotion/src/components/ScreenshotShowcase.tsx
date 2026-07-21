import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, staticFile } from "remotion";
import { COLORS } from "../theme";
import { BrowserFrame } from "./BrowserFrame";

/**
 * Full-page screenshot displayed in a browser frame with a slow Ken Burns
 * pan from top to bottom + gentle zoom. Works with any tall screenshot
 * because it uses backgroundPosition percentage.
 */
export const ScreenshotShowcase: React.FC<{
  url: string;
  src: string; // staticFile-relative path, e.g. "screenshots/admin-dashboard.png"
  height?: number;
  panStart?: number; // 0-100
  panEnd?: number;   // 0-100
}> = ({ url, src, height = 820, panStart = 0, panEnd = 100 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Ease-in-out over the full scene, offset a bit so it starts settled.
  const t = interpolate(frame, [10, durationInFrames - 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pos = panStart + (panEnd - panStart) * t;
  const scale = interpolate(t, [0, 1], [1.02, 1.06]);
  const intro = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ opacity: intro, transform: `translateY(${(1 - intro) * 20}px)` }}>
      <BrowserFrame url={url}>
        <div
          style={{
            width: "100%",
            height,
            overflow: "hidden",
            background: COLORS.bg,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundImage: `url(${staticFile(src)})`,
              backgroundSize: "100% auto",
              backgroundPosition: `50% ${pos}%`,
              backgroundRepeat: "no-repeat",
              transform: `scale(${scale})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </BrowserFrame>
    </div>
  );
};