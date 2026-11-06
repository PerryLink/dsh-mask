#!/usr/bin/env python3
"""README visuals for dsh-mask — product-grade, not engineering sketch.

Design language borrowed from dsh-media-desk / dsh-Go:
  soft gradient canvas, floating rounded cards with layered shadows,
  large display title, quiet meta line, family accent #4B67B4.

Outputs:
  docs/assets/hero-{zh,en}-{light,dark}.webp   1600x640
  docs/assets/dsh-mask-evidence-{zh,en}-{light,dark}.webp
  docs/assets/dsh-mask-flow-{light,dark}.svg
"""
import os
from html import escape
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'assets')

FONT_CJK = r'C:\Windows\Fonts\msyh.ttc'
FONT_CJK_BOLD = r'C:\Windows\Fonts\msyhbd.ttc'
FONT_MONO = r'C:\Windows\Fonts\consola.ttf'
FONT_EN = r'C:\Windows\Fonts\segoeui.ttf'
FONT_EN_BOLD = r'C:\Windows\Fonts\segoeuib.ttf'
for _p in (FONT_CJK, FONT_CJK_BOLD, FONT_MONO):
    if not os.path.exists(_p):
        raise SystemExit(f'FATAL: font missing: {_p}')

SKIN = {
    'light': dict(
        bg_from='#f8f5fd', bg_to='#e6ebf7',
        card='#ffffff', card_edge='#e5e2ef',
        text='#16161d', sub='#565b6b', faint='#969bab',
        accent='#4B67B4', accent2='#16a34a', warn='#bc4c00',
        pill='#efeaf9', grid='#e9e6f2', shadow=(30, 26, 60),
    ),
    'dark': dict(
        bg_from='#121826', bg_to='#0d1117',
        card='#1a202d', card_edge='#2c3447',
        text='#eef2f8', sub='#a2abbf', faint='#6f7789',
        accent='#8091f2', accent2='#3fb950', warn='#d29922',
        pill='#232b40', grid='#1c2333', shadow=(0, 0, 0),
    ),
}


def font(size, kind='cjk_bold'):
    return ImageFont.truetype({
        'cjk': FONT_CJK, 'cjk_bold': FONT_CJK_BOLD, 'mono': FONT_MONO,
        'en': FONT_EN, 'en_bold': FONT_EN_BOLD}[kind], size)


def hx(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def gradient(w, h, c1, c2):
    a = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(a)
    for y in range(h):
        t = 0.25 * (y / h) + 0.75 * (y / h) ** 1.35
        d.line([(0, y), (w, y)],
               fill=tuple(int(p + (q - p) * t) for p, q in zip(hx(c1), hx(c2))))
    return a


def glow(img, cx, cy, r, color, alpha=60):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(8, 0, -1):
        rr = r * i / 8
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=color + (int(alpha * (1 - i / 9)),))
    return Image.alpha_composite(img.convert('RGBA'), layer).convert('RGB')


def card(img, box, skin, radius=22, shadow=24):
    x0, y0, x1, y1 = box
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i in range(shadow, 0, -3):
        sd.rounded_rectangle([x0 - i // 4, y0 + i // 2, x1 + i // 4, y1 + i],
                             radius=radius + i // 4,
                             fill=skin['shadow'] + (int(9 * (1 - i / shadow)),))
    sh = sh.filter(ImageFilter.GaussianBlur(12))
    base = Image.alpha_composite(img.convert('RGBA'), sh)
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=hx(skin['card']),
                        outline=hx(skin['card_edge']), width=2)
    return base.convert('RGB')


def pill(img, xy, text, skin, size=16, fg=None, bg=None, kind='cjk_bold'):
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    tw = d.textlength(text, font=f)
    x, y = xy
    h = size + 18
    d.rounded_rectangle([x, y, x + tw + 32, y + h], radius=h // 2,
                        fill=hx(bg or skin['pill']))
    d.text((x + 16, y + 7), text, font=f, fill=hx(fg or skin['accent']))


