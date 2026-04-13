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

const contributors = [
  { name: "Peter Steinberger", commits: 19284, color: accent, label: "62%" },
  { name: "Vincent Koc", commits: 4067, color: "#3b82f6", label: "13%" },
  { name: "Tak Hoffman", commits: 1122, color: "#8b5cf6", label: "4%" },
  { name: "Others (60+)", commits: 6510, color: "#475569", label: "21%" },
];

export const Scene5Contributors: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const maxCommits = contributors[0].commits;
  const barMaxWidth = 1000;
  const barHeight = 60;
  const startY = 240;
  const barGap = 100;
  const labelX = 120;

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
          opacity: spring({ frame, fps, config: { damping: 200 } }),
        }}
      >
        Top Contributors
      </div>

      {/* Bars */}
      {contributors.map((c, i) => {
        const barWidth = (c.commits / maxCommits) * barMaxWidth;
        const barProgress = spring({
          frame: frame - 8 - i * 10,
          fps,
          config: { damping: 15, mass: 0.8 },
        });
        const y = startY + i * barGap;

        return (
          <React.Fragment key={c.name}>
            {/* Name */}
            <div
              style={{
                position: "absolute",
                left: labelX,
                top: y,
                color: slate,
                fontSize: 20,
                opacity: barProgress,
                lineHeight: "60px",
              }}
            >
              {c.name}
            </div>

            {/* Bar */}
            <div
              style={{
                position: "absolute",
                left: labelX + 260,
                top: y + 10,
                width: barProgress * barWidth,
                height: barHeight - 20,
                backgroundColor: c.color,
                borderRadius: 6,
              }}
            />

            {/* Number */}
            <div
              style={{
                position: "absolute",
                left: labelX + 270 + barWidth,
                top: y + 2,
                color: c.color,
                fontSize: 22,
                fontWeight: "bold",
                opacity: barProgress,
                lineHeight: "60px",
              }}
            >
              {c.commits.toLocaleString()} ({c.label})
            </div>
          </React.Fragment>
        );
      })}

      {/* Highlight box */}
      <div
        style={{
          position: "absolute",
          left: 360,
          top: 660,
          border: `2px solid ${accent}40`,
          borderRadius: 12,
          padding: "20px 40px",
          opacity: spring({ frame: frame - 45, fps, config: { damping: 200 } }),
        }}
      >
        <div style={{ color: accent, fontSize: 16 }}>
          一个人写了 62% 的代码
        </div>
        <div style={{ color: slate, fontSize: 14, marginTop: 4 }}>
          平均每天 130 次提交 · 持续 5 个月
        </div>
      </div>
    </AbsoluteFill>
  );
};
