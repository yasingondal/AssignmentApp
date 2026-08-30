import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      tabs: {
        consultation: 'Consultation',
        shop: 'Shop',
        health: 'Health Records',
        settings: 'Settings',
      },
      settings: {
        title: 'Settings',
        theme: 'Theme',
        language: 'Language',
      },
      common: {
        loading: 'Loading...',
        retry: 'Retry',
        offline: "You're offline. Showing cached data.",
      },
    },
  },
  hi: {
    translation: {
      tabs: {
        consultation: 'परामर्श',
        shop: 'दुकान',
        health: 'स्वास्थ्य रिकॉर्ड',
        settings: 'सेटिंग्स',
      },
      settings: {
        title: 'सेटिंग्स',
        theme: 'थीम',
        language: 'भाषा',
      },
      common: {
        loading: 'लोड हो रहा है...',
        retry: 'पुनः प्रयास करें',
        offline: 'आप ऑफ़लाइन हैं। कैश्ड डेटा दिखाया जा रहा है।',
      },
    },
  },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