HERO = {
    'zh': dict(kicker='DeepSeek Harness Plugin', title='dsh-mask',
               value=['在个人数据抵达模型之前', '完成脱敏'],
               sub='电话、邮箱、证件、银行卡在你这一侧换成占位符；原文永不进入会话日志。',
               meta='PII 遮罩  ·  可逆恢复  ·  零网络请求',
               in_label='用户消息', out_label='模型看到的消息',
               in_text=['帮我核对下：电话 13812345678，', '邮箱 zhang@example.com'],
               out_text=['帮我核对下：电话 <PHONE_1>，', '邮箱 <EMAIL_1>'],
               tag_in='原文只在本机', tag_out='占位符才落盘',
               restore=['恢复表', 'memory + dsh_mask', 'never the log'],
               foot='Apache-2.0  ·  PerryLink DSH plugin family'),
    'en': dict(kicker='DeepSeek Harness Plugin', title='dsh-mask',
               value=['Anonymize personal data', 'before it reaches the model'],
               sub='Phones, emails, IDs and cards become placeholders on your side; '
                   'the plaintext never enters the session log.',
               meta='PII masking  ·  reversible  ·  zero network',
               in_label='User message', out_label='What the model sees',
               in_text=['Check this: phone 13812345678,', 'email zhang@example.com'],
               out_text=['Check this: phone <PHONE_1>,', 'email <EMAIL_1>'],
               tag_in='plaintext stays here', tag_out='placeholders only',
               restore=['restore table', 'memory + dsh_mask', 'never the log'],
               foot='Apache-2.0  ·  PerryLink DSH plugin family'),
}


def wrap(d, text, f, maxw):
    words = text.split(' ') if ' ' in text else list(text)
    lines, cur = [], ''
    for wd in words:
        cand = (cur + ' ' + wd) if cur and text.find(' ') >= 0 else cur + wd
        if d.textlength(cand, font=f) <= maxw or not cur:
            cur = cand
        else:
            lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


def hero(lang, skin):
    s = SKIN[skin]
    w, h = 1600, 640
    img = gradient(w, h, s['bg_from'], s['bg_to'])
    img = glow(img, 1270, 130, 420, hx(s['accent']),
               26 if skin == 'light' else 40)
    img = glow(img, 220, 600, 320, hx(s['accent2']),
               12 if skin == 'light' else 18)
    H = HERO[lang]
    d = ImageDraw.Draw(img)

    # ----- left column -----
    pill(img, (80, 86), H['kicker'], s)
    d.text((80, 144), H['title'], font=font(78, 'mono'), fill=hx(s['text']))
    y = 262
    for line in H['value']:
        d.text((80, y), line, font=font(37, 'cjk_bold'), fill=hx(s['text']))
        y += 54
    fsub = font(19, 'cjk')
    sub_lines = wrap(d, H['sub'], fsub, 612)
    for i, ln in enumerate(sub_lines):
        d.text((82, 386 + i * 29), ln, font=fsub, fill=hx(s['sub']))
    meta_y = 386 + len(sub_lines) * 29 + 22
    d.text((82, meta_y), H['meta'], font=font(18, 'cjk'), fill=hx(s['faint']))
    d.line([82, meta_y + 52, 690, meta_y + 52], fill=hx(s['grid']), width=2)
    d.text((82, meta_y + 74), H['foot'], font=font(16, 'en'),
           fill=hx(s['faint']))

    # ----- right column: message card -> masked card, restore chip -----
    img = card(img, (760, 74, 1520, 322), s)
    img = card(img, (760, 404, 1160, 616), s)
    img = card(img, (1200, 404, 1520, 616), s)
    d = ImageDraw.Draw(img)
    # card A
    d.text((792, 100), H['in_label'], font=font(19, 'cjk_bold'),
           fill=hx(s['accent']))
    pill(img, (1290, 92), H['tag_in'], s, size=14, kind='cjk')
    d = ImageDraw.Draw(img)
    for i, ln in enumerate(H['in_text']):
        d.text((792, 146 + i * 34), ln, font=font(21, 'cjk'), fill=hx(s['text']))
    d.text((792, 232), '<PHONE_1>   <EMAIL_1>', font=font(19, 'mono'),
           fill=hx(s['accent']))
    d.text((792, 268), 'masked at agent/pre-step', font=font(15, 'mono'),
           fill=hx(s['faint']))
    # down arrow
    ax = 942
    d.line([ax, 330, ax, 372], fill=hx(s['accent']), width=4)
    d.polygon([(ax - 9, 370), (ax + 9, 370), (ax, 388)], fill=hx(s['accent']))
    # card B (masked)
    d.text((792, 430), H['out_label'], font=font(19, 'cjk_bold'),
           fill=hx(s['accent2']))
    for i, ln in enumerate(H['out_text']):
        d.text((792, 474 + i * 32), ln, font=font(20, 'cjk'), fill=hx(s['text']))
    d.text((792, 552), H['tag_out'], font=font(15, 'cjk'), fill=hx(s['faint']))
    # restore chip
    d.text((1232, 430), H['restore'][0], font=font(19, 'cjk_bold'),
           fill=hx(s['accent']))
    for i, ln in enumerate(H['restore'][1:]):
        d.text((1232, 474 + i * 26), ln, font=font(15, 'en'),
               fill=hx(s['sub'] if i == 0 else s['faint']))
    d.line([1232, 540, 1488, 540], fill=hx(s['grid']), width=2)
    d.text((1232, 556), 'reversible /mask restore', font=font(14, 'mono'),
           fill=hx(s['accent']))
    img.save(os.path.join(OUT, f'hero-{lang}-{skin}.webp'), 'WEBP', quality=92)
    print(f'hero-{lang}-{skin}.webp')


