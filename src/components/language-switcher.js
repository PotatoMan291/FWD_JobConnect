import { getLanguage, setLanguage } from '../utils/i18n.js';

let clickListenerAttached = false;

export function renderLanguageSwitcher(container) {
  if (!container) return;

  const currentLang = getLanguage();
  
  const langs = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const html = `
    <div class="lang-dropdown-wrapper" style="position: relative; display: inline-block;">
      <button class="btn btn-secondary btn-icon" id="lang-toggle-btn" aria-haspopup="true" aria-expanded="false" aria-label="Seleccionar idioma" style="font-weight: 600;">
        🌐 ${currentLang.toUpperCase()} ▾
      </button>
      <div class="lang-dropdown-menu" id="lang-dropdown-menu" style="display: none; position: absolute; top: 100%; right: 0; background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; min-width: 180px; margin-top: 5px; padding: 5px 0;">
        <div style="padding: 8px 15px; font-weight: bold; border-bottom: 1px solid var(--border-color, #e5e7eb); margin-bottom: 5px; color: var(--text-color, #111827); font-size: 14px;">
          🌐 Seleccionar idioma
        </div>
        ${langs.map(l => `
          <button class="lang-option" data-lang="${l.code}" aria-selected="${currentLang === l.code}" style="display: flex; align-items: center; width: 100%; padding: 8px 15px; background: transparent; border: none; text-align: left; cursor: pointer; color: var(--text-color, #111827); font-size: 14px;">
            <span style="width: 20px; display: inline-block; font-weight: bold;">${currentLang === l.code ? '✓' : ''}</span>
            <span style="margin-right: 8px;">${l.flag}</span>
            ${l.name}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;

  const btn = container.querySelector('#lang-toggle-btn');
  const menu = container.querySelector('#lang-dropdown-menu');
  const options = container.querySelectorAll('.lang-option');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !isExpanded);
    menu.style.display = isExpanded ? 'none' : 'block';
  });

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const selectedLang = opt.getAttribute('data-lang');
      setLanguage(selectedLang);
      renderLanguageSwitcher(container);
    });
    opt.addEventListener('mouseover', () => { opt.style.backgroundColor = 'var(--bg-hover, rgba(0,0,0,0.05))'; });
    opt.addEventListener('mouseout', () => { opt.style.backgroundColor = 'transparent'; });
  });

  if (!clickListenerAttached) {
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.lang-dropdown-wrapper').forEach(wrapper => {
        if (!wrapper.contains(e.target)) {
          const m = wrapper.querySelector('.lang-dropdown-menu');
          const b = wrapper.querySelector('#lang-toggle-btn');
          if (m && b) {
            b.setAttribute('aria-expanded', 'false');
            m.style.display = 'none';
          }
        }
      });
    });
    clickListenerAttached = true;
  }
}
