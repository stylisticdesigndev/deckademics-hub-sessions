import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { COLORS, display, body, mono } from "../../theme";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";

const Chip: React.FC<{ i: number; kicker: string; big: string }> = ({ i, kicker, big }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 25 - i * 15, fps, config: { damping: 18 } });
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "40px 60px", minWidth: 340, textAlign: "center", opacity: s, transform: `translateY(${(1 - s) * 30}px) scale(${0.9 + 0.1 * s})` }}>
      <div style={{ color: COLORS.mute, fontFamily: mono, fontSize: 14, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>{kicker}</div>
      <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 88, fontWeight: 700, lineHeight: 1 }}>{big}</div>
    </div>
  );
};

export const SceneModel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eqS = spring({ frame: frame - 80, fps, config: { damping: 18 } });
  const answerOp = interpolate(frame, [140, 170], [0, 1], { extrapolateRight: "clamp" });
  const answerY = interpolate(spring({ frame: frame - 140, fps, config: { damping: 20 } }), [0, 1], [30, 0]);
  return (
    <AbsoluteFill style={{ padding: "80px 120px", justifyContent: "center" }}>
      <Audio src={staticFile("audio/model.mp3")} />
      <SceneKicker label="Part 06 · Payroll" title="One simple formula." />
      <div style={{ marginTop: 70, display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Chip i={0} kicker="Weekly classes" big="× N" />
        <div style={{ color: COLORS.green, fontFamily: display, fontSize: 100, opacity: eqS, transform: `scale(${eqS})` }}>×</div>
        <Chip i={1} kicker="Class rate" big="$ / class" />
      </div>
      <div style={{ marginTop: 60, textAlign: "center", opacity: answerOp, transform: `translateY(${answerY}px)` }}>
        <div style={{ color: COLORS.mute, fontFamily: mono, fontSize: 14, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Example</div>
        <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 56, fontWeight: 700 }}>
          4 classes × <span style={{ color: COLORS.green }}>$50</span> = <span style={{ color: COLORS.green }}>$200 / week</span>
        </div>
      </div>
      <CaptionBar text="Everything else in payroll just helps you get this number right." />
    </AbsoluteFill>
  );
};