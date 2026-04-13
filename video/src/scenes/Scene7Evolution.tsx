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

const stages = [
  { name: "Warelay", desc: "个人实验", color: "#6366f1", emoji: "W" },
  { name: "Clawdbot", desc: "Bot 定位", color: "#f97316", emoji: "C" },
  { name: "Moltbot", desc: "Agent 转型", color: "#10b981", emoji: "M" },
  { name: "OpenClaw", desc: "开源生态", color: "#ef4444", emoji: "🦞" },
];

export const Scene7Evolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 200 } });

  const lineStartX = 260;
  const lineEndX = 1660;
  const lineY = 480;

  const lineProgress = interpolate(frame, [10, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t: number) => t,
  });

  const currentLineEnd = lineStartX + (lineEndX - lineStartX) * lineProgress;

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
          top: 50,
          width: "100%",
          textAlign: "center",
          fontSize: 48,
          fontWeight: "bold",
          color: light,
          opacity: titleProgress,
        }}
      >
        四次改名，一次进化
      </div>

      {/* Timeline line */}
      <div
        style={{
          position: "absolute",
          left: lineStartX,
          top: lineY,
          width: currentLineEnd - lineStartX,
          height: 4,
          background: `linear-gradient(to right, #6366f1, #f97316, #10b981, #ef4444)`,
          borderRadius: 2,
        }}
      />

      {/* Stage nodes */}
      {stages.map((stage, i) => {
        const x = lineStartX + (i / (stages.length - 1)) * (lineEndX - lineStartX);
        const delay = 15 + i * 10;

        const dotProgress = spring({
          frame: frame - delay,
          fps,
          config: { damping: 12, mass: 0.5 },
        });

        const textProgress = spring({
          frame: frame - delay - 5,
          fps,
          config: { damping: 200 },
        });

        return (
          <React.Fragment key={stage.name}>
            {/* Dot */}
            <div
              style={{
                position: "absolute",
                left: x - 24,
                top: lineY - 24,
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: stage.color,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: i === 3 ? 24 : 18,
                opacity: dotProgress,
                transform: `scale(${dotProgress})`,
                border: `4px solid ${bg}`,
              }}
            >
              {stage.emoji}
            </div>

            {/* Name */}
            <div
              style={{
                position: "absolute",
                left: x - 80,
                top: lineY + 50,
                width: 160,
                textAlign: "center",
                color: stage.color,
                fontSize: 24,
                fontWeight: "bold",
                opacity: textProgress,
              }}
            >
              {stage.name}
            </div>

            {/* Description */}
            <div
              style={{
                position: "absolute",
                left: x - 80,
                top: lineY + 82,
                width: 160,
                textAlign: "center",
                color: slate,
                fontSize: 16,
                opacity: textProgress,
              }}
            >
              {stage.desc}
            </div>
          </React.Fragment>
        );
      })}

      {/* Arrow at end */}
      <div
        style={{
          position: "absolute",
          left: lineEndX + 10,
          top: lineY - 12,
          color: "#ef4444",
          fontSize: 28,
          opacity: spring({ frame: frame - 55, fps, config: { damping: 200 } }),
        }}
      >
        → ?
      </div>

      {/* Bottom annotation */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: "100%",
          textAlign: "center",
          color: slate,
          fontSize: 18,
          opacity: spring({ frame: frame - 45, fps, config: { damping: 200 } }),
        }}
      >
        每次改名都伴随着定位的调整
      </div>
    </AbsoluteFill>
  );
};
