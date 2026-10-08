#!/usr/bin/env python3
"""Round 8 i18n insertion (fixed, idempotent) — insert AFTER verified anchors.
Language block tracked via last-seen history.delta_prev anchor (blocks are sequential).
Idempotent: a key is never inserted if it already exists in the file."""
import io, sys

path = 'src/lib/i18n.ts'
src = io.open(path, encoding='utf-8').read()
lines = src.split('\n')

LANG_BY_FRAGMENT = [
    ('vs previous reading', 'en'),
    ('\u092a\u093f\u091b\u0932\u0940 \u0930\u0940\u0921\u093f\u0902\u0917 \u0938\u0947', 'hi'),
    ('\u092e\u093e\u0917\u0940\u0932 \u0935\u093e\u091a\u0928\u093e\u092a\u093e\u0938\u0942\u0928', 'mr'),
    ('pichli reading se', 'hinglish'),
]

PAYLOADS = {
    'en': {
        'toast.copied': [
            "    'toast.saved': 'Saved to your list',",
            "    'toast.unsaved': 'Removed from saved',",
        ],
        'discover.saved_empty': [
            "    'discover.saved_meta': '{n} saved \u00b7 newest first',",
        ],
    },
    'hi': {
        'toast.copied': [
            "    'toast.saved': '\u0906\u092a\u0915\u0940 \u0938\u0942\u091a\u0940 \u092e\u0947\u0902 \u0938\u0947\u0935 \u0939\u0941\u0906',",
            "    'toast.unsaved': '\u0938\u0947\u0935 \u0938\u0947 \u0939\u091f\u093e \u0926\u093f\u092f\u093e \u0917\u092f\u093e',",
        ],
        'discover.saved_empty': [
            "    'discover.saved_meta': '{n} \u0938\u0947\u0935 \u00b7 \u0928\u090f \u092a\u0939\u0932\u0947',",
        ],
    },
    'mr': {
        'toast.copied': [
            "    'toast.saved': '\u0924\u0941\u092e\u091a\u094d\u092f\u093e \u092f\u093e\u0926\u0940\u0924 \u0938\u0947\u0935\u094d\u0939 \u091d\u093e\u0932\u0947',",
            "    'toast.unsaved': '\u0938\u0947\u0935\u094d\u0939\u092e\u0927\u0942\u0928 \u0915\u093e\u0922\u0932\u0947',",
        ],
        'discover.saved_empty': [
            "    'discover.saved_meta': '{n} \u0938\u0947\u0935\u094d\u0939 \u00b7 \u0928\u0935\u0940\u0928 \u0906\u0927\u0940',",
        ],
    },
    'hinglish': {
        'toast.copied': [
            "    'toast.saved': 'List me save ho gaya',",
            "    'toast.unsaved': 'Saved se hata diya',",
        ],
        'discover.saved_empty': [
            "    'discover.saved_meta': '{n} saved \u00b7 naye pehle',",
        ],
    },
}

ANCHOR_KEYS = ['toast.copied', 'discover.saved_empty']
existing_keys = ['toast.saved', 'toast.unsaved', 'discover.saved_meta',
                 'history.trends_ma', 'history.detail_context']

def key_exists(key):
    return any(f"'{key}':" in l for l in lines)

def detect_lang(line):
    for frag, lang in LANG_BY_FRAGMENT:
        if frag in line:
            return lang
    return None

current_lang = None
out = []
counts = {k: 0 for k in ANCHOR_KEYS}
for line in lines:
    out.append(line)
    if "'history.delta_prev':" in line:
        lang = detect_lang(line)
        if lang:
            current_lang = lang
    for key in ANCHOR_KEYS:
        marker = f"'{key}':"
        if marker in line and not line.strip().startswith('//') and current_lang:
            for pl in PAYLOADS[current_lang][key]:
                nk = pl.split("'")[1]
                if not key_exists(nk):
                    out.append(pl)
                    counts[key] += 1

io.open(path, 'w', encoding='utf-8').write('\n'.join(out))
ok = True
for nk in existing_keys:
    cnt = sum(1 for l in out if f"'{nk}':" in l)
    status = 'OK' if cnt == 4 else 'FAIL'
    if cnt != 4: ok = False
    print(f'{nk}: {cnt} {status}')
print('newly inserted:', counts)
sys.exit(0 if ok else 1)
