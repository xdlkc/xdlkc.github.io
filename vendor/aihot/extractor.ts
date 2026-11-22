import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import { contentDocument } from "./lib/page-content.ts";
import { sanitizeBody, trimTrailingChrome } from "./content/sanitize.ts";
import { SELECTION } from "./industry/selection.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, "industry", "prompts");

const MIN_EXTRACTED_TEXT_CHARS = 220;
const PAGE_CHROME_SELECTORS = [
  "nav",
  "footer",
  "dialog",
  "header:not(article header, main header)",
  "[role=banner]",
  "[role=navigation]",
  "[role=contentinfo]",
  "[role=dialog]",
  "[role=alertdialog]",
  "[aria-modal=true]",
  "#onetrust-consent-sdk",
].join(",");

function resolveRelativeUrls(html: string, baseUrl: string): string {
  const $ = cheerio.load(html, null, false);
  const toAbs = (val: string | undefined): string | undefined => {
    if (!val) return val;
    const trimmed = val.trim();
    if (!trimmed || trimmed.startsWith("#") || /^(?:https?:|mailto:|tel:|data:)/i.test(trimmed)) {
      return trimmed;
    }
    try {
      return new URL(trimmed, baseUrl).href;
    } catch {
      return trimmed;
    }
  };

  $("img").each((_, el) => {
    const $el = $(el);
    const lazySrc = $el.attr("data-src") || $el.attr("data-lazy-src") || $el.attr("data-original");
    const src = $el.attr("src");
    if (lazySrc && (!src || src.startsWith("data:"))) {
      $el.attr("src", toAbs(lazySrc) ?? lazySrc);
    } else if (src) {
      $el.attr("src", toAbs(src) ?? src);
    }
  });

  $("a[href]").each((_, el) => {
    const $el = $(el);
    const href = toAbs($el.attr("href"));
    if (href) $el.attr("href", href);
  });

  return $.html();
}

export function sanitizeWithAihot(rawHtml: string, baseUrl: string): string {
  if (!rawHtml || !rawHtml.trim()) return "";
  const resolved = resolveRelativeUrls(rawHtml, baseUrl);
  return trimTrailingChrome(sanitizeBody(resolved, baseUrl));
}

export async function extractFullArticle(
  url: string,
  opts: { timeoutMs?: number; fallbackHtml?: string } = {},
): Promise<{ html: string; text: string; author: string; via: "readability" | "rss" | "none" }> {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (!/html|xml/i.test(contentType)) {
      throw new Error(`Unsupported content-type: ${contentType}`);
    }

    const rawPageHtml = await res.text();
    const finalUrl = res.url || url;
    const doc = contentDocument(rawPageHtml);

    for (const chrome of Array.from(doc.querySelectorAll(PAGE_CHROME_SELECTORS))) {
      chrome.remove();
    }

    const parsed = new Readability(doc as unknown as Document, {
      charThreshold: 120,
    }).parse();

    if (parsed && parsed.content) {
      const cleanHtml = sanitizeWithAihot(parsed.content, finalUrl);
      const cleanText = (parsed.textContent || "").replace(/\s+/g, " ").trim();
      if (cleanText.length >= MIN_EXTRACTED_TEXT_CHARS && cleanHtml.length > 0) {
        return {
          html: cleanHtml,
          text: cleanText,
          author: (parsed.byline || "").trim(),
          via: "readability",
        };
      }
    }
  } catch {
    // Fall back gracefully to sanitized RSS body below
  } finally {
    clearTimeout(timer);
  }

  if (opts.fallbackHtml) {
    const fallbackClean = sanitizeWithAihot(opts.fallbackHtml, url);
    const fallbackText = cheerio.load(fallbackClean, null, false).text().replace(/\s+/g, " ").trim();
    if (fallbackClean) {
      return { html: fallbackClean, text: fallbackText, author: "", via: "rss" };
    }
  }

  return { html: "", text: "", author: "", via: "none" };
}

export function loadAihotPrompt(filename: string): string {
  const fullPath = path.join(PROMPTS_DIR, filename);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8").trim() : "";
}

export function getAihotThresholds(): Record<string, number> {
  return { ...SELECTION.thresholds };
}
