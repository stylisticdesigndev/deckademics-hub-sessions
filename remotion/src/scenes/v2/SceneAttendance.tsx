import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS, display, body, mono } from "../../theme";
import { BrowserFrame } from "../../components/BrowserFrame";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";

const days = ["MON", "TUE", "WED", "THU", "FRI"];
const rooms = ["Classroom 1", "Classroom 2", "Classroom 3"];
// P = present, A = absent, . = no class
const grid = [
  ["P", "P", "P", "P", "P"],
  ["P", "A", "P", "P", "."],
  [".", "P", "P", "A", "P"],
];

export const SceneAttendance: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 120px", justifyContent: "center" }}>
      <Audio src={staticFile("audio/attendance.mp3")} />
      <SceneKicker label="Part 05 · Oversight" title="Attendance & Announcements." />
      <div style={{ marginTop: 50, display: "flex", gap: 32 }}>
        <div style={{ flex: 1 }}>
          <BrowserFrame url="admin/attendance">
            <div style={{ padding: 30 }}>
              <div style={{ color: COLORS.mute, fontFamily: mono, fontSize: 12, letterSpacing: 2, marginBottom: 16 }}>WEEK OF JUL 14</div>
              <div style={{ display: "grid", gridTemplateColumns: "180px repeat(5, 1fr)", gap: 8, alignItems: "center" }}>
                <div />
                {days.map((d) => (
                  <div key={d} style={{ color: COLORS.mute, fontFamily: mono, fontSize: 12, letterSpacing: 2, textAlign: "center" }}>{d}</div>
                ))}
                {rooms.map((room, r) => (
                  <React.Fragment key={room}>
                    <div style={{ color: COLORS.ink, fontFamily: body, fontSize: 18 }}>{room}</div>
                    {grid[r].map((cell, c) => {
                      const s = spring({ frame: frame - 20 - (r * 5 + c) * 3, fps, config: { damping: 20 } });
                      const bg = cell === "P" ? "rgba(64,166,71,0.25)" : cell === "A" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.03)";
                      const col = cell === "P" ? COLORS.green : cell === "A" ? "#ef4444" : COLORS.mute;
                      const glyph = cell === "P" ? "✓" : cell === "A" ? "✕" : "—";
                      return (
                        <div key={c} style={{ opacity: s, transform: `scale(${0.7 + 0.3 * s})`, height: 56, borderRadius: 8, background: bg, display: "grid", placeItems: "center", color: col, fontFamily: display, fontSize: 22, fontWeight: 700 }}>
                          {glyph}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </BrowserFrame>
        </div>
        <div style={{ flex: 1 }}>
          <BrowserFrame url="admin/announcements">
            <div style={{ padding: 30 }}>
              {[
                { cat: "STUDENTS", color: COLORS.green, title: "New curriculum drops Monday" },
                { cat: "INSTRUCTORS", color: "#a78bfa", title: "Payroll batch ready to review" },
                { cat: "EVERYONE", color: "#38bdf8", title: "Guest set: DJ Sabine · Sat 8pm" },
              ].map((a, i) => {
                const s = spring({ frame: frame - 40 - i * 12, fps, config: { damping: 20 } });
                return (
                  <div key={a.title} style={{ opacity: s, transform: `translateX(${(1 - s) * 30}px)`, padding: "18px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ color: a.color, fontFamily: mono, fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>● {a.cat}</div>
                    <div style={{ color: COLORS.ink, fontFamily: body, fontSize: 20, fontWeight: 500 }}>{a.title}</div>
                  </div>
                );
              })}
            </div>
          </BrowserFrame>
        </div>
      </div>
      <CaptionBar text="School-wide oversight · Categorized announcements." />
    </AbsoluteFill>
  );
};