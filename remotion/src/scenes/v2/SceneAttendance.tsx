import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";
import { ScreenshotShowcase } from "../../components/ScreenshotShowcase";

export const SceneAttendance: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const half = Math.floor(durationInFrames / 2);
  return (
    <AbsoluteFill style={{ padding: "60px 120px 80px", justifyContent: "flex-start" }}>
      <Audio src={staticFile("audio/attendance.mp3")} />
      <SceneKicker label="Part 05 · Oversight" title="Attendance & Progress." />
      <div style={{ marginTop: 30 }}>
        <Sequence from={0} durationInFrames={half}>
          <ScreenshotShowcase
            url="deckademics.app/admin/attendance"
            src="screenshots/admin-attendance.png"
            height={780}
          />
        </Sequence>
        <Sequence from={half} durationInFrames={durationInFrames - half}>
          <ScreenshotShowcase
            url="deckademics.app/admin/progress"
            src="screenshots/admin-progress.png"
            height={780}
          />
        </Sequence>
      </div>
      <CaptionBar text="Missed classes flagged · progress rolled up school-wide." />
    </AbsoluteFill>
  );
};