/* ═══════════════════════════════════════════════════
   Grain Monitor – i18n Translation System
   Languages: English, Hindi, Marathi, Hinglish
   ═══════════════════════════════════════════════════ */

export type AppLanguage = 'en' | 'hi' | 'mr' | 'hinglish';

export const LANGUAGE_OPTIONS: { code: AppLanguage; label: string; native: string; needsSave: boolean }[] = [
  { code: 'en', label: 'English', native: 'English', needsSave: false },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', needsSave: true },
  { code: 'mr', label: 'Marathi', native: 'मराठी', needsSave: false },
  { code: 'hinglish', label: 'Hinglish', native: 'Hinglish', needsSave: true },
];

const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Header
    'app.title': 'Grain Monitor',
    'status.offline': 'Offline',
    'status.pairing': 'Pairing...',
    'status.stable': 'STABLE',
    'status.rising': 'RISING',
    'status.warning': 'WARNING',
    'status.critical': 'CRITICAL',
    'status.sleeping': 'SLEEPING',
    'status.syncing': 'SYNCING',

    // Navigation
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.history': 'History',
    'nav.settings': 'Settings',

    // Disconnected
    'disconnected.title': 'No Device',
    'disconnected.desc': 'Connect your GRAIN-01 probe to begin monitoring moisture levels.',
    'disconnected.connect': 'CONNECT',
    'disconnected.demo': 'Use Demo Mode',

    // Connecting
    'connecting.title': 'Pairing',
    'connecting.subtitle': 'GRAIN-01',

    // Syncing
    'syncing.title': 'Syncing',
    'syncing.desc': 'Retrieving history from probe...',

    // Sleeping
    'sleeping.title': 'Probe Sleeping',
    'sleeping.desc': 'The probe is in low-power mode to conserve battery. Readings will resume when it wakes.',
    'sleeping.battery': 'Battery',
    'sleeping.wake': 'WAKE PROBE',

    // Low Battery
    'lowbattery.title': 'Low Battery',
    'lowbattery.desc': 'Probe battery is critically low. Replace or charge the battery soon to avoid data loss.',
    'lowbattery.level': 'Battery Level',

    // Hero Card
    'hero.moisture': 'Moisture',
    'hero.moisture_content': 'moisture content',

    // Metric Pills
    'metric.temp': 'Temp',
    'metric.signal': 'Signal',
    'metric.grain': 'Grain',

    // Insight
    'insight.probe_sleeping': 'Probe Sleeping',
    'insight.probe_sleeping_desc': 'The probe is sleeping to save power. Readings will resume on wake.',
    'insight.syncing_history': 'Syncing History',
    'insight.syncing_history_desc': 'Retrieving stored readings from the probe. This may take a moment.',
    'insight.action_required': 'Action Required',
    'insight.attention': 'Attention Needed',
    'insight.storage_safe': 'Storage is Safe',

    // Recent Readings
    'recent.title': 'Recent Readings',
    'recent.show_more': 'Show More',
    'recent.today': 'Today',
    'recent.yesterday': 'Yesterday',

    // Discover
    'discover.title': 'Discover',
    'discover.connected_desc_safe': 'Conditions are stable. Use this time to learn and prepare for seasonal changes.',
    'discover.connected_desc_warn': 'Readings are elevated. These resources help you understand and respond to changing conditions.',
    'discover.connected_desc_critical': 'Your current readings are critical. These resources focus on emergency response and damage prevention.',
    'discover.disconnected_desc': 'Connect a probe for personalised recommendations',
    'discover.condition_normal': 'Normal',
    'discover.condition_elevated': 'Elevated',
    'discover.condition_critical': 'Critical',
    'discover.no_results': 'No recommendations available for this combination yet.',

    // History
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

    // Settings
    'settings.title': 'Settings',
    'settings.desc': 'Device & preferences',
    'settings.device': 'Device',
    'settings.calibrate': 'CALIBRATE',
    'settings.probe_controls': 'Probe Controls',
    'settings.sync_history': 'Sync History',
    'settings.sync_history_desc': 'Pull old readings',
    'settings.wake_probe': 'Wake Probe',
    'settings.wake_probe_desc': 'Exit sleep mode',
    'settings.demo_states': 'Demo States',
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

    // Language
    'language.title': 'Language',
    'language.save': 'Save & Reload',
    'language.saved': 'Language saved. Reloading...',
    'language.current': 'Current',

    // Glass
    'glass.title': 'Glass Effect',
    'glass.opacity': 'Opacity',
    'glass.subtle': 'Subtle',
    'glass.medium': 'Medium',
    'glass.strong': 'Strong',
    'glass.max': 'Maximum',

    // Accent themes
    'accent.title': 'Accent Color',
    'accent.orange': 'Orange',
    'accent.green': 'Green',
    'accent.purple': 'Purple',
    'accent.blue': 'Blue',
    'accent.teal': 'Teal',

    // Theme
    'theme.title': 'Theme',
    'theme.dark': 'Dark',
    'theme.light': 'Light',

    // Toasts
    'toast.connected': 'connected',
    'toast.disconnected': 'Device disconnected',
    'toast.alerts_on': 'Alerts enabled',
    'toast.alerts_off': 'Alerts disabled',
    'toast.autosync_on': 'Auto-sync on',
    'toast.autosync_off': 'Auto-sync off',
    'toast.csv_exported': 'CSV exported',
    'toast.export_failed': 'Export failed',
    'toast.history_cleared': 'History cleared',
    'toast.connection_failed': 'Connection failed',
    'toast.command_sent': 'Command sent:',
    'toast.command_failed': 'Command failed:',
    'toast.demo': 'Demo:',
    'toast.history_synced': 'History synchronised',
  },

  hi: {
    // Header
    'app.title': 'ग्रेन मॉनिटर',
    'status.offline': 'ऑफलाइन',
    'status.pairing': 'पेयरिंग...',
    'status.stable': 'स्थिर',
    'status.rising': 'बढ़ रहा है',
    'status.warning': 'चेतावनी',
    'status.critical': 'गंभीर',
    'status.sleeping': 'सो रहा है',
    'status.syncing': 'सिंक हो रहा है',

    // Navigation
    'nav.home': 'होम',
    'nav.discover': 'खोजें',
    'nav.history': 'इतिहास',
    'nav.settings': 'सेटिंग्स',

    // Disconnected
    'disconnected.title': 'कोई डिवाइस नहीं',
    'disconnected.desc': 'नमी स्तर की निगरानी शुरू करने के लिए अपना GRAIN-01 प्रोब कनेक्ट करें।',
    'disconnected.connect': 'कनेक्ट करें',
    'disconnected.demo': 'डेमो मोड उपयोग करें',

    // Connecting
    'connecting.title': 'पेयरिंग',
    'connecting.subtitle': 'GRAIN-01',

    // Syncing
    'syncing.title': 'सिंक हो रहा है',
    'syncing.desc': 'प्रोब से इतिहास पुनर्प्राप्त किया जा रहा है...',

    // Sleeping
    'sleeping.title': 'प्रोब सो रहा है',
    'sleeping.desc': 'प्रोब बैटरी बचाने के लिए लो-पावर मोड में है। जागने पर रीडिंग फिर शुरू होगी।',
    'sleeping.battery': 'बैटरी',
    'sleeping.wake': 'प्रोब जगाएं',

    // Low Battery
    'lowbattery.title': 'कम बैटरी',
    'lowbattery.desc': 'प्रोब बैटरी गंभीर रूप से कम है। डेटा हानि से बचने के लिए जल्दी बैटरी बदलें या चार्ज करें।',
    'lowbattery.level': 'बैटरी स्तर',

    // Hero Card
    'hero.moisture': 'नमी',
    'hero.moisture_content': 'नमी सामग्री',

    // Metric Pills
    'metric.temp': 'तापमान',
    'metric.signal': 'सिग्नल',
    'metric.grain': 'अनाज',

    // Insight
    'insight.probe_sleeping': 'प्रोब सो रहा है',
    'insight.probe_sleeping_desc': 'प्रोब बिजली बचाने के लिए सो रहा है। जागने पर रीडिंग फिर शुरू होगी।',
    'insight.syncing_history': 'इतिहास सिंक हो रहा है',
    'insight.syncing_history_desc': 'प्रोब से संग्रहीत रीडिंग पुनर्प्राप्त की जा रही है। इसमें कुछ समय लग सकता है।',
    'insight.action_required': 'कार्रवाई आवश्यक',
    'insight.attention': 'ध्यान दें',
    'insight.storage_safe': 'भंडारण सुरक्षित है',

    // Recent Readings
    'recent.title': 'हालिया रीडिंग',
    'recent.show_more': 'और देखें',
    'recent.today': 'आज',
    'recent.yesterday': 'कल',

    // Discover
    'discover.title': 'खोजें',
    'discover.connected_desc_safe': 'स्थिति स्थिर है। मौसमी बदलावों के लिए तैयारी करने का यह समय है।',
    'discover.connected_desc_warn': 'रीडिंग बढ़ रही है। ये संसाधन बदलती परिस्थितियों को समझने में मदद करेंगे।',
    'discover.connected_desc_critical': 'आपकी वर्तमान रीडिंग गंभीर है। ये संसाधन आपातकालीन प्रतिक्रिया पर केंद्रित हैं।',
    'discover.disconnected_desc': 'व्यक्तिगत सिफारिशों के लिए प्रोब कनेक्ट करें',
    'discover.condition_normal': 'सामान्य',
    'discover.condition_elevated': 'बढ़ा हुआ',
    'discover.condition_critical': 'गंभीर',
    'discover.no_results': 'इस संयोजन के लिए अभी तक कोई सिफारिश उपलब्ध नहीं है।',

    // History
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

    // Settings
    'settings.title': 'सेटिंग्स',
    'settings.desc': 'डिवाइस और प्राथमिकताएं',
    'settings.device': 'डिवाइस',
    'settings.calibrate': 'कैलिब्रेट',
    'settings.probe_controls': 'प्रोब नियंत्रण',
    'settings.sync_history': 'इतिहास सिंक करें',
    'settings.sync_history_desc': 'पुरानी रीडिंग खींचें',
    'settings.wake_probe': 'प्रोब जगाएं',
    'settings.wake_probe_desc': 'स्लीप मोड से बाहर',
    'settings.demo_states': 'डेमो स्टेट',
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

    // Language
    'language.title': 'भाषा',
    'language.save': 'सहेजें और रीलोड',
    'language.saved': 'भाषा सहेजी गई। रीलोड हो रहा है...',
    'language.current': 'वर्तमान',

    // Glass
    'glass.title': 'ग्लास प्रभाव',
    'glass.opacity': 'अपारदर्शिता',
    'glass.subtle': 'हल्का',
    'glass.medium': 'मध्यम',
    'glass.strong': 'मजबूत',
    'glass.max': 'अधिकतम',

    // Accent themes
    'accent.title': 'एक्सेंट रंग',
    'accent.orange': 'नारंगी',
    'accent.green': 'हरा',
    'accent.purple': 'बैंगनी',
    'accent.blue': 'नीला',
    'accent.teal': 'टील',

    // Theme
    'theme.title': 'थीम',
    'theme.dark': 'डार्क',
    'theme.light': 'लाइट',

    // Toasts
    'toast.connected': 'कनेक्ट हुआ',
    'toast.disconnected': 'डिवाइस डिस्कनेक्ट हुआ',
    'toast.alerts_on': 'अलर्ट चालू',
    'toast.alerts_off': 'अलर्ट बंद',
    'toast.autosync_on': 'ऑटो-सिंक चालू',
    'toast.autosync_off': 'ऑटो-सिंक बंद',
    'toast.csv_exported': 'CSV निर्यात हुआ',
    'toast.export_failed': 'निर्यात विफल',
    'toast.history_cleared': 'इतिहास साफ हुआ',
    'toast.connection_failed': 'कनेक्शन विफल',
    'toast.command_sent': 'कमांड भेजा गया:',
    'toast.command_failed': 'कमांड विफल:',
    'toast.demo': 'डेमो:',
    'toast.history_synced': 'इतिहास सिंक हुआ',
  },

  mr: {
    // Header
    'app.title': 'ग्रेन मॉनिटर',
    'status.offline': 'ऑफलाइन',
    'status.pairing': 'पेअरिंग...',
    'status.stable': 'स्थिर',
    'status.rising': 'वाढत आहे',
    'status.warning': 'इशारा',
    'status.critical': 'गंभीर',
    'status.sleeping': 'झोपेत आहे',
    'status.syncing': 'सिंक होत आहे',

    // Navigation
    'nav.home': 'होम',
    'nav.discover': 'शोधा',
    'nav.history': 'इतिहास',
    'nav.settings': 'सेटिंग्ज',

    // Disconnected
    'disconnected.title': 'कोणतेही डिव्हाइस नाही',
    'disconnected.desc': 'ओलावा पातळी निरीक्षण सुरू करण्यासाठी तुमचा GRAIN-01 प्रोब कनेक्ट करा.',
    'disconnected.connect': 'कनेक्ट करा',
    'disconnected.demo': 'डेमो मोड वापरा',

    // Connecting
    'connecting.title': 'पेअरिंग',
    'connecting.subtitle': 'GRAIN-01',

    // Syncing
    'syncing.title': 'सिंक होत आहे',
    'syncing.desc': 'प्रोबवरून इतिहास मिळवत आहे...',

    // Sleeping
    'sleeping.title': 'प्रोब झोपेत आहे',
    'sleeping.desc': 'प्रोब बॅटरी वाचवण्यासाठी लो-पॉवर मोडमध्ये आहे. जागा झाल्यावर रीडिंग पुन्हा सुरू होईल.',
    'sleeping.battery': 'बॅटरी',
    'sleeping.wake': 'प्रोब जागा करा',

    // Low Battery
    'lowbattery.title': 'कमी बॅटरी',
    'lowbattery.desc': 'प्रोब बॅटरी गंभीररित्या कमी आहे. डेटा हानी टाळण्यासाठी लवकर बॅटरी बदला किंवा चार्ज करा.',
    'lowbattery.level': 'बॅटरी पातळी',

    // Hero Card
    'hero.moisture': 'ओलावा',
    'hero.moisture_content': 'ओलावा सामग्री',

    // Metric Pills
    'metric.temp': 'तापमान',
    'metric.signal': 'सिग्नल',
    'metric.grain': 'धान्य',

    // Insight
    'insight.probe_sleeping': 'प्रोब झोपेत आहे',
    'insight.probe_sleeping_desc': 'प्रोब ऊर्जा वाचवण्यासाठी झोपेत आहे. जागा झाल्यावर रीडिंग पुन्हा सुरू होईल.',
    'insight.syncing_history': 'इतिहास सिंक होत आहे',
    'insight.syncing_history_desc': 'प्रोबवरून साठवलेल्या रीडिंग मिळवत आहे. याला काही वेळ लागू शकतो.',
    'insight.action_required': 'कार्यवाही आवश्यक',
    'insight.attention': 'लक्ष द्या',
    'insight.storage_safe': 'साठा सुरक्षित आहे',

    // Recent Readings
    'recent.title': 'अलीकडील रीडिंग',
    'recent.show_more': 'अधिक पहा',
    'recent.today': 'आज',
    'recent.yesterday': 'काल',

    // Discover
    'discover.title': 'शोधा',
    'discover.connected_desc_safe': 'परिस्थिती स्थिर आहे. हंगामी बदलांसाठी तयारी करण्याची ही वेळ आहे.',
    'discover.connected_desc_warn': 'रीडिंग वाढत आहे. ही संसाधने बदलत्या परिस्थिती समजून घेण्यास मदत करतील.',
    'discover.connected_desc_critical': 'तुमची सध्याची रीडिंग गंभीर आहे. ही संसाधने आपत्कालीन प्रतिसादावर केंद्रित आहेत.',
    'discover.disconnected_desc': 'वैयक्तिक शिफारसींसाठी प्रोब कनेक्ट करा',
    'discover.condition_normal': 'सामान्य',
    'discover.condition_elevated': 'वाढलेले',
    'discover.condition_critical': 'गंभीर',
    'discover.no_results': 'या संयोजनासाठी अद्याप कोणतीही शिफारस उपलब्ध नाही.',

    // History
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

    // Settings
    'settings.title': 'सेटिंग्ज',
    'settings.desc': 'डिव्हाइस आणि प्राधान्ये',
    'settings.device': 'डिव्हाइस',
    'settings.calibrate': 'कॅलिब्रेट',
    'settings.probe_controls': 'प्रोब नियंत्रण',
    'settings.sync_history': 'इतिहास सिंक करा',
    'settings.sync_history_desc': 'जुन्या रीडिंग काढा',
    'settings.wake_probe': 'प्रोब जागा करा',
    'settings.wake_probe_desc': 'स्लीप मोडमधून बाहेर',
    'settings.demo_states': 'डेमो स्टेट',
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

    // Language
    'language.title': 'भाषा',
    'language.save': 'जतन करा आणि रीलोड',
    'language.saved': 'भाषा जतन केली. रीलोड होत आहे...',
    'language.current': 'सध्याची',

    // Glass
    'glass.title': 'ग्लास प्रभाव',
    'glass.opacity': 'पारदर्शकता',
    'glass.subtle': 'हलके',
    'glass.medium': 'मध्यम',
    'glass.strong': 'जास्त',
    'glass.max': 'अधिकतम',

    // Accent themes
    'accent.title': 'अॅक्सेंट रंग',
    'accent.orange': 'नारिंगी',
    'accent.green': 'हिरवा',
    'accent.purple': 'जांभळा',
    'accent.blue': 'निळा',
    'accent.teal': 'टील',

    // Theme
    'theme.title': 'थीम',
    'theme.dark': 'डार्क',
    'theme.light': 'लाइट',

    // Toasts
    'toast.connected': 'कनेक्ट झाले',
    'toast.disconnected': 'डिव्हाइस डिस्कनेक्ट झाले',
    'toast.alerts_on': 'अलर्ट चालू',
    'toast.alerts_off': 'अलर्ट बंद',
    'toast.autosync_on': 'ऑटो-सिंक चालू',
    'toast.autosync_off': 'ऑटो-सिंक बंद',
    'toast.csv_exported': 'CSV निर्यात झाले',
    'toast.export_failed': 'निर्यात अयशस्वी',
    'toast.history_cleared': 'इतिहास साफ झाला',
    'toast.connection_failed': 'कनेक्शन अयशस्वी',
    'toast.command_sent': 'कमांड पाठवला:',
    'toast.command_failed': 'कमांड अयशस्वी:',
    'toast.demo': 'डेमो:',
    'toast.history_synced': 'इतिहास सिंक झाला',
  },

  hinglish: {
    // Header
    'app.title': 'Grain Monitor',
    'status.offline': 'Offline',
    'status.pairing': 'Pairing ho raha hai...',
    'status.stable': 'STABLE',
    'status.rising': 'BADH RAHA HAI',
    'status.warning': 'WARNING',
    'status.critical': 'CRITICAL',
    'status.sleeping': 'SO RAHA HAI',
    'status.syncing': 'SYNC HO RAHA HAI',

    // Navigation
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.history': 'History',
    'nav.settings': 'Settings',

    // Disconnected
    'disconnected.title': 'Koi Device Nahi',
    'disconnected.desc': 'Moisture level monitor karne ke liye apna GRAIN-01 probe connect karo.',
    'disconnected.connect': 'CONNECT KARO',
    'disconnected.demo': 'Demo Mode Use Karo',

    // Connecting
    'connecting.title': 'Pairing',
    'connecting.subtitle': 'GRAIN-01',

    // Syncing
    'syncing.title': 'Sync Ho Raha Hai',
    'syncing.desc': 'Probe se history retrieve ho rahi hai...',

    // Sleeping
    'sleeping.title': 'Probe So Raha Hai',
    'sleeping.desc': 'Probe battery bachane ke liye low-power mode mein hai. Jab jaagega tab reading phir shuru hogi.',
    'sleeping.battery': 'Battery',
    'sleeping.wake': 'PROBE JAGAO',

    // Low Battery
    'lowbattery.title': 'Low Battery',
    'lowbattery.desc': 'Probe battery bahut kam hai. Data loss se bachne ke liye jaldi battery badlo ya charge karo.',
    'lowbattery.level': 'Battery Level',

    // Hero Card
    'hero.moisture': 'Moisture',
    'hero.moisture_content': 'moisture content',

    // Metric Pills
    'metric.temp': 'Temp',
    'metric.signal': 'Signal',
    'metric.grain': 'Grain',

    // Insight
    'insight.probe_sleeping': 'Probe So Raha Hai',
    'insight.probe_sleeping_desc': 'Probe power bachane ke liye so raha hai. Jab jaagega tab reading phir shuru hogi.',
    'insight.syncing_history': 'History Sync Ho Rahi Hai',
    'insight.syncing_history_desc': 'Probe se stored readings retrieve ho rahi hain. Thoda time lagega.',
    'insight.action_required': 'Action Zaroori Hai',
    'insight.attention': 'Dhyan Do',
    'insight.storage_safe': 'Storage Safe Hai',

    // Recent Readings
    'recent.title': 'Recent Readings',
    'recent.show_more': 'Aur Dekho',
    'recent.today': 'Aaj',
    'recent.yesterday': 'Kal',

    // Discover
    'discover.title': 'Discover',
    'discover.connected_desc_safe': 'Conditions stable hain. Seasonal changes ke liye yeh time hai taiyari karne ka.',
    'discover.connected_desc_warn': 'Readings badh rahi hain. Yeh resources changing conditions samajhne mein help karenge.',
    'discover.connected_desc_critical': 'Aapki current readings critical hain. Yeh resources emergency response par focus karte hain.',
    'discover.disconnected_desc': 'Personalised recommendations ke liye probe connect karo',
    'discover.condition_normal': 'Normal',
    'discover.condition_elevated': 'Elevated',
    'discover.condition_critical': 'Critical',
    'discover.no_results': 'Is combination ke liye abhi tak koi recommendation available nahi hai.',

    // History
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

    // Settings
    'settings.title': 'Settings',
    'settings.desc': 'Device & preferences',
    'settings.device': 'Device',
    'settings.calibrate': 'CALIBRATE',
    'settings.probe_controls': 'Probe Controls',
    'settings.sync_history': 'Sync History',
    'settings.sync_history_desc': 'Purani readings kheencho',
    'settings.wake_probe': 'Wake Probe',
    'settings.wake_probe_desc': 'Sleep mode se bahar',
    'settings.demo_states': 'Demo States',
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

    // Language
    'language.title': 'Language',
    'language.save': 'Save & Reload',
    'language.saved': 'Language saved. Reloading...',
    'language.current': 'Current',

    // Glass
    'glass.title': 'Glass Effect',
    'glass.opacity': 'Opacity',
    'glass.subtle': 'Subtle',
    'glass.medium': 'Medium',
    'glass.strong': 'Strong',
    'glass.max': 'Maximum',

    // Accent themes
    'accent.title': 'Accent Color',
    'accent.orange': 'Orange',
    'accent.green': 'Green',
    'accent.purple': 'Purple',
    'accent.blue': 'Blue',
    'accent.teal': 'Teal',

    // Theme
    'theme.title': 'Theme',
    'theme.dark': 'Dark',
    'theme.light': 'Light',

    // Toasts
    'toast.connected': 'connect hua',
    'toast.disconnected': 'Device disconnect hua',
    'toast.alerts_on': 'Alerts on',
    'toast.alerts_off': 'Alerts off',
    'toast.autosync_on': 'Auto-sync on',
    'toast.autosync_off': 'Auto-sync off',
    'toast.csv_exported': 'CSV export hua',
    'toast.export_failed': 'Export fail hua',
    'toast.history_cleared': 'History clear hua',
    'toast.connection_failed': 'Connection fail hua',
    'toast.command_sent': 'Command bheja:',
    'toast.command_failed': 'Command fail:',
    'toast.demo': 'Demo:',
    'toast.history_synced': 'History sync hua',
  },
};

/** Get translated string, fallback to English if key missing */
export function t(key: string, lang: AppLanguage): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
