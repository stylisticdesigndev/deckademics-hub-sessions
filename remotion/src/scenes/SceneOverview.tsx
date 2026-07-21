import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, display, body, mono } from "../theme";

export const SceneOverview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const in1 = spring({ frame: frame - 4, fps, config: { damping: 20, stiffness: 120 } });
  const in2 = spring({ frame: frame - 18, fps, config: { damping: 20, stiffness: 120 } });
  const in3 = spring({ frame: frame - 34, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ padding: 120, justifyContent: "center", fontFamily: body, color: COLORS.ink }}>
      <div style={{ fontFamily: mono, fontSize: 22, letterSpacing: 4, color: COLORS.green, textTransform: "uppercase", opacity: in1 }}>
        Part 01 — The control room
      </div>
      <div
        style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 130,
          lineHeight: 1,
          letterSpacing: -4,
          marginTop: 40,
          transform: `translateY(${interpolate(in2, [0, 1], [30, 0])}px)`,
          opacity: in2,
          maxWidth: 1500,
        }}
      >
        Every menu item is a <span style={{ color: COLORS.green }}>self-contained area</span>.
      </div>
      <div style={{ marginTop: 40, opacity: in3, fontSize: 34, color: COLORS.mute, maxWidth: 1400, lineHeight: 1.4 }}>
        Same layout everywhere. If a badge is red, click it — that's where your attention is needed.
      </div>
    </AbsoluteFill>
  );
};