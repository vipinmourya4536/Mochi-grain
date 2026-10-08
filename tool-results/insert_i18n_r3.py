#!/usr/bin/env python3
"""Insert Round-3 i18n keys into all 4 language blocks of i18n.ts (idempotent)."""
import re, sys

PATH = '/home/z/my-project/src/lib/i18n.ts'
src = open(PATH, encoding='utf-8').read()

if "'chart.scrub_hint'" in src:
    print('ALREADY-INSERTED'); sys.exit(0)

lines = src.split('\n')

# Locate language block ranges by their opening lines
starts = {}
for i, ln in enumerate(lines):
    m = re.match(r'^  (en|hi|mr|hinglish): \{', ln)
    if m:
        starts[m.group(1)] = i

order = ['en', 'hi', 'mr', 'hinglish']
bounds = {}
for idx, lang in enumerate(order):
    s = starts[lang]
    e = starts[order[idx + 1]] - 1 if idx + 1 < len(order) else len(lines) - 1
    bounds[lang] = (s, e)

GROUPS = {
    'settings.download': [
        "    'settings.export_backup': '{export_backup}',",
        "    'settings.import_backup': '{import_backup}',",
        "    'settings.full_data': '{full_data}',",
        "    'settings.install_app': '{install_app}',",
        "    'settings.install_desc': '{install_desc}',",
        "    'header.offline': '{offline}',",
    ],
    'toast.export_failed': [
        "    'toast.backup_exported': '{backup_exported}',",
        "    'toast.backup_imported': '{backup_imported}',",
        "    'toast.import_failed': '{import_failed}',",
        "    'toast.import_invalid': '{import_invalid}',",
        "    'toast.install_ok': '{install_ok}',",
        "    'toast.install_dismissed': '{install_dismissed}',",
    ],
    'demo.live': [
        "    'chart.scrub_hint': '{scrub_hint}',",
    ],
}

TEXT = {
    'en': {
        'export_backup': 'Export Backup', 'import_backup': 'Import Backup',
        'full_data': 'Full data + settings', 'install_app': 'Install App',
        'install_desc': 'Add to home screen', 'offline': 'OFFLINE',
        'backup_exported': 'Backup exported', 'backup_imported': 'Backup restored',
        'import_failed': 'Import failed', 'import_invalid': 'Invalid backup file',
        'install_ok': 'App install started', 'install_dismissed': 'Install dismissed',
        'scrub_hint': 'Swipe to inspect history',
    },
    'hi': {
        'export_backup': 'बैकअप निर्यात', 'import_backup': 'बैकअप आयात',
        'full_data': 'पूरा डेटा + सेटिंग्स', 'install_app': 'ऐप इंस्टॉल करें',
        'install_desc': 'होम स्क्रीन पर जोड़ें', 'offline': 'ऑफ़लाइन',
        'backup_exported': 'बैकअप निर्यात हुआ', 'backup_imported': 'बैकअप पुनर्स्थापित',
        'import_failed': 'आयात विफल', 'import_invalid': 'अमान्य बैकअप फ़ाइल',
        'install_ok': 'ऐप इंस्टॉल शुरू', 'install_dismissed': 'इंस्टॉल रद्द',
        'scrub_hint': 'इतिहास देखने के लिए स्वाइप करें',
    },
    'mr': {
        'export_backup': 'बैकअप निर्यात', 'import_backup': 'बैकअप आयात',
        'full_data': 'संपूर्ण डेटा + सेटिंग्ज़', 'install_app': 'अ‍ॅप इंस्टॉल करा',
        'install_desc': 'होम स्क्रीनवर जोडा', 'offline': 'ऑफलाइन',
        'backup_exported': 'बैकअप निर्यात झाले', 'backup_imported': 'बैकअप पुनर्स्थापित',
        'import_failed': 'आयात अयशस्वी', 'import_invalid': 'अवैध बैकअप फाइल',
        'install_ok': 'अ‍ॅप इंस्टॉल सुरू', 'install_dismissed': 'इंस्टॉल रद्द',
        'scrub_hint': 'इतिहास पाहण्यासाठी स्वाइप करा',
    },
    'hinglish': {
        'export_backup': 'Backup export', 'import_backup': 'Backup import',
        'full_data': 'Poora data + settings', 'install_app': 'App install karo',
        'install_desc': 'Home screen pe add karo', 'offline': 'OFFLINE',
        'backup_exported': 'Backup export ho gaya', 'backup_imported': 'Backup restore ho gaya',
        'import_failed': 'Import fail hua', 'import_invalid': 'Galat backup file',
        'install_ok': 'App install shuru', 'install_dismissed': 'Install cancel hua',
        'scrub_hint': 'History dekhne ke liye swipe karo',
    },
}

insertions = []  # (line_index, [lines to insert AFTER that index])
for lang in order:
    s, e = bounds[lang]
    block = lines[s:e + 1]
    for anchor, group in GROUPS.items():
        found = None
        for j, ln in enumerate(block):
            if f"'{anchor}':" in ln:
                found = j
                break
        if found is None:
            print(f'ERROR: anchor {anchor} not found in {lang}'); sys.exit(1)
        new_lines = [g.format(**TEXT[lang]) for g in group]
        insertions.append((s + found, new_lines))

# Apply insertions bottom-up so earlier indices stay valid
for pos, new_lines in sorted(insertions, key=lambda x: -x[0]):
    lines[pos + 1:pos + 1] = new_lines

open(PATH, 'w', encoding='utf-8').write('\n'.join(lines))
print('INSERTED OK')
