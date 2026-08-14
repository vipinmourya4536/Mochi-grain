/* ═══════════════════════════════════════════════════
   Grain Monitor – i18n Translation System
   Languages: English, Hindi, Marathi, Hinglish
   ═══════════════════════════════════════════════════ */

export type AppLanguage = 'en' | 'hi' | 'mr' | 'hinglish';

export const LANGUAGE_OPTIONS: { code: AppLanguage; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'hinglish', label: 'Hinglish', native: 'Hinglish' },
];

export const LANG_MAP: Record<string, string> = {
  en: 'en', hi: 'hi', mr: 'mr', hinglish: 'en',
};

/* ═══════════════════════════════════════════════════════════════
   TRANSLATIONS – every user-facing string in the app
   ═══════════════════════════════════════════════════════════════ */

const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    // ── Header ──
    'app.title': 'Grain Monitor',
    'status.offline': 'Offline',
    'status.pairing': 'Pairing...',
    'status.stable': 'STABLE',
    'status.rising': 'RISING',
    'status.warning': 'WARNING',
    'status.critical': 'CRITICAL',
    'status.sleeping': 'SLEEPING',
    'status.syncing': 'SYNCING',

    // ── Navigation ──
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.history': 'History',
    'nav.settings': 'Settings',

    // ── Disconnected ──
    'disconnected.title': 'No Device',
    'disconnected.desc': 'Connect your GRAIN-01 probe to begin monitoring moisture levels.',
    'disconnected.connect': 'CONNECT PROBE',
    'disconnected.hint': 'Make sure your probe is powered on and nearby',

    // ── Connecting ──
    'connecting.title': 'Pairing',
    'connecting.subtitle': 'GRAIN-01',

    // ── Syncing ──
    'syncing.title': 'Syncing',
    'syncing.desc': 'Retrieving history from probe...',

    // ── Sleeping ──
    'sleeping.title': 'Probe Sleeping',
    'sleeping.desc': 'The probe is in low-power mode to conserve battery. Readings will resume when it wakes.',
    'sleeping.battery': 'Battery',
    'sleeping.wake': 'WAKE PROBE',

    // ── Low Battery ──
    'lowbattery.title': 'Low Battery',
    'lowbattery.desc': 'Probe battery is critically low. Replace or charge the battery soon to avoid data loss.',
    'lowbattery.level': 'Battery Level',

    // ── Hero Card ──
    'hero.moisture': 'Moisture',
    'hero.moisture_content': 'moisture content',

    // ── Metric Pills ──
    'metric.temp': 'Temp',
    'metric.signal': 'Signal',
    'metric.grain': 'Grain',

    // ── Insight ──
    'insight.probe_sleeping': 'Probe Sleeping',
    'insight.probe_sleeping_desc': 'The probe is sleeping to save power. Readings will resume on wake.',
    'insight.syncing_history': 'Syncing History',
    'insight.syncing_history_desc': 'Retrieving stored readings from the probe. This may take a moment.',
    'insight.action_required': 'Action Required',
    'insight.attention': 'Attention Needed',
    'insight.storage_safe': 'Storage is Safe',

    // ── Recent Readings ──
    'recent.title': 'Recent Readings',
    'recent.show_more': 'Show More',
    'recent.today': 'Today',
    'recent.yesterday': 'Yesterday',

    // ── Discover ──
    'discover.title': 'Discover',
    'discover.connected_desc_safe': 'Conditions are stable. Use this time to learn and prepare for seasonal changes.',
    'discover.connected_desc_warn': 'Readings are elevated. These resources help you understand and respond to changing conditions.',
    'discover.connected_desc_critical': 'Your current readings are critical. These resources focus on emergency response and damage prevention.',
    'discover.disconnected_desc': 'Connect a probe for personalised recommendations',
    'discover.condition_normal': 'Normal',
    'discover.condition_elevated': 'Elevated',
    'discover.condition_critical': 'Critical',
    'discover.no_results': 'No recommendations available for this combination yet.',

    // ── History ──
    'history.title': 'History',
    'history.readings': 'readings stored',
    'history.reading': 'reading stored',
    'history.past': 'Past readings',
    'history.no_history': 'No History Yet',
    'history.no_history_desc': 'Readings will appear here once you connect your probe.',
    'history.detail': 'Reading Detail',
    'history.moisture': 'Moisture',
    'history.temperature': 'Temperature',
    'history.battery': 'Battery',
    'history.signal': 'Signal',
    'history.grain': 'Grain',
    'history.rule': 'Rule',
    'history.confidence': 'Confidence',
    'history.severity': 'Severity',
    'history.safe': 'Safe',
    'history.warning': 'Warning',
    'history.critical': 'Critical',
    'history.trend_stable': 'Stable',
    'history.trend_rising': 'Rising',
    'history.trend_falling': 'Falling',
    'history.trend_spike': 'Spike',
    'history.trend_drop': 'Drop',

    // ── Settings ──
    'settings.title': 'Settings',
    'settings.desc': 'Device & preferences',
    'settings.device': 'Device',
    'settings.calibrate': 'CALIBRATE',
    'settings.probe_controls': 'Probe Controls',
    'settings.sync_history': 'Sync History',
    'settings.sync_history_desc': 'Pull old readings',
    'settings.wake_probe': 'Wake Probe',
    'settings.wake_probe_desc': 'Exit sleep mode',
    'settings.no_device': 'No device connected',
    'settings.grain_type': 'Grain Type',
    'settings.thresholds': 'Moisture Thresholds (%)',
    'settings.thresholds_desc': 'Auto-set from grain profile. Drag to fine-tune.',
    'settings.safe': 'Safe',
    'settings.warn': 'Warning',
    'settings.critical': 'Critical',
    'settings.preferences': 'Preferences',
    'settings.push_alerts': 'Push Alerts',
    'settings.auto_sync': 'Auto-sync',
    'settings.auto_reconnect': 'Auto-reconnect',
    'settings.wake_on_connect': 'Wake on Connect',
    'settings.data': 'Data',
    'settings.export_csv': 'Export CSV',
    'settings.download': 'Download',
    'settings.clear_history': 'Clear History',
    'settings.local_only': 'Local only',
    'settings.about': 'About',
    'settings.app_version': 'App Version',
    'settings.engine': 'Engine',
    'settings.probe_firmware': 'Probe Firmware',
    'settings.advanced': 'Advanced Settings',
    'settings.built_for': 'Grain Monitor v1.0 · Built for ESP32',

    // ── Language ──
    'language.title': 'Language',
    'language.choose': 'Choose your preferred language',
    'language.change': 'Change language',

    // ── Accent themes ──
    'accent.title': 'Accent Color',
    'accent.orange': 'Orange',
    'accent.green': 'Green',
    'accent.purple': 'Purple',
    'accent.blue': 'Blue',
    'accent.teal': 'Teal',

    // ── Theme ──
    'theme.title': 'Theme',
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'theme.tap_switch': 'Tap to switch',
    'settings.connect_first': 'Connect a device first',

    // ── Toasts ──
    'toast.connected': 'connected',
    'toast.disconnected': 'Device disconnected',
    'toast.no_device_selected': 'No device selected',
    'toast.connection_failed': 'Connection failed',
    'toast.device_connected': '{name} connected',
    'toast.alerts_on': 'Alerts enabled',
    'toast.alerts_off': 'Alerts disabled',
    'toast.autosync_on': 'Auto-sync on',
    'toast.autosync_off': 'Auto-sync off',
    'toast.csv_exported': 'CSV exported',
    'toast.export_failed': 'Export failed',
    'toast.history_cleared': 'History cleared',
    'toast.command_sent': 'Command sent:',
    'toast.command_failed': 'Command failed:',
    'toast.history_synced': 'History synchronised',
    'toast.syncing_history': 'Syncing probe history...',
    'toast.sync_failed': 'Sync command failed',
    'toast.demo_on': 'Demo mode ON – simulating live data',
    'toast.demo_off': 'Demo mode OFF',

    // ── Demo Mode ──
    'demo.title': 'Demo Mode',
    'demo.desc': 'Simulate a connected probe with live-updating data. No hardware required.',
    'demo.start': 'Start Demo',
    'demo.stop': 'Stop Demo',
    'demo.active': 'Demo Active',
    'demo.badge': 'DEMO',

    // ── Bluetooth Gate ──
    'bt.gate.title': 'Bluetooth Required',
    'bt.gate.desc': 'This app requires Bluetooth to connect to your GRAIN-01 probe. Please enable Bluetooth to continue.',
    'bt.gate.off_title': 'Turn on Bluetooth to use app',
    'bt.gate.checking_title': 'Checking Bluetooth...',
    'bt.gate.unsupported': 'Bluetooth Not Supported',
    'bt.gate.unsupported_desc': 'Your browser does not support Web Bluetooth. Please use Chrome or Edge.',
    'bt.gate.check': 'Check Again',
    'bt.gate.enable': 'Enable Bluetooth',
    'bt.gate.continue': 'Continue',
    'bt.home_prompt': 'Turn on Bluetooth',
    'bt.home_prompt_desc': 'Bluetooth is required to connect to your probe',

    // ── Grain Types ──
    'grain.wheat': 'Wheat',
    'grain.rice': 'Rice',
    'grain.corn': 'Corn',
    'grain.barley': 'Barley',
    'grain.soybean': 'Soybean',
    'grain.sorghum': 'Sorghum',
    'grain.oats': 'Oats',
    'grain.millet': 'Millet',
    'grain.other': 'Other',

    // ── Trend Directions ──
    'trend.stable': 'Stable',
    'trend.rising': 'Rising',
    'trend.falling': 'Falling',
    'trend.spike': 'Spike',
    'trend.drop': 'Drop',

    // ── Mochi Engine Messages ──
    'mochi.safe_0': 'Storage conditions are stable.',
    'mochi.safe_1': 'All readings within normal range.',
    'mochi.safe_2': 'Moisture and temperature look good.',
    'mochi.safe_action_0': 'Continue monitoring. No action needed.',
    'mochi.safe_action_1': 'Maintain current storage conditions.',
    'mochi.warn_0': 'Moisture is rising. Check ventilation and storage conditions.',
    'mochi.warn_1': 'Temperature is elevated. Ensure proper airflow.',
    'mochi.warn_2': 'Readings above normal. Monitor closely.',
    'mochi.warn_action_0': 'Check ventilation. Consider running fans or aerating.',
    'mochi.warn_action_1': 'Inspect grain bin for condensation or hot spots.',
    'mochi.critical_0': 'High moisture may increase spoilage risk. Dry the grain promptly.',
    'mochi.critical_1': 'Temperature dangerously high. Risk of spontaneous heating.',
    'mochi.critical_2': 'Both readings at dangerous levels. Act immediately.',
    'mochi.critical_action_0': 'Begin drying immediately. Contact storage facility.',
    'mochi.critical_action_1': 'Move grain to a safer environment. Do not delay.',

    // ── Secondary Observations ──
    'obs.low_battery': 'Low battery detected on probe.',
    'obs.weak_signal': 'Weak signal – move closer to probe.',
  },

  hi: {
    // ── Header ──
    'app.title': 'ग्रेन मॉनिटर',
    'status.offline': 'ऑफलाइन',
    'status.pairing': 'पेयरिंग...',
    'status.stable': 'स्थिर',
    'status.rising': 'बढ़ रहा है',
    'status.warning': 'चेतावनी',
    'status.critical': 'गंभीर',
    'status.sleeping': 'सो रहा है',
    'status.syncing': 'सिंक हो रहा है',

    // ── Navigation ──
    'nav.home': 'होम',
    'nav.discover': 'खोजें',
    'nav.history': 'इतिहास',
    'nav.settings': 'सेटिंग्स',

    // ── Disconnected ──
    'disconnected.title': 'कोई डिवाइस नहीं',
    'disconnected.desc': 'नमी स्तर की निगरानी शुरू करने के लिए अपना GRAIN-01 प्रोब कनेक्ट करें।',
    'disconnected.connect': 'प्रोब कनेक्ट करें',
    'disconnected.hint': 'प्रोब चालू है और पास में है यह सुनिश्चित करें',

    // ── Connecting ──
    'connecting.title': 'पेयरिंग',
    'connecting.subtitle': 'GRAIN-01',

    // ── Syncing ──
    'syncing.title': 'सिंक हो रहा है',
    'syncing.desc': 'प्रोब से इतिहास पुनर्प्राप्त किया जा रहा है...',

    // ── Sleeping ──
    'sleeping.title': 'प्रोब सो रहा है',
    'sleeping.desc': 'प्रोब बैटरी बचाने के लिए लो-पावर मोड में है। जागने पर रीडिंग फिर शुरू होगी।',
    'sleeping.battery': 'बैटरी',
    'sleeping.wake': 'प्रोब जगाएं',

    // ── Low Battery ──
    'lowbattery.title': 'कम बैटरी',
    'lowbattery.desc': 'प्रोब बैटरी गंभीर रूप से कम है। डेटा हानि से बचने के लिए जल्दी बैटरी बदलें या चार्ज करें।',
    'lowbattery.level': 'बैटरी स्तर',

    // ── Hero Card ──
    'hero.moisture': 'नमी',
    'hero.moisture_content': 'नमी सामग्री',

    // ── Metric Pills ──
    'metric.temp': 'तापमान',
    'metric.signal': 'सिग्नल',
    'metric.grain': 'अनाज',

    // ── Insight ──
    'insight.probe_sleeping': 'प्रोब सो रहा है',
    'insight.probe_sleeping_desc': 'प्रोब बिजली बचाने के लिए सो रहा है। जागने पर रीडिंग फिर शुरू होगी।',
    'insight.syncing_history': 'इतिहास सिंक हो रहा है',
    'insight.syncing_history_desc': 'प्रोब से संग्रहीत रीडिंग पुनर्प्राप्त की जा रही है। इसमें कुछ समय लग सकता है।',
    'insight.action_required': 'कार्रवाई आवश्यक',
    'insight.attention': 'ध्यान दें',
    'insight.storage_safe': 'भंडारण सुरक्षित है',

    // ── Recent Readings ──
    'recent.title': 'हालिया रीडिंग',
    'recent.show_more': 'और देखें',
    'recent.today': 'आज',
    'recent.yesterday': 'कल',

    // ── Discover ──
    'discover.title': 'खोजें',
    'discover.connected_desc_safe': 'स्थिति स्थिर है। मौसमी बदलावों के लिए तैयारी करने का यह समय है।',
    'discover.connected_desc_warn': 'रीडिंग बढ़ रही है। ये संसाधन बदलती परिस्थितियों को समझने में मदद करेंगे।',
    'discover.connected_desc_critical': 'आपकी वर्तमान रीडिंग गंभीर है। ये संसाधन आपातकालीन प्रतिक्रिया पर केंद्रित हैं।',
    'discover.disconnected_desc': 'व्यक्तिगत सिफारिशों के लिए प्रोब कनेक्ट करें',
    'discover.condition_normal': 'सामान्य',
    'discover.condition_elevated': 'बढ़ा हुआ',
    'discover.condition_critical': 'गंभीर',
    'discover.no_results': 'इस संयोजन के लिए अभी तक कोई सिफारिश उपलब्ध नहीं है।',

    // ── History ──
    'history.title': 'इतिहास',
    'history.readings': 'रीडिंग संग्रहीत',
    'history.reading': 'रीडिंग संग्रहीत',
    'history.past': 'पिछली रीडिंग',
    'history.no_history': 'अभी तक कोई इतिहास नहीं',
    'history.no_history_desc': 'प्रोब कनेक्ट करने पर रीडिंग यहां दिखाई देंगी।',
    'history.detail': 'रीडिंग विवरण',
    'history.moisture': 'नमी',
    'history.temperature': 'तापमान',
    'history.battery': 'बैटरी',
    'history.signal': 'सिग्नल',
    'history.grain': 'अनाज',
    'history.rule': 'नियम',
    'history.confidence': 'विश्वास',
    'history.severity': 'गंभीरता',
    'history.safe': 'सुरक्षित',
    'history.warning': 'चेतावनी',
    'history.critical': 'गंभीर',
    'history.trend_stable': 'स्थिर',
    'history.trend_rising': 'बढ़ रहा है',
    'history.trend_falling': 'घट रहा है',
    'history.trend_spike': 'अचानक वृद्धि',
    'history.trend_drop': 'अचानक गिरावट',

    // ── Settings ──
    'settings.title': 'सेटिंग्स',
    'settings.desc': 'डिवाइस और प्राथमिकताएं',
    'settings.device': 'डिवाइस',
    'settings.calibrate': 'कैलिब्रेट',
    'settings.probe_controls': 'प्रोब नियंत्रण',
    'settings.sync_history': 'इतिहास सिंक करें',
    'settings.sync_history_desc': 'पुरानी रीडिंग खींचें',
    'settings.wake_probe': 'प्रोब जगाएं',
    'settings.wake_probe_desc': 'स्लीप मोड से बाहर',
    'settings.no_device': 'कोई डिवाइस कनेक्ट नहीं',
    'settings.grain_type': 'अनाज का प्रकार',
    'settings.thresholds': 'नमी सीमाएं (%)',
    'settings.thresholds_desc': 'अनाज प्रोफाइल से स्वचालित। बारीक ट्यूनिंग के लिए खींचें।',
    'settings.safe': 'सुरक्षित',
    'settings.warn': 'चेतावनी',
    'settings.critical': 'गंभीर',
    'settings.preferences': 'प्राथमिकताएं',
    'settings.push_alerts': 'पुश अलर्ट',
    'settings.auto_sync': 'ऑटो-सिंक',
    'settings.auto_reconnect': 'ऑटो-रीकनेक्ट',
    'settings.wake_on_connect': 'कनेक्ट पर जगाएं',
    'settings.data': 'डेटा',
    'settings.export_csv': 'CSV निर्यात',
    'settings.download': 'डाउनलोड',
    'settings.clear_history': 'इतिहास साफ करें',
    'settings.local_only': 'केवल स्थानीय',
    'settings.about': 'बारे में',
    'settings.app_version': 'ऐप संस्करण',
    'settings.engine': 'इंजन',
    'settings.probe_firmware': 'प्रोब फर्मवेयर',
    'settings.advanced': 'उन्नत सेटिंग्स',
    'settings.built_for': 'ग्रेन मॉनिटर v1.0 · ESP32 के लिए बनाया गया',

    // ── Language ──
    'language.title': 'भाषा',
    'language.choose': 'अपनी पसंदीदा भाषा चुनें',
    'language.change': 'भाषा बदलें',

    // ── Accent themes ──
    'accent.title': 'एक्सेंट रंग',
    'accent.orange': 'नारंगी',
    'accent.green': 'हरा',
    'accent.purple': 'बैंगनी',
    'accent.blue': 'नीला',
    'accent.teal': 'टील',

    // ── Theme ──
    'theme.title': 'थीम',
    'theme.dark': 'डार्क',
    'theme.light': 'लाइट',
    'theme.tap_switch': 'बदलने के लिए टैप करें',
    'settings.connect_first': 'पहले एक डिवाइस कनेक्ट करें',

    // ── Toasts ──
    'toast.connected': 'कनेक्ट हुआ',
    'toast.disconnected': 'डिवाइस डिस्कनेक्ट हुआ',
    'toast.no_device_selected': 'कोई डिवाइस चयनित नहीं',
    'toast.connection_failed': 'कनेक्शन विफल',
    'toast.device_connected': '{name} कनेक्ट हुआ',
    'toast.alerts_on': 'अलर्ट चालू',
    'toast.alerts_off': 'अलर्ट बंद',
    'toast.autosync_on': 'ऑटो-सिंक चालू',
    'toast.autosync_off': 'ऑटो-सिंक बंद',
    'toast.csv_exported': 'CSV निर्यात हुआ',
    'toast.export_failed': 'निर्यात विफल',
    'toast.history_cleared': 'इतिहास साफ हुआ',
    'toast.command_sent': 'कमांड भेजा गया:',
    'toast.command_failed': 'कमांड विफल:',
    'toast.history_synced': 'इतिहास सिंक हुआ',
    'toast.syncing_history': 'प्रोब से इतिहास सिंक हो रहा है...',
    'toast.sync_failed': 'सिंक कमांड विफल',
    'toast.demo_on': 'डेमो मोड चालू – लाइव डेटा सिमुलेट हो रहा है',
    'toast.demo_off': 'डेमो मोड बंद',

    // ── Demo Mode ──
    'demo.title': 'डेमो मोड',
    'demo.desc': 'हार्डवेयर के बिना कनेक्टेड प्रोब का अनुकरण करें। लाइव डेटा अपडेट होगा।',
    'demo.start': 'डेमो शुरू करें',
    'demo.stop': 'डेमो बंद करें',
    'demo.active': 'डेमो चल रहा है',
    'demo.badge': 'डेमो',

    // ── Bluetooth Gate ──
    'bt.gate.title': 'ब्लूटूथ आवश्यक',
    'bt.gate.desc': 'इस ऐप को आपके GRAIN-01 प्रोब से कनेक्ट करने के लिए ब्लूटूथ चाहिए। कृपया जारी रखने के लिए ब्लूटूथ चालू करें।',
    'bt.gate.off_title': 'ऐप का उपयोग करने के लिए ब्लूटूथ चालू करें',
    'bt.gate.checking_title': 'ब्लूटूथ जांच रहा है...',
    'bt.gate.unsupported': 'ब्लूटूथ समर्थित नहीं',
    'bt.gate.unsupported_desc': 'आपका ब्राउज़र वेब ब्लूटूथ का समर्थन नहीं करता। कृपया Chrome या Edge का उपयोग करें।',
    'bt.gate.check': 'फिर से जांचें',
    'bt.gate.enable': 'ब्लूटूथ चालू करें',
    'bt.gate.continue': 'जारी रखें',
    'bt.home_prompt': 'ब्लूटूथ चालू करें',
    'bt.home_prompt_desc': 'प्रोब से कनेक्ट करने के लिए ब्लूटूथ आवश्यक है',

    // ── Grain Types ──
    'grain.wheat': 'गेहूं',
    'grain.rice': 'चावल',
    'grain.corn': 'मक्का',
    'grain.barley': 'जौ',
    'grain.soybean': 'सोयाबीन',
    'grain.sorghum': 'ज्वार',
    'grain.oats': 'जई',
    'grain.millet': 'बाजरा',
    'grain.other': 'अन्य',

    // ── Trend Directions ──
    'trend.stable': 'स्थिर',
    'trend.rising': 'बढ़ रहा है',
    'trend.falling': 'घट रहा है',
    'trend.spike': 'अचानक वृद्धि',
    'trend.drop': 'अचानक गिरावट',

    // ── Mochi Engine Messages ──
    'mochi.safe_0': 'भंडारण की स्थिति स्थिर है।',
    'mochi.safe_1': 'सभी रीडिंग सामान्य सीमा में हैं।',
    'mochi.safe_2': 'नमी और तापमान ठीक हैं।',
    'mochi.safe_action_0': 'निगरानी जारी रखें। कोई कार्रवाई आवश्यक नहीं।',
    'mochi.safe_action_1': 'वर्तमान भंडारण स्थितियां बनाए रखें।',
    'mochi.warn_0': 'नमी बढ़ रही है। वेंटिलेशन और भंडारण स्थितियां जांचें।',
    'mochi.warn_1': 'तापमान बढ़ा हुआ है। उचित हवा का प्रवाह सुनिश्चित करें।',
    'mochi.warn_2': 'रीडिंग सामान्य से ऊपर हैं। करीब से निगरानी करें।',
    'mochi.warn_action_0': 'वेंटिलेशन जांचें। पंखे चलाने या हवा देने पर विचार करें।',
    'mochi.warn_action_1': 'गोदाम में संक्यंदन या गर्म बिंदुओं की जांच करें।',
    'mochi.critical_0': 'उच्च नमी से सड़न का खतरा बढ़ सकता है। अनाज को तुरंत सुखाएं।',
    'mochi.critical_1': 'तापमान खतरनाक रूप से उच्च है। स्वतः गर्म होने का खतरा।',
    'mochi.critical_2': 'दोनों रीडिंग खतरनाक स्तर पर हैं। तुरंत कार्रवाई करें।',
    'mochi.critical_action_0': 'तुरंत सुखाना शुरू करें। भंडारण सुविधा से संपर्क करें।',
    'mochi.critical_action_1': 'अनाज को सुरक्षित वातावरण में स्थानांतरित करें। देर न करें।',

    // ── Secondary Observations ──
    'obs.low_battery': 'प्रोब पर कम बैटरी पाई गई।',
    'obs.weak_signal': 'कमजोर सिग्नल – प्रोब के करीब जाएं।',
  },

  mr: {
    // ── Header ──
    'app.title': 'ग्रेन मॉनिटर',
    'status.offline': 'ऑफलाइन',
    'status.pairing': 'पेअरिंग...',
    'status.stable': 'स्थिर',
    'status.rising': 'वाढत आहे',
    'status.warning': 'इशारा',
    'status.critical': 'गंभीर',
    'status.sleeping': 'झोपेत आहे',
    'status.syncing': 'सिंक होत आहे',

    // ── Navigation ──
    'nav.home': 'होम',
    'nav.discover': 'शोधा',
    'nav.history': 'इतिहास',
    'nav.settings': 'सेटिंग्ज',

    // ── Disconnected ──
    'disconnected.title': 'कोणतेही डिव्हाइस नाही',
    'disconnected.desc': 'ओलावा पातळी निरीक्षण सुरू करण्यासाठी तुमचा GRAIN-01 प्रोब कनेक्ट करा.',
    'disconnected.connect': 'प्रोब कनेक्ट करा',
    'disconnected.hint': 'तुमचा प्रोब चालू आहे आणि जवळ आहे हे सुनिश्चित करा',

    // ── Connecting ──
    'connecting.title': 'पेअरिंग',
    'connecting.subtitle': 'GRAIN-01',

    // ── Syncing ──
    'syncing.title': 'सिंक होत आहे',
    'syncing.desc': 'प्रोबवरून इतिहास मिळवत आहे...',

    // ── Sleeping ──
    'sleeping.title': 'प्रोब झोपेत आहे',
    'sleeping.desc': 'प्रोब बॅटरी वाचवण्यासाठी लो-पॉवर मोडमध्ये आहे. जागा झाल्यावर रीडिंग पुन्हा सुरू होईल.',
    'sleeping.battery': 'बॅटरी',
    'sleeping.wake': 'प्रोब जागा करा',

    // ── Low Battery ──
    'lowbattery.title': 'कमी बॅटरी',
    'lowbattery.desc': 'प्रोब बॅटरी गंभीररित्या कमी आहे. डेटा हानी टाळण्यासाठी लवकर बॅटरी बदला किंवा चार्ज करा.',
    'lowbattery.level': 'बॅटरी पातळी',

    // ── Hero Card ──
    'hero.moisture': 'ओलावा',
    'hero.moisture_content': 'ओलावा सामग्री',

    // ── Metric Pills ──
    'metric.temp': 'तापमान',
    'metric.signal': 'सिग्नल',
    'metric.grain': 'धान्य',

    // ── Insight ──
    'insight.probe_sleeping': 'प्रोब झोपेत आहे',
    'insight.probe_sleeping_desc': 'प्रोब ऊर्जा वाचवण्यासाठी झोपेत आहे. जागा झाल्यावर रीडिंग पुन्हा सुरू होईल.',
    'insight.syncing_history': 'इतिहास सिंक होत आहे',
    'insight.syncing_history_desc': 'प्रोबवरून साठवलेल्या रीडिंग मिळवत आहे. याला काही वेळ लागू शकतो.',
    'insight.action_required': 'कार्यवाही आवश्यक',
    'insight.attention': 'लक्ष द्या',
    'insight.storage_safe': 'साठा सुरक्षित आहे',

    // ── Recent Readings ──
    'recent.title': 'अलीकडील रीडिंग',
    'recent.show_more': 'अधिक पहा',
    'recent.today': 'आज',
    'recent.yesterday': 'काल',

    // ── Discover ──
    'discover.title': 'शोधा',
    'discover.connected_desc_safe': 'परिस्थिती स्थिर आहे. हंगामी बदलांसाठी तयारी करण्याची ही वेळ आहे.',
    'discover.connected_desc_warn': 'रीडिंग वाढत आहे. ही संसाधने बदलत्या परिस्थिती समजून घेण्यास मदत करतील.',
    'discover.connected_desc_critical': 'तुमची सध्याची रीडिंग गंभीर आहे. ही संसाधने आपत्कालीन प्रतिसादावर केंद्रित आहेत.',
    'discover.disconnected_desc': 'वैयक्तिक शिफारसींसाठी प्रोब कनेक्ट करा',
    'discover.condition_normal': 'सामान्य',
    'discover.condition_elevated': 'वाढलेले',
    'discover.condition_critical': 'गंभीर',
    'discover.no_results': 'या संयोजनासाठी अद्याप कोणतीही शिफारस उपलब्ध नाही.',

    // ── History ──
    'history.title': 'इतिहास',
    'history.readings': 'रीडिंग साठवल्या',
    'history.reading': 'रीडिंग साठवली',
    'history.past': 'मागील रीडिंग',
    'history.no_history': 'अद्याप इतिहास नाही',
    'history.no_history_desc': 'प्रोब कनेक्ट केल्यावर रीडिंग इथे दिसतील.',
    'history.detail': 'रीडिंग तपशील',
    'history.moisture': 'ओलावा',
    'history.temperature': 'तापमान',
    'history.battery': 'बॅटरी',
    'history.signal': 'सिग्नल',
    'history.grain': 'धान्य',
    'history.rule': 'नियम',
    'history.confidence': 'विश्वास',
    'history.severity': 'गंभीरता',
    'history.safe': 'सुरक्षित',
    'history.warning': 'इशारा',
    'history.critical': 'गंभीर',
    'history.trend_stable': 'स्थिर',
    'history.trend_rising': 'वाढत आहे',
    'history.trend_falling': 'कमी होत आहे',
    'history.trend_spike': 'अचानक वाढ',
    'history.trend_drop': 'अचानक घट',

    // ── Settings ──
    'settings.title': 'सेटिंग्ज',
    'settings.desc': 'डिव्हाइस आणि प्राधान्ये',
    'settings.device': 'डिव्हाइस',
    'settings.calibrate': 'कॅलिब्रेट',
    'settings.probe_controls': 'प्रोब नियंत्रण',
    'settings.sync_history': 'इतिहास सिंक करा',
    'settings.sync_history_desc': 'जुन्या रीडिंग काढा',
    'settings.wake_probe': 'प्रोब जागा करा',
    'settings.wake_probe_desc': 'स्लीप मोडमधून बाहेर',
    'settings.no_device': 'कोणतेही डिव्हाइस कनेक्ट नाही',
    'settings.grain_type': 'धान्याचा प्रकार',
    'settings.thresholds': 'ओलावा मर्यादा (%)',
    'settings.thresholds_desc': 'धान्य प्रोफाइलमधून स्वयंचलित. बारीक ट्यूनिंगसाठी ओढा.',
    'settings.safe': 'सुरक्षित',
    'settings.warn': 'इशारा',
    'settings.critical': 'गंभीर',
    'settings.preferences': 'प्राधान्ये',
    'settings.push_alerts': 'पुश अलर्ट',
    'settings.auto_sync': 'ऑटो-सिंक',
    'settings.auto_reconnect': 'ऑटो-रीकनेक्ट',
    'settings.wake_on_connect': 'कनेक्ट वर जागा करा',
    'settings.data': 'डेटा',
    'settings.export_csv': 'CSV निर्यात',
    'settings.download': 'डाउनलोड',
    'settings.clear_history': 'इतिहास साफ करा',
    'settings.local_only': 'केवळ स्थानिक',
    'settings.about': 'बद्दल',
    'settings.app_version': 'ॲप आवृत्ती',
    'settings.engine': 'इंजिन',
    'settings.probe_firmware': 'प्रोब फर्मवेअर',
    'settings.advanced': 'प्रगत सेटिंग्ज',
    'settings.built_for': 'ग्रेन मॉनिटर v1.0 · ESP32 साठी बनलेले',

    // ── Language ──
    'language.title': 'भाषा',
    'language.choose': 'आपली पसंदीदा भाषा निवडा',
    'language.change': 'भाषा बदला',

    // ── Accent themes ──
    'accent.title': 'अॅक्सेंट रंग',
    'accent.orange': 'नारिंगी',
    'accent.green': 'हिरवा',
    'accent.purple': 'जांभळा',
    'accent.blue': 'निळा',
    'accent.teal': 'टील',

    // ── Theme ──
    'theme.title': 'थीम',
    'theme.dark': 'डार्क',
    'theme.light': 'लाइट',
    'theme.tap_switch': 'बदलण्यासाठी टॅप करा',
    'settings.connect_first': 'प्रथम डिव्हाइस कनेक्ट करा',

    // ── Toasts ──
    'toast.connected': 'कनेक्ट झाले',
    'toast.disconnected': 'डिव्हाइस डिस्कनेक्ट झाले',
    'toast.no_device_selected': 'कोणतेही डिव्हाइस निवडले नाही',
    'toast.connection_failed': 'कनेक्शन अयशस्वी',
    'toast.device_connected': '{name} कनेक्ट झाले',
    'toast.alerts_on': 'अलर्ट चालू',
    'toast.alerts_off': 'अलर्ट बंद',
    'toast.autosync_on': 'ऑटो-सिंक चालू',
    'toast.autosync_off': 'ऑटो-सिंक बंद',
    'toast.csv_exported': 'CSV निर्यात झाले',
    'toast.export_failed': 'निर्यात अयशस्वी',
    'toast.history_cleared': 'इतिहास साफ झाला',
    'toast.command_sent': 'कमांड पाठवला:',
    'toast.command_failed': 'कमांड अयशस्वी:',
    'toast.history_synced': 'इतिहास सिंक झाला',
    'toast.syncing_history': 'प्रोबवरून इतिहास सिंक होत आहे...',
    'toast.sync_failed': 'सिंक कमांड अयशस्वी',
    'toast.demo_on': 'डेमो मोड चालू – लाइव डेटा सिम्युलेट होत आहे',
    'toast.demo_off': 'डेमो मोड बंद',

    // ── Demo Mode ──
    'demo.title': 'डेमो मोड',
    'demo.desc': 'हार्डवेअरशिवाय कनेक्टेड प्रोबचे अनुकरण करा. लाइव डेटा अपडेट होईल.',
    'demo.start': 'डेमो सुरू करा',
    'demo.stop': 'डेमो बंद करा',
    'demo.active': 'डेमो चालू आहे',
    'demo.badge': 'डेमो',

    // ── Bluetooth Gate ──
    'bt.gate.title': 'ब्लूटूथ आवश्यक',
    'bt.gate.desc': 'या अॅपला तुमच्या GRAIN-01 प्रोबशी कनेक्ट होण्यासाठी ब्लूटूथ आवश्यक आहे. कृपया सुरू ठेवण्यासाठी ब्लूटूथ चालू करा.',
    'bt.gate.off_title': 'अॅप वापरण्यासाठी ब्लूटूथ चालू करा',
    'bt.gate.checking_title': 'ब्लूटूथ तपासत आहे...',
    'bt.gate.unsupported': 'ब्लूटूथ समर्थित नाही',
    'bt.gate.unsupported_desc': 'तुमचा ब्राउझर वेब ब्लूटूथ समर्थित नाही. कृपया Chrome किंवा Edge वापरा.',
    'bt.gate.check': 'पुन्हा तपासा',
    'bt.gate.enable': 'ब्लूटूथ चालू करा',
    'bt.gate.continue': 'सुरू ठेवा',
    'bt.home_prompt': 'ब्लूटूथ चालू करा',
    'bt.home_prompt_desc': 'प्रोबशी कनेक्ट होण्यासाठी ब्लूटूथ आवश्यक आहे',

    // ── Grain Types ──
    'grain.wheat': 'गव्ह',
    'grain.rice': 'तांदूळ',
    'grain.corn': 'मका',
    'grain.barley': 'जव',
    'grain.soybean': 'सोयाबीन',
    'grain.sorghum': 'ज्वार',
    'grain.oats': 'ओट्स',
    'grain.millet': 'बाजरी',
    'grain.other': 'इतर',

    // ── Trend Directions ──
    'trend.stable': 'स्थिर',
    'trend.rising': 'वाढत आहे',
    'trend.falling': 'कमी होत आहे',
    'trend.spike': 'अचानक वाढ',
    'trend.drop': 'अचानक घट',

    // ── Mochi Engine Messages ──
    'mochi.safe_0': 'साठा स्थिर आहे.',
    'mochi.safe_1': 'सर्व रीडिंग सामान्य श्रेणीत आहेत.',
    'mochi.safe_2': 'ओलावा आणि तापमान चांगले आहे.',
    'mochi.safe_action_0': 'निरीक्षण सुरू ठेवा. कोणतीही कार्यवाही आवश्यक नाही.',
    'mochi.safe_action_1': 'सध्याच्या साठा स्थिती राखा.',
    'mochi.warn_0': 'ओलावा वाढत आहे. वेंटिलेशन आणि साठा स्थिती तपासा.',
    'mochi.warn_1': 'तापमान वाढलेले आहे. योग्य वायू प्रवाह सुनिश्चित करा.',
    'mochi.warn_2': 'रीडिंग सामान्यपेक्षा जास्त. जवळून निरीक्षण करा.',
    'mochi.warn_action_0': 'वेंटिलेशन तपासा. पंखे चालवण्यावर विचार करा.',
    'mochi.warn_action_1': 'गोदामात कंडनेशन किंवा गरम ठिकाणांची तपासणी करा.',
    'mochi.critical_0': 'जास्त ओलावामुळे सडण्याचा धोका वाढू शकतो. तांदूळ लवकर सुकवा.',
    'mochi.critical_1': 'तापमान धोकादायकरित्या जास्त आहे. स्वतः तापमान वाढण्याचा धोका.',
    'mochi.critical_2': 'दोन्ही रीडिंग धोकादायक पातळीवर आहेत. त्वरित कार्यवाही करा.',
    'mochi.critical_action_0': 'लवकर सुकवणे सुरू करा. साठा सुविधेशी संपर्क साधा.',
    'mochi.critical_action_1': 'धान्य सुरक्षित वातावरणात हलवा. विलंब करू नका.',

    // ── Secondary Observations ──
    'obs.low_battery': 'प्रोबवर कमी बॅटरी आढळली.',
    'obs.weak_signal': 'कमकुवत सिग्नल – प्रोबच्या जवळ जा.',
  },

  hinglish: {
    // ── Header ──
    'app.title': 'Grain Monitor',
    'status.offline': 'Offline',
    'status.pairing': 'Pairing ho raha hai...',
    'status.stable': 'STABLE',
    'status.rising': 'BADH RAHA HAI',
    'status.warning': 'WARNING',
    'status.critical': 'CRITICAL',
    'status.sleeping': 'SO RAHA HAI',
    'status.syncing': 'SYNC HO RAHA HAI',

    // ── Navigation ──
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.history': 'History',
    'nav.settings': 'Settings',

    // ── Disconnected ──
    'disconnected.title': 'Koi Device Nahi',
    'disconnected.desc': 'Moisture level monitor karne ke liye apna GRAIN-01 probe connect karo.',
    'disconnected.connect': 'PROBE CONNECT KARO',
    'disconnected.hint': 'Apna probe on hai aur paas mein hai yeh ensure karo',

    // ── Connecting ──
    'connecting.title': 'Pairing',
    'connecting.subtitle': 'GRAIN-01',

    // ── Syncing ──
    'syncing.title': 'Sync Ho Raha Hai',
    'syncing.desc': 'Probe se history retrieve ho rahi hai...',

    // ── Sleeping ──
    'sleeping.title': 'Probe So Raha Hai',
    'sleeping.desc': 'Probe battery bachane ke liye low-power mode mein hai. Jab jaagega tab reading phir shuru hogi.',
    'sleeping.battery': 'Battery',
    'sleeping.wake': 'PROBE JAGAO',

    // ── Low Battery ──
    'lowbattery.title': 'Low Battery',
    'lowbattery.desc': 'Probe battery bahut kam hai. Data loss se bachne ke liye jaldi battery badlo ya charge karo.',
    'lowbattery.level': 'Battery Level',

    // ── Hero Card ──
    'hero.moisture': 'Moisture',
    'hero.moisture_content': 'moisture content',

    // ── Metric Pills ──
    'metric.temp': 'Temp',
    'metric.signal': 'Signal',
    'metric.grain': 'Grain',

    // ── Insight ──
    'insight.probe_sleeping': 'Probe So Raha Hai',
    'insight.probe_sleeping_desc': 'Probe power bachane ke liye so raha hai. Jab jaagega tab reading phir shuru hogi.',
    'insight.syncing_history': 'History Sync Ho Rahi Hai',
    'insight.syncing_history_desc': 'Probe se stored readings retrieve ho rahi hain. Thoda time lagega.',
    'insight.action_required': 'Action Zaroori Hai',
    'insight.attention': 'Dhyan Do',
    'insight.storage_safe': 'Storage Safe Hai',

    // ── Recent Readings ──
    'recent.title': 'Recent Readings',
    'recent.show_more': 'Aur Dekho',
    'recent.today': 'Aaj',
    'recent.yesterday': 'Kal',

    // ── Discover ──
    'discover.title': 'Discover',
    'discover.connected_desc_safe': 'Conditions stable hain. Seasonal changes ke liye yeh time hai taiyari karne ka.',
    'discover.connected_desc_warn': 'Readings badh rahi hain. Yeh resources changing conditions samajhne mein help karenge.',
    'discover.connected_desc_critical': 'Aapki current readings critical hain. Yeh resources emergency response par focus karte hain.',
    'discover.disconnected_desc': 'Personalised recommendations ke liye probe connect karo',
    'discover.condition_normal': 'Normal',
    'discover.condition_elevated': 'Elevated',
    'discover.condition_critical': 'Critical',
    'discover.no_results': 'Is combination ke liye abhi tak koi recommendation available nahi hai.',

    // ── History ──
    'history.title': 'History',
    'history.readings': 'readings stored',
    'history.reading': 'reading stored',
    'history.past': 'Pichli readings',
    'history.no_history': 'Abhi Tak Koi History Nahi',
    'history.no_history_desc': 'Probe connect karne par readings yahan dikhengi.',
    'history.detail': 'Reading Detail',
    'history.moisture': 'Moisture',
    'history.temperature': 'Temperature',
    'history.battery': 'Battery',
    'history.signal': 'Signal',
    'history.grain': 'Grain',
    'history.rule': 'Rule',
    'history.confidence': 'Confidence',
    'history.severity': 'Severity',
    'history.safe': 'Safe',
    'history.warning': 'Warning',
    'history.critical': 'Critical',
    'history.trend_stable': 'Stable',
    'history.trend_rising': 'Badh raha hai',
    'history.trend_falling': 'Gir raha hai',
    'history.trend_spike': 'Spike',
    'history.trend_drop': 'Drop',

    // ── Settings ──
    'settings.title': 'Settings',
    'settings.desc': 'Device & preferences',
    'settings.device': 'Device',
    'settings.calibrate': 'CALIBRATE',
    'settings.probe_controls': 'Probe Controls',
    'settings.sync_history': 'Sync History',
    'settings.sync_history_desc': 'Purani readings kheencho',
    'settings.wake_probe': 'Wake Probe',
    'settings.wake_probe_desc': 'Sleep mode se bahar',
    'settings.no_device': 'Koi device connected nahi',
    'settings.grain_type': 'Grain Type',
    'settings.thresholds': 'Moisture Thresholds (%)',
    'settings.thresholds_desc': 'Grain profile se automatic. Fine-tune karne ke liye drag karo.',
    'settings.safe': 'Safe',
    'settings.warn': 'Warning',
    'settings.critical': 'Critical',
    'settings.preferences': 'Preferences',
    'settings.push_alerts': 'Push Alerts',
    'settings.auto_sync': 'Auto-sync',
    'settings.auto_reconnect': 'Auto-reconnect',
    'settings.wake_on_connect': 'Wake on Connect',
    'settings.data': 'Data',
    'settings.export_csv': 'Export CSV',
    'settings.download': 'Download',
    'settings.clear_history': 'Clear History',
    'settings.local_only': 'Local only',
    'settings.about': 'About',
    'settings.app_version': 'App Version',
    'settings.engine': 'Engine',
    'settings.probe_firmware': 'Probe Firmware',
    'settings.advanced': 'Advanced Settings',
    'settings.built_for': 'Grain Monitor v1.0 · ESP32 ke liye bana',

    // ── Language ──
    'language.title': 'Language',
    'language.choose': 'Apni pasandeeda language choose karo',
    'language.change': 'Language badlo',

    // ── Accent themes ──
    'accent.title': 'Accent Color',
    'accent.orange': 'Orange',
    'accent.green': 'Green',
    'accent.purple': 'Purple',
    'accent.blue': 'Blue',
    'accent.teal': 'Teal',

    // ── Theme ──
    'theme.title': 'Theme',
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'theme.tap_switch': 'Switch karne ke liye tap karo',
    'settings.connect_first': 'Pehle ek device connect karo',

    // ── Toasts ──
    'toast.connected': 'connect hua',
    'toast.disconnected': 'Device disconnect hua',
    'toast.no_device_selected': 'Koi device select nahi hua',
    'toast.connection_failed': 'Connection fail hua',
    'toast.device_connected': '{name} connect hua',
    'toast.alerts_on': 'Alerts on',
    'toast.alerts_off': 'Alerts off',
    'toast.autosync_on': 'Auto-sync on',
    'toast.autosync_off': 'Auto-sync off',
    'toast.csv_exported': 'CSV export hua',
    'toast.export_failed': 'Export fail hua',
    'toast.history_cleared': 'History clear hua',
    'toast.command_sent': 'Command bheja:',
    'toast.command_failed': 'Command fail:',
    'toast.history_synced': 'History sync hua',
    'toast.syncing_history': 'Probe se history sync ho rahi hai...',
    'toast.sync_failed': 'Sync command fail hua',
    'toast.demo_on': 'Demo mode ON – live data simulate ho raha hai',
    'toast.demo_off': 'Demo mode OFF',

    // ── Demo Mode ──
    'demo.title': 'Demo Mode',
    'demo.desc': 'Bina hardware ke connected probe simulate karein. Live data update hoga.',
    'demo.start': 'Demo Shuru Karein',
    'demo.stop': 'Demo Band Karein',
    'demo.active': 'Demo Chal Raha Hai',
    'demo.badge': 'DEMO',

    // ── Bluetooth Gate ──
    'bt.gate.title': 'Bluetooth Zaroori Hai',
    'bt.gate.desc': 'Is app ko aapke GRAIN-01 probe se connect karne ke liye Bluetooth chahiye. Please Bluetooth on karein.',
    'bt.gate.off_title': 'App use karne ke liye Bluetooth on karein',
    'bt.gate.checking_title': 'Bluetooth check ho raha hai...',
    'bt.gate.unsupported': 'Bluetooth Supported Nahi Hai',
    'bt.gate.unsupported_desc': 'Aapka browser Web Bluetooth support nahi karta. Please Chrome ya Edge use karein.',
    'bt.gate.check': 'Phir Se Check Karein',
    'bt.gate.enable': 'Bluetooth On Karein',
    'bt.gate.continue': 'Continue',
    'bt.home_prompt': 'Bluetooth On Karein',
    'bt.home_prompt_desc': 'Probe se connect karne ke liye Bluetooth zaroori hai',

    // ── Grain Types ──
    'grain.wheat': 'Gehun',
    'grain.rice': 'Chawal',
    'grain.corn': 'Makka',
    'grain.barley': 'Jau',
    'grain.soybean': 'Soyabean',
    'grain.sorghum': 'Jowar',
    'grain.oats': 'Oats',
    'grain.millet': 'Bajra',
    'grain.other': 'Other',

    // ── Trend Directions ──
    'trend.stable': 'Stable',
    'trend.rising': 'Badh raha hai',
    'trend.falling': 'Gir raha hai',
    'trend.spike': 'Spike',
    'trend.drop': 'Drop',

    // ── Mochi Engine Messages ──
    'mochi.safe_0': 'Storage conditions stable hain.',
    'mochi.safe_1': 'Saari readings normal range mein hain.',
    'mochi.safe_2': 'Moisture aur temperature theek lag rahi hain.',
    'mochi.safe_action_0': 'Monitoring continue karo. Koi action zaroori nahi.',
    'mochi.safe_action_1': 'Current storage conditions maintain karo.',
    'mochi.warn_0': 'Moisture badh rahi hai. Ventilation aur storage conditions check karo.',
    'mochi.warn_1': 'Temperature elevated hai. Proper airflow ensure karo.',
    'mochi.warn_2': 'Readings normal se upar hain. Closely monitor karo.',
    'mochi.warn_action_0': 'Ventilation check karo. Fans chalane ya aerate karne par socho.',
    'mochi.warn_action_1': 'Grain bin mein condensation ya hot spots inspect karo.',
    'mochi.critical_0': 'High moisture se spoilage risk badh sakta hai. Grain jaldi sukhao.',
    'mochi.critical_1': 'Temperature dangerously high hai. Spontaneous heating ka risk.',
    'mochi.critical_2': 'Dono readings dangerous levels par hain. Foran action karo.',
    'mochi.critical_action_0': 'Drying foran shuru karo. Storage facility se contact karo.',
    'mochi.critical_action_1': 'Grain ko safer environment mein move karo. Delay mat karo.',

    // ── Secondary Observations ──
    'obs.low_battery': 'Probe par low battery detect hui.',
    'obs.weak_signal': 'Weak signal – probe ke paas jao.',
  },
};

/** Get translated string, fallback to English if key missing */
export function t(key: string, lang: AppLanguage): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

/** Get translated string with parameter substitution */
export function tp(key: string, lang: AppLanguage, params?: Record<string, string | number>): string {
  let str = t(key, lang);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}

/** Translate a grain type */
export function tGrain(grainType: string, lang: AppLanguage): string {
  return t(`grain.${grainType}`, lang);
}

/** Translate a trend direction */
export function tTrend(trend: string, lang: AppLanguage): string {
  return t(`trend.${trend}`, lang);
}
