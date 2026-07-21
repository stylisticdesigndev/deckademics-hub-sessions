import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, display, body, mono } from "../theme";

export const SceneTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eyebrow = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const line1 = spring({ frame: frame - 14, fps, config: { damping: 20, stiffness: 120 } });
  const line2 = spring({ frame: frame - 22, fps, config: { damping: 20, stiffness: 120 } });
  const sub = spring({ frame: frame - 40, fps, config: { damping: 200 } });
  const bar = spring({ frame: frame - 30, fps, config: { damping: 20, stiffness: 90 } });
  const barW = interpolate(bar, [0, 1], [0, 220]);
  const y1 = interpolate(line1, [0, 1], [40, 0]);
  const y2 = interpolate(line2, [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ padding: 120, justifyContent: "center", fontFamily: body, color: COLORS.ink }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: eyebrow, marginBottom: 32 }}>
        <div style={{ width: barW, height: 3, background: COLORS.green }} />
        <span style={{ fontFamily: mono, fontSize: 22, letterSpacing: 4, color: COLORS.green, textTransform: "uppercase" }}>
          Deckademics / Admin Handoff
        </span>
      </div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 200, lineHeight: 0.95, letterSpacing: -6 }}>
        <div style={{ transform: `translateY(${y1}px)`, opacity: line1 }}>Run the</div>
        <div style={{ transform: `translateY(${y2}px)`, opacity: line2, color: COLORS.green }}>school.</div>
      </div>
      <div style={{ marginTop: 48, opacity: sub, maxWidth: 900, fontSize: 32, color: COLORS.mute, lineHeight: 1.4 }}>
        A 30-second walkthrough of the admin console — with a focused look at payroll.
      </div>
    </AbsoluteFill>
  );
};