import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { COLORS, display, body, mono } from "../../theme";
import { BrowserFrame } from "../../components/BrowserFrame";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";

const rows = [
  { name: "DJ Kairo", role: "Primary", rate: 55, status: "active" },
  { name: "DJ Miles", role: "Primary", rate: 50, status: "active" },
  { name: "DJ Nova",  role: "Secondary", rate: 45, status: "pending" },
  { name: "DJ Ruby",  role: "Primary", rate: 60, status: "active" },
];

export const SceneInstructors: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 120px", justifyContent: "center" }}>
      <Audio src={staticFile("audio/instructors.mp3")} />
      <SceneKicker label="Part 02 · Instructors" title="Rates drive payroll." />
      <div style={{ marginTop: 50 }}>
        <BrowserFrame url="deckademics.app/admin/instructors">
          <div style={{ padding: 30 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, color: COLORS.mute, fontFamily: mono, fontSize: 13, letterSpacing: 2 }}>
              <span style={{ padding: "6px 14px", background: "rgba(64,166,71,0.15)", color: COLORS.green, borderRadius: 6 }}>ACTIVE 12</span>
              <span style={{ padding: "6px 14px", background: "rgba(239,68,68,0.12)", color: "#ef4444", borderRadius: 6 }}>PENDING 1</span>
              <span style={{ padding: "6px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>INACTIVE 3</span>
            </div>
            {rows.map((r, i) => {
              const s = spring({ frame: frame - 20 - i * 8, fps, config: { damping: 20 } });
              const rateHighlight = interpolate(frame, [120 + i * 6, 150 + i * 6], [0, 1], { extrapolateRight: "clamp" });
              return (
                <div key={r.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 160px 160px 140px",
                    alignItems: "center",
                    padding: "18px 20px",
                    borderBottom: `1px solid ${COLORS.border}`,
                    opacity: s,
                    transform: `translateY(${(1 - s) * 20}px)`,
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: `hsl(${i * 70}, 40%, 30%)`, display: "grid", placeItems: "center", color: "#fff", fontFamily: display, fontWeight: 700 }}>
                      {r.name.split(" ")[1][0]}
                    </div>
                    <div style={{ color: COLORS.ink, fontFamily: body, fontSize: 22, fontWeight: 600 }}>{r.name}</div>
                  </div>
                  <div style={{ color: COLORS.mute, fontFamily: mono, fontSize: 14, letterSpacing: 1.5 }}>{r.role.toUpperCase()}</div>
                  <div style={{ fontFamily: display, fontSize: 26, fontWeight: 700, color: rateHighlight > 0 ? COLORS.green : COLORS.ink, transition: "color 200ms" }}>
                    ${r.rate}<span style={{ fontSize: 14, color: COLORS.mute, fontWeight: 500 }}>/class</span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: 2, color: r.status === "active" ? COLORS.green : "#ef4444" }}>
                    {r.status.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </BrowserFrame>
      </div>
      <CaptionBar text="Deactivate is safe — students get flagged for reassignment." />
    </AbsoluteFill>
  );
};