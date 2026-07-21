import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";
import { ScreenshotShowcase } from "../../components/ScreenshotShowcase";

export const SceneInstructors: React.FC = () => (
  <AbsoluteFill style={{ padding: "60px 120px 80px", justifyContent: "flex-start" }}>
    <Audio src={staticFile("audio/instructors.mp3")} />
    <SceneKicker label="Part 02 · Instructors" title="Manage the whole team." />
    <div style={{ marginTop: 30 }}>
      <ScreenshotShowcase
        url="deckademics.app/admin/instructors"
        src="screenshots/admin-instructors.png"
        height={780}
      />
    </div>
    <CaptionBar text="Active · Pending · Inactive — all in one view." />
  </AbsoluteFill>
);