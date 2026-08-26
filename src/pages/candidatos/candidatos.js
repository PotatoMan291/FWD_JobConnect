import '../../guards/auth-guard.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n, t } from '../../utils/i18n.js';
import { renderMenu } from '../../components/menu.js';
import { renderThemeSwitcher } from '../../components/theme-switcher.js';
import { renderAccessibilityMenu } from '../../components/accessibility-menu.js';
import { initAccessibility } from '../../utils/accessibility.js';
import { renderLanguageSwitcher } from '../../components/language-switcher.js';
import { createFilterLayout } from '../../components/filter-layout.js';
import { renderTable } from '../../components/table.js';
import { renderPagination } from '../../components/pagination.js';
import { candidatosService } from '../../services/candidatos-service.js';
import { vacantesService } from '../../services/vacantes-service.js';
import { aiMatchService } from '../../services/ai-match-service.js';
import { authService } from '../../services/auth-service.js';
import { openCandidatoForm } from './candidatos-form.js';
import { openModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
import { formatId } from '../../utils/format.js';
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
  mobileBtn.addEventListener('click', () => menuContainer.classList.toggle('open'));
}

const filterContainer = document.getElementById('filter-container');
const tableContainer = document.getElementById('table-container');
const paginationContainer = document.getElementById('pagination-container');

let currentCursor = 0;
const currentLimit = 10;
let currentSearch = '';
let currentFilters = {};
let aiRankings = new Map();
let aiEnabled = false;
let vacancyOptions = [];
const currentUser = authService.getCurrentUser();
const canSelectVacancy = ['admin', 'recruiter'].includes(currentUser?.role);

function canAccessVacancy(job) {
  return currentUser?.role === 'admin' || (currentUser?.role === 'recruiter' && String(job.createdBy) === String(currentUser.id));
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function candidateAvatar(candidate) {
  const initials = `${candidate.firstName} ${candidate.lastName}`.trim().split(' ').map(part => part[0]).join('').toUpperCase();
  return candidate.image
    ? `<img class="candidate-list-avatar" src="${escapeHTML(candidate.image)}" alt="Foto de ${escapeHTML(candidate.fullName)}" data-fallback-initials="${escapeHTML(initials || '?')}">`
    : `<span class="candidate-list-avatar candidate-list-initials" aria-hidden="true">${escapeHTML(initials || '?')}</span>`;
}

function localAvatarUrl(initials) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#DCEBE7"/><text x="40" y="46" text-anchor="middle" dominant-baseline="middle" fill="#1F5C4F" font-family="sans-serif" font-size="24" font-weight="700">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function bindAvatarFallback(container) {
  container.querySelectorAll('.candidate-list-avatar[data-fallback-initials]').forEach(image => {
    image.addEventListener('error', () => {
      image.onerror = null;
      image.src = localAvatarUrl(image.dataset.fallbackInitials || '?');
      image.removeAttribute('data-fallback-initials');
    }, { once: true });
  });
}

