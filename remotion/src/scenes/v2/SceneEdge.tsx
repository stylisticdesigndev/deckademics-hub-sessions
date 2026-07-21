import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS, display, body, mono } from "../../theme";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";

const CARDS = [
  { kicker: "Sick day",        title: "Mark absent",     tag: "No pay for that slot." },
  { kicker: "Someone covered", title: "Add Extra Pay",   tag: "On the covering instructor's row." },
  { kicker: "Mistake · unpaid", title: "Edit or void",   tag: "Adjust before marking paid." },
  { kicker: "Mistake · paid",  title: "Void + reissue",  tag: "Never delete." },
];

export const SceneEdge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 120px", justifyContent: "center" }}>
      <Audio src={staticFile("audio/edge.mp3")} />
      <SceneKicker label="Part 08 · Cheatsheet" title="Common situations." />
      <div style={{ marginTop: 60, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {CARDS.map((c, i) => {
          const s = spring({ frame: frame - 20 - i * 20, fps, config: { damping: 20 } });
          return (
            <div key={c.kicker} style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              padding: 40,
              opacity: s,
              transform: `translateY(${(1 - s) * 30}px)`,
            }}>
              <div style={{ color: COLORS.green, fontFamily: mono, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>{c.kicker}</div>
              <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 44, fontWeight: 700, marginBottom: 8, lineHeight: 1.05 }}>{c.title}</div>
              <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 20 }}>{c.tag}</div>
            </div>
          );
        })}
      </div>
      <CaptionBar text="Void, don't delete. Always leaves a trail." />
    </AbsoluteFill>
  );
};