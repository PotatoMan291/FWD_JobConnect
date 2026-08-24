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
import { vacantesService } from '../../services/vacantes-service.js';
import { openVacanteForm } from './vacantes-form.js';
import { openModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
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
  mobileBtn.addEventListener('click', () => menuContainer.classList.toggle('open'));
}

const filterContainer = document.getElementById('filter-container');
const tableContainer = document.getElementById('table-container');
const paginationContainer = document.getElementById('pagination-container');
const createBtn = document.getElementById('create-vacante-btn');

let currentCursor = 0;
const currentLimit = 10;
let currentSearch = '';
let currentFilters = {};

async function loadData() {
  renderTable({ container: tableContainer, columns: [], isLoading: true });

  const res = await vacantesService.getAll({
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
    { key: 'id', headerKey: 'table.id', isMono: true, render: (id) => formatId(id, '#VAC-') },
    { key: 'title', headerKey: 'vacantes.form.title', render: (val) => `<strong>${val}</strong>` },
    { key: 'category', headerKey: 'vacantes.form.category', render: (val) => `<span class="badge badge-neutral">${val}</span>` },
    { key: 'price', headerKey: 'vacantes.form.price', isMono: true, render: (val) => formatCurrency(val * 100) },
    { key: 'stock', headerKey: 'vacantes.form.stock', isMono: true, render: (val) => `<span class="badge badge-active">${val} Plazas</span>` }
  ];

  renderTable({
    container: tableContainer,
    columns,
    data: res.data,
    onEdit: (id, item) => {
      openVacanteForm({ item, onSave: loadData });
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
  openVacanteForm({ onSave: loadData });
});

loadData();
