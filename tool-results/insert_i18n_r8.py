#!/usr/bin/env python3
"""Round 8 i18n insertion — insert AFTER verified anchors, never replace.
Keys: history.trends_ma, history.detail_context (after history.delta_prev)
      toast.saved, toast.unsaved (after toast.copied)
      discover.saved_meta (after discover.saved_empty)
Language blocks identified by the exact anchor line content."""
import io, sys

path = 'src/lib/i18n.ts'
src = io.open(path, encoding='utf-8').read()
lines = src.split('\n')

# anchor unique-prefix -> (per-language payloads keyed by exact anchor line prefix fragment)
LANG_BY_FRAGMENT = [
    ('vs previous reading', 'en'),
    ('\u092a\u093f\u091b\u0932\u0940 \u0930\u0940\u0921\u093f\u0902\u0917 \u0938\u0947', 'hi'),
    ('\u092e\u093e\u0917\u0940\u0932 \u0935\u093e\u091a\u0928\u093e\u092a\u093e\u0938\u0942\u0928', 'mr'),
    ('pichli reading se', 'hinglish'),
]

PAYLOADS = {
    'en': {
        'history.delta_prev': [
            "    'history.trends_ma': '7-reading average',",
            "    'history.detail_context': 'Surrounding readings',",
        ],
        'toast.copied': [
            "    'toast.saved': 'Saved to your list',",
            "    'toast.unsaved': 'Removed from saved',",
        ],
        'discover.saved_empty': [
            "    'discover.saved_meta': '{n} saved \\u00b7 newest first',",
        ],
    },
    'hi': {
        'history.delta_prev': [
            "    'history.trends_ma': '7 \u0930\u0940\u0921\u093f\u0902\u0917 \u0915\u093e \u0914\u0938\u0924',",
            "    'history.detail_context': '\u0906\u0938\u092a\u093e\u0938 \u0915\u0940 \u0930\u0940\u0921\u093f\u0902\u0917',",
        ],
        'toast.copied': [
            "    'toast.saved': '\u0906\u092a\u0915\u0940 \u0938\u0942\u091a\u0940 \u092e\u0947\u0902 \u0938\u0947\u0935 \u0939\u0941\u0906',",
            "    'toast.unsaved': '\u0938\u0947\u0935 \u0938\u0947 \u0939\u091f\u093e \u0926\u093f\u092f\u093e \u0917\u092f\u093e',",
        ],
        'discover.saved_empty': [
            "    'discover.saved_meta': '{n} \u0938\u0947\u0935 \\u00b7 \u0928\u090f \u092a\u0939\u0932\u0947',",
        ],
    },
    'mr': {
        'history.delta_prev': [
            "    'history.trends_ma': '7 \u0935\u093e\u091a\u0928\u093e\u0902\u091a\u093e \u0938\u0930\u093e\u0938\u0930\u0940',",
            "    'history.detail_context': '\u0906\u091c\u0942\u092c\u093e\u091c\u0942\u091a\u0940 \u0935\u093e\u091a\u0928\u0947',",
        ],
        'toast.copied': [
            "    'toast.saved': '\u0924\u0941\u092e\u091a\u094d\u092f\u093e \u092f\u093e\u0926\u0940\u0924 \u0938\u0947\u0935\u094d\u0939 \u091d\u093e\u0932\u0947',",
            "    'toast.unsaved': '\u0938\u0947\u0935\u094d\u0939\u092e\u0927\u0942\u0928 \u0915\u093e\u0922\u0932\u0947',",
        ],
        'discover.saved_empty': [
            "    'discover.saved_meta': '{n} \u0938\u0947\u0935\u094d\u0939 \\u00b7 \u0928\u0935\u0940\u0928 \u0906\u0927\u0940',",
        ],
    },
    'hinglish': {
        'history.delta_prev': [
            "    'history.trends_ma': '7 reading ka average',",
            "    'history.detail_context': 'Aas-paas ki readings',",
        ],
        'toast.copied': [
            "    'toast.saved': 'List me save ho gaya',",
            "    'toast.unsaved': 'Saved se hata diya',",
        ],
        'discover.saved_empty': [
            "    'discover.saved_meta': '{n} saved \\u00b7 naye pehle',",
        ],
    },
}

ANCHOR_KEYS = ['history.delta_prev', 'toast.copied', 'discover.saved_empty']

def detect_lang(line):
    for frag, lang in LANG_BY_FRAGMENT:
        if frag in line:
            return lang
    return None

out = []
inserted = {k: 0 for k in ANCHOR_KEYS}
for line in lines:
    out.append(line)
    for key in ANCHOR_KEYS:
        marker = f"'{key}':"
        if marker in line and not line.strip().startswith('//'):
            lang = detect_lang(line)
            if lang:
                for pl in PAYLOADS[lang][key]:
                    out.append(pl)
                    inserted[key] += 1

io.open(path, 'w', encoding='utf-8').write('\n'.join(out))
print('inserted counts (expect 4 each):', inserted)
for key in ANCHOR_KEYS:
    cnt = sum(1 for l in out if f"'{key}':" in l)
    print(f'anchor {key} total occurrences: {cnt}')
new_keys = ['history.trends_ma', 'history.detail_context', 'toast.saved', 'toast.unsaved', 'discover.saved_meta']
for nk in new_keys:
    cnt = sum(1 for l in out if f"'{nk}':" in l)
    status = 'OK' if cnt == 4 else 'FAIL'
    print(f'{nk}: {cnt} {status}')
sys.exit(0 if all(sum(1 for l in out if f"'{nk}':" in l) == 4 for nk in new_keys) else 1)
