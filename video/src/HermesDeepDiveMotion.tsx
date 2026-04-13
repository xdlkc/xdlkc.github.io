import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const uiFont =
  '"Avenir Next", "Helvetica Neue", "Segoe UI", sans-serif';
const displayFont =
  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

const frameColor = "rgba(255,255,255,0.08)";

const MetricCard = ({
  frame,
  fps,
  from,
  label,
  value,
  accent,
  x,
  y,
}: {
  frame: number;
  fps: number;
  from: number;
  label: string;
  value: string;
  accent: string;
  x: number;
  y: number;
}) => {
  const enter = spring({
    fps,
    frame: Math.max(0, frame - from),
    config: { damping: 14, stiffness: 150 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 280,
        height: 140,
        borderRadius: 28,
        border: `1px solid ${accent}66`,
        background: "rgba(10,16,28,0.82)",
        boxShadow: `0 18px 40px rgba(0,0,0,0.26), 0 0 60px ${accent}16`,
        padding: "22px 24px",
        transform: `translateY(${(1 - enter) * 90}px) scale(${0.9 + enter * 0.1})`,
        opacity: enter,
      }}
    >
      <div
        style={{
          color: accent,
          fontSize: 18,
          fontFamily: uiFont,
          fontWeight: 800,
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 18,
          color: "#F8FAFC",
          fontSize: 58,
          lineHeight: 1,
          fontFamily: uiFont,
          fontWeight: 800,
          letterSpacing: "-0.05em",
        }}
      >
        {value}
      </div>
    </div>
  );
};

