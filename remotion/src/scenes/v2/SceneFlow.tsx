import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";
import { ScreenshotShowcase } from "../../components/ScreenshotShowcase";

export const SceneFlow: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const half = Math.floor(durationInFrames / 2);
  return (
    <AbsoluteFill style={{ padding: "60px 120px 80px", justifyContent: "flex-start" }}>
      <Audio src={staticFile("audio/flow.mp3")} />
      <SceneKicker label="Part 07 · Payroll" title="The real payroll screen." />
      <div style={{ marginTop: 30 }}>
        <Sequence from={0} durationInFrames={half}>
          <ScreenshotShowcase
            url="deckademics.app/admin/payments · Instructor Payroll"
            src="screenshots/admin-payments-instructor.png"
            height={780}
          />
        </Sequence>
        <Sequence from={half} durationInFrames={durationInFrames - half}>
          <ScreenshotShowcase
            url="deckademics.app/admin/payments · Student Payments"
            src="screenshots/admin-payments-student.png"
            height={780}
          />
        </Sequence>
      </div>
      <CaptionBar text="Generate · Preview · Extra Pay · Mark Paid — right here." />
    </AbsoluteFill>
  );
};