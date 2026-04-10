import "./index.css";
import { Composition } from "remotion";
import {
  CompilationLayerAnimation,
  GovernanceRiskAnimation,
  KnowledgeCompoundingAnimation,
  LlmWikiExplainer,
  RagVsWikiAnimation,
} from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LlmWikiExplainer"
        component={LlmWikiExplainer}
        durationInFrames={450}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="RagVsWiki"
        component={RagVsWikiAnimation}
        durationInFrames={140}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="CompilationLayer"
        component={CompilationLayerAnimation}
        durationInFrames={140}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="KnowledgeCompounding"
        component={KnowledgeCompoundingAnimation}
        durationInFrames={140}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="GovernanceRisk"
        component={GovernanceRiskAnimation}
        durationInFrames={130}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
