import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { COLORS, display, body, mono } from "../../theme";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";

const STEPS = [
  { n: "01", t: "Generate", d: "Pick a date range · usually last 2 weeks.", start: 30 },
  { n: "02", t: "Preview",  d: "See classes × rate per instructor.",       start: 180 },
  { n: "03", t: "Confirm",  d: "Creates pending payments instructors see.", start: 330 },
  { n: "04", t: "Adjust",   d: "Add Extra Pay · edit before money moves.",  start: 500 },
  { n: "05", t: "Mark Paid", d: "Final · moves batch to Payroll History.",  start: 800 },
];

export const SceneFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "60px 120px", justifyContent: "flex-start" }}>
      <Audio src={staticFile("audio/flow.mp3")} />
      <SceneKicker label="Part 07 · Workflow" title="Generate → Preview → Pay." />
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
        {STEPS.map((s, i) => {
          const enter = spring({ frame: frame - s.start, fps, config: { damping: 20 } });
          const highlight = interpolate(frame, [s.start + 20, s.start + 50], [0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const nextStart = i < STEPS.length - 1 ? STEPS[i + 1].start + 20 : Number.POSITIVE_INFINITY;
          const active = frame > s.start + 20 && frame < nextStart;
          return (
            <div key={s.n} style={{
              display: "grid", gridTemplateColumns: "80px 260px 1fr",
              alignItems: "center", gap: 24,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderLeft: `4px solid ${active ? COLORS.green : COLORS.border}`,
              borderRadius: 14, padding: "22px 28px",
              opacity: enter, transform: `translateX(${(1 - enter) * -40}px)`,
            }}>
              <div style={{ color: COLORS.green, fontFamily: mono, fontSize: 22, opacity: highlight }}>{s.n}</div>
              <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 42, fontWeight: 700, opacity: highlight }}>{s.t}</div>
              <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 22, opacity: highlight }}>{s.d}</div>
            </div>
          );
        })}
      </div>
      <CaptionBar text="Five steps · runs every pay period." />
    </AbsoluteFill>
  );
};