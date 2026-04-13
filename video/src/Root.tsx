import "./index.css";
import { Composition } from "remotion";
import { OpenClawVideo } from "./OpenClawVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
