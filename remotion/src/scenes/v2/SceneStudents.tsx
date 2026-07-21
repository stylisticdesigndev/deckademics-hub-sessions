import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";
import { ScreenshotShowcase } from "../../components/ScreenshotShowcase";

export const SceneStudents: React.FC = () => (
  <AbsoluteFill style={{ padding: "60px 120px 80px", justifyContent: "flex-start" }}>
    <Audio src={staticFile("audio/students.mp3")} />
    <SceneKicker label="Part 03 · Students" title="Every student · every class." />
    <div style={{ marginTop: 30 }}>
      <ScreenshotShowcase
        url="deckademics.app/admin/students"
        src="screenshots/admin-students.png"
        height={780}
      />
    </div>
    <CaptionBar text="Instructor · Level · Day · Time — all visible at a glance." />
  </AbsoluteFill>
);