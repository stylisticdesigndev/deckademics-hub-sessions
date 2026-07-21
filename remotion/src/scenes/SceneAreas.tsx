import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, display, body, mono } from "../theme";

const AREAS = [
  { k: "01", t: "Instructors", d: "Approve, edit, deactivate safely." },
  { k: "02", t: "Students", d: "Active · Pending · Inactive tabs." },
  { k: "03", t: "Curriculum", d: "Novice → Advanced rubric." },
  { k: "04", t: "Skills", d: "0–100 gradable items." },
  { k: "05", t: "Attendance", d: "Classrooms 1, 2, 3 — read-only." },
  { k: "06", t: "Messages", d: "Two-way threads, unread badges." },
  { k: "07", t: "Announcements", d: "School-wide, categorised." },
  { k: "08", t: "Bugs & Requests", d: "Track until badge clears." },
];

export const SceneAreas: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const header = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ padding: "80px 120px", fontFamily: body, color: COLORS.ink }}>
      <div style={{ opacity: header, marginBottom: 40 }}>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 4, color: COLORS.green, textTransform: "uppercase" }}>
          Eight menu items
        </div>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 96, letterSpacing: -3, marginTop: 12 }}>
          Know one, know them all.
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20 }}>
        {AREAS.map((a, i) => {
          const s = spring({ frame: frame - 18 - i * 5, fps, config: { damping: 22, stiffness: 140 } });
          const y = interpolate(s, [0, 1], [40, 0]);
          return (
            <div
              key={a.k}
              style={{
                opacity: s,
                transform: `translateY(${y}px)`,
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderLeft: `4px solid ${COLORS.green}`,
                padding: "22px 28px",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <div style={{ fontFamily: mono, color: COLORS.green, fontSize: 22, minWidth: 60 }}>{a.k}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: display, fontWeight: 500, fontSize: 34 }}>{a.t}</div>
                <div style={{ color: COLORS.mute, fontSize: 20, marginTop: 4 }}>{a.d}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};