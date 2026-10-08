#!/usr/bin/env python3
"""Repair discover.saved_meta: delete all existing occurrences, re-insert after
each discover.saved_empty anchor with language detected from the ANCHOR's own
unique content (block-order independent)."""
import io, sys

path = 'src/lib/i18n.ts'
lines = io.open(path, encoding='utf-8').read().split('\n')

# 1) Remove every existing discover.saved_meta line
lines = [l for l in lines if "'discover.saved_meta':" not in l]

# 2) Language by the saved_empty anchor's own unique fragment
SAVED_EMPTY_LANG = [
    ('No saved videos yet', 'en'),
    ('\u0905\u092d\u0940 \u0915\u094b\u0908 \u0938\u0947\u0935 \u0915\u093f\u092f\u093e \u0935\u0940\u0921\u093f\u092f\u094b \u0928\u0939\u0940\u0902', 'hi'),
    ('\u0905\u091c\u0942\u0928 \u0915\u094b\u0923\u0924\u093e\u0939\u0940 \u0938\u0947\u0935\u094d\u0939 \u0915\u0947\u0932\u0947\u0932\u093e', 'mr'),
    ('Abhi tak koi saved video nahi', 'hinglish'),
]

META_BY_LANG = {
    'en': "    'discover.saved_meta': '{n} saved \u00b7 newest first',",
    'hi': "    'discover.saved_meta': '{n} \u0938\u0947\u0935 \u00b7 \u0928\u090f \u092a\u0939\u0932\u0947',",
    'mr': "    'discover.saved_meta': '{n} \u0938\u0947\u0935\u094d\u0939 \u00b7 \u0928\u0935\u0940\u0928 \u0906\u0927\u0940',",
    'hinglish': "    'discover.saved_meta': '{n} saved \u00b7 naye pehle',",
}

out = []
inserted = 0
for line in lines:
    out.append(line)
    if "'discover.saved_empty':" in line and not line.strip().startswith('//'):
        lang = None
        for frag, lg in SAVED_EMPTY_LANG:
            if frag in line:
                lang = lg
                break
        if lang:
            out.append(META_BY_LANG[lang])
            inserted += 1

io.open(path, 'w', encoding='utf-8').write('\n'.join(out))

ok = True
for nk in ['discover.saved_meta', 'toast.saved', 'toast.unsaved',
           'history.trends_ma', 'history.detail_context',
           'toast.demo_off', 'history.trend_drop', 'history.score_title', 'settings.sound']:
    cnt = sum(1 for l in out if f"'{nk}':" in l)
    expect = 4
    status = 'OK' if cnt == expect else 'FAIL'
    if cnt != expect: ok = False
    print(f'{nk}: {cnt} {status}')
print('meta re-inserted:', inserted)
sys.exit(0 if ok else 1)
