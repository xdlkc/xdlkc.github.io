#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import unicodedata
from datetime import date, datetime
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Publish a markdown article into source/_posts for the Hexo blog."
    )
    parser.add_argument("source", help="Path to the source markdown file.")
    parser.add_argument("--repo", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument("--date", help="Publish date in YYYY-MM-DD. Defaults to today.")
    parser.add_argument("--slug", help="Output filename slug. Defaults to a slugified title.")
    parser.add_argument("--title", help="Override the post title. Defaults to the first H1.")
    parser.add_argument("--commit", action="store_true", help="Create a git commit after publishing.")
    parser.add_argument("--push", action="store_true", help="Push to origin/master after publishing.")
    parser.add_argument(
        "--proxy",
        default="http://127.0.0.1:6789",
        help="Proxy used by git push when --push is set.",
    )
    return parser.parse_args()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


def parse_publish_date(raw: str | None) -> date:
    if not raw:
        return date.today()
    return datetime.strptime(raw, "%Y-%m-%d").date()


def strip_existing_front_matter(text: str) -> str:
    if text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end != -1:
            return text[end + 5 :].lstrip()
    return text


def extract_title(text: str) -> str:
    match = re.search(r"^#\s+(.+?)\s*$", text, re.MULTILINE)
    if not match:
        raise SystemExit("Could not find a top-level '# Title' in the markdown file.")
    return match.group(1).strip()


def remove_first_h1(text: str) -> str:
    return re.sub(r"^#\s+.+?\n+", "", text, count=1, flags=re.MULTILINE).lstrip()


def is_remote_asset(path: str) -> bool:
    return path.startswith(("http://", "https://", "//", "/"))


def sync_local_images(body: str, source_path: Path, repo: Path, slug: str) -> str:
    uploads_dir = repo / "source" / "uploads" / slug
    uploads_dir.mkdir(parents=True, exist_ok=True)

    def replace(match: re.Match[str]) -> str:
        alt = match.group(1)
        raw_path = match.group(2).strip()
        if is_remote_asset(raw_path):
            return match.group(0)

        source_asset = (source_path.parent / raw_path).resolve()
        if not source_asset.exists() or not source_asset.is_file():
            return match.group(0)

        target_asset = uploads_dir / source_asset.name
        shutil.copy2(source_asset, target_asset)
        new_path = f"/uploads/{slug}/{target_asset.name}"
        return f"![{alt}]({new_path})"

    return re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", replace, body)


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_only).strip("-").lower()
    if slug:
        return slug
    compact = re.sub(r"\s+", "-", value.strip())
    compact = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff-]+", "", compact).strip("-")
    compact = compact.lower()
    if compact:
        return compact
    raise SystemExit("Could not derive a slug from the title. Please pass --slug.")


def build_post_markdown(title: str, published: date, body: str) -> str:
    header = (
        "---\n"
        f"title: {title}\n"
        f"date: {published.isoformat()} 00:00:00\n"
        "---\n\n"
    )
    return header + body.rstrip() + "\n"


def run_git(repo: Path, args: list[str]) -> None:
    result = subprocess.run(["git", "-C", str(repo), *args], check=False)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def commit_and_push(repo: Path, post_path: Path, title: str, push: bool, proxy: str) -> None:
    run_git(repo, ["add", str(post_path), "source", "themes", "_config.yml", "package.json", ".github", ".gitignore", "scaffolds", "tools"])
    run_git(repo, ["commit", "-m", f"Publish {title}"])
    if push:
        result = subprocess.run(
            [
                "git",
                "-C",
                str(repo),
                "-c",
                f"http.proxy={proxy}",
                "-c",
                f"https.proxy={proxy}",
                "push",
                "origin",
                "master",
            ],
            check=False,
        )
        if result.returncode != 0:
            raise SystemExit(result.returncode)


def main() -> None:
    args = parse_args()
    repo = Path(args.repo).resolve()
    source = Path(args.source).expanduser().resolve()
    published = parse_publish_date(args.date)

    text = strip_existing_front_matter(read_text(source))
    title = args.title or extract_title(text)
    slug = args.slug or slugify(title)
    body = remove_first_h1(text)
    body = sync_local_images(body, source, repo, slug)

    target_dir = repo / "source" / "_posts"
    target_dir.mkdir(parents=True, exist_ok=True)
    post_path = target_dir / f"{slug}.md"

    if source != post_path:
        shutil.copy2(source, post_path)
        text = strip_existing_front_matter(read_text(post_path))
        body = remove_first_h1(text)
        body = sync_local_images(body, source, repo, slug)

    write_text(post_path, build_post_markdown(title, published, body))

    if args.push:
        args.commit = True
    if args.commit:
        commit_and_push(repo, post_path, title, push=args.push, proxy=args.proxy)

    print(
        "\n".join(
            [
                "Published:",
                f"  title: {title}",
                f"  date: {published.isoformat()}",
                f"  slug: {slug}",
                f"  post: {post_path}",
                f"  url: /{published:%Y/%m/%d}/{slug}/",
            ]
        )
    )


if __name__ == "__main__":
    main()
