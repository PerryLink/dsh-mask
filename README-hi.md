<div align="center">

# dsh-mask
- **1024 स्टोर चैनल**: एक बार `npm i -g dsh1024`, फिर `dsh1024 plugin --profile web add dsh-mask` ([deepseek1024.com](https://deepseek1024.com) इंस्टॉल रैंकिंग में गिना जाता है)।

**DeepSeek Harness के लिए PII मास्किंग मिडलवेयर — मॉडल तक पहुँचने से पहले व्यक्तिगत डेटा को अनाम करें, डिस्प्ले लेयर पर उसे वापस लाएँ।**

*फ़ोन, ईमेल, आईडी कार्ड, बैंक कार्ड, कुंजियाँ आदि मॉडल सीमा पर प्लेसहोल्डर बन जाते हैं; मूल पाठ आपके सत्र लॉग में कभी नहीं जाता।*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-mask.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-mask/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-mask/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-mask?label=version)](https://github.com/PerryLink/dsh-mask/releases)
[![npm version](https://img.shields.io/npm/v/dsh-mask)](https://www.npmjs.com/package/dsh-mask)
[![npm downloads](https://img.shields.io/npm/dm/dsh-mask)](https://www.npmjs.com/package/dsh-mask)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

## Compatibility

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.5-rc.1` (2026-09-09 को अनुकूलित): सत्र लिफ़ाफ़ा अपना ignorable फ़ील्ड केवल संग्रहीत-लॉग पठन संगतता के लिए रखता है - Session.append अभी भी इसे स्टैम्प नहीं कर सकता, इसलिए गेट व्यवहार अपरिवर्तित है। 2026-09-10 को `dsh-v0.1.5-rc.1` master checkout के विरुद्ध सत्यापित (पूर्ण गेट शृंखला + profile इंस्टॉल स्मोक)। |
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

`dsh-mask` अब storage स्टैक बंडल नहीं करता। जो प्रोफ़ाइल इसे पहले से रचते हैं (`web` प्रोफ़ाइल `@deepseek-ai/dsh-web-app` के ज़रिए करती है) वे `storageDomain` देते हैं, इसलिए persistence तुरंत काम करता है। बिना storage वाले bare प्रोफ़ाइल में प्लगइन फिर भी माउंट होता है और मास्क करता है, पर restore तालिका केवल मेमोरी में रहती है (रीस्टार्ट पर खो जाती है): अपने प्रोफ़ाइल पैच में storage स्टैक रचें, या `persistRestoreTable: false` करें।

## Configuration

सभी विकल्प Schemastery `Config` फ़ील्ड हैं (cordis.yml से बदले जा सकते हैं)। `cordis.patch.yml` हर कुंजी का दस्तावेज़ देता है।

| कुंजी | डिफ़ॉल्ट | अर्थ |
|---|---|---|
| `enabled` | `true` | मुख्य स्विच |
| `mode` | `regex` | केवल `regex` लागू (`regex+ner` आरक्षित) |
| `entities` | `[phone, email, id-card, bank-card, key]` | PII प्रकार; `ip` opt-in, `person`/`address` को NER चाहिए |
| `scope` | `[messages]` | सतहें: `messages` (agent/pre-step संदेश) और `tools` (टूल परिणाम पाठ)। स्ट्रिंग या array स्वीकार करता है, जैसे `[messages, tools]` |
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
- **`0.1.2-rc.1` इवेंट।** host अभी `mask/*` दर्ज नहीं करता, इसलिए ऑडिट appends छोड़े जाते हैं (सत्र लोड होते रहते हैं)।

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

### Benchmark

PII बेंचमार्क (108 सिंथेटिक नमूनों पर प्रति-प्रकार P/R/F1) [`benchmark/RESULTS.md`](benchmark/RESULTS.md) में है; `node benchmark/run.mjs` से दोबारा बनाएँ (कोई build नहीं, कोई नई निर्भरता नहीं)।

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — निर्माता और अनुरक्षक।

## PerryLink DSH Plugin Family

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) द्वारा अनुरक्षित [37 DeepSeek Harness प्लगइनों](https://github.com/PerryLink) में से एक है। अगर यह आपकी मदद करता है, तो बाकी भी करेंगे:

| Plugin | One-liner |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | अनुमोदन श्रृंखला पर द्वितीय-मॉडल स्वतः-समीक्षा, डिफ़ॉल्ट रूप से विफल-बंद | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | वेब UI साइडबार, संदेश और अवरोधन के साथ टिकाऊ पृष्ठभूमि चाइल्ड एजेंट | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | DeepSeek Harness के लिए लागत प्रशासन: बजट, कार्बन और विलंबता एक पैनल में। | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-समतुल्य: स्नैपशॉट, सत्र फ़ॉर्क, एक-बार पुनर्स्थापना | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Claude Code सत्र, मेमोरी, कौशल और CLAUDE.md को DSH में स्थानांतरित करें | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | DeepSeek Harness के लिए क्रॉस-प्लेटफ़ॉर्म नेटिव डेस्कटॉप नियंत्रण — Windows पहले। | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | वेब कंपोज़र के लिए टर्मिनल-शैली इनपुट इतिहास: तीर, Ctrl+R खोज | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | डेटासेट गुणवत्ता जाँच व उद्धरण सत्यापन (यहाँ उपभोग किया गया वैकल्पिक संख्या-सेतु) | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | DeepSeek Harness के लिए प्रॉम्प्ट-इंजेक्शन, जेलब्रेक और सीक्रेट-लीक रक्षा। | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | इंजीनियरिंग-अनुशासन रक्षक: आवश्यकताओं की पूछताछ, परीक्षण द्वार, प्रतिद्वंद्वी समीक्षा | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | DeepSeek Harness के लिए एकीकृत स्थैतिक-छवि निर्माण रूटिंग। | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | DeepSeek Harness के लिए रीड-ओनली प्रदर्शन डायग्नोस्टिक्स। | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | चीनी सार्वजनिक म्यूचुअल फंड के लिए नियतात्मक अनुसंधान रिपोर्ट | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | DSH के लिए GitHub PR/issues एकीकरण, हर लेखन अनुमोदन-द्वारित | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | उद्योग-अनुसंधान ऑर्केस्ट्रेशन जो इस प्लगिन के `ctx.researchReport.assemble` से डिलीवरेबल सील करता है | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | DeepSeek Harness के लिए स्थानीय दस्तावेज़ ज्ञानकोश। | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | DeepSeek Harness के लिए स्थानीय-मॉडल (Ollama) एकीकरण। | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | भाषा सर्वरों पर LSP निदान, फ़ॉर्मेटिंग, पूर्णता, कोड क्रियाएँ और नाम बदलना | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | केवल-पढ़ने वाला MCP रनटाइम पैनल: /mcp कमांड + स्थिति, टूल और त्रुटियों वाला Settings टैब | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | अनुमोदन-द्वारित क्रॉस-सत्र मेमोरी: ctx.memory सीम + SQLite + मेमोरी टूल | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | DeepSeek Harness के लिए OpenTelemetry और Langfuse अवलोकनीयता निर्यातक। | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-समतुल्य रनटाइम शैली बदलाव | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | ऑडिट के साथ Claude Code-शैली घोषणात्मक allow/deny/ask अनुमति नियम | |
| **[dsh-personal-directive](https://github.com/PerryLink/dsh-personal-directive)** | शीर्ष-बार टॉगल के साथ व्यक्तिगत निर्देश इंजेक्टर (फ्रेमवर्क संस्करण) |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | माँग पर एजेंट कौशल के रूप में प्लगइन-विकास ज्ञान आधार | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | मल्टी-चैनल अनुमोदन/प्रश्न ब्रिज: WeChat/Telegram/Feishu, सत्र कंसोल |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | सामग्री-पता साक्ष्य और सीलबंद संस्करणों वाला सत्यापन-योग्य अनुसंधान-रिपोर्ट इंजन | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | DeepSeek Harness प्लगिनों की बहु-आयामी गुणवत्ता स्कोरिंग। | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | टिकाऊ क्रम के साथ वेब साइडबार में सत्र पिन करें | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | DeepSeek Harness के लिए क्रॉस-डिवाइस सत्र सिंक — आपके सत्र स्टोर का एक समर्पित git मिरर। | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | सुरक्षा-ऑडिट कौशल पैक: गुप्त स्कैन, निर्भरता और आपूर्ति-श्रृंखला समीक्षा | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | DeepSeek Harness के लिए आवाज़-प्रथम सत्र लूप: बोलें और उत्तर सुनें। | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | DeepSeek Harness प्लगिनों के लिए पृथक इंस्टॉल-एंड-स्मोक टेस्ट ड्राइव। | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 कार्य ब्रिज: सत्र-हेडर पैनल + 11 टूल |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | DeepSeek Harness के लिए वेंडर पैरामीटर अनुवाद और नियतात्मक JSON मरम्मत। | |
| **[dsh-wechat](https://github.com/PerryLink/dsh-wechat)** | WeChat ↔ DSH ब्रिज (Tencent iLink bot): टेक्स्ट/इमेज/फ़ाइल/आवाज़, चैट में अनुमोदन |

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

### DSH Desktop मार्केट से इंस्टॉल करें

सभी PerryLink प्लगइन DSH Desktop के बिल्ट-इन मार्केट में देखे जा सकते हैं: **Market → Sources → add source → पेस्ट करें** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ चुनें**। इंस्टॉलेशन मार्केट के npm-identity सत्यापन और आपकी पुष्टि से ही होता है।
