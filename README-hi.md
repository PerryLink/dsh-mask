<div align="center">

# dsh-mask
- **1024 स्टोर चैनल**: एक बार `npm i -g dsh1024`, फिर `dsh1024 plugin --profile web add dsh-mask` ([deepseek1024.com](https://deepseek1024.com) इंस्टॉल रैंकिंग में गिना जाता है)।

**DeepSeek Harness के लिए PII मास्किंग मिडलवेयर — मॉडल तक पहुँचने से पहले व्यक्तिगत डेटा को अनाम करें, डिस्प्ले लेयर पर उसे वापस लाएँ।**

*फ़ोन, ईमेल, आईडी कार्ड, बैंक कार्ड, कुंजियाँ आदि मॉडल सीमा पर प्लेसहोल्डर बन जाते हैं; मूल पाठ आपके सत्र लॉग में कभी नहीं जाता।*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-mask)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-mask.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-mask/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-mask/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-mask?label=version)](https://github.com/PerryLink/dsh-mask/releases)
[![npm version](https://img.shields.io/npm/v/dsh-mask)](https://www.npmjs.com/package/dsh-mask)
[![npm downloads](https://img.shields.io/npm/dm/dsh-mask)](https://www.npmjs.com/package/dsh-mask)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-mask?metric=downloads&lang=hi)](https://dshfind.com/hi/plugins/PerryLink/dsh-mask?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-mask
```


</div>

---


**📖 इकोसिस्टम नॉलेज बेस** — मापे गए आँकड़े, मार्केटिंग नहीं: [डेवलपमेंट गाइड · चयन डेटा · रखरखाव मानदंड](https://perrylink.github.io/dsh-plugin-guide/)।

<!-- star-cta -->
## Install & uninstall

- **git चैनल**: `dsh plugin --profile web add github:PerryLink/dsh-mask` (`git+https://github.com/PerryLink/dsh-mask.git` के बराबर)। कोई build चरण नहीं।
- **npm चैनल**: `dsh plugin --profile web add dsh-mask`।
- **tarball चैनल**: `pnpm pack` फिर `dsh plugin --profile web add ./dsh-mask-<version>.tgz`।
- **अनइंस्टॉल**: `dsh plugin --profile web remove dsh-mask`।

`dsh-mask` अब storage स्टैक बंडल नहीं करता। जो प्रोफ़ाइल इसे पहले से रचते हैं (`web` प्रोफ़ाइल `@deepseek-ai/dsh-web-app` के ज़रिए करती है) वे `storageDomain` देते हैं, इसलिए persistence तुरंत काम करता है। बिना storage वाले bare प्रोफ़ाइल में प्लगइन फिर भी माउंट होता है और मास्क करता है, पर restore तालिका केवल मेमोरी में रहती है (रीस्टार्ट पर खो जाती है): अपने प्रोफ़ाइल पैच में storage स्टैक रचें, या `persistRestoreTable: false` करें।

## ⭐ 如果它帮到了你

यह प्लगइन [DSH प्लगइन परिवार](https://github.com/PerryLink) का हिस्सा है (95 प्लगइन, सभी Apache-2.0)। अगर यह उपयोगी लगे, तो **एक स्टार दें** — इससे कोई सुविधा अनलॉक नहीं होती, पर अगला व्यक्ति इसे खोज में आसानी से पा लेता है।

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-mask?

DeepSeek Harness के लिए PII मास्किंग मिडलवेयर — मॉडल तक पहुँचने से पहले व्यक्तिगत डेटा को अनाम करें, डिस्प्ले लेयर पर उसे वापस लाएँ।

फ़ोन, ईमेल, आईडी कार्ड, बैंक कार्ड, कुंजियाँ आदि मॉडल सीमा पर प्लेसहोल्डर बन जाते हैं; मूल पाठ आपके सत्र लॉग में कभी नहीं जाता।

![dsh-mask कार्यप्रवाह आरेख: कॉल → प्लगइन → परिणाम।](docs/assets/dsh-mask-flow.svg)

*कार्यप्रवाह: कॉल → प्लगइन → परिणाम। नीचे के उदाहरण वास्तविक कमांड सतह का उपयोग करते हैं।*


*वही रन, एनिमेटेड।*

## Comparison

![dsh-mask का मापा गया तुलना चार्ट](https://raw.githubusercontent.com/PerryLink/dsh-mask/main/docs/assets/dsh-mask-evidence.png)

108 synthetic samples (60 positive, 48 negative) · from benchmark/RESULTS.md

## Compatibility

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (2026-09-18 को अनुकूलित): सत्र लिफ़ाफ़ा अपना ignorable फ़ील्ड केवल संग्रहीत-लॉग पठन संगतता के लिए रखता है - Session.append अभी भी इसे स्टैम्प नहीं कर सकता, इसलिए गेट व्यवहार अपरिवर्तित है। 2026-09-18 को `dsh-v0.1.7-alpha.1` master checkout के विरुद्ध सत्यापित (पूर्ण गेट शृंखला + profile इंस्टॉल स्मोक)। |
| Node | `^22.19.0 \|\| >=24.0.0` |
| प्लेटफ़ॉर्म | जहाँ DSH चले (शुद्ध host, शून्य-निर्भरता regex; कोई ब्राउज़र आधा नहीं) |
| मॉडल | टेक्स्ट मॉडल पूर्ण रूप से समर्थित |

## What you get

`dsh-mask` व्यक्तिगत डेटा को **मॉडल सीमा पर** अनाम करता है और पुनर्स्थापना तालिका रखता है:

- **अनुरोध से पहले मास्किंग** — `agent/pre-step` संदेशों को फिर से लिखता है ताकि फ़ोन, ईमेल, आईडी कार्ड, बैंक कार्ड, कुंजियाँ और IP (opt-in) `<PHONE_1>` जैसे प्लेसहोल्डर बन जाएँ। मास्क किया हुआ पाठ ही लॉग होता है और मॉडल को जाता है।
- **पुनर्स्थापना तालिका** — `प्लेसहोल्डर → मूल` नक्शा केवल मेमोरी और नियंत्रित स्टोरेज डोमेन (`dsh_mask`) में रहता है; मूल पाठ सत्र लॉग में कभी नहीं जाता।
- **बिना मूल पाठ की ऑडिट** — `mask/applied` इवेंट केवल «N मान बदले + प्रकार-वितरण» दर्ज करता है।
- **`/mask` कमांड** — `status`, `on`/`off`, `restore <text>` (प्लेसहोल्डर वापस मूल में बदलकर मूल पाठ को फ़ाइल के रूप में सौंपता है, लॉग होने योग्य पाठ के रूप में कभी नहीं), `help`।
- **`mask_test` टूल** — एक अंश चलाकर प्लेसहोल्डर परिणाम देखें; मूल मान कभी नहीं दिखाता।

```text
उपयोगकर्ता संदेश ──agent/pre-step──▶ प्लेसहोल्डर ──मॉडल──▶ प्लेसहोल्डर ──restore──▶ नियंत्रित फ़ाइल
                                        ▲                                                    │
                                        └──── पुनर्स्थापना तालिका (मेमोरी + dsh_mask) ────────┘
```

## Quick start

```sh
dsh plugin --profile web add github:PerryLink/dsh-mask
```

```sh
dsh plugin --profile web add github:PerryLink/dsh-mask
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
mask: restored 1 placeholder(s): <PHONE_1>
  file: /tmp/dsh-mask-restore/restore-1f0c….txt  (mode 0600, one file per session)
```

### उदाहरण

ये वास्तविक प्रवेश बिंदु हैं; इंस्टॉल के बाद एक चलाएँ।

#### विस्तृत उदाहरण

**कमांड**

~~~sh
mask_test
~~~

**इनपुट**

~~~json
{"text":"电话 13812345678"}
~~~

**आउटपुट**

~~~text
mask_test: replaced 1 PII value(s) (PHONE=1)
masked:
电话 <PHONE_1>
~~~

*स्रोत `plugins/dsh-mask/index.mjs:243-250; test/index.test.mjs:306-315`*

#### विफलता शाखा

**इनपुट**

~~~text
/mask restore <PHONE_1> with restoreDir=/tmp/dsh-mask-probe-not-a-dir (a regular file)
~~~

**आउटपुट**

~~~text
mask: restore failed: EEXIST: file already exists, mkdir '/tmp/dsh-mask-probe-not-a-dir'
~~~

*स्रोत `plugins/dsh-mask/index.mjs:501-506; plugins/dsh-mask/lib/deliver.mjs:89-97; plugins/dsh-mask/test/index.test.mjs:278-290`*

#### संक्षिप्त उदाहरण

- `mask_test`
- `/mask restore <text>`

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
| `restoreDir` | `''` | `/mask restore` मूल पाठ कहाँ सौंपता है। खाली = `os.tmpdir()/dsh-mask-restore`; सापेक्ष मान host प्रक्रिया के cwd के सापेक्ष हल होता है। डायरेक्टरी `0700` पर बनती है और फ़ाइल `0600` पर लिखी जाती है, प्रति सत्र एक |

## Tools & surfaces

| सतह | मूल पाठ दिखाता है | नोट्स |
|---|---|---|
| `agent/pre-step` मास्किंग | कभी नहीं | संदेशों को प्लेसहोल्डर में बदलता है |
| `/mask status` | कभी नहीं | स्थिति, कुल बदले, वितरण |
| `/mask on` / `/mask off` | कभी नहीं | रनटाइम टॉगल |
| `/mask restore <text>` | हाँ (स्पष्ट) | प्लेसहोल्डर को इस सत्र के मानों में बदलकर नियंत्रित फ़ाइल में लिखता है (प्रति सत्र एक, mode `0600`); परिणाम पाठ और सत्र लॉग में केवल वह पथ और प्लेसहोल्डर नाम जाते हैं |
| `mask_test` | कभी नहीं | अंश को मास्क कर परिणाम देता है |

## Permissions & data

- **अनुमतियाँ**: कोई नेटवर्क नहीं, कोई क्रेडेंशियल नहीं (`network:none`, `credentials:none`)। manifest `/mask restore` की डिलीवरी फ़ाइल के लिए `filesystem:write` घोषित करता है।
- **डेटा**: `प्लेसहोल्डर → मूल` तालिका मेमोरी में और, `persistRestoreTable: true` होने पर, `dsh_mask` डोमेन में रहती है; सत्र लॉग में कभी नहीं। एकमात्र अन्य मूल-पाठ प्रति वह डिलीवरी फ़ाइल है जो स्पष्ट `/mask restore` लिखता है (`restoreDir`, mode `0600`, प्रति सत्र एक, अगली पुनर्स्थापना उसे ओवरराइट करती है); कोई भी पथ चुपचाप मूल पाठ डिस्क पर नहीं लिखता।
- **सत्र लॉग**: `mask/applied` `types.d.ts` में घोषित है और केवल तब जोड़ा जाता है जब host प्रकार दर्ज करे।

## Security boundaries

- **मूल पाठ सत्र लॉग में कभी नहीं जाता।** लॉग और मॉडल को मास्क रूप ही जाता है; मूल तालिका में रहते हैं। यही नियम प्रकटीकरण पर भी लागू है: host कमांड के परिणाम पाठ को **शब्दशः** लॉग करता है और उसी इवेंट से दृश्य आउटपुट बनाता है, इसलिए `/mask restore` मूल पाठ को नियंत्रित फ़ाइल में लिखता है और केवल पथ लौटाता है।
- **दिखाने/लॉग से पहले सैनिटाइज़।** `lib/sanitize.mjs` PII, रहस्य और URL क्रेडेंशियल हटाता है; `mask_test`, `/mask status` और `/mask` के सभी त्रुटि पथ मूल कभी नहीं दिखाते।
- **नियंत्रित पुनर्स्थापना।** `/mask restore` एकमात्र स्पष्ट प्रकटीकरण सतह है। डिलीवरी विफल हो तो फेल क्लोज़्ड: त्रुटि, मूल पाठ दिखाने वाला fallback कभी नहीं।
- **फेल क्लोज़्ड।** अलागू `mode`/`scope`/इकाइयाँ और सीमा से बाहर संख्याएँ लोड पर विफल होती हैं।
- **पंजीकरण प्रभाव हैं।** listener, कमांड, टूल और डोमेन-बंद सभी Cordis effects हैं।

## Known limitations

- **केवल regex।** `person` और `address` को बाहरी NER पहचानकर्ता चाहिए; लोड पर विफल। बॉक्स में: फ़ोन, ईमेल, आईडी कार्ड, बैंक कार्ड, कुंजी और IP (opt-in)।
- **क्षेत्र-विशिष्ट पैटर्न।** `phone` और `id-card` डिटेक्टर केवल मुख्य भूमि चीन के प्रारूप पहचानते हैं: `phone` = `1[3-9]` के बाद नौ अंक, और `id-card` = 18 वर्णों वाला चीनी निवासी आईडी (17 अंक और एक अंक या `X`)। अन्य देशों के फ़ोन नंबर और राष्ट्रीय पहचान पत्र नहीं पकड़े जाते। `email`, `ip` और `key` क्षेत्र-निरपेक्ष हैं; `bank-card` किसी भी 16-19 अंकों की श्रृंखला को कम विश्वास के साथ स्वीकार करता है।
- **डिस्प्ले-लेयर पुनर्स्थापना को क्लाइंट आधा चाहिए।** मास्किंग host-side है; UI बुलबुलों को खोलना एक ब्राउज़र-आधा सुविधा है जो यह शुद्ध-host रूप नहीं देता। host तालिका और निर्यातित `RestoreStore` seam रखता है (उसके मेथड को session id चाहिए), इसलिए भविष्य का क्लाइंट आधा उन्हें host remote से लेगा, सीधे नहीं; आज अनमास्किंग का सतह `/mask restore <text>` कमांड है, जो मूल पाठ फ़ाइल के रूप में सौंपता है क्योंकि कमांड परिणाम शब्दशः लॉग होता है, और `maskClientEnabled` कुंजी schema में घोषित व मान्य होती है पर अभी कोई रनटाइम कोड उसे नहीं पढ़ता।
- **बिना आर्ग्युमेंट `/mask restore` नहीं है।** अंतिम assistant संदेश के *सभी* प्लेसहोल्डर वापस लाना उपलब्ध नहीं है, और बिना पाठ के चलाने पर कमांड यह बता देता है। दो host तथ्य इसे रोकते हैं: पुनर्स्थापना तालिका प्रति सत्र सपाट `{प्लेसहोल्डर: मूल}` नक्शा है, जिसमें **संदेश-वार सूचकांक नहीं** है, इसलिए वह संदेश सत्र इवेंट लॉग में खोजना पड़ता है; और host ने `Session.snapshotEvents()` / `eventAt()` / `ownEvents()` को deprecated कर दिया है और नए कॉलर के लिए मना किया है, जबकि उसका एकमात्र स्वीकृत विकल्प (इवेंट से इंक्रीमेंटल प्रोजेक्शन) इस प्लगइन के घोषित host corridor (`>=0.1.2-rc.1`) पर भरोसेमंद नहीं है। प्लेसहोल्डर एक-एक करके वापस लाए जा सकते हैं: `/mask restore <PHONE_1>`।
- **`0.1.7-rc.2` पर इवेंट।** host 59 सत्र-इवेंट प्रकार दर्ज करता है और उनमें `mask/*` नहीं है; उसका `Session.append` `ignorable` लिफ़ाफ़ा भी नहीं लगा सकता, इसलिए ऑडिट appends छोड़े जाते हैं (सत्र लोड होते रहते हैं)। गेट मौन नहीं है: प्रत्येक सत्र की पहली अस्वीकृति पर छोड़े गए प्रकार और इस प्रलेखित सीमा के साथ एक दृश्य चेतावनी दर्ज होती है। जब host प्रकार दर्ज करे या `ignorable` लिफ़ाफ़ा स्वीकार करे, append स्वतः सक्षम हो जाता है।

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

## Interoperability with other DSH plugins

**DSH `0.2.0-rc.2`** (वह रनटाइम जिसके लिए यह README प्रकाशित है) और 2026-10-05 को सर्वे किए गए उच्च-स्टार प्लगइन सेट के विरुद्ध सत्यापित।

यह प्लगइन अन्य प्लगइनों में **हस्तक्षेप नहीं करता**, उन उच्च-स्टार प्लगइनों सहित जो व्यापक रूप से इंस्टॉल हैं:

- **कोई टूल-नाम टकराव नहीं।** सभी टूल नेमस्पेस युक्त हैं; कोई भी ऐसा नंगा नाम नहीं लेता जो पहले से किसी अंतर्निहित टूल या अन्य प्लगइन का हो।
- **कोई सर्विस-की टकराव नहीं।** यह कोई सर्विस key प्रदान नहीं करता, इसलिए टकराव संभव नहीं।
- **कोई स्लॉट टकराव नहीं।** यह कोई क्लाइंट slot key पंजीकृत नहीं करता, इसलिए `shadows-shipped-ui` सीट के लिए प्रतिस्पर्धा नहीं करता।
- **कोई HTTP रूट टकराव नहीं।** यह कोई `webServer` प्रीफ़िक्स पंजीकृत नहीं करता।
- **कोई patch-लेयर टकराव नहीं।** बंडल patch केवल अपनी पंक्ति `insert` करता है; कभी किसी अंतर्निहित पंक्ति का `config` ओवरराइड नहीं करता।
- **कोई वैश्विक परिवर्तन नहीं।** यह प्रोटोटाइप नहीं बदलता, `process.env` नहीं लिखता, और वैश्विक fetch dispatcher प्रतिस्थापित नहीं करता।

**साझा ईवेंट लिसनर रचना से ही अहस्तक्षेपी हैं।** यह क्रम-संवेदनशील ईवेंट `agent/pre-step`, `tools/post-execute` को `ctx.on()` से देखता है — Cordis का **ब्रॉडकास्ट** पंजीकरण, जहाँ हर लिसनर चलता है और कोई किसी दूसरे को वंचित नहीं कर सकता। **यहाँ प्रत्येक लिसनर `next()` से डेलिगेट करता है**, इसलिए श्रृंखला कभी शॉर्ट-सर्किट नहीं होती:
  - `agent/pre-step` — also used by `dsh-routing-suite` (7000★, 7 listeners), `modlens` (4122★), `dsh-purge` (3317★), `dsh-agent-teams` (1923★), `dsh-context` (1849★).
  - `tools/post-execute` — also used by `cc-safety-net` (1576★).

स्थैतिक प्रमाण: इस रिपॉज़िटरी पर `dsh-plugin-doctor` के K10–K13 सभी `pass` हैं।

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — निर्माता और अनुरक्षक।

## PerryLink DSH Plugin Family

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) के DeepSeek Harness प्लगइन परिवार का हिस्सा है। पूरी सूची नीचे संक्षिप्त रखी गई है ताकि हर README की पहली स्क्रीन छोटी रहे; हर पंक्ति और उसकी स्थिति देखने के लिए इसे खोलें।

<details>
<summary>सभी प्लगइन खोलें</summary>

| प्लगइन | स्थिति |
|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** |  |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** |  |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** |  |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** |  |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** |  |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** |  |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** |  |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** |  |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |

</details>

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

### DSH Desktop मार्केट से इंस्टॉल करें

सभी PerryLink प्लगइन DSH Desktop के बिल्ट-इन मार्केट में देखे जा सकते हैं: **Market → Sources → add source → पेस्ट करें** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ चुनें**। इंस्टॉलेशन मार्केट के npm-identity सत्यापन और आपकी पुष्टि से ही होता है।