F1 = [('phone', 1.000), ('email', 1.000), ('id-card', 1.000),
      ('bank-card', 1.000), ('key', 1.000), ('ip (opt-in)', 0.833)]
EV = {
    'zh': dict(title='分类型 F1 · 108 个合成样本',
               sub='benchmark/RESULTS.md · 60 正 / 48 负 · 可复现：node benchmark/run.mjs',
               note='Macro F1 0.972  ·  Micro F1 0.968  ·  ip 是唯一有误报的类型（4 FP，FPR 0.500）',
               note2='未测量：person / address（仅 NER 路径，不在正则路径上）',
               tag='召回 1.000', big='0.972', big_label='Macro F1'),
    'en': dict(title='Per-type F1 · 108 synthetic samples',
               sub='benchmark/RESULTS.md · 60 positive / 48 negative · reproduce: node benchmark/run.mjs',
               note='Macro F1 0.972  ·  Micro F1 0.968  ·  ip is the only type with false positives (4 FP, FPR 0.500)',
               note2='Not measured: person / address (NER-only, not on the regex path)',
               tag='recall 1.000', big='0.972', big_label='Macro F1'),
}


def vgrad(w, h, c1, c2):
    a = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(a)
    for y in range(h):
        t = y / max(1, h - 1)
        d.line([(0, y), (w, y)],
               fill=tuple(int(p + (q - p) * t) for p, q in zip(hx(c1), hx(c2))))
    return a


