import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";
import { ScreenshotShowcase } from "../../components/ScreenshotShowcase";

export const SceneCurriculum: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const half = Math.floor(durationInFrames / 2);
  return (
    <AbsoluteFill style={{ padding: "60px 120px 80px", justifyContent: "flex-start" }}>
      <Audio src={staticFile("audio/curriculum.mp3")} />
      <SceneKicker label="Part 04 · Learning" title="Curriculum vs. Skills." />
      <div style={{ marginTop: 30 }}>
        <Sequence from={0} durationInFrames={half}>
          <ScreenshotShowcase
            url="deckademics.app/admin/curriculum"
            src="screenshots/admin-curriculum.png"
            height={780}
          />
        </Sequence>
        <Sequence from={half} durationInFrames={durationInFrames - half}>
          <ScreenshotShowcase
            url="deckademics.app/admin/skills"
            src="screenshots/admin-skills.png"
            height={780}
          />
        </Sequence>
      </div>
      <CaptionBar text="Curriculum is what's taught · Skills is what's graded." />
    </AbsoluteFill>
  );
};