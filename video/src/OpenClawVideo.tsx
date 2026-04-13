import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  spring,
  Sequence,
  Series,
} from "remotion";
import { Scene1Hero } from "./scenes/Scene1Hero";
import { Scene2Channels } from "./scenes/Scene2Channels";
import { Scene3Architecture } from "./scenes/Scene3Architecture";
import { Scene4Commits } from "./scenes/Scene4Commits";
import { Scene5Contributors } from "./scenes/Scene5Contributors";
import { Scene6Plugins } from "./scenes/Scene6Plugins";
import { Scene7Evolution } from "./scenes/Scene7Evolution";
import { Scene8Ending } from "./scenes/Scene8Ending";

export const OpenClawVideo = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
      <Series>
        <Series.Sequence durationInFrames={75}>
          <Scene1Hero />
        </Series.Sequence>
        <Series.Sequence durationInFrames={75}>
          <Scene2Channels />
        </Series.Sequence>
        <Series.Sequence durationInFrames={75}>
          <Scene3Architecture />
        </Series.Sequence>
        <Series.Sequence durationInFrames={75}>
          <Scene4Commits />
        </Series.Sequence>
        <Series.Sequence durationInFrames={60}>
          <Scene5Contributors />
        </Series.Sequence>
        <Series.Sequence durationInFrames={60}>
          <Scene6Plugins />
        </Series.Sequence>
        <Series.Sequence durationInFrames={60}>
          <Scene7Evolution />
        </Series.Sequence>
        <Series.Sequence durationInFrames={60}>
          <Scene8Ending />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
