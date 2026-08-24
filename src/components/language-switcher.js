import { getLanguage, setLanguage } from '../utils/i18n.js';
import { icons } from '../assets/icons/icons.js';

export function renderLanguageSwitcher(container) {
  if (!container) return;

  const currentLang = getLanguage();

  const html = `
    <button class="btn btn-secondary btn-icon" id="lang-toggle-btn" title="Cambiar Idioma (ES/EN)" style="font-weight: 600;">
      ${icons.globe}
      <span>${currentLang.toUpperCase()}</span>
    </button>
  `;

  container.innerHTML = html;

  const btn = container.querySelector('#lang-toggle-btn');
  btn.addEventListener('click', () => {
    const nextLang = currentLang === 'es' ? 'en' : 'es';
    setLanguage(nextLang);
    renderLanguageSwitcher(container);
  });
}
