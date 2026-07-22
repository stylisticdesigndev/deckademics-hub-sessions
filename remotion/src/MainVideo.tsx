import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneIntro } from "./scenes/v2/SceneIntro";
import { SceneDashboard } from "./scenes/v2/SceneDashboard";
import { SceneInstructors } from "./scenes/v2/SceneInstructors";
import { SceneStudents } from "./scenes/v2/SceneStudents";
import { SceneCurriculum } from "./scenes/v2/SceneCurriculum";
import { SceneAttendance } from "./scenes/v2/SceneAttendance";
import { SceneModel } from "./scenes/v2/SceneModel";
import { SceneFlow } from "./scenes/v2/SceneFlow";
import { SceneEdge } from "./scenes/v2/SceneEdge";
import { SceneCloseV2 } from "./scenes/v2/SceneCloseV2";

// Per-scene durations in frames (30fps) — sized to each narration clip + short tail.
const D = {
  intro: 414,
  dashboard: 722,
  instructors: 704,
  students: 657,
  curriculum: 866,
  attendance: 540,
  model: 574,
  flow: 1071,
  edge: 572,
  close: 138,
};
export const TOTAL_FRAMES = Object.values(D).reduce((a, b) => a + b, 0);

const PersistentBg: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [0, 60]);
  const drift2 = interpolate(frame, [0, durationInFrames], [0, -80]);
  return (
    <AbsoluteFill style={{ background: "#0b1210", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -200,
          background:
            "radial-gradient(circle at 30% 30%, rgba(64,166,71,0.25), transparent 55%), radial-gradient(circle at 75% 70%, rgba(48,120,52,0.22), transparent 60%)",
          transform: `translate(${drift}px, ${drift2}px)`,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(circle at 50% 50%, black 40%, transparent 80%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <PersistentBg />
      <Series>
        <Series.Sequence durationInFrames={D.intro}><SceneIntro /></Series.Sequence>
        <Series.Sequence durationInFrames={D.dashboard}><SceneDashboard /></Series.Sequence>
        <Series.Sequence durationInFrames={D.instructors}><SceneInstructors /></Series.Sequence>
        <Series.Sequence durationInFrames={D.students}><SceneStudents /></Series.Sequence>
        <Series.Sequence durationInFrames={D.curriculum}><SceneCurriculum /></Series.Sequence>
        <Series.Sequence durationInFrames={D.attendance}><SceneAttendance /></Series.Sequence>
        <Series.Sequence durationInFrames={D.model}><SceneModel /></Series.Sequence>
        <Series.Sequence durationInFrames={D.flow}><SceneFlow /></Series.Sequence>
        <Series.Sequence durationInFrames={D.edge}><SceneEdge /></Series.Sequence>
        <Series.Sequence durationInFrames={D.close}><SceneCloseV2 /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};