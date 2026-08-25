import '../../guards/auth-guard.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n, t } from '../../utils/i18n.js';
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
import { openCandidateProfile } from '../../components/candidate-profile.js';

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
      { key: 'id', headerKey: 'table.id', isMono: true, render: (id) => formatId(id) },
      { key: 'firstName', headerKey: 'candidatos.form.name', render: (val, row) => `${row.firstName} ${row.lastName}` },
      { key: 'email', headerKey: 'candidatos.form.email' },
      { key: 'role', headerKey: 'dashboard.table.candidato.role', render: (val) => `<span class="badge badge-active">${val || t('role.candidate')}</span>` }
    ],
    data: candidatosRes.data || [],
    isLoading: false,
    error: candidatosRes.ok ? null : candidatosRes.message
  });

  const candidatesTable = document.getElementById('recent-candidatos-table');
  candidatesTable.querySelectorAll('.candidate-profile-trigger').forEach(button => {
    button.addEventListener('click', () => {
      const item = (candidatosRes.data || []).find(candidate => String(candidate.id) === button.dataset.candidateId);
      openCandidateProfile({ candidateId: button.dataset.candidateId, candidate: item });
    });
  });

  // Renderizar tabla reciente de Vacantes
  renderTable({
    container: document.getElementById('recent-vacantes-table'),
    columns: [
      { key: 'id', headerKey: 'table.id', isMono: true, render: (id) => formatId(id, '#VAC-') },
      { key: 'title', headerKey: 'dashboard.table.vacante.title' },
      { key: 'price', headerKey: 'dashboard.table.vacante.salary', isMono: true, render: (val) => formatCurrency(val) },
      { key: 'category', headerKey: 'dashboard.table.vacante.area', render: (val) => `<span class="badge badge-neutral">${val}</span>` }
    ],
    data: vacantesRes.data || [],
    isLoading: false,
    error: vacantesRes.ok ? null : vacantesRes.message
  });
}

loadDashboardData();