async function loadData() {
  renderTable({ container: tableContainer, columns: [], isLoading: true });

  const res = await candidatosService.getAll({
    cursor: aiEnabled ? 0 : currentCursor,
    limit: aiEnabled ? 100 : currentLimit,
    q: currentSearch,
    filters: aiEnabled ? { workMode: currentFilters.workMode, location: currentFilters.location } : currentFilters
  });

  if (!res.ok) {
    renderTable({ container: tableContainer, error: res.message });
    paginationContainer.innerHTML = '';
    return;
  }

  let data = res.data;
  let total = res.total;
  if (aiEnabled && aiRankings.size) {
    data = [...data].sort((a, b) => (aiRankings.get(String(b.id))?.score || 0) - (aiRankings.get(String(a.id))?.score || 0));
    total = data.length;
    data = data.slice(currentCursor, currentCursor + currentLimit);
  }

  const columns = [
    { key: 'image', headerKey: 'candidatos.photo', render: (value, row) => candidateAvatar(row) },
    { key: 'id', headerKey: 'table.id', isMono: true, render: (id) => formatId(id, '#CAN-') },
    { key: 'firstName', headerKey: 'candidatos.form.name', render: (val, row) => `<button class="candidate-profile-trigger" type="button" data-candidate-id="${row.id}" aria-label="${t('candidatos.profile.view', { name: `${row.firstName} ${row.lastName}` })}">${row.firstName} ${row.lastName}</button>` },
    { key: 'email', headerKey: 'candidatos.form.email' },
    { key: 'phone', headerKey: 'candidatos.form.phone', isMono: true },
    { key: 'company', headerKey: 'candidatos.form.company', render: (val) => typeof val === 'string' ? val : (val && val.name ? val.name : '—') }
  ];

  if (aiEnabled) {
    columns.splice(3, 0, {
      key: 'aiScore',
      headerKey: 'filter.ai.score',
      render: (_val, row) => {
        const ranking = aiRankings.get(String(row.id));
        if (!ranking) return '—';
        return `<span class="ai-match-badge" title="${escapeHTML(ranking.reason || '')}">${ranking.score}%</span>`;
      }
    });
  }

  renderTable({
    container: tableContainer,
    columns,
    data,
    onEdit: (id, item) => {
      openCandidatoForm({ item, onSave: loadData });
    },
    onDelete: (id, item) => {
      openDeleteConfirmation(id, item);
    }
  });
  bindAvatarFallback(tableContainer);

  tableContainer.querySelectorAll('.candidate-profile-trigger').forEach(button => {
    button.addEventListener('click', () => {
      const item = data.find(candidate => String(candidate.id) === button.dataset.candidateId);
      openCandidateProfile({
        candidateId: button.dataset.candidateId,
        candidate: item,
        onEdit: selectedCandidate => openCandidatoForm({ item: selectedCandidate, onSave: loadData })
      });
    });
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
    const res = await candidatosService.remove(id);
    if (res.ok) {
      showToast(t('toast.delete.success'), 'success');
      closeModal();
      loadData();
    } else {
      showToast(res.message || t('toast.error'), 'error');
    }
  });
}

const filterFields = [
  { key: 'search', type: 'text', placeholder: 'filter.search' },
  { key: 'workMode', type: 'select', labelKey: 'filter.workMode', options: [
    { value: 'Remoto', label: 'Remoto' },
    { value: 'Hibrido', label: 'Híbrido' },
    { value: 'Presencial', label: 'Presencial' }
  ]},
  { key: 'location', type: 'select', labelKey: 'filter.location', options: [
    { value: 'Costa Rica', label: 'Costa Rica' },
    { value: 'Mexico', label: 'México' },
    { value: 'Espana', label: 'España' },
    { value: 'Estados Unidos', label: 'Estados Unidos' },
    { value: 'Argentina', label: 'Argentina' },
    { value: 'Brasil', label: 'Brasil' }
  ]}
];

if (canSelectVacancy) {
  filterFields.splice(1, 0, {
    key: 'vacancyId',
    type: 'select',
    labelKey: 'filter.vacancy',
    options: vacancyOptions
  });
  filterFields.push({
    key: 'ai',
    type: 'action',
    labelKey: 'filter.ai.candidates',
    icon: 'sparkles'
  });
}

const filterLayout = createFilterLayout({
  container: filterContainer,
  fields: filterFields,
  onFilterChange: (filters) => {
    currentSearch = filters.search || '';
    const nextVacancy = filters.vacancyId || '';
    if (nextVacancy !== (currentFilters.vacancyId || '')) {
      aiEnabled = false;
      aiRankings = new Map();
    }
    currentFilters = {
      vacancyId: nextVacancy,
      workMode: filters.workMode || '',
      location: filters.location || ''
    };
    currentCursor = 0;
    loadData();
  },
  onAction: async (actionKey, filters) => {
    if (actionKey !== 'ai') return;
    if (!filters.vacancyId) {
      showToast(t('filter.ai.needVacancy'), 'error');
      return;
    }
    showToast(t('filter.ai.running'), 'info');
    const pool = await candidatosService.getAll({
      cursor: 0,
      limit: 100,
      q: currentSearch,
      filters: { workMode: filters.workMode || '', location: filters.location || '' }
    });
    const res = await aiMatchService.rankCandidates({
      vacancyId: filters.vacancyId,
      candidateIds: (pool.data || []).map(candidate => candidate.id)
    });
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

async function loadVacancyOptions() {
  const res = await vacantesService.getAll({ cursor: 0, limit: 100 });
  if (!res.ok) return;
  vacancyOptions = (res.data || [])
    .filter(canAccessVacancy)
    .map(job => ({ value: String(job.id), label: job.title }));
  filterLayout.setOptions('vacancyId', vacancyOptions);
}

if (canSelectVacancy) loadVacancyOptions();

loadData();