def evidence(lang, skin):
    s = SKIN[skin]
    w, h = 1600, 640
    img = gradient(w, h, s['bg_from'], s['bg_to'])
    img = glow(img, 1430, 540, 360, hx(s['accent']),
               20 if skin == 'light' else 30)
    d = ImageDraw.Draw(img)
    E = EV[lang]
    d.text((80, 56), E['title'], font=font(38, 'cjk_bold'), fill=hx(s['text']))
    d.text((80, 112), E['sub'], font=font(17, 'cjk'), fill=hx(s['sub']))
    # big number block
    d.text((1180, 44), E['big'], font=font(104, 'en_bold'), fill=hx(s['accent']))
    d.text((1184, 150), E['big_label'], font=font(18, 'en_bold'),
           fill=hx(s['sub']))
    d.text((1184, 176), E['tag'], font=font(15, 'cjk'), fill=hx(s['accent2']))
    label_w = 220
    bar_x = 80 + label_w + 20
    bar_max = 900
    top = 196
    row = 56
    grad_hi = vgrad(bar_max, 34, s['accent2'], s['accent2'] + '')
    for i, (name, val) in enumerate(F1):
        y = top + i * row
        d.text((80, y + 3), name, font=font(20, 'en'), fill=hx(s['text']))
        d.rounded_rectangle([bar_x, y, bar_x + bar_max, y + 32], radius=16,
                            fill=hx(s['grid']))
        fillw = int(bar_max * val)
        color = s['accent2'] if val >= 0.999 else s['warn']
        d.rounded_rectangle([bar_x, y, bar_x + fillw, y + 32], radius=16,
                            fill=hx(color))
        # glossy top line
        d.rounded_rectangle([bar_x + 6, y + 4, bar_x + max(fillw - 6, 12),
                             y + 14], radius=5,
                            fill=tuple(min(255, c + 38) for c in hx(color)))
        d.text((bar_x + bar_max + 22, y - 1), f'{val:.3f}',
               font=font(21, 'en_bold'), fill=hx(s['text']))
    d.line([80, 552, 1520, 552], fill=hx(s['grid']), width=2)
    d.text((80, 568), E['note'], font=font(15, 'cjk'), fill=hx(s['sub']))
    d.text((80, 596), E['note2'], font=font(15, 'cjk'), fill=hx(s['faint']))
    img.save(os.path.join(OUT, f'dsh-mask-evidence-v2-{lang}-{skin}.webp'),
             'WEBP', quality=92)
    print(f'dsh-mask-evidence-v2-{lang}-{skin}.webp')


FLOW = {
    'light': dict(bg='#ffffff', card='#fcfcfe', edge='#e6e3f0', text='#16161d',
                  sub='#5b5f6e', accent='#4B67B4', accent2='#16a34a',
                  grid='#f2f0f8', pill='#efeaf9'),
    'dark': dict(bg='#0d1117', card='#161b26', edge='#2a3142', text='#eef2f8',
                 sub='#9aa3b5', accent='#8091f2', accent2='#3fb950',
                 grid='#151b27', pill='#232b40'),
}


def flow_svg(skin):
    s = FLOW[skin]
    W, H = 1200, 720
    nodes = [('01', 'user message', 'plaintext enters', 62),
             ('02', 'agent/pre-step', '→ <PHONE_1> …', 288),
             ('03', 'model', 'placeholder-only', 514),
             ('04', '/mask restore', 'explicit reveal', 740),
             ('05', 'controlled file', '0600 · per session', 966)]
    nw, nh = 186, 128
    y0 = 232
    solid = f"0.10" if skin == 'light' else "0.55"
    p = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="dsh-mask data flow">
<defs>
  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{s['accent']}" stop-opacity=".15"/>
    <stop offset=".5" stop-color="{s['accent']}" stop-opacity=".9"/>
    <stop offset="1" stop-color="{s['accent']}" stop-opacity=".15"/>
  </linearGradient>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="200%">
    <feDropShadow dx="0" dy="10" stdDeviation="13" flood-color="#1b1735" flood-opacity="{solid}"/>
  </filter>
  <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
    <circle cx="1.3" cy="1.3" r="1.3" fill="{s['grid']}"/>
  </pattern>
