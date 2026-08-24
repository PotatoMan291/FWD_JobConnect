import { THEMES, getTheme, setTheme } from '../utils/theme.js';
import { icons } from '../assets/icons/icons.js';

export function renderThemeSwitcher(container) {
  if (!container) return;

  const currentTheme = getTheme();
  const currentObj = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  const html = `
    <div class="switcher-dropdown" id="theme-dropdown">
      <button class="btn btn-secondary btn-icon" id="theme-btn" title="Cambiar Tema Visual">
        ${icons.theme}
        <span class="theme-dot" style="background-color: ${currentObj.color};"></span>
      </button>
      <div class="switcher-menu">
        ${THEMES.map(theme => `
          <button class="switcher-item" data-theme="${theme.id}">
            <span class="theme-dot" style="background-color: ${theme.color};"></span>
            <span>${theme.name}</span>
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

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });
}
