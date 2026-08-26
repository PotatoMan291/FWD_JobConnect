import { storage } from './storage.js';

export const THEMES = [
  { id: 'light', name: 'Claro', color: '#F6F4EF', borderColor: '#7A746B' },
  { id: 'dark', name: 'Oscuro', color: '#181613', borderColor: '#D8D2C8' },
  { id: 'sepia', name: 'Sepia', color: '#F1E7D2', borderColor: '#8A6841' },
  { id: 'contrast', name: 'Alto Contraste', color: '#0B5FFF', borderColor: '#FFD34E' }
];

export function getTheme() {
  return storage.get('theme', 'light');
}

export function setTheme(themeName) {
  const validTheme = THEMES.some(t => t.id === themeName) ? themeName : 'light';
  document.documentElement.setAttribute('data-theme', validTheme);
  storage.set('theme', validTheme);
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: validTheme } }));
}

export function initTheme() {
  const savedTheme = getTheme();
  setTheme(savedTheme);
}
