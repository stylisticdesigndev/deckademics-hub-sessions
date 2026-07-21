import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { SceneKicker, CaptionBar } from "../../components/CaptionBar";
import { ScreenshotShowcase } from "../../components/ScreenshotShowcase";

export const SceneDashboard: React.FC = () => (
  <AbsoluteFill style={{ padding: "60px 120px 80px", justifyContent: "flex-start" }}>
    <Audio src={staticFile("audio/dashboard.mp3")} />
    <SceneKicker label="Part 01 · Dashboard" title="Your morning check-in." />
    <div style={{ marginTop: 30 }}>
      <ScreenshotShowcase
        url="deckademics.app/admin/dashboard"
        src="screenshots/admin-dashboard.png"
        height={780}
      />
    </div>
    <CaptionBar text="Totals up top · pending approvals below." />
  </AbsoluteFill>
);