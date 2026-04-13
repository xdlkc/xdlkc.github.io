import "./index.css";
import { Composition } from "remotion";
import { HermesDeepDiveCover } from "./HermesDeepDiveCover";
import { HermesDeepDiveMotion } from "./HermesDeepDiveMotion";
import { OpenClawVideo } from "./OpenClawVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HermesDeepDiveMotion"
        component={HermesDeepDiveMotion}
        durationInFrames={420}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HermesDeepDiveCover"
        component={HermesDeepDiveCover}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="OpenClawVideo"
        component={OpenClawVideo}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
