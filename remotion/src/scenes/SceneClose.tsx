import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, display, body, mono } from "../theme";

const RULES = [
  "Void — never Delete.",
  "Corrective Extra Pay > editing paid amounts.",
  "Missing from preview? Check schedule, rate, or an overlapping payment.",
];

export const SceneClose: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const bigIn = spring({ frame: frame - 60, fps, config: { damping: 18, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ padding: 120, fontFamily: body, color: COLORS.ink, justifyContent: "center" }}>
      <div style={{ opacity: head }}>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 4, color: COLORS.green, textTransform: "uppercase" }}>
          If you ever get stuck
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 40, marginBottom: 60 }}>
        {RULES.map((r, i) => {
          const p = spring({ frame: frame - 14 - i * 10, fps, config: { damping: 22, stiffness: 130 } });
          return (
            <div key={i} style={{ opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-40, 0])}px)`, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 14, height: 14, background: COLORS.green, borderRadius: 2 }} />
              <div style={{ fontFamily: display, fontWeight: 500, fontSize: 40 }}>{r}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 160,
          letterSpacing: -5,
          opacity: bigIn,
          transform: `translateY(${interpolate(bigIn, [0, 1], [40, 0])}px)`,
          lineHeight: 1,
        }}
      >
        You're <span style={{ color: COLORS.green }}>ready.</span>
      </div>
      <div style={{ marginTop: 32, opacity: bigIn, fontSize: 26, color: COLORS.mute, fontFamily: mono, letterSpacing: 3, textTransform: "uppercase" }}>
        Deckademics · Launching out of beta
      </div>
    </AbsoluteFill>
  );
};