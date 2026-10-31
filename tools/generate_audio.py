#!/usr/bin/env python3
"""Generate blog post audio narration locally using MiniMax Token Plan APIs.

Workflow:
1. Read a Hexo markdown post (with or without front-matter).
2. Either:
   - `podcast` mode (default): Use MiniMax Chat Completions API to condense and
     rewrite the technical article into a natural, spoken-style guided narration
     script (saving the script to `source/uploads/<slug>/audio-script.txt`), OR
   - `full` mode: Clean markdown syntax, code blocks, Mermaid diagrams, and tables
     for direct read-aloud.
3. Call MiniMax T2A v2 API (`POST /v1/t2a_v2`, model `speech-2.8-hd`) in chunks,
   decode hex MP3 bytes, and save `source/uploads/<slug>/audio.mp3`.
4. Inject `audio`, `audio_mode`, and `audio_duration` into the post's front-matter.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


DEFAULT_API_HOST = "https://api.minimaxi.com"
DEFAULT_LLM_MODEL = "MiniMax-M3.1-Flash"
DEFAULT_TTS_MODEL = "speech-2.8-hd"
DEFAULT_VOICE_ID = "presenter_male"
MAX_TTS_CHUNK_CHARS = 1800

PODCAST_SYSTEM_PROMPT = """你是一位资深技术播客主理人（风格参考：极客时间精讲 / 架构师深度导读）。
你的任务是将输入的技术博客文章改写为一段**适合单人朗读的口语化音频导读稿**（时长控制在 4~6 分钟，字数约 1400~2200 字）。

改写要求：
1. **纯口播文本**：直接输出主播要读出来的文字。不要包含任何 Markdown 标题（#）、加粗（**）、列表符号（- / 1.）、代码块、舞台提示（如“【背景音乐】”、“主播：”）或分段小标题。
2. **消除图文与代码断层**：原文中的代码块、配置项、表格和架构图，千万不要生硬地念变量名或说“如下图所示”，而是用自然语言把它们背后的设计意图、数据流向和核心机制讲清楚。
3. **脉络清晰**：
   - 开篇用两三句话点明这篇文章要解决什么核心工程痛点；
   - 中间顺着文章的架构逻辑，拆解最关键的 2~4 个技术洞察与 Trade-off；
   - 结尾给出简短有力的工程启发，并引导读者结合正文中的图表与源码深入阅读。
4. **听感自然**：多用短句，适当使用过渡词（“我们先来看”、“更有意思的是”、“换句话说”），中英文专有名词（如 Agent、Harness、Subagent、Context）保持自然混排，数字和百分比用易读的方式表达。"""


def load_dotenv(repo: Path) -> None:
    """Load simple KEY=VALUE pairs from .env in repo root if present."""
    env_file = repo / ".env"
    if not env_file.exists():
        return
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = value


def split_front_matter(markdown_text: str) -> tuple[str | None, str]:
    """Return (front_matter_content_without_delimiters, body)."""
    if markdown_text.startswith("---\n"):
        end = markdown_text.find("\n---\n", 4)
        if end != -1:
            fm = markdown_text[4:end]
            body = markdown_text[end + 5 :]
            return fm, body
    return None, markdown_text


def extract_title_from_post(front_matter: str | None, body: str, fallback: str) -> str:
    if front_matter:
        match = re.search(r"^title:\s*(.+?)\s*$", front_matter, re.MULTILINE)
        if match:
            return match.group(1).strip().strip("'").strip('"')
    h1_match = re.search(r"^#\s+(.+?)\s*$", body, re.MULTILINE)
    if h1_match:
        return h1_match.group(1).strip()
    return fallback


def clean_markdown_for_speech(markdown_body: str) -> str:
    """Strip code blocks, tables, HTML, images, and markdown formatting for TTS."""
    text = markdown_body

    # Remove Hexo raw tags
    text = re.sub(r"\{%\s*raw\s*%\}|\{%\s*endraw\s*%\}", "\n", text)

    # Remove fenced code blocks (including mermaid, bash, python, etc.)
    text = re.sub(r"```[\s\S]*?```", "\n", text)
    text = re.sub(r"~~~[\s\S]*?~~~", "\n", text)
    text = re.sub(r"<pre[\s\S]*?</pre>", "\n", text, flags=re.IGNORECASE)

    # Preserve paragraph breaks for block-level HTML elements before stripping tags
    text = re.sub(
        r"</(p|div|h[1-6]|li|blockquote|tr|section|article)>",
        "\n\n",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)

    # Remove HTML tags and comments
    text = re.sub(r"<!--[\s\S]*?-->", "", text)
    text = re.sub(r"<[^>]+>", "", text)

    # Remove images ![alt](url)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", text)

    # Replace links [label](url) with label
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)

    # Remove markdown tables
    lines = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|"):
            continue
        if re.match(r"^\|?[\s:|-]+\|[\s:|-]*$", stripped):
            continue
        lines.append(line)
    text = "\n".join(lines)

    # Strip heading markers, blockquotes, list markers, bold/italic, inline code
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^>\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^[\s]*[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^[\s]*\d+\.\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"^---+$", "", text, flags=re.MULTILINE)

    # Collapse multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def strip_thinking_blocks(text: str) -> str:
    """Remove <think>...</think> blocks emitted by reasoning models."""
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE)
    return cleaned.strip()


def split_text_into_tts_chunks(text: str, max_chars: int = MAX_TTS_CHUNK_CHARS) -> list[str]:
    """Split spoken text into paragraph/sentence chunks under max_chars."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[str] = []
    current = ""

    def flush() -> None:
        nonlocal current
        if current.strip():
            chunks.append(current.strip())
        current = ""

    for para in paragraphs:
        if len(para) <= max_chars:
            if not current:
                current = para
            elif len(current) + 2 + len(para) <= max_chars:
                current = f"{current}\n\n{para}"
            else:
                flush()
                current = para
        else:
            flush()
            # Split long paragraph by sentence boundaries
            sentences = re.split(r"(?<=[。！？.!?\n])", para)
            for sent in sentences:
                sent = sent.strip()
                if not sent:
                    continue
                if len(sent) > max_chars:
                    for i in range(0, len(sent), max_chars):
                        chunks.append(sent[i : i + max_chars])
                elif not current:
                    current = sent
                elif len(current) + len(sent) <= max_chars:
                    current = f"{current}{sent}"
                else:
                    flush()
                    current = sent
            flush()

    flush()
    return chunks


