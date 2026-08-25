import '../../guards/auth-guard.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n, t } from '../../utils/i18n.js';
import { renderMenu } from '../../components/menu.js';
import { renderThemeSwitcher } from '../../components/theme-switcher.js';
import { renderAccessibilityMenu } from '../../components/accessibility-menu.js';
import { initAccessibility } from '../../utils/accessibility.js';
import { renderLanguageSwitcher } from '../../components/language-switcher.js';
import { createFilterLayout } from '../../components/filter-layout.js';
import { renderPagination } from '../../components/pagination.js';
import { vacantesService } from '../../services/vacantes-service.js';
import { aiMatchService } from '../../services/ai-match-service.js';
import { authService } from '../../services/auth-service.js';
import { openVacanteForm } from './vacantes-form.js';
import { openModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
import { renderJobCatalog } from '../../components/job-catalog.js';

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
  mobileBtn.addEventListener('click', () => menuContainer.classList.toggle('open'));
}

const filterContainer = document.getElementById('filter-container');
const catalogContainer = document.getElementById('job-catalog-container');
const paginationContainer = document.getElementById('pagination-container');
const createBtn = document.getElementById('create-vacante-btn');

let currentCursor = 0;
const currentLimit = 10;
let currentSearch = '';
let currentFilters = {};
let aiRankings = new Map();
let aiEnabled = false;
const currentUser = authService.getCurrentUser();
const canManageVacancies = ['admin', 'recruiter'].includes(currentUser?.role);

if (!canManageVacancies && createBtn) {
  createBtn.hidden = true;
}

async function loadData() {
  renderJobCatalog({ container: catalogContainer, isLoading: true });

  const res = await vacantesService.getAll({
    cursor: aiEnabled ? 0 : currentCursor,
    limit: aiEnabled ? 100 : currentLimit,
    q: currentSearch,
    filters: currentFilters
  });

  if (!res.ok) {
    renderJobCatalog({ container: catalogContainer, error: res.message, onRetry: loadData });
    paginationContainer.innerHTML = '';
    return;
  }

  let jobs = res.data;
  let total = res.total;
  if (aiEnabled && aiRankings.size) {
    jobs = jobs.map(job => {
      const ranking = aiRankings.get(String(job.id));
      return ranking ? { ...job, matchScore: ranking.score, matchReason: ranking.reason } : job;
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    total = jobs.length;
    jobs = jobs.slice(currentCursor, currentCursor + currentLimit);
  }

  renderJobCatalog({
    container: catalogContainer,
    jobs,
    onEdit: canManageVacancies ? item => openVacanteForm({ item, onSave: loadData }) : null,
    onDelete: canManageVacancies ? item => openDeleteConfirmation(item.id, item) : null,
  emptyMessage: t('vacantes.empty.search')
  });

  renderPagination({
    container: paginationContainer,
    skip: currentCursor,
    limit: currentLimit,
    total,
    onCursorChange: (newCursor) => {
      currentCursor = newCursor;
      loadData();
    }
  });
}

function openDeleteConfirmation(id, item) {
  const title = t('modal.delete.title');
  const bodyHTML = `<p>${t('modal.delete.confirm')}</p>`;
  const footerHTML = `
    <button class="btn btn-secondary cancel-modal-btn">${t('modal.cancel')}</button>
    <button class="btn btn-danger confirm-delete-btn">${t('modal.delete.submit')}</button>
  `;

  const overlay = openModal({ title, bodyHTML, footerHTML });
  overlay.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);
  overlay.querySelector('.confirm-delete-btn').addEventListener('click', async () => {
    const res = await vacantesService.remove(id);
    if (res.ok) {
      showToast(t('toast.delete.success'), 'success');
      closeModal();
      loadData();
    } else {
      showToast(res.message || t('toast.error'), 'error');
    }
  });
}

const vacanteFields = [
  { key: 'search', type: 'text', placeholder: 'filter.search' },
  { key: 'category', type: 'select', labelKey: 'filter.category', options: [
    { value: 'Ingeniería de Software', label: 'Ingeniería de Software' },
    { value: 'Diseño & Producto', label: 'Diseño & Producto' },
    { value: 'Infraestructura Cloud', label: 'Infraestructura Cloud' },
    { value: 'Recursos Humanos', label: 'Recursos Humanos' },
    { value: 'Ciencia de Datos', label: 'Ciencia de Datos' },
    { value: 'Control de Calidad', label: 'Control de Calidad' },
    { value: 'Operaciones IT', label: 'Operaciones IT' },
    { value: 'Desarrollo Móvil', label: 'Desarrollo Móvil' }
  ]},
  { key: 'modality', type: 'select', labelKey: 'filter.modality', options: [
    { value: 'Remoto', label: 'Remoto' },
    { value: 'Híbrido', label: 'Híbrido' },
    { value: 'Presencial', label: 'Presencial' }
  ]},
  { key: 'experienceLevel', type: 'select', labelKey: 'filter.experience', options: [
    { value: 'Intermedio', label: 'Intermedio' },
    { value: 'Senior', label: 'Senior' }
  ]},
  { key: 'location', type: 'select', labelKey: 'filter.location', options: [
    { value: 'San José', label: 'San José' },
    { value: 'Heredia', label: 'Heredia' },
    { value: 'Alajuela', label: 'Alajuela' },
    { value: 'Cartago', label: 'Cartago' },
    { value: 'Escazú', label: 'Escazú' },
    { value: 'Santa Ana', label: 'Santa Ana' },
    { value: 'Belén', label: 'Belén' }
  ]},
  { key: 'published', type: 'date-range', fromKey: 'publishedFrom', toKey: 'publishedTo', labelKey: 'filter.published' }
];

if (currentUser?.id) {
  vacanteFields.push({
    key: 'ai',
    type: 'action',
    labelKey: 'filter.ai.vacancies',
    icon: 'sparkles'
  });
}

createFilterLayout({
  container: filterContainer,
  fields: vacanteFields,
  onFilterChange: (filters) => {
    currentSearch = filters.search || '';
    currentFilters = {
      category: filters.category || '',
      modality: filters.modality || '',
      experienceLevel: filters.experienceLevel || '',
      location: filters.location || '',
      publishedFrom: filters.publishedFrom || '',
      publishedTo: filters.publishedTo || ''
    };
    currentCursor = 0;
    loadData();
  },
  onAction: async (actionKey) => {
    if (actionKey !== 'ai') return;
    const candidateId = currentUser?.id;
    if (!candidateId) {
      showToast(t('filter.ai.needProfile'), 'error');
      return;
    }
    showToast(t('filter.ai.running'), 'info');
    const res = await aiMatchService.rankVacancies({ candidateId });
    if (!res.ok) {
      showToast(res.message || t('toast.error'), 'error');
      return;
    }
    aiRankings = new Map((res.data.rankings || []).map(item => [String(item.id), item]));
    aiEnabled = true;
    currentCursor = 0;
    showToast(res.data.source === 'openrouter' ? t('filter.ai.success') : t('filter.ai.fallback'), 'success');
    loadData();
  }
});

if (canManageVacancies && createBtn) {
  createBtn.addEventListener('click', () => {
    openVacanteForm({ onSave: loadData });
  });
}

loadData();
window.addEventListener('languagechange', loadData);
