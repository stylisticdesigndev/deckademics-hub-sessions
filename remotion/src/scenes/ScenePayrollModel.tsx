import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, display, body, mono } from "../theme";

export const ScenePayrollModel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const header = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const a = spring({ frame: frame - 24, fps, config: { damping: 22, stiffness: 140 } });
  const op = spring({ frame: frame - 46, fps, config: { damping: 200 } });
  const b = spring({ frame: frame - 58, fps, config: { damping: 22, stiffness: 140 } });
  const eq = spring({ frame: frame - 80, fps, config: { damping: 200 } });
  const c = spring({ frame: frame - 90, fps, config: { damping: 18, stiffness: 130 } });
  const note = spring({ frame: frame - 118, fps, config: { damping: 200 } });

  const Box: React.FC<{ p: number; label: string; value: string; color?: string }> = ({ p, label, value, color }) => (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
        padding: "36px 44px",
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        minWidth: 340,
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: mono, color: COLORS.mute, fontSize: 20, letterSpacing: 3, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 72, color: color ?? COLORS.ink, marginTop: 10, letterSpacing: -2 }}>
        {value}
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ padding: 120, fontFamily: body, color: COLORS.ink, justifyContent: "center" }}>
      <div style={{ opacity: header, marginBottom: 40 }}>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 4, color: COLORS.green, textTransform: "uppercase" }}>
          Part 02 — Payroll · the mental model
        </div>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 96, letterSpacing: -3, marginTop: 12 }}>
          One simple formula.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, marginTop: 40 }}>
        <Box p={a} label="Weekly classes" value="× N" />
        <div style={{ opacity: op, fontFamily: display, fontSize: 96, color: COLORS.green }}>×</div>
        <Box p={b} label="Class rate" value="$ / class" />
        <div style={{ opacity: eq, fontFamily: display, fontSize: 96, color: COLORS.green }}>=</div>
        <Box p={c} label="Instructor pay" value="Total" color={COLORS.green} />
      </div>
      <div style={{ opacity: note, marginTop: 60, fontSize: 28, color: COLORS.mute, textAlign: "center" }}>
        Rate is per <span style={{ color: COLORS.ink }}>class</span>, not per hour. Restricted to the owner account.
      </div>
    </AbsoluteFill>
  );
};