def format_duration_ms(duration_ms: int) -> str:
    total_seconds = max(1, round(duration_ms / 1000))
    minutes, seconds = divmod(total_seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours > 0:
        return f"{hours:d}:{minutes:02d}:{seconds:02d}"
    return f"{minutes:02d}:{seconds:02d}"


def upsert_front_matter_fields(markdown_text: str, updates: dict[str, str]) -> str:
    """Insert or update key-value fields inside YAML front-matter."""
    fm, body = split_front_matter(markdown_text)
    if fm is None:
        fm_lines = [f"{k}: {v}" for k, v in updates.items()]
        return "---\n" + "\n".join(fm_lines) + "\n---\n\n" + body.lstrip()

    lines = fm.splitlines()
    remaining = dict(updates)
    updated_lines: list[str] = []

    for line in lines:
        matched_key = None
        for key in list(remaining.keys()):
            if re.match(rf"^{re.escape(key)}\s*:", line):
                matched_key = key
                break
        if matched_key is not None:
            updated_lines.append(f"{matched_key}: {remaining.pop(matched_key)}")
        else:
            updated_lines.append(line)

    for key, value in remaining.items():
        updated_lines.append(f"{key}: {value}")

    new_fm = "\n".join(updated_lines)
    return f"---\n{new_fm}\n---\n{body}"


def http_post_json(
    url: str,
    api_key: str,
    payload: dict[str, Any],
    timeout: int = 120,
) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} calling {url}: {err_body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Network error calling {url}: {exc}") from exc


def generate_podcast_script_via_minimax(
    *,
    title: str,
    markdown_body: str,
    api_key: str,
    api_host: str = DEFAULT_API_HOST,
    llm_model: str = DEFAULT_LLM_MODEL,
) -> str:
    """Call MiniMax OpenAI-compatible chat completions endpoint to produce podcast script."""
    url = f"{api_host.rstrip('/')}/v1/chat/completions"
    # Truncate extremely huge bodies safely while keeping plenty of context
    trimmed_body = markdown_body[:45000]
    user_prompt = (
        f"文章标题：《{title}》\n\n"
        f"文章正文如下，请将其改写为 4~6 分钟的单人技术播客导读口播稿：\n\n"
        f"{trimmed_body}"
    )
    payload = {
        "model": llm_model,
        "messages": [
            {"role": "system", "content": PODCAST_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.65,
        "stream": False,
    }
    res = http_post_json(url, api_key=api_key, payload=payload, timeout=180)
    base_resp = res.get("base_resp") or {}
    if base_resp.get("status_code") not in (None, 0):
        raise RuntimeError(f"MiniMax LLM error: {base_resp}")

    choices = res.get("choices") or []
    if not choices:
        raise RuntimeError(f"Unexpected MiniMax LLM response: {res}")

    content = choices[0].get("message", {}).get("content", "")
    script = strip_thinking_blocks(content)
    script = clean_markdown_for_speech(script)
    if not script:
        raise RuntimeError("MiniMax LLM returned an empty script.")
    return script


def synthesize_tts_chunks_via_minimax(
    *,
    chunks: list[str],
    api_key: str,
    api_host: str = DEFAULT_API_HOST,
    tts_model: str = DEFAULT_TTS_MODEL,
    voice_id: str = DEFAULT_VOICE_ID,
    speed: float = 1.0,
) -> tuple[bytes, int]:
    """Synthesize each text chunk via MiniMax /v1/t2a_v2 and concatenate MP3 bytes.

    Returns (combined_mp3_bytes, total_duration_ms).
    """
    url = f"{api_host.rstrip('/')}/v1/t2a_v2"
    audio_parts: list[bytes] = []
    total_duration_ms = 0

    for idx, chunk in enumerate(chunks, start=1):
        print(f"  [MiniMax TTS] Synthesizing chunk {idx}/{len(chunks)} ({len(chunk)} chars)...")
        payload = {
            "model": tts_model,
            "text": chunk,
            "stream": False,
            "output_format": "hex",
            "voice_setting": {
                "voice_id": voice_id,
                "speed": speed,
                "vol": 1.0,
                "pitch": 0,
            },
            "audio_setting": {
                "sample_rate": 32000,
                "bitrate": 128000,
                "format": "mp3",
                "channel": 1,
            },
        }
        res = http_post_json(url, api_key=api_key, payload=payload, timeout=180)
        base_resp = res.get("base_resp") or {}
        if base_resp.get("status_code", 0) != 0:
            raise RuntimeError(
                f"MiniMax T2A error on chunk {idx}: "
                f"{base_resp.get('status_code')} {base_resp.get('status_msg')}"
            )

        hex_audio = (res.get("data") or {}).get("audio")
        if not hex_audio:
            raise RuntimeError(f"MiniMax T2A returned empty audio on chunk {idx}: {res}")

        audio_parts.append(bytes.fromhex(hex_audio))
        extra_info = res.get("extra_info") or {}
        total_duration_ms += int(extra_info.get("audio_length") or 0)

    return b"".join(audio_parts), total_duration_ms


def compute_cache_hash(
    *,
    spoken_text: str,
    tts_model: str,
    voice_id: str,
    speed: float,
) -> str:
    payload = json.dumps(
        {
            "text": spoken_text,
            "tts_model": tts_model,
            "voice_id": voice_id,
            "speed": speed,
        },
        ensure_ascii=False,
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def generate_audio_for_post(
    *,
    post_path: Path,
    repo: Path,
    slug: str | None = None,
    mode: str = "podcast",
    api_key: str | None = None,
    api_host: str = DEFAULT_API_HOST,
    llm_model: str = DEFAULT_LLM_MODEL,
    tts_model: str = DEFAULT_TTS_MODEL,
    voice_id: str = DEFAULT_VOICE_ID,
    speed: float = 1.0,
    regenerate_script: bool = False,
    force: bool = False,
) -> dict[str, Any]:
    """End-to-end audio generation and front-matter update for a post."""
    load_dotenv(repo)
    resolved_key = (
        api_key
        or os.environ.get("MINIMAX_API_KEY")
        or os.environ.get("MINIMAX_TOKEN")
    )
    if not resolved_key:
        raise SystemExit(
            "Missing MiniMax API key. Please set MINIMAX_API_KEY in your environment "
            "or in a .env file at the repository root."
        )

    resolved_host = os.environ.get("MINIMAX_API_HOST", api_host)
    post_path = post_path.resolve()
    if not post_path.exists():
        raise SystemExit(f"Post file not found: {post_path}")

    resolved_slug = slug or post_path.stem
    uploads_dir = repo / "source" / "uploads" / resolved_slug
    uploads_dir.mkdir(parents=True, exist_ok=True)

    script_path = uploads_dir / "audio-script.txt"
    mp3_path = uploads_dir / "audio.mp3"
    meta_path = uploads_dir / "audio-meta.json"
    public_audio_url = f"/uploads/{resolved_slug}/audio.mp3"

    raw_markdown = post_path.read_text(encoding="utf-8")
    fm, body = split_front_matter(raw_markdown)
    title = extract_title_from_post(fm, body, fallback=resolved_slug)

    if mode == "podcast":
        if script_path.exists() and not regenerate_script:
            print(f"[Audio] Using existing podcast script: {script_path}")
            spoken_text = script_path.read_text(encoding="utf-8").strip()
        else:
            print(f"[Audio] Generating podcast narration script with {llm_model}...")
            readable_body = clean_markdown_for_speech(body)
            spoken_text = generate_podcast_script_via_minimax(
                title=title,
                markdown_body=readable_body,
                api_key=resolved_key,
                api_host=resolved_host,
                llm_model=llm_model,
            )
            script_path.write_text(spoken_text + "\n", encoding="utf-8")
            print(f"[Audio] Saved podcast script ({len(spoken_text)} chars) -> {script_path}")
    elif mode == "full":
        spoken_text = f"{title}。\n\n{clean_markdown_for_speech(body)}"
    else:
        raise ValueError(f"Unsupported mode: {mode}")

    cache_hash = compute_cache_hash(
        spoken_text=spoken_text,
        tts_model=tts_model,
        voice_id=voice_id,
        speed=speed,
    )

    duration_label = ""
    if mp3_path.exists() and meta_path.exists() and not force:
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            meta = {}
        if meta.get("cache_hash") == cache_hash:
            duration_label = str(meta.get("duration") or "")
            print(f"[Audio] Cache hit ({cache_hash}), skipping TTS synthesis: {mp3_path}")

    if not duration_label or not mp3_path.exists() or force:
        chunks = split_text_into_tts_chunks(spoken_text)
        if not chunks:
            raise RuntimeError("No speakable text extracted from the article.")
        mp3_bytes, duration_ms = synthesize_tts_chunks_via_minimax(
            chunks=chunks,
            api_key=resolved_key,
            api_host=resolved_host,
            tts_model=tts_model,
            voice_id=voice_id,
            speed=speed,
        )
        mp3_path.write_bytes(mp3_bytes)
        duration_label = format_duration_ms(duration_ms) if duration_ms > 0 else ""
        meta_payload = {
            "slug": resolved_slug,
            "mode": mode,
            "tts_model": tts_model,
            "voice_id": voice_id,
            "speed": speed,
            "chars": len(spoken_text),
            "chunks": len(chunks),
            "duration_ms": duration_ms,
            "duration": duration_label,
            "cache_hash": cache_hash,
        }
        meta_path.write_text(
            json.dumps(meta_payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"[Audio] Saved MP3 ({len(mp3_bytes) / 1024:.1f} KB, {duration_label}) -> {mp3_path}")

    fm_updates = {
        "audio": public_audio_url,
        "audio_mode": mode,
    }
    if duration_label:
        fm_updates["audio_duration"] = f'"{duration_label}"'

    updated_markdown = upsert_front_matter_fields(raw_markdown, fm_updates)
    if updated_markdown != raw_markdown:
        post_path.write_text(updated_markdown, encoding="utf-8")
        print(f"[Audio] Updated front-matter in {post_path}")

    return {
        "post_path": post_path,
        "mp3_path": mp3_path,
        "script_path": script_path if mode == "podcast" else None,
        "audio_url": public_audio_url,
        "mode": mode,
        "duration": duration_label,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate MiniMax audio narration for a Hexo blog post."
    )
    parser.add_argument("post", help="Path to the markdown post (e.g. source/_posts/my-post.md).")
    parser.add_argument("--repo", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument("--slug", help="Override asset folder slug (defaults to post filename stem).")
    parser.add_argument(
        "--mode",
        choices=["podcast", "full"],
        default="podcast",
        help="'podcast' (default): AI guided summary narration; 'full': cleaned full-text read-aloud.",
    )
    parser.add_argument(
        "--voice-id",
        default=DEFAULT_VOICE_ID,
        help=f"MiniMax voice_id (default: {DEFAULT_VOICE_ID}).",
    )
    parser.add_argument(
        "--tts-model",
        default=DEFAULT_TTS_MODEL,
        help=f"MiniMax T2A model (default: {DEFAULT_TTS_MODEL}).",
    )
    parser.add_argument(
        "--llm-model",
        default=DEFAULT_LLM_MODEL,
        help=f"MiniMax LLM model for podcast script generation (default: {DEFAULT_LLM_MODEL}).",
    )
    parser.add_argument(
        "--speed",
        type=float,
        default=1.0,
        help="Speech synthesis speed multiplier (default: 1.0).",
    )
    parser.add_argument(
        "--api-host",
        default=DEFAULT_API_HOST,
        help=f"MiniMax API host (default: {DEFAULT_API_HOST}).",
    )
    parser.add_argument(
        "--regenerate-script",
        action="store_true",
        help="Regenerate the podcast script even if audio-script.txt already exists.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-synthesizing MP3 even if cache hash matches.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    generate_audio_for_post(
        post_path=Path(args.post),
        repo=Path(args.repo).resolve(),
        slug=args.slug,
        mode=args.mode,
        api_host=args.api_host,
        llm_model=args.llm_model,
        tts_model=args.tts_model,
        voice_id=args.voice_id,
        speed=args.speed,
        regenerate_script=args.regenerate_script,
        force=args.force,
    )


if __name__ == "__main__":
    main()