</defs>
<rect width="{W}" height="{H}" fill="{s['bg']}"/>
<rect width="{W}" height="{H}" fill="url(#dots)" opacity=".5"/>
<text x="62" y="74" fill="{s['text']}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="29" font-weight="700">dsh-mask</text>
<text x="62" y="104" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15">data flow · masking at the model boundary · restore table stays host-side</text>
<rect x="62" y="124" width="1076" height="1.5" rx="1" fill="{s['edge']}"/>''']
    for i, (num, title, sub, x) in enumerate(nodes):
        accent = s['accent2'] if i == 4 else (s['accent'] if i == 1 else s['edge'])
        stroke = 2.6 if i in (1, 4) else 1.3
        p.append(f'''<g filter="url(#soft)">
  <rect x="{x}" y="{y0}" width="{nw}" height="{nh}" rx="18" fill="{s['card']}" stroke="{accent}" stroke-width="{stroke}"/>
</g>
<circle cx="{x + 24}" cy="{y0 + 24}" r="12" fill="{s['pill']}"/>
<text x="{x + 24}" y="{y0 + 29}" text-anchor="middle" fill="{s['accent']}" font-family="ui-monospace, monospace" font-size="11" font-weight="700">{num}</text>
<text x="{x + nw / 2}" y="{y0 + 68}" text-anchor="middle" fill="{s['text']}" font-family="ui-monospace, monospace" font-size="14.5" font-weight="700">{escape(title)}</text>
<text x="{x + nw / 2}" y="{y0 + 94}" text-anchor="middle" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12">{escape(sub)}</text>''')
        if i < len(nodes) - 1:
            x0, x1 = x + nw + 8, nodes[i + 1][3] - 8
            mid = (x0 + x1) / 2
            yy = y0 + nh / 2
            p.append(f'''<path d="M{x0} {yy} C{mid} {yy}, {mid} {yy}, {x1} {yy}" stroke="url(#lineGrad)" stroke-width="2.2" fill="none"/>
<path d="M{x1 - 11} {yy - 5.5} l9 5.5 -9 5.5" fill="none" stroke="{s['accent']}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>''')
    bx, by, bw = 288, 432, 620
    p.append(f'''<path d="M381 {y0 + nh} V{by}" stroke="{s['accent']}" stroke-width="1.8" stroke-dasharray="5 6" opacity=".75"/>
<path d="M833 {y0 + nh} V{by}" stroke="{s['accent']}" stroke-width="1.8" stroke-dasharray="5 6" opacity=".75"/>
<g filter="url(#soft)">
  <rect x="{bx}" y="{by}" width="{bw}" height="66" rx="16" fill="{s['pill']}" stroke="{s['accent']}" stroke-width="1.4"/>
</g>
<text x="{bx + 26}" y="{by + 28}" fill="{s['accent']}" font-family="ui-monospace, monospace" font-size="12.5" font-weight="700">restore table</text>
<text x="{bx + 26}" y="{by + 49}" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12.5">memory + dsh_mask storage domain · never the session log</text>
<rect x="62" y="566" width="1076" height="66" rx="16" fill="{s['card']}" stroke="{s['edge']}"/>
<text x="86" y="594" fill="{s['accent']}" font-family="ui-monospace, monospace" font-size="12.5" font-weight="700">mask/applied</text>
<text x="86" y="616" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12.5">session event = counts + type distribution only · the plaintext never enters the log</text>
<circle cx="1090" cy="600" r="4.5" fill="{s['accent2']}"/>
<text x="1102" y="605" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="11.5">audit</text>
<text x="62" y="686" fill="{s['sub']}" font-family="ui-monospace, monospace" font-size="12">Apache-2.0 · PerryLink DSH plugin family</text>
</svg>''')
    with open(os.path.join(OUT, f'dsh-mask-flow-v2-{skin}.svg'), 'w',
              encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(p) + '\n')
    print(f'dsh-mask-flow-v2-{skin}.svg')


def main():
    os.makedirs(OUT, exist_ok=True)
    for skin in ('light', 'dark'):
        for lang in ('zh', 'en'):
            hero(lang, skin)
            evidence(lang, skin)
        flow_svg(skin)


if __name__ == '__main__':
    main()
