import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  spring,
} from "remotion";

const accent = "#f97316";
const slate = "#64748b";
const light = "#f8fafc";
const bg = "#0f172a";

export const Scene1Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 200 } });
  const subtitleProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200 },
  });
  const numberProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 100, mass: 0.5 },
  });
  const numberValue = interpolate(numberProgress, [0, 1], [0, 30000]);

  const taglineOpacity = interpolate(frame, [45, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lobsterScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "monospace",
      }}
    >
      {/* Lobster emoji */}
      <div
        style={{
          fontSize: 80,
          opacity: titleProgress,
          transform: `scale(${lobsterScale})`,
          marginBottom: 20,
        }}
      >
        🦞
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 72,
          fontWeight: "bold",
          color: accent,
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [30, 0])}px)`,
          letterSpacing: -2,
        }}
      >
        OpenClaw
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 28,
          color: slate,
          opacity: subtitleProgress,
          transform: `translateY(${interpolate(subtitleProgress, [0, 1], [20, 0])}px)`,
          marginTop: 12,
        }}
      >
        Personal AI Assistant · Open Source · MIT License
      </div>

      {/* Big number */}
      <div
        style={{
          fontSize: 120,
          fontWeight: "bold",
          color: light,
          opacity: numberProgress,
          marginTop: 40,
          letterSpacing: -4,
        }}
      >
        {Math.round(numberValue).toLocaleString()}
      </div>
      <div
        style={{
          fontSize: 24,
          color: slate,
          opacity: numberProgress,
          marginTop: -8,
        }}
      >
        commits in 5 months
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 20,
          color: accent,
          opacity: taglineOpacity,
          marginTop: 40,
          border: `1px solid ${accent}40`,
          padding: "8px 24px",
          borderRadius: 20,
        }}
      >
        EXFOLIATE! EXFOLIATE!
      </div>
    </AbsoluteFill>
  );
};