const SignalDot = ({
  frame,
  delay,
  x,
  y,
  color,
}: {
  frame: number;
  delay: number;
  x: number;
  y: number;
  color: string;
}) => {
  const opacity = interpolate((frame - delay + 90) % 90, [0, 30, 60], [0.15, 1, 0.15]);
  const scale = interpolate((frame - delay + 90) % 90, [0, 30, 60], [0.8, 1.2, 0.8]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 16,
        height: 16,
        borderRadius: 999,
        background: color,
        boxShadow: `0 0 30px ${color}`,
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
};

export const HermesDeepDiveMotion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scene1Out = interpolate(frame, [0, 90, 112], [1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const scene2In = interpolate(frame, [92, 116], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scene2Out = interpolate(frame, [122, 190, 214], [1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const scene3In = interpolate(frame, [194, 218], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scene3Out = interpolate(frame, [224, 280, 304], [1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const finalIn = spring({
    fps,
    frame: Math.max(0, frame - 286),
    config: { damping: 15, stiffness: 110 },
  });
  const titleRise = spring({
    fps,
    frame: Math.max(0, frame - 296),
    config: { damping: 18, stiffness: 95 },
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 14% 12%, rgba(87,83,255,0.16), transparent 30%), radial-gradient(circle at 82% 16%, rgba(244,63,94,0.18), transparent 28%), linear-gradient(135deg, #070b14 0%, #0b1020 55%, #111827 100%)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 24,
          borderRadius: 34,
          border: `1px solid ${frameColor}`,
          background:
            "linear-gradient(180deg, rgba(9,13,23,0.86) 0%, rgba(8,11,18,0.92) 100%)",
          overflow: "hidden",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 120px), repeating-linear-gradient(180deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 96px)",
          opacity: 0.45,
        }}
      />

      <Sequence from={0} durationInFrames={112}>
        <AbsoluteFill
          style={{
            opacity: scene1Out,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 84,
              top: 86,
              color: "#9FB4FF",
              fontSize: 22,
              fontFamily: uiFont,
              fontWeight: 800,
              letterSpacing: "0.14em",
            }}
          >
            HERMES AGENT / SOURCE DIVE
          </div>

          <div
            style={{
              position: "absolute",
              left: 84,
              top: 170,
              color: "#F8FAFC",
              fontSize: 108,
              lineHeight: 0.94,
              fontFamily: displayFont,
              fontWeight: 700,
              letterSpacing: "-0.06em",
              width: 1240,
            }}
          >
            我本来以为
            <br />
            这又是一个
            <br />
            agent demo
          </div>

          <div
            style={{
              position: "absolute",
              left: 88,
              top: 560,
              color: "#D6DCEB",
              fontSize: 32,
              lineHeight: 1.35,
              fontFamily: uiFont,
              width: 920,
              letterSpacing: "-0.03em",
            }}
          >
            结果我越翻越不对劲。
            <br />
            这东西，明显不是只想演示一轮对话。
          </div>

          <div
            style={{
              position: "absolute",
              right: 92,
              top: 126,
              width: 480,
              height: 560,
              borderRadius: 30,
              border: "1px solid rgba(126,211,255,0.16)",
              background: "rgba(8,14,24,0.72)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.34)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 22,
                top: 18,
                color: "#7DD3FC",
                fontSize: 18,
                fontFamily: uiFont,
                letterSpacing: "0.14em",
                fontWeight: 800,
              }}
            >
              TERMINAL FEELING
            </div>
            {[
              "source venv/bin/activate",
              "python -m pytest tests/ -q",
              "run_agent.py    10800 lines",
              "cli.py          10060 lines",
              "tools/mcp_tool.py 2195 lines",
              "tests/          535 files",
              "state.db + FTS5 + WAL",
            ].map((line, index) => (
              <div
                key={line}
                style={{
                  position: "absolute",
                  left: 28,
                  top: 78 + index * 62,
                  color: index < 2 ? "#86EFAC" : "#E5E7EB",
              opacity: interpolate(frame - 10 - index * 14, [0, 28], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  fontSize: 28,
                  fontFamily: '"SFMono-Regular", Menlo, monospace',
                  letterSpacing: "-0.02em",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={100} durationInFrames={120}>
        <AbsoluteFill
          style={{
            opacity: scene2In * scene2Out,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 88,
              top: 90,
              color: "#FCA5A5",
              fontSize: 22,
              fontFamily: uiFont,
              fontWeight: 800,
              letterSpacing: "0.14em",
            }}
          >
            然后我看到了这些数字
          </div>

          <MetricCard frame={frame} fps={fps} from={118} label="PYTHON FILES" value="855" accent="#60A5FA" x={88} y={176} />
          <MetricCard frame={frame} fps={fps} from={132} label="CODE LINES" value="38.8万" accent="#F59E0B" x={400} y={176} />
          <MetricCard frame={frame} fps={fps} from={146} label="TEST FILES" value="535" accent="#34D399" x={712} y={176} />
          <MetricCard frame={frame} fps={fps} from={160} label="CORE FILE" value="10800" accent="#A78BFA" x={1024} y={176} />

          <div
            style={{
              position: "absolute",
              left: 90,
              top: 392,
              color: "#F8FAFC",
              fontSize: 116,
              lineHeight: 0.94,
              fontFamily: displayFont,
              fontWeight: 700,
              letterSpacing: "-0.06em",
              opacity: interpolate(frame, [152, 184], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            这不是那种
            <br />
            周末搓出来的玩具
          </div>

          <div
            style={{
              position: "absolute",
              left: 96,
              top: 648,
              color: "#CBD5E1",
              fontSize: 34,
              lineHeight: 1.35,
              fontFamily: uiFont,
              width: 1160,
              letterSpacing: "-0.03em",
            }}
          >
            它更像一个已经被现实世界狠狠干过很多次，
            <br />
            然后还在继续长的系统。
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={206} durationInFrames={110}>
        <AbsoluteFill
          style={{
            opacity: scene3In * scene3Out,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 88,
              top: 94,
              color: "#F8FAFC",
              fontSize: 138,
              lineHeight: 0.92,
              fontFamily: displayFont,
              fontWeight: 700,
              letterSpacing: "-0.07em",
              width: 1260,
            }}
          >
            真难的不是
            <br />
            模型再聪明一点
          </div>
          <div
            style={{
              position: "absolute",
              left: 92,
              top: 420,
              color: "#C4B5FD",
              fontSize: 84,
              lineHeight: 1,
              fontFamily: uiFont,
              fontWeight: 800,
              letterSpacing: "-0.05em",
            }}
          >
            难的是它别失忆
          </div>
          <div
            style={{
              position: "absolute",
              left: 92,
              top: 514,
              color: "#F9A8D4",
              fontSize: 84,
              lineHeight: 1,
              fontFamily: uiFont,
              fontWeight: 800,
              letterSpacing: "-0.05em",
            }}
          >
            别失手
          </div>
          <div
            style={{
              position: "absolute",
              left: 92,
              top: 608,
              color: "#7DD3FC",
              fontSize: 84,
              lineHeight: 1,
              fontFamily: uiFont,
              fontWeight: 800,
              letterSpacing: "-0.05em",
            }}
          >
            别一换入口就像换了个人
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={294} durationInFrames={126}>
        <AbsoluteFill
          style={{
            opacity: finalIn,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 84,
              top: 84,
              color: "#A7F3D0",
              fontSize: 22,
              fontFamily: uiFont,
              fontWeight: 800,
              letterSpacing: "0.14em",
            }}
          >
            所以这篇文章想讲的是
          </div>

          <div
            style={{
              position: "absolute",
              left: 84,
              top: 156,
              width: 780,
              transform: `translateY(${(1 - titleRise) * 26}px)`,
              opacity: titleRise,
            }}
          >
            <div
              style={{
                color: "#F8FAFC",
                fontSize: 92,
                lineHeight: 0.98,
                fontFamily: displayFont,
                fontWeight: 700,
                letterSpacing: "-0.06em",
              }}
            >
              一个 AI 助手
              <br />
              到底怎么
              <br />
              从 demo 变成活系统
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              right: 84,
              top: 114,
              width: 600,
              height: 560,
              borderRadius: 34,
              border: `1px solid ${frameColor}`,
              background:
                "linear-gradient(180deg, rgba(12,18,31,0.94) 0%, rgba(7,10,18,0.96) 100%)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 34,
                top: 30,
                color: "#93C5FD",
                fontSize: 20,
                fontFamily: uiFont,
                fontWeight: 800,
                letterSpacing: "0.12em",
              }}
            >
              四个咬在一起的东西
            </div>

            {[
              { label: "AIAgent", x: 72, y: 114, w: 210, color: "#60A5FA" },
              { label: "Registry", x: 322, y: 114, w: 210, color: "#F59E0B" },
              { label: "Commands", x: 72, y: 272, w: 210, color: "#34D399" },
              { label: "SessionDB", x: 322, y: 272, w: 210, color: "#A78BFA" },
            ].map((node, index) => (
              <div
                key={node.label}
                style={{
                  position: "absolute",
                  left: node.x,
                  top: node.y,
                  width: node.w,
                  height: 96,
                  borderRadius: 26,
                  border: `1px solid ${node.color}66`,
                  background: "rgba(17,24,39,0.78)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#F8FAFC",
                  fontSize: 34,
                  fontFamily: uiFont,
                  fontWeight: 800,
                  boxShadow: `0 0 42px ${node.color}1A`,
                  transform: `translateY(${Math.sin((frame + index * 11) / 14) * 4}px)`,
                }}
              >
                {node.label}
              </div>
            ))}

            <svg
              width="600"
              height="560"
              viewBox="0 0 600 560"
              style={{ position: "absolute", inset: 0 }}
            >
              <path d="M282 162H322" stroke="rgba(148,163,184,0.75)" strokeWidth="5" strokeLinecap="round" />
              <path d="M177 210V272" stroke="rgba(148,163,184,0.75)" strokeWidth="5" strokeLinecap="round" />
              <path d="M427 210V272" stroke="rgba(148,163,184,0.75)" strokeWidth="5" strokeLinecap="round" />
              <path d="M282 320H322" stroke="rgba(148,163,184,0.75)" strokeWidth="5" strokeLinecap="round" />
            </svg>

            <SignalDot frame={frame} delay={0} x={170} y={205} color="#60A5FA" />
            <SignalDot frame={frame} delay={18} x={420} y={205} color="#F59E0B" />
            <SignalDot frame={frame} delay={36} x={170} y={364} color="#34D399" />
            <SignalDot frame={frame} delay={54} x={420} y={364} color="#A78BFA" />

            <div
              style={{
                position: "absolute",
                left: 34,
                right: 34,
                bottom: 34,
                padding: "18px 20px",
                borderRadius: 22,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${frameColor}`,
                color: "#E5E7EB",
                fontSize: 19,
                lineHeight: 1.4,
                fontFamily: uiFont,
              }}
            >
              一轮对话跑完不稀奇。稀奇的是下一轮还能续上，而且别露馅。
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
