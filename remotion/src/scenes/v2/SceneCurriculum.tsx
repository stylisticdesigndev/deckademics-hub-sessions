import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { COLORS, display, body, mono } from "../../theme";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";

const Panel: React.FC<{ i: number; label: string; title: string; tag: string; children: React.ReactNode; color: string }> = ({ i, label, title, tag, children, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 15 - i * 12, fps, config: { damping: 20 } });
  return (
    <div style={{ flex: 1, opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${color}`, borderRadius: 14, padding: 40, minHeight: 460 }}>
        <div style={{ color, fontFamily: mono, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
        <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 46, fontWeight: 700, marginBottom: 8, lineHeight: 1 }}>{title}</div>
        <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 20, marginBottom: 28 }}>{tag}</div>
        {children}
      </div>
    </div>
  );
};

export const SceneCurriculum: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const skills = ["Beatmatching", "EQ mixing", "Phrase mixing", "Loop rolls", "Hot cues", "Scratching"];
  return (
    <AbsoluteFill style={{ padding: "80px 120px", justifyContent: "center" }}>
      <Audio src={staticFile("audio/curriculum.mp3")} />
      <SceneKicker label="Part 04 · Learning" title="Curriculum vs. Skills." />
      <div style={{ display: "flex", gap: 32, marginTop: 50 }}>
        <Panel i={0} label="Curriculum" title="What's taught." tag="The syllabus, week by week." color="#a78bfa">
          {["Week 1 · Intro to decks", "Week 2 · Beatmatching by ear", "Week 3 · EQ & phrasing", "Week 4 · First recorded mix"].map((w, i) => {
            const s = spring({ frame: frame - 60 - i * 8, fps, config: { damping: 20 } });
            return (
              <div key={w} style={{ padding: "14px 0", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.ink, fontFamily: body, fontSize: 20, opacity: s }}>
                {w}
              </div>
            );
          })}
        </Panel>
        <Panel i={1} label="Skills" title="What's graded." tag="32 techniques · scored 0–100." color={COLORS.green}>
          {skills.map((sk, i) => {
            const s = spring({ frame: frame - 80 - i * 6, fps, config: { damping: 20 } });
            const pct = [82, 74, 68, 55, 90, 41][i];
            const w = interpolate(spring({ frame: frame - 120 - i * 6, fps, config: { damping: 20 } }), [0, 1], [0, pct]);
            return (
              <div key={sk} style={{ padding: "10px 0", opacity: s }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.ink, fontFamily: body, fontSize: 18, marginBottom: 6 }}>
                  <span>{sk}</span><span style={{ color: COLORS.mute, fontFamily: mono }}>{Math.round(w)}</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${w}%`, height: "100%", background: COLORS.green }} />
                </div>
              </div>
            );
          })}
        </Panel>
      </div>
      <CaptionBar text="Instructors grade Skills · Students see Skills." />
    </AbsoluteFill>
  );
};