#!/usr/bin/env python3
"""Automatically detect new/updated Hexo posts missing audio narration and generate it.

Intended for GitHub Actions (`.github/workflows/deploy.yml`) and local dry-runs.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

from generate_audio import generate_audio_for_post, load_dotenv, split_front_matter

SKIP_FILENAME_PREFIXES = (
    "test-",
    "news-midday-summary-",
)
ZERO_SHA = "0" * 40


def should_skip_post(post_path: Path) -> tuple[bool, str]:
    """Return (skip, reason) for a candidate markdown post."""
    name = post_path.name
    for prefix in SKIP_FILENAME_PREFIXES:
        if name.startswith(prefix):
            return True, f"filename starts with '{prefix}'"

    if not post_path.exists() or not post_path.is_file():
        return True, "file does not exist"

    raw = post_path.read_text(encoding="utf-8")
    fm, _ = split_front_matter(raw)
    if fm:
        if re.search(r"^audio:\s*\S+", fm, re.MULTILINE):
            return True, "front-matter already defines 'audio'"
        if re.search(r"^skip_audio:\s*(true|yes|1)\s*$", fm, re.MULTILINE | re.IGNORECASE):
            return True, "front-matter sets 'skip_audio: true'"

    return False, ""


def git_rev_exists(repo: Path, rev: str) -> bool:
    if not rev or rev == ZERO_SHA:
        return False
    res = subprocess.run(
        ["git", "-C", str(repo), "cat-file", "-e", f"{rev}^{{commit}}"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return res.returncode == 0


def find_changed_posts(repo: Path, base: str | None, head: str = "HEAD") -> list[Path]:
    """Return Added/Modified markdown posts between base and head."""
    resolved_base = base if (base and git_rev_exists(repo, base)) else None
    if not resolved_base:
        if git_rev_exists(repo, f"{head}~1"):
            resolved_base = f"{head}~1"
        else:
            return []

    res = subprocess.run(
        [
            "git",
            "-C",
            str(repo),
            "diff",
            "--name-only",
            "--diff-filter=AM",
            resolved_base,
            head,
            "--",
            "source/_posts",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if res.returncode != 0:
        print(f"[AutoAudio] git diff failed: {res.stderr.strip()}", file=sys.stderr)
        return []

    posts: list[Path] = []
    for line in res.stdout.splitlines():
        rel = line.strip()
        if not rel.endswith(".md"):
            continue
        candidate = (repo / rel).resolve()
        if candidate.exists():
            posts.append(candidate)
    return sorted(set(posts))


def resolve_manual_post(repo: Path, raw_post: str) -> Path:
    """Validate and resolve a manually specified post path under source/_posts."""
    posts_dir = (repo / "source" / "_posts").resolve()
    candidate = Path(raw_post)
    if not candidate.is_absolute():
        candidate = (repo / candidate).resolve()
    else:
        candidate = candidate.resolve()

    if posts_dir not in candidate.parents or candidate.suffix != ".md":
        raise SystemExit(
            f"[AutoAudio] Refusing post path outside source/_posts/*.md: {raw_post}"
        )
    if not candidate.exists():
        raise SystemExit(f"[AutoAudio] Post file not found: {candidate}")
    return candidate


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Auto-generate MiniMax audio narration for new Hexo posts."
    )
    parser.add_argument("--repo", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument(
        "--base",
        default=os.environ.get("EVENT_BEFORE", ""),
        help="Base git commit SHA for diffing changed posts.",
    )
    parser.add_argument("--head", default="HEAD", help="Head git ref (default: HEAD).")
    parser.add_argument(
        "--post",
        default=os.environ.get("INPUT_POST", "").strip(),
        help="Explicit post path (e.g. from workflow_dispatch input).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        default=os.environ.get("INPUT_FORCE", "").lower() in ("1", "true", "yes"),
        help="Force regenerate script and MP3 for manually specified post.",
    )
    parser.add_argument(
        "--best-effort",
        action="store_true",
        help="Emit warning and continue instead of failing the workflow if generation fails.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only print which posts would be processed without calling MiniMax APIs.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    repo = Path(args.repo).resolve()
    load_dotenv(repo)

    has_key = bool(os.environ.get("MINIMAX_API_KEY") or os.environ.get("MINIMAX_TOKEN"))
    if not has_key and not args.dry_run:
        print(
            "[AutoAudio] MINIMAX_API_KEY is not set; skipping automatic audio generation."
        )
        return

    if args.post:
        post_path = resolve_manual_post(repo, args.post)
        print(f"[AutoAudio] Manual target: {post_path.relative_to(repo)}")
        if args.dry_run:
            return
        generate_audio_for_post(
            post_path=post_path,
            repo=repo,
            regenerate_script=args.force,
            force=args.force,
        )
        return

    candidates = find_changed_posts(repo, args.base, args.head)
    if not candidates:
        print("[AutoAudio] No added or modified posts in diff; nothing to do.")
        return

    targets: list[Path] = []
    for post in candidates:
        skip, reason = should_skip_post(post)
        rel = post.relative_to(repo)
        if skip:
            print(f"[AutoAudio] Skipping {rel} ({reason})")
        else:
            targets.append(post)

    if not targets:
        print("[AutoAudio] All changed posts already have audio or are excluded.")
        return

    for post in targets:
        rel = post.relative_to(repo)
        print(f"[AutoAudio] Processing {rel}...")
        if args.dry_run:
            continue
        try:
            generate_audio_for_post(post_path=post, repo=repo)
        except BaseException as exc:
            if args.best_effort:
                print(f"::warning::Failed to generate audio for {rel}: {exc}")
            else:
                raise


if __name__ == "__main__":
    main()
