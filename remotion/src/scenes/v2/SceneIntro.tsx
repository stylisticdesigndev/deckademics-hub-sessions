import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, display, body } from "../../theme";

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barW = interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [0, 220]);
  const titleY = interpolate(spring({ frame: frame - 8, fps, config: { damping: 20 } }), [0, 1], [40, 0]);
  const titleOp = interpolate(frame, [8, 25], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: 140, justifyContent: "center" }}>
      <Audio src={staticFile("audio/intro.mp3")} />
      <div style={{ height: 4, width: barW, background: COLORS.green, marginBottom: 32 }} />
      <div style={{ color: COLORS.green, fontFamily: "monospace", fontSize: 20, letterSpacing: 4, textTransform: "uppercase", marginBottom: 24, opacity: subOp }}>
        Deckademics · Admin Handoff
      </div>
      <div
        style={{
          color: COLORS.ink,
          fontFamily: display,
          fontSize: 180,
          fontWeight: 700,
          lineHeight: 0.95,
          letterSpacing: -4,
          transform: `translateY(${titleY}px)`,
          opacity: titleOp,
        }}
      >
        Run the school.
        <br />
        <span style={{ color: COLORS.green }}>Run payroll.</span>
      </div>
      <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 28, marginTop: 32, opacity: subOp }}>
        A three-minute tour of the admin console.
      </div>
    </AbsoluteFill>
  );
};