import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { COLORS, display, body, mono } from "../../theme";
import { BrowserFrame } from "../../components/BrowserFrame";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";

const students = [
  { name: "Amara Chen",  level: "Amateur",      primary: "DJ Kairo", pct: 62 },
  { name: "Jordan Reed", level: "Novice",       primary: "DJ Miles", pct: 24 },
  { name: "Sofia Ortiz", level: "Intermediate", primary: "DJ Ruby",  pct: 78 },
  { name: "Kai Patel",   level: "Advanced",     primary: "DJ Kairo", pct: 94 },
];

const LEVEL_COLOR: Record<string, string> = {
  Novice: "#94a3b8",
  Amateur: "#38bdf8",
  Intermediate: "#a78bfa",
  Advanced: COLORS.green,
};

export const SceneStudents: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 120px", justifyContent: "center" }}>
      <Audio src={staticFile("audio/students.mp3")} />
      <SceneKicker label="Part 03 · Students" title="Primary + secondary." />
      <div style={{ marginTop: 50 }}>
        <BrowserFrame url="deckademics.app/admin/students">
          <div style={{ padding: 30 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, fontFamily: mono, fontSize: 13, letterSpacing: 2 }}>
              <span style={{ padding: "6px 14px", background: "rgba(64,166,71,0.15)", color: COLORS.green, borderRadius: 6 }}>ACTIVE 48</span>
              <span style={{ padding: "6px 14px", background: "rgba(239,68,68,0.12)", color: "#ef4444", borderRadius: 6 }}>PENDING 3</span>
              <span style={{ padding: "6px 14px", background: "rgba(255,255,255,0.04)", color: COLORS.mute, borderRadius: 6 }}>INACTIVE 7</span>
            </div>
            {students.map((s, i) => {
              const sp = spring({ frame: frame - 20 - i * 8, fps, config: { damping: 20 } });
              const barW = interpolate(spring({ frame: frame - 60 - i * 8, fps, config: { damping: 22 } }), [0, 1], [0, s.pct]);
              return (
                <div key={s.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 180px 180px 260px",
                    alignItems: "center",
                    padding: "18px 20px",
                    borderBottom: `1px solid ${COLORS.border}`,
                    opacity: sp,
                    transform: `translateY(${(1 - sp) * 20}px)`,
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: `hsl(${i * 90}, 40%, 30%)`, display: "grid", placeItems: "center", color: "#fff", fontFamily: display, fontWeight: 700 }}>
                      {s.name[0]}
                    </div>
                    <div style={{ color: COLORS.ink, fontFamily: body, fontSize: 22, fontWeight: 600 }}>{s.name}</div>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: 2, color: LEVEL_COLOR[s.level] }}>
                    ● {s.level.toUpperCase()}
                  </div>
                  <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 16 }}>
                    <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: COLORS.mute }}>Primary</span><br />
                    <span style={{ color: COLORS.ink, fontSize: 18 }}>{s.primary}</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 12, color: COLORS.mute, marginBottom: 4 }}>
                      <span>SKILLS</span><span style={{ color: COLORS.ink }}>{Math.round(barW)}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${barW}%`, height: "100%", background: LEVEL_COLOR[s.level] }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </BrowserFrame>
      </div>
      <CaptionBar text="Proficiency updates automatically from graded Skills." />
    </AbsoluteFill>
  );
};