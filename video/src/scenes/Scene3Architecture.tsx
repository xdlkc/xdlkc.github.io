import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

const accent = "#f97316";
const bg = "#0f172a";
const light = "#f8fafc";
const slate = "#64748b";

const ChannelRow = ({
  label,
  x,
  y,
  frame,
  fps,
  delay,
}: {
  label: string;
  x: number;
  y: number;
  frame: number;
  fps: number;
  delay: number;
}) => {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        color: slate,
        fontSize: 16,
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [-30, 0])}px)`,
      }}
    >
      {label}
    </div>
  );
};

const ArrowDown = ({
  x,
  y,
  opacity,
}: {
  x: number;
  y: number;
  opacity: number;
}) => (
  <div
    style={{
      position: "absolute",
      left: x - 12,
      top: y,
      color: accent,
      fontSize: 24,
      opacity,
    }}
  >
    ↓
  </div>
);

export const Scene3Architecture: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 200 } });

  const gatewayProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, mass: 0.5 },
  });

  const agentsProgress = spring({
    frame: frame - 25,
    fps,
    config: { damping: 200 },
  });

  const modelsProgress = spring({
    frame: frame - 40,
    fps,
    config: { damping: 200 },
  });

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
        Architecture
      </div>

      {/* Channels top row */}
      {["WhatsApp", "Telegram", "Discord", "Slack", "Signal", "微信"].map(
        (ch, i) => (
          <ChannelRow
            key={ch}
            label={ch}
            x={180 + i * 280}
            y={160}
            frame={frame}
            fps={fps}
            delay={5 + i * 2}
          />
        )
      )}

      {/* Arrow */}
      <ArrowDown x={960} y={200} opacity={gatewayProgress} />

      {/* Gateway box */}
      <div
        style={{
          position: "absolute",
          left: 360,
          top: 260,
          width: 1200,
          height: 180,
          border: `3px solid ${accent}`,
          borderRadius: 16,
          opacity: gatewayProgress,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 32, fontWeight: "bold", color: accent }}>
          Gateway
        </div>
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 16,
            fontSize: 16,
            color: slate,
          }}
        >
          {["Sessions", "Presence", "Cron", "Webhooks", "Config"].map(
            (item, i) => (
              <span
                key={item}
                style={{
                  opacity: spring({
                    frame: frame - 15 - i * 3,
                    fps,
                    config: { damping: 200 },
                  }),
                }}
              >
                {item}
              </span>
            )
          )}
        </div>
      </div>

      {/* Arrow */}
      <ArrowDown x={960} y={450} opacity={agentsProgress} />

      {/* Pi Agent */}
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 510,
          width: 800,
          height: 120,
          backgroundColor: "#1e293b",
          borderRadius: 12,
          border: "2px solid #334155",
          opacity: agentsProgress,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 60,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: "bold", color: light }}>
          Pi Agent Runtime
        </div>
        <div style={{ color: slate, fontSize: 14 }}>RPC · Tool Streaming</div>
      </div>

      {/* Arrow */}
      <ArrowDown x={960} y={640} opacity={modelsProgress} />

      {/* Model providers */}
      <div
        style={{
          position: "absolute",
          top: 690,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 20,
          opacity: modelsProgress,
        }}
      >
        {["OpenAI", "Anthropic", "Google", "DeepSeek", "Ollama"].map(
          (model, i) => {
            const mProgress = spring({
              frame: frame - 45 - i * 3,
              fps,
              config: { damping: 12, mass: 0.5 },
            });
            return (
              <div
                key={model}
                style={{
                  padding: "8px 24px",
                  borderRadius: 20,
                  backgroundColor: "#1e40af80",
                  color: "#93c5fd",
                  fontSize: 16,
                  opacity: mProgress,
                  transform: `scale(${mProgress})`,
                }}
              >
                {model}
              </div>
            );
          }
        )}
      </div>

      {/* Side labels */}
      {[
        { label: "CLI", x: 120, y: 320, delay: 30 },
        { label: "WebChat", x: 120, y: 370, delay: 33 },
        { label: "macOS App", x: 120, y: 420, delay: 36 },
        { label: "iOS/Android", x: 120, y: 470, delay: 39 },
      ].map((item) => (
        <div
          key={item.label}
          style={{
            position: "absolute",
            left: item.x,
            top: item.y,
            color: slate,
            fontSize: 14,
            opacity: spring({
              frame: frame - item.delay,
              fps,
              config: { damping: 200 },
            }),
          }}
        >
          → {item.label}
        </div>
      ))}
    </AbsoluteFill>
  );
};
