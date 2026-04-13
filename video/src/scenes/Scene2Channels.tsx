import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const channels = [
  { name: "WhatsApp", color: "#25D366" },
  { name: "Telegram", color: "#0088cc" },
  { name: "Slack", color: "#4A154B" },
  { name: "Discord", color: "#5865F2" },
  { name: "微信", color: "#07C160" },
  { name: "飞书", color: "#3370FF" },
  { name: "Signal", color: "#3A76F0" },
  { name: "iMessage", color: "#34AADC" },
  { name: "IRC", color: "#f97316" },
  { name: "Matrix", color: "#0DBD8B" },
  { name: "Teams", color: "#6264A7" },
  { name: "LINE", color: "#00B900" },
];

const accent = "#f97316";
const bg = "#0f172a";

export const Scene2Channels: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 200 } });

  const centerX = 960;
  const centerY = 540;
  const radius = 320;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "monospace",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          fontSize: 48,
          fontWeight: "bold",
          color: "#f8fafc",
          opacity: titleProgress,
        }}
      >
        22个聊天渠道，一个AI助手
      </div>

      {/* Central gateway hub */}
      <div
        style={{
          position: "absolute",
          left: centerX - 60,
          top: centerY - 60,
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: `3px solid ${accent}`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          opacity: titleProgress,
        }}
      >
        <div style={{ color: accent, fontSize: 18, fontWeight: "bold" }}>
          GATEWAY
        </div>
        <div style={{ color: "#64748b", fontSize: 10 }}>Control Plane</div>
      </div>

      {/* Channel nodes arranged in a circle */}
      {channels.map((channel, i) => {
        const angle = (i / channels.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        const delay = i * 3;
        const nodeProgress = spring({
          frame: frame - 15 - delay,
          fps,
          config: { damping: 200 },
        });

        const scale = spring({
          frame: frame - 15 - delay,
          fps,
          config: { damping: 12, mass: 0.5 },
        });

        // Connection line
        const lineOpacity = interpolate(nodeProgress, [0, 1], [0, 0.3]);

        return (
          <React.Fragment key={channel.name}>
            {/* Connection line */}
            <div
              style={{
                position: "absolute",
                left: Math.min(x, centerX) - 1,
                top: Math.min(y, centerY) - 1,
                width: Math.abs(x - centerX) + 2,
                height: Math.abs(y - centerY) + 2,
                opacity: lineOpacity,
              }}
            >
              <svg
                width="100%"
                height="100%"
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                <line
                  x1={x < centerX ? "100%" : "0"}
                  y1={y < centerY ? "100%" : "0"}
                  x2={x < centerX ? "0" : "100%"}
                  y2={y < centerY ? "0" : "100%"}
                  stroke={accent}
                  strokeWidth={1}
                />
              </svg>
            </div>

            {/* Channel node */}
            <div
              style={{
                position: "absolute",
                left: x - 48,
                top: y - 24,
                width: 96,
                height: 48,
                borderRadius: 24,
                backgroundColor: channel.color,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                fontSize: 14,
                fontWeight: "bold",
                opacity: nodeProgress,
                transform: `scale(${scale})`,
              }}
            >
              {channel.name}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
