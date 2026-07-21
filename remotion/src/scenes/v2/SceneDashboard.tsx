import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { COLORS, display, body, mono } from "../../theme";
import { BrowserFrame } from "../../components/BrowserFrame";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";

const StatusCard: React.FC<{ i: number; label: string; count: number; status: "alert" | "ok" }> = ({ i, label, count, status }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 20 - i * 6, fps, config: { damping: 18 } });
  const color = status === "alert" ? "#ef4444" : COLORS.green;
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 12,
        padding: "22px 24px",
        opacity: s,
        transform: `translateY(${(1 - s) * 20}px)`,
      }}
    >
      <div style={{ color: COLORS.mute, fontFamily: mono, fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 8 }}>
        <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 54, fontWeight: 700 }}>{count}</div>
        <div style={{ color, fontFamily: mono, fontSize: 12, textTransform: "uppercase", letterSpacing: 2 }}>
          {status === "alert" ? "· needs you" : "· all clear"}
        </div>
      </div>
    </div>
  );
};

export const SceneDashboard: React.FC = () => {
  return (
    <AbsoluteFill style={{ padding: "80px 120px", justifyContent: "center" }}>
      <Audio src={staticFile("audio/dashboard.mp3")} />
      <SceneKicker label="Part 01 · Dashboard" title="Red means action." />
      <div style={{ marginTop: 60 }}>
        <BrowserFrame url="deckademics.app/admin/dashboard">
          <div style={{ padding: 40, display: "flex", gap: 20 }}>
            <StatusCard i={0} label="New Signups" count={4} status="alert" />
            <StatusCard i={1} label="Overdue Payments" count={2} status="alert" />
            <StatusCard i={2} label="Bug Reports" count={1} status="alert" />
            <StatusCard i={3} label="Attendance" count={0} status="ok" />
          </div>
        </BrowserFrame>
      </div>
      <CaptionBar text="If nothing is red, you can close the tab." />
    </AbsoluteFill>
  );
};