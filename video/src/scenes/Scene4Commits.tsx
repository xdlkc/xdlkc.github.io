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

const months = [
  { label: "Dec '25", value: 4200 },
  { label: "Jan '26", value: 6800 },
  { label: "Feb '26", value: 6500 },
  { label: "Mar '26", value: 6700 },
  { label: "Apr '26", value: 6400 },
];

export const Scene4Commits: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const maxValue = Math.max(...months.map((m) => m.value));
  const barWidth = 180;
  const barGap = 60;
  const startX = 260;
  const chartTop = 220;
  const chartBottom = 780;
  const chartHeight = chartBottom - chartTop;

  const titleProgress = spring({ frame, fps, config: { damping: 200 } });

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
        Commits / Month
      </div>

      <div
        style={{
          position: "absolute",
          top: 120,
          width: "100%",
          textAlign: "center",
          fontSize: 80,
          fontWeight: "bold",
          color: accent,
          opacity: spring({ frame: frame - 5, fps, config: { damping: 200 } }),
        }}
      >
        30,983 total
      </div>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = chartBottom - ratio * chartHeight;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: startX - 20,
              top: y,
              width: 1920 - startX * 2 + 40,
              height: 1,
              backgroundColor: "#1e293b",
            }}
          />
        );
      })}

      {/* Bars */}
      {months.map((month, i) => {
        const barHeight = (month.value / maxValue) * chartHeight;
        const barProgress = spring({
          frame: frame - 10 - i * 8,
          fps,
          config: { damping: 15, mass: 0.8 },
        });

        const currentHeight = barProgress * barHeight;
        const x = startX + i * (barWidth + barGap);

        return (
          <React.Fragment key={month.label}>
            {/* Bar */}
            <div
              style={{
                position: "absolute",
                left: x,
                top: chartBottom - currentHeight,
                width: barWidth,
                height: currentHeight,
                background: `linear-gradient(to bottom, ${accent}, #ea580c80)`,
                borderRadius: 8,
                opacity: 0.9,
              }}
            />

            {/* Value label */}
            <div
              style={{
                position: "absolute",
                left: x,
                top: chartBottom - currentHeight - 35,
                width: barWidth,
                textAlign: "center",
                color: slate,
                fontSize: 18,
                opacity: barProgress,
              }}
            >
              ~{month.value.toLocaleString()}
            </div>

            {/* Month label */}
            <div
              style={{
                position: "absolute",
                left: x,
                top: chartBottom + 15,
                width: barWidth,
                textAlign: "center",
                color: i === months.length - 1 ? accent : slate,
                fontSize: 18,
                fontWeight: i === months.length - 1 ? "bold" : "normal",
                opacity: barProgress,
              }}
            >
              {month.label}
            </div>
          </React.Fragment>
        );
      })}

      {/* Average line */}
      <div
        style={{
          position: "absolute",
          left: startX - 40,
          top: chartBottom - (6100 / maxValue) * chartHeight,
          width: 1920 - startX * 2 + 80,
          borderTop: `2px dashed ${accent}60`,
          opacity: spring({ frame: frame - 50, fps, config: { damping: 200 } }),
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 80,
          top: chartBottom - (6100 / maxValue) * chartHeight - 25,
          color: accent,
          fontSize: 14,
          opacity: spring({ frame: frame - 50, fps, config: { damping: 200 } }),
        }}
      >
        avg ~6,200/mo
      </div>
    </AbsoluteFill>
  );
};
