import { authService } from '../services/auth-service.js';
import { t } from '../utils/i18n.js';
import { icons } from '../assets/icons/icons.js';

const NAV_ITEMS = [
  { key: 'dashboard', labelKey: 'menu.dashboard', icon: 'dashboard', path: '/src/pages/dashboard/dashboard.html', roles: ['admin', 'recruiter'] },
  { key: 'candidatos', labelKey: 'menu.candidatos', icon: 'candidatos', path: '/src/pages/candidatos/candidatos.html', roles: ['admin', 'recruiter'] },
  { key: 'vacantes', labelKey: 'menu.vacantes', icon: 'vacantes', path: '/src/pages/vacantes/vacantes.html', roles: ['admin', 'recruiter', 'user'] },
  { key: 'perfil', labelKey: 'menu.profile', icon: 'candidatos', path: '/src/pages/perfil/perfil.html', roles: ['admin', 'recruiter', 'user'] },
  { key: 'empresas', labelKey: 'menu.empresas', icon: 'empresas', path: '/src/pages/empresas/empresas.html', roles: ['admin', 'recruiter'] },
  { key: 'postulaciones', labelKey: 'menu.postulaciones', icon: 'postulaciones', path: '/src/pages/postulaciones/postulaciones.html', roles: ['admin', 'recruiter', 'user'] },
  { key: 'entrevistas', labelKey: 'menu.entrevistas', icon: 'entrevistas', path: '/src/pages/entrevistas/entrevistas.html', roles: ['admin', 'recruiter'] },
  { key: 'tareas', labelKey: 'menu.tareas', icon: 'tareas', path: '/src/pages/tareas/tareas.html', roles: ['admin', 'recruiter', 'user'] }
];

export function renderMenu(container, currentUser = null) {
  if (!container) return;
  const user = currentUser || authService.getCurrentUser() || { firstName: 'Usuario', role: 'user' };
  const userRole = user.role || 'user';
  const currentPath = window.location.pathname;

  const allowedItems = NAV_ITEMS.filter(item => item.roles.includes(userRole));
  const brandHref = userRole === 'user' ? '/src/pages/vacantes/vacantes.html' : '/src/pages/dashboard/dashboard.html';

  const html = `
    <div class="sidebar-header">
      <a href="${brandHref}" class="brand-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28">
          <rect width="32" height="32" rx="6" fill="var(--color-accent)"/>
          <path d="M10 12V10C10 8.89543 10.8954 8 12 8H20C21.1046 8 22 8.89543 22 10V12H24C25.1046 12 26 12.8954 26 14V22C26 23.1046 25.1046 24 24 24H8C6.89543 24 6 23.1046 6 22V14C6 12.8954 6.89543 12 8 12H10ZM12 10V12H20V10H12Z" fill="var(--color-bg)"/>
        </svg>
        <span class="brand-title">${t('brand.title')}</span>
      </a>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-title">${t('menu.navigation')}</div>
      ${allowedItems.map(item => {
        const isActive = currentPath.includes(item.key);
        return `
          <a href="${item.path}" class="nav-item ${isActive ? 'active' : ''}">
            ${icons[item.icon] || ''}
            <span>${t(item.labelKey)}</span>
          </a>
        `;
      }).join('')}
    </nav>

    <div class="sidebar-footer">
      <img class="sidebar-user-avatar" src="${user.image || '/public/favicon.svg'}" alt="${t('menu.user_photo', { name: user.firstName || user.username || t('menu.user.default') })}">
      <div class="user-info">
        <span class="user-name">${user.firstName || user.username || t('menu.user.default')} ${user.lastName || ''}</span>
        <span class="user-role">${t(`menu.role.${userRole}`) || userRole}</span>
      </div>
      <button id="logout-btn" class="btn btn-icon" title="${t('menu.logout')}">
        ${icons.logout}
      </button>
    </div>
  `;

  container.innerHTML = html;
  container.classList.add('sidebar');

  container.querySelectorAll('.nav-item, .brand-logo').forEach(link => {
    link.addEventListener('click', () => container.classList.remove('open'));
  });

  if (!container.dataset.outsideClickBound) {
    document.addEventListener('click', event => {
      if (!container.classList.contains('open')) return;
      if (!event.target.closest('#menu, #mobile-menu-btn')) {
        container.classList.remove('open');
      }
    });
    container.dataset.outsideClickBound = 'true';
  }

  const logoutBtn = container.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => authService.logout());
  }

  if (!container.dataset.languageChangeBound) {
    window.addEventListener('languagechange', () => {
      renderMenu(container, user);
    });
    container.dataset.languageChangeBound = 'true';
  }
}
