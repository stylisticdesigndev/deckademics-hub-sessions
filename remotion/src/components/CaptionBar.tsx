import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS, body } from "../theme";

export const CaptionBar: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: op,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(11,18,16,0.75)",
          border: `1px solid ${COLORS.border}`,
          borderLeft: `3px solid ${COLORS.green}`,
          padding: "12px 24px",
          borderRadius: 10,
          color: COLORS.ink,
          fontFamily: body,
          fontSize: 22,
          letterSpacing: 0.2,
          backdropFilter: "blur(6px)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const SceneKicker: React.FC<{ label: string; title: string }> = ({ label, title }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const x = interpolate(frame, [0, 20], [-20, 0], { extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: op, transform: `translateX(${x}px)` }}>
      <div
        style={{
          color: COLORS.green,
          fontFamily: "monospace",
          fontSize: 18,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: COLORS.ink,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 68,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: -1,
        }}
      >
        {title}
      </div>
    </div>
  );
};