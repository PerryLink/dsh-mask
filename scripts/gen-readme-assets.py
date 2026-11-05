#!/usr/bin/env python3
"""Generate README image assets for dsh-mask (docs/assets/).

Outputs (idempotent overwrite):
  dsh-mask-flow-light.svg / dsh-mask-flow-dark.svg
      Hero data-flow diagram. Two hand-written SVG files (vector — never
      rasterized to webp). Text inside is command-surface tokens only
      (agent/pre-step, /mask restore, ...), so all five README languages
      share the same pair.
  dsh-mask-evidence-{zh,en}-{light,dark}.webp
      Per-type F1 bar chart, data quoted verbatim from benchmark/RESULTS.md
      (108 synthetic samples). Chinese needs an explicit CJK font — probed
      below; the script aborts loudly when none is found.

Run once:  python scripts/gen-readme-assets.py
Requires:  Pillow (pip install pillow)
"""
from __future__ import annotations

import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

# --- palette: PerryLink family (accent) + GitHub page backgrounds ----------
FAMILY = "#4B67B4"   # family accent (badges labelColor family uses #2B3245)
GREEN = {"light": "#16a34a", "dark": "#3fb950"}
ORANGE = {"light": "#bc4c00", "dark": "#d29922"}
SKIN = {
    "light": dict(bg="#ffffff", box="#f6f8fa", border="#d0d7de",
                  text="#1f2328", sub="#57606a", track="#eaeef2"),
    "dark": dict(bg="#0d1117", box="#161b22", border="#30363d",
                 text="#f0f6fc", sub="#8b949e", track="#21262d"),
}

# --- CJK font probe: Chinese must never render as tofu boxes ----------------
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyh.ttc",      # Microsoft YaHei
    r"C:\Windows\Fonts\simhei.ttf",    # SimHei
    r"C:\Windows\Fonts\Deng.ttf",      # DengXian
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/System/Library/Fonts/PingFang.ttc",
]
FONT_PATH = next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)
if FONT_PATH is None:
    sys.exit("FATAL: no CJK font found (looked for msyh.ttc, simhei.ttf, "
             "Deng.ttf, Noto Sans CJK, PingFang). Refusing to render Chinese "
             "as tofu boxes; install one of the probed fonts and re-run.")


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size)


# ---------------------------------------------------------------------------
# 1. Hero data-flow SVG (light + dark)
# ---------------------------------------------------------------------------
FLOW_NODES = [
    ("user message", "plaintext in"),
    ("agent/pre-step", "→ <PHONE_1> <EMAIL_1>"),
    ("model", "sees placeholders only"),
    ("/mask restore", "explicit reveal"),
    ("controlled file", "0600 · one per session"),
]


def flow_svg(skin: str) -> str:
    s = SKIN[skin]
    w, h = 1200, 400
    nw, nh, gap = 180, 96, 45
    y0 = 150
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" role="img" aria-label="dsh-mask data flow">',
        f'<title>dsh-mask data flow</title>',
        f'<rect width="{w}" height="{h}" rx="18" fill="{s["bg"]}"/>',
        f'<text x="60" y="62" fill="{s["text"]}" font-family="ui-sans-serif,'
        f'system-ui,sans-serif" font-size="30" font-weight="700">dsh-mask</text>',
        f'<text x="60" y="94" fill="{s["sub"]}" font-family="ui-monospace,'
        f'monospace" font-size="16">agent/pre-step PII masking · restore '
        f'table stays host-side</text>',
        f'<line x1="60" y1="116" x2="1140" y2="116" stroke="{s["border"]}"/>',
    ]
    for i, (label, sub) in enumerate(FLOW_NODES):
        x = 60 + i * (nw + gap)
        accent = GREEN[skin] if i == len(FLOW_NODES) - 1 else (
            FAMILY if i == 1 else s["border"])
        parts.append(
            f'<rect x="{x}" y="{y0}" width="{nw}" height="{nh}" rx="14" '
            f'fill="{s["box"]}" stroke="{accent}" stroke-width="2"/>')
        parts.append(
            f'<text x="{x + nw // 2}" y="{y0 + 40}" fill="{s["text"]}" '
            f'text-anchor="middle" font-family="ui-monospace,monospace" '
            f'font-size="16" font-weight="700">{label}</text>')
        parts.append(
            f'<text x="{x + nw // 2}" y="{y0 + 68}" fill="{s["sub"]}" '
            f'text-anchor="middle" font-family="ui-monospace,monospace" '
            f'font-size="12">{sub}</text>')
        if i < len(FLOW_NODES) - 1:
            ax = x + nw + 6
            ay = y0 + nh // 2
            parts.append(
                f'<path d="M{ax} {ay}h{gap - 12}" stroke="{s["sub"]}" '
                f'stroke-width="3"/>')
            parts.append(
                f'<path d="M{ax + gap - 14} {ay - 7}l10 7-10 7" fill="none" '
                f'stroke="{s["sub"]}" stroke-width="3" '
                f'stroke-linecap="round" stroke-linejoin="round"/>')
    # restore-table loop bar under nodes 2..4
    bx, bw, by, bh = 285, 630, 285, 52
    for cx in (285 + 90, 735 + 90):  # node2 / node4 center-bottom connectors
        parts.append(
            f'<path d="M{cx} {y0 + nh}v{by - y0 - nh}" '
            f'stroke="{FAMILY}" stroke-width="2" stroke-dasharray="5 5"/>')
    parts.append(
        f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="12" '
        f'fill="{s["box"]}" stroke="{FAMILY}" stroke-width="2"/>')
    parts.append(
        f'<text x="{bx + bw // 2}" y="{by + 33}" fill="{s["text"]}" '
        f'text-anchor="middle" font-family="ui-monospace,monospace" '
        f'font-size="14">restore table · memory + dsh_mask domain · '
        f'never the session log</text>')
    parts.append(
        f'<text x="60" y="378" fill="{s["sub"]}" font-family="ui-monospace,'
        f'monospace" font-size="13">mask/applied audit event = counts + '
        f'type distribution only · plaintext never enters the session log'
        f'</text>')
    parts.append('</svg>')
    return "\n".join(parts) + "\n"


