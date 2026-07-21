import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { COLORS, display, body, mono } from "../../theme";

export const SceneCloseV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18 } });
  const barW = interpolate(spring({ frame: frame - 20, fps, config: { damping: 22 } }), [0, 1], [0, 300]);
  return (
    <AbsoluteFill style={{ padding: 140, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <Audio src={staticFile("audio/close.mp3")} />
      <div style={{ color: COLORS.green, fontFamily: mono, fontSize: 18, letterSpacing: 4, textTransform: "uppercase", opacity: s }}>
        That's the whole system.
      </div>
      <div style={{ height: 4, width: barW, background: COLORS.green, marginTop: 24, marginBottom: 24 }} />
      <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 220, fontWeight: 700, lineHeight: 0.95, letterSpacing: -6, transform: `scale(${0.9 + 0.1 * s})`, opacity: s }}>
        You're <span style={{ color: COLORS.green }}>ready</span>.
      </div>
      <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 26, marginTop: 30, opacity: s }}>
        Deckademics · Admin Handoff · v2
      </div>
    </AbsoluteFill>
  );
};