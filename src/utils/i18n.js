import { storage } from './storage.js';
import esDict from '../i18n/es.js';
import enDict from '../i18n/en.js';

const dictionaries = {
  es: esDict,
  en: enDict
};

let currentLang = 'es';

export function getLanguage() {
  return storage.get('lang', 'es');
}

export function t(key, params = {}) {
  const dict = dictionaries[currentLang] || dictionaries.es;
  let text = dict[key] || dictionaries.es[key] || key;

  Object.keys(params).forEach(p => {
    text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
  });

  return text;
}

export function updatePageTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.setAttribute('placeholder', t(key));
    }
  });
}

export function setLanguage(lang) {
  const targetLang = dictionaries[lang] ? lang : 'es';
  currentLang = targetLang;
  storage.set('lang', targetLang);
  document.documentElement.setAttribute('lang', targetLang);
  updatePageTranslations();
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: targetLang } }));
}

export function initI18n() {
  const savedLang = getLanguage();
  setLanguage(savedLang);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updatePageTranslations);
  } else {
    updatePageTranslations();
  }
}
