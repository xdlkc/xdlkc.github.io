import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const accent = "#f97316";
const bg = "#0f172a";
const light = "#f8fafc";
const slate = "#64748b";

const phases = [
  { era: "过去", desc: "自建邮件服务器", example: "配 DNS / MX", x: 360 },
  { era: "现在", desc: "开箱即用的服务", example: "Gmail", x: 960 },
  { era: "未来", desc: "无感融入日常", example: "微信 / AI助手", x: 1560 },
];

export const Scene8Ending: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 200 } });

  const lineY = 420;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        fontFamily: "monospace",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 80,
          width: "100%",
          textAlign: "center",
          fontSize: 42,
          fontWeight: "bold",
          color: light,
          opacity: titleProgress,
        }}
      >
        AI助手的终局，是「无处不在」
      </div>

      {/* Timeline arrow */}
      <div
        style={{
          position: "absolute",
          left: 260,
          top: lineY,
          width: 1400,
          height: 3,
          background: `linear-gradient(to right, ${slate}, ${accent})`,
          borderRadius: 2,
          opacity: spring({ frame: frame - 5, fps, config: { damping: 200 } }),
        }}
      />

      {/* Phases */}
      {phases.map((phase, i) => {
        const delay = 10 + i * 12;
        const progress = spring({
          frame: frame - delay,
          fps,
          config: { damping: 200 },
        });
        const scaleProgress = spring({
          frame: frame - delay,
          fps,
          config: { damping: 12, mass: 0.5 },
        });

        return (
          <React.Fragment key={phase.era}>
            {/* Dot */}
            <div
              style={{
                position: "absolute",
                left: phase.x - 12,
                top: lineY - 12,
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: i === 2 ? accent : slate,
                opacity: progress,
                transform: `scale(${scaleProgress})`,
              }}
            />

            {/* Era label */}
            <div
              style={{
                position: "absolute",
                left: phase.x - 80,
                top: lineY - 70,
                width: 160,
                textAlign: "center",
                fontSize: 28,
                fontWeight: "bold",
                color: i === 2 ? accent : light,
                opacity: progress,
              }}
            >
              {phase.era}
            </div>

            {/* Description */}
            <div
              style={{
                position: "absolute",
                left: phase.x - 120,
                top: lineY + 30,
                width: 240,
                textAlign: "center",
                fontSize: 18,
                color: slate,
                opacity: progress,
              }}
            >
              {phase.desc}
            </div>

            {/* Example */}
            <div
              style={{
                position: "absolute",
                left: phase.x - 120,
                top: lineY + 58,
                width: 240,
                textAlign: "center",
                fontSize: 14,
                color: accent,
                opacity: progress,
              }}
            >
              {phase.example}
            </div>
          </React.Fragment>
        );
      })}

      {/* Bottom call to action */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          width: "100%",
          textAlign: "center",
          opacity: spring({ frame: frame - 40, fps, config: { damping: 200 } }),
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🦞</div>
        <div style={{ fontSize: 32, fontWeight: "bold", color: accent }}>
          github.com/openclaw/openclaw
        </div>
        <div
          style={{ fontSize: 16, color: slate, marginTop: 12 }}
        >
          MIT License · npm install -g openclaw@latest · openclaw onboard
        </div>
      </div>
    </AbsoluteFill>
  );
};
