#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Task 7 i18n insertion: insert new keys AFTER anchor lines, per language block,
bottom-up so line numbers stay valid. Verifies each key appears exactly 4x."""

import re, sys

path = '/home/z/my-project/src/lib/i18n.ts'
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

# (anchor_prefix, [keys to insert after])
INSERTS = [
    ("'discover.no_results':", [
        "    'discover.filter_all': 'All',",
        "    'discover.filter_saved': 'Saved',",
        "    'discover.saved_empty': 'No saved videos yet. Tap the bookmark on any video to keep it here.',",
        "    'discover.bookmark_add': 'Save video',",
        "    'discover.bookmark_remove': 'Remove from saved',",
        "",
    ]),
    ("'history.score_trend':", [
        "    'history.sheet_title': 'How the score is calculated',",
        "    'history.sheet_zones_desc': 'Share of readings sitting below the safe line for your grain — more in the safe zone means a higher score.',",
        "    'history.sheet_stability_desc': 'How steady your moisture has been. Wild swings between readings cost marks even if the average is fine.',",
        "    'history.sheet_trend_desc': 'Direction of the last few readings. Rising moisture is the first sign of spoilage risk and lowers the score.',",
        "    'history.sheet_bands': 'Score bands',",
        "",
    ]),
    ("'settings.haptics':", [
        "    'settings.sound': 'Alert sound',",
        "",
    ]),
]

# Language detection: find block boundaries by 'en:', 'hi:', 'mr:', 'hinglish:' keys
blocks = []  # (name, start_line_idx)
for i, l in enumerate(lines):
    m = re.match(r"^\s{2}(en|hi|mr|hinglish): \{", l)
    if m:
        blocks.append((m.group(1), i))

def lang_for(line_idx):
    name = 'en'
    for bname, bstart in blocks:
        if line_idx >= bstart:
            name = bname
    return name

TRANSL = {
 'hi': {
  'discover.filter_all': 'सभी',
  'discover.filter_saved': 'सेव किए गए',
  'discover.saved_empty': 'अभी कोई सेव किया वीडियो नहीं। किसी भी वीडियो पर बुकमार्क दबाएं और उसे यहां रखें।',
  'discover.bookmark_add': 'वीडियो सेव करें',
  'discover.bookmark_remove': 'सेव से हटाएं',
  'history.sheet_title': 'स्कोर कैसे बनता है',
  'history.sheet_zones_desc': 'आपके अनाज की सुरक्षित रेखा से नीचे बैठी रीडिंग का हिस्सा — जितनी अधिक रीडिंग सेफ ज़ोन में, स्कोर उतना बेहतर।',
  'history.sheet_stability_desc': 'आपकी नमी कितनी स्थिर रही है। औसत ठीक होने पर भी रीडिंग में भारी उतार-चढ़ाव अंक कम करते हैं।',
  'history.sheet_trend_desc': 'पिछली कुछ रीडिंग की दिशा। बढ़ती नमी सड़ांध के जोखिम का पहला संकेत है और स्कोर घटाती है।',
  'history.sheet_bands': 'स्कोर श्रेणियां',
  'settings.sound': 'अलर्ट ध्वनि',
 },
 'mr': {
  'discover.filter_all': 'सर्व',
  'discover.filter_saved': 'सेव्ह केलेले',
  'discover.saved_empty': 'अजून कोणताही सेव्ह केलेला व्हिडिओ नाही. कोणत्याही व्हिडिओवर बुकमार्क दाबा आणि तो येथे ठेवा.',
  'discover.bookmark_add': 'व्हिडिओ सेव्ह करा',
  'discover.bookmark_remove': 'सेव्हमधून काढा',
  'history.sheet_title': 'स्कोर कसा मोजला जातो',
  'history.sheet_zones_desc': 'तुमच्या धान्याच्या सुरक्षित रेषेखाली असलेल्या वाचनांचा वाटा — जास्त वाचने सेफ झोनमध्ये असतील तर स्कोर जास्त.',
  'history.sheet_stability_desc': 'तुमची ओलावा किती स्थिर होती. सरासरी बरोबर असली तरी वाचनांमधील मोठे बदल गुण कमी करतात.',
  'history.sheet_trend_desc': 'शेवटच्या काही वाचनांची दिशा. वाढणारी ओलावा हा कुजण्याच्या धोक्याचे पहिले लक्षण आहे आणि स्कोर कमी करतो.',
  'history.sheet_bands': 'स्कोर श्रेणी',
  'settings.sound': 'अलर्ट आवाज',
 },
 'hinglish': {
  'discover.filter_all': 'Sabhi',
  'discover.filter_saved': 'Saved',
  'discover.saved_empty': 'Abhi tak koi saved video nahi. Kisi bhi video par bookmark dabao aur use yahan rakho.',
  'discover.bookmark_add': 'Video save karo',
  'discover.bookmark_remove': 'Saved se hatao',
  'history.sheet_title': 'Score kaise banta hai',
  'history.sheet_zones_desc': 'Aapke grain ki safe line ke neeche baithe readings ka hissa — jitni zyada readings safe zone mein, score utna behtar.',
  'history.sheet_stability_desc': 'Aapki moisture kitni steady rahi. Average theek hone par bhi readings ke bade utar-chadhav marks kam karte hain.',
  'history.sheet_trend_desc': 'Pichli kuch readings ki direction. Badhti hui moisture spoilage risk ka pehla sign hai aur score ghatati hai.',
  'history.sheet_bands': 'Score bands',
  'settings.sound': 'Alert sound',
 },
}

def key_of(line):
    m = re.match(r"\s*'([a-z_.A-Z]+)':", line)
    return m.group(1) if m else None

# Collect insertion ops: (line_idx, [new lines])
ops = []
for i, l in enumerate(lines):
    stripped = l
    for anchor, default_block in INSERTS:
        if stripped.lstrip().startswith(anchor):
            lang = lang_for(i)
            # Build localized block
            if lang in ('en', 'hi', 'mr', 'hinglish'):
                tr = TRANSL.get(lang, {})
                out = []
                for dline in default_block:
                    k = key_of(dline)
                    if k and k in tr:
                        # localize, preserve indentation and trailing comma
                        indent = dline[:len(dline) - len(dline.lstrip())]
                        # find value part from default to mirror quoting style
                        m2 = re.match(r"(\s*'" + re.escape(k) + r"': )(.*)", dline)
                        val = tr[k]
                        out.append(f"{indent}'{k}': '{val}'," if not dline.rstrip().endswith(",") else f"{indent}'{k}': '{val}',")
                    else:
                        if k is None:  # blank spacer line
                            out.append('')
                            continue
                        out.append(dline)
                ops.append((i, out))
            break

# Apply bottom-up
for i, new_lines in sorted(ops, key=lambda x: -x[0]):
    lines[i+1:i+1] = [nl + '\n' if nl else '\n' for nl in new_lines]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

# VERIFY: every new key appears exactly 4 times
NEW_KEYS = [
 'discover.filter_all','discover.filter_saved','discover.saved_empty','discover.bookmark_add','discover.bookmark_remove',
 'history.sheet_title','history.sheet_zones_desc','history.sheet_stability_desc','history.sheet_trend_desc','history.sheet_bands',
 'settings.sound',
]
content = ''.join(lines)
ok = True
for k in NEW_KEYS:
    n = content.count(f"'{k}':")
    status = 'OK' if n == 4 else 'FAIL'
    if n != 4: ok = False
    print(f"{status} {k}: {n}")

# ALSO verify anchors still exist exactly 4x (not replaced)
for anchor_key in ['discover.no_results','history.score_trend','settings.haptics']:
    n = content.count(f"'{anchor_key}':")
    status = 'OK' if n == 4 else 'FAIL'
    if n != 4: ok = False
    print(f"{status} anchor {anchor_key}: {n}")

sys.exit(0 if ok else 1)
