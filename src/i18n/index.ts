import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

const SUPPORTED_LNGS = ['pt-BR'] as const;

void i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'pt-BR',
    lng: 'pt-BR',
    supportedLngs: SUPPORTED_LNGS,
    ns: ['common', 'search', 'cart', 'checkout', 'auth', 'errors'],
    defaultNS: 'common',
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/translation.json`,
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
