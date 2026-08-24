import '../../guards/auth-guard.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n } from '../../utils/i18n.js';
import { renderMenu } from '../../components/menu.js';
import { renderThemeSwitcher } from '../../components/theme-switcher.js';
import { renderAccessibilityMenu } from '../../components/accessibility-menu.js';
import { initAccessibility } from '../../utils/accessibility.js';
import { renderLanguageSwitcher } from '../../components/language-switcher.js';
import { renderTable } from '../../components/table.js';
import { candidatosService } from '../../services/candidatos-service.js';
import { vacantesService } from '../../services/vacantes-service.js';
import { empresasService } from '../../services/empresas-service.js';
import { postulacionesService } from '../../services/postulaciones-service.js';
import { formatId, formatCurrency } from '../../utils/format.js';

initTheme();
initAccessibility();
initI18n();

const menuContainer = document.getElementById('menu');
const themeContainer = document.getElementById('theme-switcher-container');
const accessibilityContainer = document.getElementById('accessibility-menu-container');
const langContainer = document.getElementById('lang-switcher-container');

renderMenu(menuContainer);
renderThemeSwitcher(themeContainer);
renderAccessibilityMenu(accessibilityContainer);
renderLanguageSwitcher(langContainer);

const mobileBtn = document.getElementById('mobile-menu-btn');
if (mobileBtn) {
  mobileBtn.addEventListener('click', () => {
    menuContainer.classList.toggle('open');
  });
}

async function loadDashboardData() {
  // Cargar métricas en paralelo
  const [candidatosRes, vacantesRes, empresasRes, postulacionesRes] = await Promise.all([
    candidatosService.getAll({ limit: 5 }),
    vacantesService.getAll({ limit: 5 }),
    empresasService.getAll({ limit: 1 }),
    postulacionesService.getAll({ limit: 1 })
  ]);

  // Actualizar métricas
  document.getElementById('count-candidatos').textContent = candidatosRes.total || 0;
  document.getElementById('count-vacantes').textContent = vacantesRes.total || 0;
  document.getElementById('count-empresas').textContent = empresasRes.total || 0;
  document.getElementById('count-postulaciones').textContent = postulacionesRes.total || 0;

  // Renderizar tabla reciente de Candidatos
  renderTable({
    container: document.getElementById('recent-candidatos-table'),
    columns: [
      { key: 'id', header: 'ID', isMono: true, render: (id) => formatId(id) },
      { key: 'firstName', header: 'Nombre', render: (val, row) => `${row.firstName} ${row.lastName}` },
      { key: 'email', header: 'Correo' },
      { key: 'role', header: 'Rol/Posición', render: (val) => `<span class="badge badge-active">${val || 'Candidato'}</span>` }
    ],
    data: candidatosRes.data || [],
    isLoading: false,
    error: candidatosRes.ok ? null : candidatosRes.message
  });

  // Renderizar tabla reciente de Vacantes
  renderTable({
    container: document.getElementById('recent-vacantes-table'),
    columns: [
      { key: 'id', header: 'ID', isMono: true, render: (id) => formatId(id, '#VAC-') },
      { key: 'title', header: 'Vacante' },
      { key: 'price', header: 'Rango Salarial', isMono: true, render: (val) => formatCurrency(val * 100) },
      { key: 'category', header: 'Área', render: (val) => `<span class="badge badge-neutral">${val}</span>` }
    ],
    data: vacantesRes.data || [],
    isLoading: false,
    error: vacantesRes.ok ? null : vacantesRes.message
  });
}

loadDashboardData();