# ---------------------------------------------------------------------------
# 2. Evidence bar chart (zh/en x light/dark), data from benchmark/RESULTS.md
# ---------------------------------------------------------------------------
# Per-type F1 quoted verbatim from benchmark/RESULTS.md (108 synthetic
# samples, 60 positive / 48 negative; regenerate: node benchmark/run.mjs).
F1 = [("phone", 1.000), ("email", 1.000), ("id-card", 1.000),
      ("bank-card", 1.000), ("key", 1.000), ("ip (opt-in)", 0.833)]

TEXT = {
    "zh": dict(
        title="dsh-mask PII 检测 — 分类型 F1",
        sub="108 个合成样本（60 正 / 48 负）· 数据出自 benchmark/RESULTS.md",
        note1="Macro F1 0.972 · Micro F1 0.968 · ip 是唯一有误报的类型"
              "（4 FP，FPR 0.500）——其正则按范围宽松匹配",
        note2="未测量：person / address（仅 NER 路径，不在正则路径上）"),
    "en": dict(
        title="dsh-mask PII detection — per-type F1",
        sub="108 synthetic samples (60 positive, 48 negative) · "
            "from benchmark/RESULTS.md",
        note1="Macro F1 0.972 · Micro F1 0.968 · ip is the only type with "
              "false positives (4 FP, FPR 0.500) — its regex is range-loose",
        note2="Not measured: person / address (NER-only, not on the "
              "regex path)"),
}


def evidence(lang: str, skin: str) -> None:
    s = SKIN[skin]
    t = TEXT[lang]
    w, h = 1600, 620
    img = Image.new("RGB", (w, h), s["bg"])
    d = ImageDraw.Draw(img)
    pad = 70
    # title block
    d.text((pad, 44), t["title"], font=font(36), fill=s["text"])
    d.text((pad, 100), t["sub"], font=font(19), fill=s["sub"])
    # bars
    label_w = 260
    bar_x, bar_max = pad + label_w + 24, 1000
    row_h, bar_h = 56, 34
    top = 170
    for i, (name, val) in enumerate(F1):
        y = top + i * row_h
        # right-aligned label
        lb = d.textbbox((0, 0), name, font=font(22))
        d.text((bar_x - 24 - (lb[2] - lb[0]), y + 4), name,
               font=font(22), fill=s["text"])
        d.rounded_rectangle([bar_x, y, bar_x + bar_max, y + bar_h],
                            radius=9, fill=s["track"])
        color = GREEN[skin] if val >= 0.999 else ORANGE[skin]
        d.rounded_rectangle([bar_x, y, bar_x + int(bar_max * val), y + bar_h],
                            radius=9, fill=color)
        d.text((bar_x + bar_max + 18, y + 2), f"{val:.3f}",
               font=font(24), fill=s["text"])
    # footnotes
    ny = top + len(F1) * row_h + 18
    d.text((pad, ny), t["note1"], font=font(17), fill=s["sub"])
    d.text((pad, ny + 32), t["note2"], font=font(17), fill=s["sub"])
    img.save(os.path.join(OUT, f"dsh-mask-evidence-{lang}-{skin}.webp"),
             "WEBP", quality=90)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for skin in ("light", "dark"):
        with open(os.path.join(OUT, f"dsh-mask-flow-{skin}.svg"),
                  "w", encoding="utf-8", newline="\n") as fh:
            fh.write(flow_svg(skin))
    for lang in ("zh", "en"):
        for skin in ("light", "dark"):
            evidence(lang, skin)
    print("wrote 2 SVG + 4 WebP assets to docs/assets/")


if __name__ == "__main__":
    main()
