import React from "react";
import {
	AbsoluteFill,
	Easing,
	interpolate,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

const clampProgress = (frame: number, start: number, duration: number) => {
	return interpolate(frame, [start, start + duration], [0, 1], {
		easing: easeOut,
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
};

const typewriter = (text: string, frame: number, start: number, charsPerFrame: number) => {
	const visible = Math.max(0, Math.floor((frame - start) * charsPerFrame));
	return text.slice(0, visible);
};

const bgStyle: React.CSSProperties = {
	background:
		"radial-gradient(circle at 15% 18%, rgba(249,115,22,0.16), transparent 24%), radial-gradient(circle at 84% 20%, rgba(37,99,235,0.12), transparent 28%), linear-gradient(135deg, #fff9f1 0%, #f8fafc 52%, #eef6ff 100%)",
	color: "#0f172a",
	fontFamily:
		'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const panelStyle: React.CSSProperties = {
	background: "rgba(255,255,255,0.82)",
	border: "1px solid rgba(148,163,184,0.28)",
	borderRadius: 28,
	boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
	backdropFilter: "blur(18px)",
};

const TitleBlock: React.FC<{
	kicker: string;
	title: string;
	subtitle: string;
	accent: string;
}> = ({kicker, title, subtitle, accent}) => {
	const frame = useCurrentFrame();
	const titleIn = clampProgress(frame, -6, 22);
	const subtitleIn = clampProgress(frame, -1, 24);

	return (
		<div style={{display: "flex", flexDirection: "column", gap: 18}}>
			<div
				style={{
					fontSize: 24,
					letterSpacing: 4,
					fontWeight: 700,
					color: accent,
					opacity: titleIn,
					transform: `translateY(${interpolate(titleIn, [0, 1], [18, 0])}px)`,
				}}
			>
				{kicker}
			</div>
			<div
				style={{
					fontSize: 64,
					fontWeight: 800,
					lineHeight: 1.05,
					opacity: titleIn,
					transform: `translateY(${interpolate(titleIn, [0, 1], [28, 0])}px)`,
				}}
			>
				{title}
			</div>
			<div
				style={{
					fontSize: 28,
					lineHeight: 1.45,
					color: "#334155",
					maxWidth: 860,
					opacity: subtitleIn,
					transform: `translateY(${interpolate(subtitleIn, [0, 1], [20, 0])}px)`,
				}}
			>
				{subtitle}
			</div>
		</div>
	);
};

const Card: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	title: string;
	lines: string[];
	bg: string;
	border: string;
	ink: string;
	start: number;
	delay?: number;
}> = ({x, y, w, h, title, lines, bg, border, ink, start, delay = 0}) => {
	const frame = useCurrentFrame();
	const enter = clampProgress(frame, start + delay, 18);
	return (
		<div
			style={{
				position: "absolute",
				left: x,
				top: y,
				width: w,
				height: h,
				borderRadius: 26,
				background: bg,
				border: `2px solid ${border}`,
				padding: "20px 22px",
				boxSizing: "border-box",
				opacity: enter,
				transform: `translateY(${interpolate(enter, [0, 1], [26, 0])}px) scale(${interpolate(enter, [0, 1], [0.96, 1])})`,
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div style={{fontSize: 20, fontWeight: 800, color: ink, marginBottom: 12, lineHeight: 1.15}}>
				{title}
			</div>
			{lines.map((line) => (
				<div
					key={line}
					style={{
						fontSize: 16,
						lineHeight: 1.3,
						color: ink,
						opacity: 0.88,
						marginBottom: 7,
						wordBreak: "break-word",
					}}
				>
					{line}
				</div>
			))}
		</div>
	);
};

const Arrow: React.FC<{
	x: number;
	y: number;
	width: number;
	color: string;
	start: number;
}> = ({x, y, width, color, start}) => {
	const frame = useCurrentFrame();
	const draw = clampProgress(frame, start, 14);
	return (
		<div
			style={{
				position: "absolute",
				left: x,
				top: y,
				width,
				height: 16,
				opacity: draw,
			}}
		>
			<div
				style={{
					position: "absolute",
					left: 0,
					top: 6,
					width: interpolate(draw, [0, 1], [0, width - 18]),
					height: 4,
					borderRadius: 999,
					background: color,
				}}
			/>
			<div
				style={{
					position: "absolute",
					right: 0,
					top: 0,
					width: 0,
					height: 0,
					borderTop: "8px solid transparent",
					borderBottom: "8px solid transparent",
					borderLeft: `18px solid ${color}`,
					transform: `scale(${draw})`,
					transformOrigin: "left center",
				}}
			/>
		</div>
	);
};

const SceneFrame: React.FC<{children: React.ReactNode}> = ({children}) => (
	<div
		style={{
			...panelStyle,
			position: "absolute",
			left: 72,
			top: 72,
			right: 72,
			bottom: 72,
			padding: 54,
			overflow: "hidden",
		}}
	>
		{children}
	</div>
);

const RagScene: React.FC = () => {
	const frame = useCurrentFrame();
	const question = typewriter("每次提问时，临时从原始材料里拼装答案", frame, 8, 0.9);

	return (
		<SceneFrame>
			<TitleBlock
				kicker="SCENE 01"
				title="传统 RAG"
				subtitle="速度快，但每次复杂提问都像临时搭脚手架。知识回答完就散，不会自然沉淀。"
				accent="#c2410c"
			/>
			<div style={{position: "absolute", inset: "300px 54px 54px 54px"}}>
				<Card
					x={0}
					y={54}
					w={236}
					h={160}
					title="raw docs"
					lines={["论文、文章、会议纪要", "原始事实仍然分散"] }
					bg="#fff7ed"
					border="#fdba74"
					ink="#7c2d12"
					start={12}
				/>
				<Arrow x={260} y={126} width={92} color="#f97316" start={24} />
				<Card
					x={364}
					y={54}
					w={252}
					h={160}
					title="retrieve chunks"
					lines={["按 query 找相关碎片", "在上下文里临时拼接"] }
					bg="#fff7ed"
					border="#fdba74"
					ink="#7c2d12"
					start={30}
				/>
				<Arrow x={644} y={126} width={92} color="#f97316" start={42} />
				<Card
					x={748}
					y={54}
					w={244}
					h={160}
					title="answer now"
					lines={["这次回答看起来成立", "但知识不会累计"] }
					bg="#fff7ed"
					border="#fdba74"
					ink="#7c2d12"
					start={48}
				/>

				<div
					style={{
						position: "absolute",
						left: 160,
						top: 258,
						right: 160,
						height: 120,
						borderRadius: 28,
						background: "rgba(255,255,255,0.9)",
						border: "1px solid rgba(148,163,184,0.22)",
						padding: "26px 34px",
						boxSizing: "border-box",
						opacity: clampProgress(frame, 62, 16),
						transform: `translateY(${interpolate(clampProgress(frame, 62, 16), [0, 1], [18, 0])}px)`,
					}}
				>
					<div style={{fontSize: 18, color: "#64748b", marginBottom: 12}}>QUESTION</div>
					<div style={{fontSize: 28, fontWeight: 700, color: "#0f172a"}}>{question}</div>
				</div>
			</div>
		</SceneFrame>
	);
};

const WikiScene: React.FC = () => {
	const frame = useCurrentFrame();
	const glow = interpolate(frame, [60, 110], [0.5, 1], {
		easing: easeInOut,
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<SceneFrame>
			<TitleBlock
				kicker="SCENE 02"
				title="LLM Wiki"
				subtitle="关键不是“多一个笔记工具”，而是在原始材料和最终问答之间加入可维护的知识编译层。"
				accent="#1d4ed8"
			/>
			<div style={{position: "absolute", inset: "306px 54px 54px 54px"}}>
				<Card
					x={10}
					y={84}
					w={220}
					h={146}
					title="raw/"
					lines={["原始文档不可变", "始终保留事实底稿"] }
					bg="#eff6ff"
					border="#93c5fd"
					ink="#1e3a8a"
					start={12}
				/>
				<Arrow x={248} y={150} width={84} color="#2563eb" start={24} />
				<div
					style={{
						position: "absolute",
						left: 344,
						top: 34,
						width: 328,
						height: 246,
						borderRadius: 30,
						background: "#f8fafc",
						border: "2px solid #94a3b8",
						boxSizing: "border-box",
						padding: 28,
						opacity: clampProgress(frame, 28, 16),
						transform: `scale(${interpolate(clampProgress(frame, 28, 16), [0, 1], [0.95, 1])})`,
						boxShadow: `0 0 ${38 * glow}px rgba(37,99,235,0.16)`,
					}}
				>
					<div style={{fontSize: 29, fontWeight: 800, marginBottom: 16}}>wiki layer</div>
					{["实体页", "概念页", "对比页", "综合页", "冲突标记", "引用与更新"].map((item, index) => (
						<div
							key={item}
							style={{
								display: "inline-flex",
								padding: "8px 14px",
								borderRadius: 999,
								background: index % 2 === 0 ? "#e2e8f0" : "#dbeafe",
								color: "#0f172a",
								fontSize: 18,
								fontWeight: 700,
								marginRight: 10,
								marginBottom: 12,
								opacity: clampProgress(frame, 40 + index * 3, 10),
								transform: `translateY(${interpolate(clampProgress(frame, 40 + index * 3, 10), [0, 1], [10, 0])}px)`,
							}}
						>
							{item}
						</div>
					))}
				</div>
				<Arrow x={704} y={150} width={84} color="#2563eb" start={52} />
				<Card
					x={800}
					y={84}
					w={220}
					h={146}
					title="query"
					lines={["对整理后的知识提问", "答案继续回写 wiki"] }
					bg="#eff6ff"
					border="#93c5fd"
					ink="#1e3a8a"
					start={58}
				/>
			</div>
		</SceneFrame>
	);
};

const OrbitCard: React.FC<{
	label: string;
	description: string;
	x: number;
	y: number;
	start: number;
	color: string;
}> = ({label, description, x, y, start, color}) => {
	const frame = useCurrentFrame();
	const enter = clampProgress(frame, start, 14);
	return (
		<div
			style={{
				position: "absolute",
				left: x,
				top: y,
				width: 250,
				height: 120,
				background: "rgba(255,255,255,0.92)",
				border: `2px solid ${color}`,
				borderRadius: 24,
				boxSizing: "border-box",
				padding: "16px 18px",
				opacity: enter,
				transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div style={{fontSize: 20, fontWeight: 800, color, lineHeight: 1.15}}>{label}</div>
			<div
				style={{
					fontSize: 15,
					color: "#334155",
					marginTop: 8,
					lineHeight: 1.3,
					wordBreak: "break-word",
				}}
			>
				{description}
			</div>
		</div>
	);
};

const LoopScene: React.FC = () => {
	const frame = useCurrentFrame();
	const ring = clampProgress(frame, 18, 24);
	const pulse = interpolate(frame, [54, 96], [0.94, 1.02], {
		easing: easeInOut,
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<SceneFrame>
			<TitleBlock
				kicker="SCENE 03"
				title="知识复利"
				subtitle="一旦输出能回写成结构化资产，知识库就不再只是仓库，而是会被持续编译和纠错的系统。"
				accent="#15803d"
			/>
			<div style={{position: "absolute", inset: "310px 54px 54px 54px"}}>
				<div
					style={{
						position: "absolute",
						left: 415,
						top: 20,
						width: 320,
						height: 320,
						borderRadius: 9999,
						border: "2px solid rgba(148,163,184,0.4)",
						background: "radial-gradient(circle, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 72%)",
						transform: `scale(${interpolate(ring, [0, 1], [0.9, pulse])})`,
						opacity: ring,
					}}
				>
					<div
						style={{
							position: "absolute",
							inset: 0,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: 12,
							textAlign: "center",
						}}
					>
						<div style={{fontSize: 42, fontWeight: 800}}>Wiki</div>
						<div style={{fontSize: 22, color: "#475569", lineHeight: 1.4}}>
							持续演化的
							<br />
							知识中间层
						</div>
					</div>
				</div>

				<OrbitCard label="摄入" description="新论文、新文章、新讨论加入" x={442} y={-14} start={28} color="#c2410c" />
				<OrbitCard label="综合" description="实体页、主题页、冲突页更新" x={742} y={122} start={40} color="#1d4ed8" />
				<OrbitCard label="输出" description="问答、报告、洞见继续回写" x={438} y={312} start={52} color="#15803d" />
				<OrbitCard label="Lint" description="发现空洞、冲突、过时结论" x={28} y={126} start={64} color="#b91c1c" />
			</div>
		</SceneFrame>
	);
};

const RiskScene: React.FC = () => {
	return (
		<SceneFrame>
			<TitleBlock
				kicker="SCENE 04"
				title="风险与治理"
				subtitle="LLM Wiki 越强，越不能把它当作自动趋于正确的系统。真正难的是可审计性、证据分级与团队治理。"
				accent="#b91c1c"
			/>
			<div style={{position: "absolute", inset: "304px 54px 54px 54px"}}>
				<Card
					x={24}
					y={0}
					w={320}
					h={120}
					title="错误被编译进去"
					lines={["聊天错误会消失", "Wiki 错误会变成长期资产"] }
					bg="#fef2f2"
					border="#fca5a5"
					ink="#991b1b"
					start={12}
				/>
				<Card
					x={648}
					y={0}
					w={320}
					h={120}
					title="过度确定性"
					lines={["模型会把冲突证据", "写成表面连贯的单一结论"] }
					bg="#fff7ed"
					border="#fdba74"
					ink="#9a3412"
					start={24}
				/>
				<Card
					x={334}
					y={138}
					w={324}
					h={120}
					title="可维护不等于可审计"
					lines={["没有引用、更新时间、证据等级", "透明也会退化成二手改写"] }
					bg="#eff6ff"
					border="#93c5fd"
					ink="#1e3a8a"
					start={36}
				/>
			</div>
		</SceneFrame>
	);
};

const ProgressBar: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const width = interpolate(frame, [0, durationInFrames], [0, 100], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				position: "absolute",
				left: 0,
				bottom: 0,
				height: 8,
				width: `${width}%`,
				background: "linear-gradient(90deg, #f97316 0%, #2563eb 50%, #16a34a 100%)",
			}}
		/>
	);
};

export const LlmWikiExplainer: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const driftA = interpolate(frame, [0, 450], [0, 28], {
		easing: easeInOut,
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const driftB = interpolate(frame, [0, 450], [0, -22], {
		easing: easeInOut,
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={bgStyle}>
			<div
				style={{
					position: "absolute",
					left: -60 + driftA,
					top: 34,
					width: 320,
					height: 320,
					borderRadius: 9999,
					background: "rgba(249,115,22,0.10)",
					filter: "blur(4px)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					right: -40 + driftB,
					bottom: 80,
					width: 360,
					height: 360,
					borderRadius: 9999,
					background: "rgba(37,99,235,0.08)",
					filter: "blur(4px)",
				}}
			/>

			<Sequence durationInFrames={150}>
				<RagScene />
			</Sequence>
			<Sequence from={150} durationInFrames={150}>
				<WikiScene />
			</Sequence>
			<Sequence from={300} durationInFrames={150}>
				<LoopScene />
			</Sequence>

			<div
				style={{
					position: "absolute",
					right: 38,
					top: 26,
					fontSize: 18,
					letterSpacing: 2,
					color: "#475569",
				}}
			>
				{width}×{height} · 30 FPS
			</div>

			<ProgressBar />
		</AbsoluteFill>
	);
};

const BackgroundShell: React.FC<{
	children: React.ReactNode;
	durationInFrames: number;
	showMeta?: boolean;
	showProgress?: boolean;
}> = ({children, durationInFrames, showMeta = true, showProgress = true}) => {
	const frame = useCurrentFrame();
	const driftA = interpolate(frame, [0, durationInFrames], [0, 28], {
		easing: easeInOut,
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const driftB = interpolate(frame, [0, durationInFrames], [0, -22], {
		easing: easeInOut,
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const {width, height} = useVideoConfig();

	return (
		<AbsoluteFill style={bgStyle}>
			<div
				style={{
					position: "absolute",
					left: -60 + driftA,
					top: 34,
					width: 320,
					height: 320,
					borderRadius: 9999,
					background: "rgba(249,115,22,0.10)",
					filter: "blur(4px)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					right: -40 + driftB,
					bottom: 80,
					width: 360,
					height: 360,
					borderRadius: 9999,
					background: "rgba(37,99,235,0.08)",
					filter: "blur(4px)",
				}}
			/>
			{children}
			{showMeta ? (
				<div
					style={{
						position: "absolute",
						right: 38,
						top: 26,
						fontSize: 18,
						letterSpacing: 2,
						color: "#475569",
					}}
				>
					{width}×{height} · 30 FPS
				</div>
			) : null}
			{showProgress ? <ProgressBar /> : null}
		</AbsoluteFill>
	);
};

export const RagVsWikiAnimation: React.FC = () => {
	const {durationInFrames} = useVideoConfig();
	return (
		<BackgroundShell durationInFrames={durationInFrames} showMeta={false} showProgress={false}>
			<RagScene />
		</BackgroundShell>
	);
};

export const CompilationLayerAnimation: React.FC = () => {
	const {durationInFrames} = useVideoConfig();
	return (
		<BackgroundShell durationInFrames={durationInFrames} showMeta={false} showProgress={false}>
			<WikiScene />
		</BackgroundShell>
	);
};

export const KnowledgeCompoundingAnimation: React.FC = () => {
	const {durationInFrames} = useVideoConfig();
	return (
		<BackgroundShell durationInFrames={durationInFrames} showMeta={false} showProgress={false}>
			<LoopScene />
		</BackgroundShell>
	);
};

export const GovernanceRiskAnimation: React.FC = () => {
	const {durationInFrames} = useVideoConfig();
	return (
		<BackgroundShell durationInFrames={durationInFrames} showMeta={false} showProgress={false}>
			<RiskScene />
		</BackgroundShell>
	);
};
