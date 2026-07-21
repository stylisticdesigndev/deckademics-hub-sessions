import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { SceneTitle } from "./scenes/SceneTitle";
import { SceneOverview } from "./scenes/SceneOverview";
import { SceneAreas } from "./scenes/SceneAreas";
import { ScenePayrollModel } from "./scenes/ScenePayrollModel";
import { ScenePayrollFlow } from "./scenes/ScenePayrollFlow";
import { SceneClose } from "./scenes/SceneClose";

const D = { title: 90, overview: 90, areas: 120, model: 150, flow: 180, close: 105 };
const T = 20;
// Total = sum durations - (transitions * (n-1))
export const TOTAL_FRAMES =
  D.title + D.overview + D.areas + D.model + D.flow + D.close - T * 5;

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
  const wipeT = springTiming({ config: { damping: 200 }, durationInFrames: T });
  const fadeT = springTiming({ config: { damping: 200 }, durationInFrames: T });
  return (
    <AbsoluteFill>
      <PersistentBg />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D.title}>
          <SceneTitle />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={fadeT} />
        <TransitionSeries.Sequence durationInFrames={D.overview}>
          <SceneOverview />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={wipeT} />
        <TransitionSeries.Sequence durationInFrames={D.areas}>
          <SceneAreas />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={fadeT} />
        <TransitionSeries.Sequence durationInFrames={D.model}>
          <ScenePayrollModel />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={wipeT} />
        <TransitionSeries.Sequence durationInFrames={D.flow}>
          <ScenePayrollFlow />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={fadeT} />
        <TransitionSeries.Sequence durationInFrames={D.close}>
          <SceneClose />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};