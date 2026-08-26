import { THEMES, getTheme, setTheme } from '../utils/theme.js';
import { icons } from '../assets/icons/icons.js';

export function renderThemeSwitcher(container) {
  if (!container) return;

  const currentTheme = getTheme();

  const html = `
    <div class="switcher-dropdown" id="theme-dropdown">
      <button class="btn btn-secondary btn-icon" id="theme-btn" title="Cambiar Tema Visual">
        ${icons.theme}
        <span>Temas</span>
      </button>
      <div class="switcher-menu">
        ${THEMES.map(theme => `
          <button class="switcher-item ${theme.id === currentTheme ? 'is-active' : ''}" data-theme="${theme.id}" aria-pressed="${theme.id === currentTheme}">
            <span class="theme-dot" style="--theme-dot-color: ${theme.color}; --theme-dot-border: ${theme.borderColor}; background-color: ${theme.color}; border-color: ${theme.borderColor};"></span>
            <span class="theme-name">${theme.name}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;

  const dropdown = container.querySelector('#theme-dropdown');
  const btn = container.querySelector('#theme-btn');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Cierra el selector de idioma antes de abrir/cerrar el selector de tema.
    document.querySelectorAll('.lang-dropdown-wrapper').forEach(wrapper => {
      const langMenu = wrapper.querySelector('.lang-dropdown-menu');
      const langBtn = wrapper.querySelector('#lang-toggle-btn');
      if (langMenu) langMenu.style.display = 'none';
      if (langBtn) langBtn.setAttribute('aria-expanded', 'false');
    });

    dropdown.classList.toggle('open');
  });

  container.querySelectorAll('.switcher-item').forEach(itemBtn => {
    itemBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const themeId = itemBtn.getAttribute('data-theme');
      setTheme(themeId);
      dropdown.classList.remove('open');
      renderThemeSwitcher(container);
    });
  });

  container.querySelectorAll('.theme-dot').forEach(dot => {
    dot.title = `Color del tema ${dot.closest('.switcher-item')?.querySelector('.theme-name')?.textContent || ''}`;
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });
}
