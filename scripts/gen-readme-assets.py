#!/usr/bin/env python3
"""README visuals for dsh-mask — v3.

Lessons applied (measured, not guessed):
  * GitHub renders README images at ~880px wide. At 1440px canvas that is
    scale 0.61; every on-canvas size is chosen so the on-screen size stays
    readable: title >= 45px, secondary >= 15px, meta/notes >= 12px.
  * Type scale follows the inspected samples (media-desk / dsh-Go):
    display : value : secondary : meta  ~=  3.2 : 1.5 : 1 : 0.75.
  * Right-side visual takes ~50% of the hero width (the samples use 55%).
  * Spacing on a 4px grid; group gaps stay >= 1.2x the local line height.
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
    'light': dict(bg_from='#f9f6fd', bg_to='#e4eaf8',
                  card='#ffffff', card_edge='#e4e1ee',
                  text='#141419', sub='#4d5261', faint='#8f94a4',
                  accent='#4B67B4', accent2='#16a34a', warn='#bc4c00',
                  pill='#ece7f9', grid='#e7e4f0', shadow=(32, 26, 64)),
    'dark': dict(bg_from='#131a2a', bg_to='#0c1016',
                 card='#1b2231', card_edge='#2e374b',
                 text='#f0f3f9', sub='#a8b1c4', faint='#737b8d',
                 accent='#8496f5', accent2='#3fb950', warn='#d29922',
                 pill='#242d42', grid='#1e2636', shadow=(0, 0, 0)),
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
        t = 0.2 * (y / h) + 0.8 * (y / h) ** 1.5
        d.line([(0, y), (w, y)],
               fill=tuple(int(p + (q - p) * t) for p, q in zip(hx(c1), hx(c2))))
    return a


def glow(img, cx, cy, r, color, alpha=60):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(9, 0, -1):
        rr = r * i / 9
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=color + (int(alpha * (1 - i / 10)),))
    return Image.alpha_composite(img.convert('RGBA'), layer).convert('RGB')


def card(img, box, skin, radius=20, shadow=22):
    x0, y0, x1, y1 = box
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i in range(shadow, 0, -3):
        sd.rounded_rectangle([x0 - i // 4, y0 + i // 2, x1 + i // 4, y1 + i],
                             radius=radius + i // 4,
                             fill=skin['shadow'] + (int(8 * (1 - i / shadow)),))
    base = Image.alpha_composite(img.convert('RGBA'),
                                 sh.filter(ImageFilter.GaussianBlur(11)))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=hx(skin['card']),
                        outline=hx(skin['card_edge']), width=2)
    return base.convert('RGB')


def pill(img, xy, text, skin, size=18, fg=None, bg=None, kind='cjk_bold'):
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    tw = d.textlength(text, font=f)
    x, y = xy
    h = size + 20
    d.rounded_rectangle([x, y, x + tw + 36, y + h], radius=h // 2,
                        fill=hx(bg or skin['pill']))
    d.text((x + 18, y + 8), text, font=f, fill=hx(fg or skin['accent']))
    return h


def wrap(d, text, f, maxw):
    if ' ' in text:
        words, lines, cur = text.split(' '), [], ''
        for wd in words:
            cand = (cur + ' ' + wd) if cur else wd
            if d.textlength(cand, font=f) <= maxw or not cur:
                cur = cand
            else:
                lines.append(cur)
                cur = wd
        if cur:
            lines.append(cur)
        return lines
    lines, cur = [], ''
    for ch in text:
        if d.textlength(cur + ch, font=f) <= maxw or not cur:
            cur += ch
        else:
            lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


HERO = {
    'zh': dict(kicker='DeepSeek Harness Plugin', title='dsh-mask',
               value=['在个人数据抵达模型之前', '完成脱敏'],
               sub='电话、邮箱、证件、银行卡在你这一侧\n换成占位符；原文永不进入会话日志。',
               meta='PII 遮罩  ·  可逆恢复  ·  零网络请求',
               in_label='用户消息', out_label='模型看到的消息',
               in_text=['帮我核对下：电话 13812345678，', '邮箱 zhang@example.com'],
               out_text=['帮我核对下：电话 <PHONE_1>，', '邮箱 <EMAIL_1>'],
               tag_in='原文只在本机', tag_out='占位符才落盘',
               restore=['恢复表', 'memory + dsh_mask', 'never the log'],
               foot='Apache-2.0  ·  PerryLink DSH plugin family'),
    'en': dict(kicker='DeepSeek Harness Plugin', title='dsh-mask',
               value=['Anonymize personal data', 'before it reaches the model'],
               sub='Phones, emails, IDs and cards become placeholders on your side; the plaintext never enters the session log.',
               meta='PII masking  ·  reversible  ·  zero network',
               in_label='User message', out_label='What the model sees',
               in_text=['Check this: phone 13812345678,', 'email zhang@example.com'],
               out_text=['Check this: phone <PHONE_1>,', 'email <EMAIL_1>'],
               tag_in='plaintext stays here', tag_out='placeholders only',
               restore=['restore table', 'memory + dsh_mask', 'never the log'],
               foot='Apache-2.0  ·  PerryLink DSH plugin family'),
}


def hero(lang, skin):
    s = SKIN[skin]
    w, h = 1440, 576
    img = gradient(w, h, s['bg_from'], s['bg_to'])
    img = glow(img, 1160, 90, 380, hx(s['accent']),
               30 if skin == 'light' else 44)
    img = glow(img, 200, 540, 280, hx(s['accent2']),
               12 if skin == 'light' else 18)
    H = HERO[lang]
    d = ImageDraw.Draw(img)
    m = 60

    # ---- left column ----
    pill(img, (m, m), H['kicker'], s)
    d = ImageDraw.Draw(img)
    d.text((m, 112), H['title'], font=font(84, 'mono'), fill=hx(s['text']))
    y = 232
    for line in H['value']:
        d.text((m, y), line, font=font(40, 'cjk_bold'), fill=hx(s['text']))
        y += 54
    fsub = font(26, 'cjk')
    sub_lines = []
    for para in H['sub'].split('\n'):
        sub_lines += wrap(d, para, fsub, 520)
    for i, ln in enumerate(sub_lines):
        d.text((m + 2, 352 + i * 37), ln, font=fsub, fill=hx(s['sub']))
    meta_y = 352 + len(sub_lines) * 37 + 20
    d.text((m + 2, meta_y), H['meta'], font=font(20, 'cjk'),
           fill=hx(s['faint']))
    d.line([m + 2, meta_y + 46, m + 540, meta_y + 46],
           fill=hx(s['grid']), width=2)
    d.text((m + 2, meta_y + 62), H['foot'], font=font(17, 'en'),
           fill=hx(s['faint']))

    # ---- right column: message -> masked -> restore (50% width) ----
    img = card(img, (660, 56, 1380, 272), s)
    img = card(img, (660, 322, 1044, 516), s)
    img = card(img, (1080, 322, 1380, 516), s)
    d = ImageDraw.Draw(img)
    d.text((692, 82), H['in_label'], font=font(20, 'cjk_bold'),
           fill=hx(s['accent']))
    pill(img, (1216, 74), H['tag_in'], s, size=15, kind='cjk')
    d = ImageDraw.Draw(img)
    for i, ln in enumerate(H['in_text']):
        d.text((692, 128 + i * 34), ln, font=font(22, 'cjk'),
               fill=hx(s['text']))
    d.text((692, 208), '<PHONE_1>   <EMAIL_1>', font=font(20, 'mono'),
           fill=hx(s['accent']))
    d.text((692, 238), 'masked at agent/pre-step', font=font(16, 'mono'),
           fill=hx(s['faint']))
    # arrow
    ax = 852
    d.line([ax, 280, ax, 306], fill=hx(s['accent']), width=5)
    d.polygon([(ax - 10, 304), (ax + 10, 304), (ax, 320)],
              fill=hx(s['accent']))
    # masked card
    d.text((692, 348), H['out_label'], font=font(20, 'cjk_bold'),
           fill=hx(s['accent2']))
    for i, ln in enumerate(H['out_text']):
        d.text((692, 392 + i * 32), ln, font=font(21, 'cjk'),
               fill=hx(s['text']))
    d.text((692, 462), H['tag_out'], font=font(16, 'cjk'), fill=hx(s['faint']))
    # restore card
    d.text((1112, 348), H['restore'][0], font=font(20, 'cjk_bold'),
           fill=hx(s['accent']))
    for i, ln in enumerate(H['restore'][1:]):
        d.text((1112, 392 + i * 26), ln, font=font(16, 'en'),
               fill=hx(s['sub'] if i == 0 else s['faint']))
    d.line([1112, 452, 1348, 452], fill=hx(s['grid']), width=2)
    d.text((1112, 468), 'reversible /mask restore', font=font(15, 'mono'),
           fill=hx(s['accent']))
    img.save(os.path.join(OUT, f'hero-{lang}-{skin}-v3.webp'), 'WEBP',
             quality=92)
    print(f'hero-{lang}-{skin}-v3.webp')


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


def evidence(lang, skin):
    s = SKIN[skin]
    w, h = 1440, 576
    img = gradient(w, h, s['bg_from'], s['bg_to'])
    img = glow(img, 1300, 480, 320, hx(s['accent']),
               20 if skin == 'light' else 30)
    d = ImageDraw.Draw(img)
    E = EV[lang]
    m = 60
    d.text((m, 46), E['title'], font=font(42, 'cjk_bold'), fill=hx(s['text']))
    d.text((m, 100), E['sub'], font=font(19, 'cjk'), fill=hx(s['sub']))
    d.text((1020, 24), E['big'], font=font(92, 'en_bold'), fill=hx(s['accent']))
    d.text((1024, 118), E['big_label'], font=font(19, 'en_bold'),
           fill=hx(s['sub']))
    d.text((1024, 142), E['tag'], font=font(16, 'cjk'), fill=hx(s['accent2']))
    label_w, bar_max = 170, 620
    bar_x = m + label_w + 20
    top, row, bh = 176, 52, 30
    for i, (name, val) in enumerate(F1):
        y = top + i * row
        d.text((m, y + 1), name, font=font(22, 'en'), fill=hx(s['text']))
        d.rounded_rectangle([bar_x, y, bar_x + bar_max, y + bh], radius=15,
                            fill=hx(s['grid']))
        fillw = int(bar_max * val)
        color = s['accent2'] if val >= 0.999 else s['warn']
        d.rounded_rectangle([bar_x, y, bar_x + fillw, y + bh], radius=15,
                            fill=hx(color))
        d.rounded_rectangle([bar_x + 5, y + 4, bar_x + max(fillw - 5, 10),
                             y + 13], radius=5,
                            fill=tuple(min(255, c + 34) for c in hx(color)))
        d.text((bar_x + bar_max + 20, y - 2), f'{val:.3f}',
               font=font(22, 'en_bold'), fill=hx(s['text']))
    d.line([m, 486, w - m, 486], fill=hx(s['grid']), width=2)
    d.text((m, 500), E['note'], font=font(19, 'cjk'), fill=hx(s['sub']))
    d.text((m, 532), E['note2'], font=font(18, 'cjk'), fill=hx(s['faint']))
    img.save(os.path.join(OUT, f'dsh-mask-evidence-v3-{lang}-{skin}.webp'),
             'WEBP', quality=92)
    print(f'dsh-mask-evidence-v3-{lang}-{skin}.webp')


FLOW = {
    'light': dict(bg='#ffffff', card='#fcfcfe', edge='#e6e3f0', text='#141419',
                  sub='#4d5261', accent='#4B67B4', accent2='#16a34a',
                  grid='#f2f0f8', pill='#ece7f9'),
    'dark': dict(bg='#0d1117', card='#161b26', edge='#2a3142', text='#f0f3f9',
                 sub='#a8b1c4', accent='#8496f5', accent2='#3fb950',
                 grid='#182031', pill='#242d42'),
}


def flow_svg(skin):
    s = FLOW[skin]
    W, H = 1100, 660
    nodes = [('01', 'user message', 'plaintext enters', 50),
             ('02', 'agent/pre-step', '-> <PHONE_1>', 256),
             ('03', 'model', 'placeholder-only', 462),
             ('04', '/mask restore', 'explicit reveal', 668),
             ('05', 'controlled file', '0600 per session', 898)]
    nw, nh, y0 = 176, 118, 190
    solid = "0.10" if skin == 'light' else "0.55"
    p = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="dsh-mask data flow">
<defs>
  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{s['accent']}" stop-opacity=".15"/>
    <stop offset=".5" stop-color="{s['accent']}" stop-opacity=".9"/>
    <stop offset="1" stop-color="{s['accent']}" stop-opacity=".15"/>
  </linearGradient>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="200%">
    <feDropShadow dx="0" dy="9" stdDeviation="12" flood-color="#1b1735" flood-opacity="{solid}"/>
  </filter>
  <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
    <circle cx="1.3" cy="1.3" r="1.3" fill="{s['grid']}"/>
  </pattern>
</defs>
<rect width="{W}" height="{H}" fill="{s['bg']}"/>
<rect width="{W}" height="{H}" fill="url(#dots)" opacity=".5"/>
<text x="50" y="62" fill="{s['text']}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="32" font-weight="700">dsh-mask</text>
<text x="50" y="90" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16">data flow · masking at the model boundary · restore table stays host-side</text>
<rect x="50" y="108" width="1000" height="1.6" rx="1" fill="{s['edge']}"/>''']
    for i, (num, title, sub, x) in enumerate(nodes):
        accent = s['accent2'] if i == 4 else (s['accent'] if i == 1 else s['edge'])
        stroke = 2.6 if i in (1, 4) else 1.3
        p.append(f'''<g filter="url(#soft)">
  <rect x="{x}" y="{y0}" width="{nw}" height="{nh}" rx="17" fill="{s['card']}" stroke="{accent}" stroke-width="{stroke}"/>
</g>
<circle cx="{x + 24}" cy="{y0 + 24}" r="12" fill="{s['pill']}"/>
<text x="{x + 24}" y="{y0 + 29}" text-anchor="middle" fill="{s['accent']}" font-family="ui-monospace, monospace" font-size="11.5" font-weight="700">{num}</text>
<text x="{x + nw / 2}" y="{y0 + 66}" text-anchor="middle" fill="{s['text']}" font-family="ui-monospace, monospace" font-size="16" font-weight="700">{escape(title)}</text>
<text x="{x + nw / 2}" y="{y0 + 92}" text-anchor="middle" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">{escape(sub)}</text>''')
        if i < len(nodes) - 1:
            x0, x1 = x + nw + 5, nodes[i + 1][3] - 5
            mid, yy = (x0 + x1) / 2, y0 + nh / 2
            p.append(f'''<path d="M{x0} {yy} C{mid} {yy}, {mid} {yy}, {x1} {yy}" stroke="url(#lineGrad)" stroke-width="2.2" fill="none"/>
<path d="M{x1 - 10} {yy - 5} l8 5 -8 5" fill="none" stroke="{s['accent']}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>''')
    bx, by, bw = 256, 378, 588
    p.append(f'''<path d="M344 {y0 + nh} V{by}" stroke="{s['accent']}" stroke-width="1.7" stroke-dasharray="5 6" opacity=".75"/>
<path d="M756 {y0 + nh} V{by}" stroke="{s['accent']}" stroke-width="1.7" stroke-dasharray="5 6" opacity=".75"/>
<g filter="url(#soft)">
  <rect x="{bx}" y="{by}" width="{bw}" height="58" rx="15" fill="{s['pill']}" stroke="{s['accent']}" stroke-width="1.3"/>
</g>
<text x="{bx + 24}" y="{by + 25}" fill="{s['accent']}" font-family="ui-monospace, monospace" font-size="13" font-weight="700">restore table</text>
<text x="{bx + 24}" y="{by + 44}" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">memory + dsh_mask storage domain · never the session log</text>
<rect x="50" y="476" width="1000" height="58" rx="15" fill="{s['card']}" stroke="{s['edge']}"/>
<text x="74" y="502" fill="{s['accent']}" font-family="ui-monospace, monospace" font-size="13" font-weight="700">mask/applied</text>
<text x="74" y="522" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">session event = counts + type distribution only · the plaintext never enters the log</text>
<circle cx="994" cy="506" r="4.5" fill="{s['accent2']}"/>
<text x="1006" y="511" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12">audit</text>
<text x="50" y="596" fill="{s['sub']}" font-family="ui-monospace, monospace" font-size="13">Apache-2.0 · PerryLink DSH plugin family</text>
</svg>''')
    with open(os.path.join(OUT, f'dsh-mask-flow-v3-{skin}.svg'), 'w',
              encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(p) + '\n')
    print(f'dsh-mask-flow-v3-{skin}.svg')


def main():
    os.makedirs(OUT, exist_ok=True)
    for skin in ('light', 'dark'):
        for lang in ('zh', 'en'):
            hero(lang, skin)
            evidence(lang, skin)
        flow_svg(skin)


if __name__ == '__main__':
    main()
