#!/usr/bin/env python3
"""README visuals for dsh-mask — v4.

The second figure is not a generic left-to-right pipeline: the plugin's whole
point is what happens on each SIDE of the model boundary, plus the restore loop.
So the diagram is a two-zone layout split by a dashed boundary, with the restore
path drawn back from the host side.
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
    'light': dict(bg_from='#f9f6fd', bg_to='#e4eaf8', card='#ffffff',
                  card_edge='#e4e1ee', text='#141419', sub='#4d5261',
                  faint='#8f94a4', accent='#4B67B4', accent2='#16a34a',
                  warn='#bc4c00', pill='#ece7f9', grid='#e7e4f0',
                  shadow=(32, 26, 64)),
    'dark': dict(bg_from='#131a2a', bg_to='#0c1016', card='#1b2231',
                 card_edge='#2e374b', text='#f0f3f9', sub='#a8b1c4',
                 faint='#737b8d', accent='#8496f5', accent2='#3fb950',
                 warn='#d29922', pill='#242d42', grid='#1e2636',
                 shadow=(0, 0, 0)),
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


def pill(img, xy, text, skin, size=16, fg=None, bg=None, kind='cjk_bold'):
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    tw = d.textlength(text, font=f)
    x, y = xy
    h = size + 18
    d.rounded_rectangle([x, y, x + tw + 32, y + h], radius=h // 2,
                        fill=hx(bg or skin['pill']))
    d.text((x + 16, y + 7), text, font=f, fill=hx(fg or skin['accent']))


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
               out_text=['Check this: phone <PHONE_1>，', 'email <EMAIL_1>'],
               tag_in='plaintext stays here', tag_out='placeholders only',
               restore=['restore table', 'memory + dsh_mask', 'never the log'],
               foot='Apache-2.0  ·  PerryLink DSH plugin family'),
}


def hero(lang, skin):
    s = SKIN[skin]
    w, h = 1440, 576
    img = gradient(w, h, s['bg_from'], s['bg_to'])
    img = glow(img, 1160, 90, 380, hx(s['accent']), 30 if skin == 'light' else 44)
    img = glow(img, 200, 540, 280, hx(s['accent2']), 12 if skin == 'light' else 18)
    H = HERO[lang]
    d = ImageDraw.Draw(img)
    m = 60
    pill(img, (m, m), H['kicker'], s, size=17)
    d = ImageDraw.Draw(img)
    tsize = 84
    while tsize > 44:
        tf = font(tsize, 'mono')
        if d.textlength(H['title'], font=tf) <= 540:
            break
        tsize -= 4
    d.text((m, 112 + (84 - tsize) // 2), H['title'], font=font(tsize, 'mono'),
           fill=hx(s['text']))
    y = 228
    for line in H['value']:
        d.text((m, y), line, font=font(40, 'cjk_bold'), fill=hx(s['text']))
        y += 54
    fsub = font(26, 'cjk')
    lines = []
    for para in H['sub'].split('\n'):
        lines += wrap(d, para, fsub, 520)
    for i, ln in enumerate(lines):
        d.text((m + 2, 348 + i * 36), ln, font=fsub, fill=hx(s['sub']))
    meta_y = 348 + len(lines) * 36 + 18
    d.text((m + 2, meta_y), H['meta'], font=font(20, 'cjk'), fill=hx(s['faint']))
    d.line([m + 2, meta_y + 44, m + 540, meta_y + 44], fill=hx(s['grid']), width=2)
    d.text((m + 2, meta_y + 60), H['foot'], font=font(17, 'en'),
           fill=hx(s['faint']))

    # right: message -> masked, restore card
    img = card(img, (660, 56, 1380, 272), s)
    img = card(img, (660, 322, 1044, 516), s)
    img = card(img, (1080, 322, 1380, 516), s)
    d = ImageDraw.Draw(img)
    d.text((692, 82), H['in_label'], font=font(20, 'cjk_bold'), fill=hx(s['accent']))
    pill(img, (1216, 74), H['tag_in'], s, size=15, kind='cjk')
    d = ImageDraw.Draw(img)
    for i, ln in enumerate(H['in_text']):
        d.text((692, 128 + i * 34), ln, font=font(22, 'cjk'), fill=hx(s['text']))
    d.text((692, 208), '<PHONE_1>   <EMAIL_1>', font=font(20, 'mono'),
           fill=hx(s['accent']))
    d.text((692, 238), 'masked at agent/pre-step', font=font(16, 'mono'),
           fill=hx(s['faint']))
    ax = 852
    d.line([ax, 280, ax, 306], fill=hx(s['accent']), width=5)
    d.polygon([(ax - 10, 304), (ax + 10, 304), (ax, 320)], fill=hx(s['accent']))
    d.text((692, 348), H['out_label'], font=font(20, 'cjk_bold'), fill=hx(s['accent2']))
    for i, ln in enumerate(H['out_text']):
        d.text((692, 392 + i * 32), ln, font=font(21, 'cjk'), fill=hx(s['text']))
    d.text((692, 462), H['tag_out'], font=font(16, 'cjk'), fill=hx(s['faint']))
    d.text((1112, 348), H['restore'][0], font=font(20, 'cjk_bold'), fill=hx(s['accent']))
    for i, ln in enumerate(H['restore'][1:]):
        d.text((1112, 392 + i * 26), ln, font=font(16, 'en'),
               fill=hx(s['sub'] if i == 0 else s['faint']))
    d.line([1112, 452, 1348, 452], fill=hx(s['grid']), width=2)
    d.text((1112, 468), 'reversible /mask restore', font=font(15, 'mono'),
           fill=hx(s['accent']))
    img.save(os.path.join(OUT, f'hero-{lang}-{skin}-v3.webp'), 'WEBP', quality=92)
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
    img = glow(img, 1300, 480, 320, hx(s['accent']), 20 if skin == 'light' else 30)
    d = ImageDraw.Draw(img)
    E = EV[lang]
    m = 60
    d.text((m, 46), E['title'], font=font(42, 'cjk_bold'), fill=hx(s['text']))
    d.text((m, 100), E['sub'], font=font(19, 'cjk'), fill=hx(s['sub']))
    d.text((1020, 24), E['big'], font=font(92, 'en_bold'), fill=hx(s['accent']))
    d.text((1024, 118), E['big_label'], font=font(19, 'en_bold'), fill=hx(s['sub']))
    d.text((1024, 142), E['tag'], font=font(16, 'cjk'), fill=hx(s['accent2']))
    label_w, bar_max = 170, 620
    bar_x = m + label_w + 20
    top, row, bh = 176, 52, 30
    for i, (name, val) in enumerate(F1):
        y = top + i * row
        d.text((m, y + 1), name, font=font(22, 'en'), fill=hx(s['text']))
        d.rounded_rectangle([bar_x, y, bar_x + bar_max, y + bh], radius=15, fill=hx(s['grid']))
        fillw = int(bar_max * val)
        color = s['accent2'] if val >= 0.999 else s['warn']
        d.rounded_rectangle([bar_x, y, bar_x + fillw, y + bh], radius=15, fill=hx(color))
        d.rounded_rectangle([bar_x + 5, y + 4, bar_x + max(fillw - 5, 10), y + 13],
                            radius=5, fill=tuple(min(255, c + 34) for c in hx(color)))
        d.text((bar_x + bar_max + 20, y - 2), f'{val:.3f}', font=font(22, 'en_bold'),
               fill=hx(s['text']))
    d.line([m, 486, w - m, 486], fill=hx(s['grid']), width=2)
    d.text((m, 500), E['note'], font=font(19, 'cjk'), fill=hx(s['sub']))
    d.text((m, 532), E['note2'], font=font(18, 'cjk'), fill=hx(s['faint']))
    img.save(os.path.join(OUT, f'dsh-mask-evidence-v3-{lang}-{skin}.webp'),
             'WEBP', quality=92)
    print(f'dsh-mask-evidence-v3-{lang}-{skin}.webp')


FLOW = {'light': dict(bg='#ffffff', zone='#f7f5fc', card='#ffffff',
                      edge='#e6e3f0', text='#141419', sub='#4d5261',
                      accent='#4B67B4', accent2='#16a34a', grid='#f2f0f8',
                      pill='#ece7f9', faint='#8f94a4'),
        'dark': dict(bg='#0d1117', zone='#121824', card='#161b26', edge='#2a3142',
                     text='#f0f3f9', sub='#a8b1c4', accent='#8496f5',
                     accent2='#3fb950', grid='#182031', pill='#242d42',
                     faint='#737b8d')}


def flow_svg(skin):
    """Two zones split by the model boundary + a restore loop back."""
    s = FLOW[skin]
    W, H = 1100, 660
    solid = "0.10" if skin == 'light' else "0.55"
    p = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="dsh-mask two-zone diagram: host side and model side split by the model boundary, with the restore loop">
<defs>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="200%">
    <feDropShadow dx="0" dy="9" stdDeviation="12" flood-color="#1b1735" flood-opacity="{solid}"/>
  </filter>
  <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
    <circle cx="1.3" cy="1.3" r="1.3" fill="{s['grid']}"/>
  </pattern>
  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="{s['accent']}"/>
  </marker>
  <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="{s['accent2']}"/>
  </marker>
</defs>
<rect width="{W}" height="{H}" fill="{s['bg']}"/>
<rect width="{W}" height="{H}" fill="url(#dots)" opacity=".5"/>
<text x="50" y="58" fill="{s['text']}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="32" font-weight="700">dsh-mask</text>
<text x="50" y="86" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16">the model boundary is the whole design: mask on this side, placeholders on the other</text>

<!-- zone backgrounds -->
<rect x="42" y="112" width="520" height="470" rx="22" fill="{s['zone']}" stroke="{s['edge']}"/>
<rect x="600" y="112" width="458" height="470" rx="22" fill="{s['zone']}" stroke="{s['edge']}"/>
<text x="66" y="142" fill="{s['accent']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="700">YOUR MACHINE</text>
<text x="624" y="142" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="700">WHAT THE MODEL SEES</text>

<!-- boundary -->
<line x1="581" y1="112" x2="581" y2="582" stroke="{s['accent']}" stroke-width="2" stroke-dasharray="7 7" opacity=".75"/>
<g transform="translate(581 352) rotate(-90)">
  <text x="0" y="0" text-anchor="middle" fill="{s['accent']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12.5" font-weight="700" letter-spacing="2">MODEL BOUNDARY</text>
</g>

<!-- host side cards -->
<g filter="url(#soft)">
  <rect x="66" y="164" width="472" height="118" rx="16" fill="{s['card']}" stroke="{s['edge']}"/>
</g>
<text x="86" y="190" fill="{s['accent']}" font-family="ui-monospace, monospace" font-size="13" font-weight="700">user message</text>
<text x="86" y="220" fill="{s['text']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="17">帮我核对下：电话 13812345678，</text>
<text x="86" y="246" fill="{s['text']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="17">邮箱 zhang@example.com</text>
<text x="86" y="270" fill="{s['faint']}" font-family="ui-monospace, monospace" font-size="12">plaintext stays on this side</text>

<g filter="url(#soft)">
  <rect x="66" y="304" width="472" height="112" rx="16" fill="{s['card']}" stroke="{s['accent']}" stroke-width="2.2"/>
</g>
<text x="86" y="330" fill="{s['accent']}" font-family="ui-monospace, monospace" font-size="13" font-weight="700">agent/pre-step · mask</text>
<text x="86" y="362" fill="{s['text']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="17">电话 &lt;PHONE_1&gt;，邮箱 &lt;EMAIL_1&gt;</text>
<text x="86" y="392" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">rewrite happens here, before the log</text>

<g filter="url(#soft)">
  <rect x="66" y="438" width="472" height="118" rx="16" fill="{s['card']}" stroke="{s['edge']}"/>
</g>
<text x="86" y="464" fill="{s['accent']}" font-family="ui-monospace, monospace" font-size="13" font-weight="700">restore table</text>
<text x="86" y="494" fill="{s['text']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="17">memory + dsh_mask domain</text>
<text x="86" y="520" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">/mask restore → a 0600 file, one per session</text>
<text x="86" y="542" fill="{s['faint']}" font-family="ui-monospace, monospace" font-size="12">never the session log</text>

<!-- arrows: message -> mask -> (boundary) model -->
<line x1="302" y1="282" x2="302" y2="302" stroke="{s['accent']}" stroke-width="2.4" marker-end="url(#arr)"/>
<line x1="538" y1="360" x2="640" y2="360" stroke="{s['accent']}" stroke-width="2.4" marker-end="url(#arr)"/>

<!-- model side cards -->
<g filter="url(#soft)">
  <rect x="618" y="196" width="422" height="160" rx="16" fill="{s['card']}" stroke="{s['accent2']}" stroke-width="2.2"/>
</g>
<text x="638" y="226" fill="{s['accent2']}" font-family="ui-monospace, monospace" font-size="13" font-weight="700">model</text>
<text x="638" y="260" fill="{s['text']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="17">电话 &lt;PHONE_1&gt;，邮箱 &lt;EMAIL_1&gt;</text>
<text x="638" y="292" fill="{s['sub']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">placeholder-only · reversible by the host</text>
<text x="638" y="322" fill="{s['faint']}" font-family="ui-monospace, monospace" font-size="12">mask/applied = counts + types, no plaintext</text>

<!-- restore loop back to host -->
<path d="M830 356 C830 470, 680 500, 552 492" stroke="{s['accent2']}" stroke-width="2.2" fill="none" stroke-dasharray="6 6" marker-end="url(#arr2)"/>
<text x="620" y="452" fill="{s['accent2']}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12">explicit restore</text>

<text x="50" y="622" fill="{s['sub']}" font-family="ui-monospace, monospace" font-size="13">Apache-2.0 · PerryLink DSH plugin family</text>
</svg>''']
    with open(os.path.join(OUT, f'dsh-mask-flow-v4-{skin}.svg'), 'w',
              encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(p) + '\n')
    print(f'dsh-mask-flow-v4-{skin}.svg')


def main():
    os.makedirs(OUT, exist_ok=True)
    for skin in ('light', 'dark'):
        for lang in ('zh', 'en'):
            hero(lang, skin)
            evidence(lang, skin)
        flow_svg(skin)


if __name__ == '__main__':
    main()
