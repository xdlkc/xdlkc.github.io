import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const chipStyle: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.07)",
  color: "#E5E7EB",
  fontSize: 28,
  fontWeight: 600,
  letterSpacing: "-0.02em",
};

export const HermesDeepDiveCover = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({
    fps,
    frame,
    config: {
      damping: 18,
      stiffness: 110,
      mass: 0.9,
    },
  });

  const glow = interpolate(frame, [0, 45], [0.35, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 15% 20%, rgba(56,189,248,0.28), transparent 34%), radial-gradient(circle at 82% 18%, rgba(244,114,182,0.22), transparent 32%), linear-gradient(135deg, #0b1020 0%, #111827 55%, #1f2937 100%)",
        color: "white",
        fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          inset: 60,
          borderRadius: 36,
          border: "1px solid rgba(148,163,184,0.22)",
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.92) 100%)",
          boxShadow: `0 30px 80px rgba(0,0,0,0.32), 0 0 ${80 * glow}px rgba(56,189,248,0.12)`,
          padding: "72px 76px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            height: "100%",
          }}
        >
          <div
            style={{
              width: 1080,
              transform: `translateY(${24 * (1 - rise)}px)`,
              opacity: rise,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 20px",
                borderRadius: 999,
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(96,165,250,0.35)",
                color: "#BFDBFE",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              我翻了几天 Hermes Agent
            </div>

            <div
              style={{
                marginTop: 34,
                fontSize: 88,
                lineHeight: 1.08,
                fontWeight: 800,
                letterSpacing: "-0.045em",
              width: 1040,
            }}
          >
              我慢慢看明白了
              <br />
              一个 AI 助手想活到现实里
              <br />
              到底有多麻烦
            </div>

            <div
              style={{
                marginTop: 28,
                width: 980,
                fontSize: 34,
                lineHeight: 1.45,
                color: "#CBD5E1",
                letterSpacing: "-0.02em",
              }}
            >
              真难的不是模型再聪明一点，也不是工具再多一点。难的是它别失忆，别失手，别一换入口就像换了个人。
            </div>

            <div
              style={{
                display: "flex",
                gap: 18,
                marginTop: 42,
              }}
            >
              <div style={chipStyle}>855 个 Python 文件</div>
              <div style={chipStyle}>38.8 万行代码</div>
              <div style={chipStyle}>535 个测试文件</div>
            </div>
          </div>

          <div
            style={{
              width: 560,
              height: 560,
              borderRadius: 36,
              border: "1px solid rgba(148,163,184,0.18)",
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(2,6,23,0.92) 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 20% 20%, rgba(96,165,250,0.18), transparent 30%), radial-gradient(circle at 70% 30%, rgba(192,132,252,0.18), transparent 32%), radial-gradient(circle at 60% 80%, rgba(34,197,94,0.15), transparent 28%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 56,
                top: 64,
                width: 448,
                height: 104,
                borderRadius: 24,
                border: "1px solid rgba(96,165,250,0.24)",
                background: "rgba(30,41,59,0.72)",
                display: "flex",
                alignItems: "center",
                padding: "0 28px",
                color: "#DBEAFE",
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              AIAgent
            </div>

            <div
              style={{
                position: "absolute",
                left: 56,
                top: 214,
                width: 200,
                height: 82,
                borderRadius: 22,
                border: "1px solid rgba(251,191,36,0.22)",
                background: "rgba(120,53,15,0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FDE68A",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              Registry
            </div>

            <div
              style={{
                position: "absolute",
                right: 56,
                top: 214,
                width: 200,
                height: 82,
                borderRadius: 22,
                border: "1px solid rgba(52,211,153,0.22)",
                background: "rgba(6,78,59,0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#A7F3D0",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              Commands
            </div>

            <div
              style={{
                position: "absolute",
                left: 112,
                top: 362,
                width: 336,
                height: 94,
                borderRadius: 24,
                border: "1px solid rgba(196,181,253,0.24)",
                background: "rgba(76,29,149,0.24)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#DDD6FE",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              SessionDB
            </div>

            <svg
              width="560"
              height="560"
              viewBox="0 0 560 560"
              style={{ position: "absolute", inset: 0 }}
            >
              <path d="M280 168V214" stroke="rgba(148,163,184,0.6)" strokeWidth="5" strokeLinecap="round" />
              <path d="M256 255H204" stroke="rgba(148,163,184,0.6)" strokeWidth="5" strokeLinecap="round" />
              <path d="M304 255H356" stroke="rgba(148,163,184,0.6)" strokeWidth="5" strokeLinecap="round" />
              <path d="M280 296V362" stroke="rgba(148,163,184,0.6)" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
