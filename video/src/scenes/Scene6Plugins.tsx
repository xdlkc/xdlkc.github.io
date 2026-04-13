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

const categories = [
  {
    title: "Model Providers ×20+",
    color: "#3b82f6",
    items: [
      "OpenAI",
      "Anthropic",
      "Google",
      "DeepSeek",
      "Mistral",
      "Groq",
      "Ollama",
      "NVIDIA",
      "xAI",
      "Bedrock",
    ],
  },
  {
    title: "Channels ×22",
    color: "#10b981",
    items: [
      "Telegram",
      "Discord",
      "Slack",
      "Signal",
      "WhatsApp",
      "微信",
      "Matrix",
      "Teams",
    ],
  },
  {
    title: "Search ×6",
    color: "#06b6d4",
    items: ["Brave", "Tavily", "Exa", "DuckDuckGo", "Perplexity", "SearXNG"],
  },
  {
    title: "Capabilities",
    color: "#a855f7",
    items: ["Browser", "Memory", "Voice", "Canvas", "Image Gen", "Video"],
  },
];

export const Scene6Plugins: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const centerX = 960;
  const centerY = 540;

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
          top: 40,
          width: "100%",
          textAlign: "center",
          fontSize: 48,
          fontWeight: "bold",
          color: light,
          opacity: spring({ frame, fps, config: { damping: 200 } }),
        }}
      />

      {/* Center number */}
      <div
        style={{
          position: "absolute",
          left: centerX - 80,
          top: centerY - 60,
          width: 160,
          height: 120,
          borderRadius: "50%",
          border: `3px solid ${accent}`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          opacity: spring({ frame, fps, config: { damping: 200 } }),
        }}
      >
        <div style={{ fontSize: 48, fontWeight: "bold", color: accent }}>
          105
        </div>
        <div style={{ fontSize: 14, color: slate }}>Plugins</div>
      </div>

      {/* Category groups */}
      {categories.map((cat, catIdx) => {
        const catAngle = (catIdx / categories.length) * 2 * Math.PI - Math.PI / 2;
        const catX = centerX + Math.cos(catAngle) * 400;
        const catY = centerY + Math.sin(catAngle) * 300;

        const catProgress = spring({
          frame: frame - 5 - catIdx * 8,
          fps,
          config: { damping: 200 },
        });

        return (
          <div
            key={cat.title}
            style={{
              position: "absolute",
              left: catX - 150,
              top: catY - 80,
              width: 300,
              opacity: catProgress,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: cat.color,
                marginBottom: 8,
              }}
            >
              {cat.title}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cat.items.map((item, itemIdx) => {
                const itemProgress = spring({
                  frame: frame - 10 - catIdx * 8 - itemIdx * 2,
                  fps,
                  config: { damping: 12, mass: 0.5 },
                });
                return (
                  <div
                    key={item}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 12,
                      backgroundColor: cat.color + "30",
                      border: `1px solid ${cat.color}50`,
                      color: cat.color,
                      fontSize: 12,
                      opacity: itemProgress,
                      transform: `scale(${itemProgress})`,
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
