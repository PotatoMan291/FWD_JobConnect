import '../../guards/auth-guard.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n, t } from '../../utils/i18n.js';
import { renderMenu } from '../../components/menu.js';
import { renderThemeSwitcher } from '../../components/theme-switcher.js';
import { renderLanguageSwitcher } from '../../components/language-switcher.js';
import { createFilterLayout } from '../../components/filter-layout.js';
import { renderTable } from '../../components/table.js';
import { renderPagination } from '../../components/pagination.js';
import { candidatosService } from '../../services/candidatos-service.js';
import { openCandidatoForm } from './candidatos-form.js';
import { openModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
import { formatId } from '../../utils/format.js';
import { openCandidateProfile } from '../../components/candidate-profile.js';

initTheme();
initI18n();

const menuContainer = document.getElementById('menu');
const themeContainer = document.getElementById('theme-switcher-container');
const langContainer = document.getElementById('lang-switcher-container');

renderMenu(menuContainer);
renderThemeSwitcher(themeContainer);
renderLanguageSwitcher(langContainer);

const mobileBtn = document.getElementById('mobile-menu-btn');
if (mobileBtn) {
  mobileBtn.addEventListener('click', () => menuContainer.classList.toggle('open'));
}

const filterContainer = document.getElementById('filter-container');
const tableContainer = document.getElementById('table-container');
const paginationContainer = document.getElementById('pagination-container');
const createBtn = document.getElementById('create-candidato-btn');

let currentCursor = 0;
const currentLimit = 10;
let currentSearch = '';
let currentFilters = {};

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function candidateAvatar(candidate) {
  const initials = `${candidate.firstName} ${candidate.lastName}`.trim().split(' ').map(part => part[0]).join('').toUpperCase();
  return candidate.image
    ? `<img class="candidate-list-avatar" src="${escapeHTML(candidate.image)}" alt="Foto de ${escapeHTML(candidate.fullName)}">`
    : `<span class="candidate-list-avatar candidate-list-initials" aria-hidden="true">${escapeHTML(initials || '?')}</span>`;
}

async function loadData() {
  renderTable({ container: tableContainer, columns: [], isLoading: true });

  const res = await candidatosService.getAll({
    cursor: currentCursor,
    limit: currentLimit,
    q: currentSearch,
    filters: currentFilters
  });

  if (!res.ok) {
    renderTable({ container: tableContainer, error: res.message });
    paginationContainer.innerHTML = '';
    return;
  }

  const columns = [
    { key: 'image', header: 'Foto', render: (value, row) => candidateAvatar(row) },
    { key: 'id', headerKey: 'table.id', isMono: true, render: (id) => formatId(id, '#CAN-') },
    { key: 'firstName', headerKey: 'candidatos.form.name', render: (val, row) => `<button class="candidate-profile-trigger" type="button" data-candidate-id="${row.id}" aria-label="Ver perfil de ${row.firstName} ${row.lastName}">${row.firstName} ${row.lastName}</button>` },
    { key: 'email', headerKey: 'candidatos.form.email' },
    { key: 'phone', headerKey: 'candidatos.form.phone', isMono: true },
    { key: 'company', headerKey: 'candidatos.form.company', render: (val) => typeof val === 'string' ? val : (val && val.name ? val.name : '—') }
  ];

  renderTable({
    container: tableContainer,
    columns,
    data: res.data,
    onEdit: (id, item) => {
      openCandidatoForm({ item, onSave: loadData });
    },
    onDelete: (id, item) => {
      openDeleteConfirmation(id, item);
    }
  });

  tableContainer.querySelectorAll('.candidate-profile-trigger').forEach(button => {
    button.addEventListener('click', () => {
      const item = res.data.find(candidate => String(candidate.id) === button.dataset.candidateId);
      openCandidateProfile({
        candidateId: button.dataset.candidateId,
        candidate: item,
        onEdit: selectedCandidate => openCandidatoForm({ item: selectedCandidate, onSave: loadData })
      });
    });
  });

  renderPagination({
    container: paginationContainer,
    skip: res.skip,
    limit: currentLimit,
    total: res.total,
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

// Inicializar filtros
createFilterLayout({
  container: filterContainer,
  fields: [
    { key: 'search', type: 'text', placeholder: 'filter.search' }
  ],
  onFilterChange: (filters) => {
    currentSearch = filters.search || '';
    currentCursor = 0;
    loadData();
  }
});

createBtn.addEventListener('click', () => {
  openCandidatoForm({ onSave: loadData });
});

loadData();
