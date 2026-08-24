import '../../guards/auth-guard.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n, t } from '../../utils/i18n.js';
import { renderMenu } from '../../components/menu.js';
import { renderThemeSwitcher } from '../../components/theme-switcher.js';
import { renderLanguageSwitcher } from '../../components/language-switcher.js';
import { createFilterLayout } from '../../components/filter-layout.js';
import { renderTable } from '../../components/table.js';
import { renderPagination } from '../../components/pagination.js';
import { postulacionesService } from '../../services/postulaciones-service.js';
import { openPostulacionForm } from './postulaciones-form.js';
import { openModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
import { formatId, truncateText } from '../../utils/format.js';

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
const createBtn = document.getElementById('create-postulacion-btn');

let currentCursor = 0;
const currentLimit = 10;
let currentSearch = '';

async function loadData() {
  renderTable({ container: tableContainer, columns: [], isLoading: true });

  const res = await postulacionesService.getAll({
    cursor: currentCursor,
    limit: currentLimit,
    q: currentSearch
  });

  if (!res.ok) {
    renderTable({ container: tableContainer, error: res.message });
    paginationContainer.innerHTML = '';
    return;
  }

  const columns = [
    { key: 'id', headerKey: 'table.id', isMono: true, render: (id) => formatId(id, '#POS-') },
    { key: 'title', headerKey: 'postulaciones.form.title', render: (val) => `<strong>${truncateText(val, 45)}</strong>` },
    { key: 'body', headerKey: 'postulaciones.form.body', render: (val) => truncateText(val, 60) },
    { key: 'views', headerKey: 'table.status', render: (val) => `<span class="badge badge-neutral">${val || 0} Vistas</span>` }
  ];

  renderTable({
    container: tableContainer,
    columns,
    data: res.data,
    onEdit: (id, item) => {
      openPostulacionForm({ item, onSave: loadData });
    },
    onDelete: (id, item) => {
      openDeleteConfirmation(id, item);
    }
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
    const res = await postulacionesService.remove(id);
    if (res.ok) {
      showToast(t('toast.delete.success'), 'success');
      closeModal();
      loadData();
    } else {
      showToast(res.message || t('toast.error'), 'error');
    }
  });
}

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
  openPostulacionForm({ onSave: loadData });
});

loadData();
