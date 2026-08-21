<div align="center">

# dsh-mask

**DeepSeek Harness के लिए PII मास्किंग मिडलवेयर — मॉडल तक पहुँचने से पहले व्यक्तिगत डेटा को अनाम करें, डिस्प्ले लेयर पर उसे वापस लाएँ।**

*फ़ोन, ईमेल, आईडी कार्ड, बैंक कार्ड, कुंजियाँ आदि मॉडल सीमा पर प्लेसहोल्डर बन जाते हैं; मूल पाठ आपके सत्र लॉग में कभी नहीं जाता।*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-mask/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-mask/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-mask?label=version)](https://github.com/PerryLink/dsh-mask/releases)
[![npm version](https://img.shields.io/npm/v/dsh-mask)](https://www.npmjs.com/package/dsh-mask)
[![npm downloads](https://img.shields.io/npm/dm/dsh-mask)](https://www.npmjs.com/package/dsh-mask)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## Compatibility

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.8` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| प्लेटफ़ॉर्म | जहाँ DSH चले (शुद्ध host, शून्य-निर्भरता regex; कोई ब्राउज़र आधा नहीं) |
| मॉडल | टेक्स्ट मॉडल पूर्ण रूप से समर्थित |

## What you get

`dsh-mask` व्यक्तिगत डेटा को **मॉडल सीमा पर** अनाम करता है और पुनर्स्थापना तालिका रखता है:

- **अनुरोध से पहले मास्किंग** — `agent/pre-step` संदेशों को फिर से लिखता है ताकि फ़ोन, ईमेल, आईडी कार्ड, बैंक कार्ड, कुंजियाँ और IP (opt-in) `<PHONE_1>` जैसे प्लेसहोल्डर बन जाएँ। मास्क किया हुआ पाठ ही लॉग होता है और मॉडल को जाता है।
- **पुनर्स्थापना तालिका** — `प्लेसहोल्डर → मूल` नक्शा केवल मेमोरी और नियंत्रित स्टोरेज डोमेन (`dsh_mask`) में रहता है; मूल पाठ सत्र लॉग में कभी नहीं जाता।
- **बिना मूल पाठ की ऑडिट** — `mask/applied` इवेंट केवल «N मान बदले + प्रकार-वितरण» दर्ज करता है।
- **`/mask` कमांड** — `status`, `on`/`off`, `restore <text>`, `help`।
- **`mask_test` टूल** — एक अंश चलाकर प्लेसहोल्डर परिणाम देखें; मूल मान कभी नहीं दिखाता।

```text
उपयोगकर्ता संदेश ──agent/pre-step──▶ प्लेसहोल्डर ──मॉडल──▶ प्लेसहोल्डर ──restore──▶ डिस्प्ले
                                          ▲                                              │
                                          └──── पुनर्स्थापना तालिका (मेमोरी + dsh_mask) ─┘
```

## Quick start

```sh
dsh plugin --profile web add "github:PerryLink/dsh-mask#main"
# या npm से
dsh plugin --profile web add dsh-mask
dsh --profile web --dump-config | grep -A2 'id: mask'
```

```yaml
- insert:
    - id: mask
      name: dsh-mask
      config:
        entities: [phone, email, id-card, bank-card, key]
```

```
> /mask status
> /mask restore <PHONE_1>
```

## Install & uninstall

- **git चैनल**: `dsh plugin --profile web add "github:PerryLink/dsh-mask#main"` (`git+https://github.com/PerryLink/dsh-mask.git` के बराबर)। कोई build चरण नहीं।
- **npm चैनल**: `dsh plugin --profile web add dsh-mask`।
- **tarball चैनल**: `pnpm pack` फिर `dsh plugin --profile web add ./dsh-mask-<version>.tgz`।
- **अनइंस्टॉल**: `dsh plugin --profile web remove dsh-mask`।

## Configuration

सभी विकल्प Schemastery `Config` फ़ील्ड हैं (cordis.yml से बदले जा सकते हैं)। `cordis.patch.yml` हर कुंजी का दस्तावेज़ देता है।

| कुंजी | डिफ़ॉल्ट | अर्थ |
|---|---|---|
| `enabled` | `true` | मुख्य स्विच |
| `mode` | `regex` | केवल `regex` लागू (`regex+ner` आरक्षित) |
| `entities` | `[phone, email, id-card, bank-card, key]` | PII प्रकार; `ip` opt-in, `person`/`address` को NER चाहिए |
| `scope` | `messages` | केवल `messages` लागू |
| `registerCommand` | `true` | `/mask` कमांड पंजीकृत करें |
| `registerTools` | `true` | `mask_test` टूल पंजीकृत करें |
| `persistRestoreTable` | `true` | तालिका को `dsh_mask` डोमेन में सहेजें |
| `maxRestoreEntriesPerSession` | `500` | प्रति सत्र प्रविष्टि सीमा |
| `maxSessions` | `1000` | मेमोरी में सत्र सीमा |

## Tools & surfaces

| सतह | मूल पाठ दिखाता है | नोट्स |
|---|---|---|
| `agent/pre-step` मास्किंग | कभी नहीं | संदेशों को प्लेसहोल्डर में बदलता है |
| `/mask status` | कभी नहीं | स्थिति, कुल बदले, वितरण |
| `/mask on` / `/mask off` | कभी नहीं | रनटाइम टॉगल |
| `/mask restore <text>` | हाँ (स्पष्ट) | प्लेसहोल्डर को इस सत्र के मानों में बदलता है |
| `mask_test` | कभी नहीं | अंश को मास्क कर परिणाम देता है |

## Permissions & data

- **अनुमतियाँ**: कोई नेटवर्क नहीं, कोई क्रेडेंशियल नहीं (`network:none`, `credentials:none`)।
- **डेटा**: `प्लेसहोल्डर → मूल` तालिका मेमोरी में और, `persistRestoreTable: true` होने पर, `dsh_mask` डोमेन में रहती है; सत्र लॉग में कभी नहीं।
- **सत्र लॉग**: `mask/applied` `types.d.ts` में घोषित है और केवल तब जोड़ा जाता है जब host प्रकार दर्ज करे।

## Security boundaries

- **मूल पाठ सत्र लॉग में कभी नहीं जाता।** लॉग और मॉडल को मास्क रूप ही जाता है; मूल तालिका में रहते हैं।
- **दिखाने/लॉग से पहले सैनिटाइज़।** `lib/sanitize.mjs` PII, रहस्य और URL क्रेडेंशियल हटाता है।
- **नियंत्रित पुनर्स्थापना।** `/mask restore` एकमात्र स्पष्ट प्रकटीकरण सतह है।
- **फेल क्लोज़्ड।** अलागू `mode`/`scope`/इकाइयाँ और सीमा से बाहर संख्याएँ लोड पर विफल होती हैं।
- **पंजीकरण प्रभाव हैं।** listener, कमांड, टूल और डोमेन-बंद सभी Cordis effects हैं।

## Known limitations

- **केवल regex।** `person` और `address` को बाहरी NER पहचानकर्ता चाहिए; लोड पर विफल। बॉक्स में: फ़ोन, ईमेल, आईडी कार्ड, बैंक कार्ड, कुंजी और IP (opt-in)।
- **डिस्प्ले-लेयर पुनर्स्थापना को क्लाइंट आधा चाहिए।** मास्किंग host-side है; UI बुलबुलों को खोलना एक ब्राउज़र-आधा सुविधा है जो यह शुद्ध-host रूप नहीं देता। तालिका और `restore()` पूर्ण host-side seam हैं।
- **`0.1.0-rc.8` इवेंट।** host अभी `mask/*` दर्ज नहीं करता, इसलिए ऑडिट appends छोड़े जाते हैं (सत्र लोड होते रहते हैं)।

## Development

```sh
pnpm install
pnpm run typecheck && pnpm run typecheck:ci
pnpm test
pnpm run verify:self-contained
pnpm run verify:artifacts
pnpm run check:readmes
pnpm pack
```

कोई build चरण नहीं: शुद्ध ESM, `index.mjs` और `lib/` ही भेजे गए आर्टिफ़ैक्ट हैं।

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — निर्माता और अनुरक्षक।

## PerryLink DSH Plugin Family

यह परियोजना [PerryLink](https://github.com/PerryLink) द्वारा अनुरक्षित [DeepSeek Harness प्लगइनों](https://github.com/PerryLink) में से एक है। अगर यह आपकी मदद करता है, तो बाकी भी संभवतः करेंगे:

| प्लगइन | एक पंक्ति में |
|---|---|
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII मास्किंग मिडलवेयर: मॉडल सीमा पर अनाम करें, डिस्प्ले लेयर पर पुनर्स्थापित करें |
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | रीड-ओनली MCP रनटाइम पैनल: /mcp कमांड + सेटिंग्स टैब, स्थिति/टूल/त्रुटियाँ |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | इंजीनियरिंग-अनुशासन गार्ड: आवश्यकता पूछताछ, टेस्ट गेट, विरोधी समीक्षा |
| [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | टिकाऊ पृष्ठभूमि चाइल्ड एजेंट: वेब साइडबार, संदेश और व्यवधान |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | LSP निदान, फ़ॉर्मेटिंग, पूर्णता, कोड क्रियाएँ और नाम बदलना |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Claude Code outputStyles-समकक्ष रनटाइम शैली बदलाव |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Claude Code /rewind-समकक्ष: स्नैपशॉट, सत्र fork, एक-क्लिक पुनर्स्थापना |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code-शैली घोषणात्मक allow/deny/ask अनुमति नियम, ऑडिट सहित |
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | अनुमोदन श्रृंखला पर दूसरे मॉडल की स्वतः समीक्षा, डिफ़ॉल्ट fail-closed |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | अनुमोदित क्रॉस-सत्र मेमोरी: ctx.memory seam + SQLite + memory टूल |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | सुरक्षा-ऑडिट स्किल पैक: सीक्रेट स्कैन, डिपेंडेंसी और सप्लाई-चेन समीक्षा |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | वेब साइडबार में सत्र पिन करें, टिकाऊ क्रम |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | वेब कम्पोज़र के लिए टर्मिनल-शैली इनपुट इतिहास: तीर, Ctrl+R खोज |
| [dsh-github](https://github.com/PerryLink/dsh-github) | DSH के लिए GitHub PR/issue एकीकरण, हर लेखन अनुमोदित |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | प्लगइन-विकास ज्ञान आधार, माँग पर एजेंट स्किल के रूप में |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | Claude Code के सत्र, मेमोरी, स्किल और CLAUDE.md को DSH में स्थानांतरित करें |

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors
