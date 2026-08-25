import '../../guards/auth-guard.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n, t } from '../../utils/i18n.js';
import { renderMenu } from '../../components/menu.js';
import { renderThemeSwitcher } from '../../components/theme-switcher.js';
import { renderAccessibilityMenu } from '../../components/accessibility-menu.js';
import { initAccessibility } from '../../utils/accessibility.js';
import { renderLanguageSwitcher } from '../../components/language-switcher.js';
import { renderTable } from '../../components/table.js';
import { renderPagination } from '../../components/pagination.js';
import { empresasService } from '../../services/empresas-service.js';
import { openEmpresaForm } from './empresas-form.js';
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

const tableContainer = document.getElementById('table-container');
const paginationContainer = document.getElementById('pagination-container');
const createBtn = document.getElementById('create-empresa-btn');

let currentCursor = 0;
const currentLimit = 10;

async function loadData() {
  renderTable({ container: tableContainer, columns: [], isLoading: true });

  const res = await empresasService.getAll({
    cursor: currentCursor,
    limit: currentLimit
  });

  if (!res.ok) {
    renderTable({ container: tableContainer, error: res.message });
    paginationContainer.innerHTML = '';
    return;
  }

  const columns = [
    { key: 'id', headerKey: 'table.id', isMono: true, render: (id) => formatId(id, '#EMP-') },
    { key: 'userId', headerKey: 'table.name', isMono: true, render: (uid) => `<strong>${t('empresas.account', { id: uid })}</strong>` },
    { key: 'totalProducts', headerKey: 'empresas.form.quantity', isMono: true, render: (val) => `<span class="badge badge-active">${t('empresas.vacancies_count', { count: val || 0 })}</span>` },
    { key: 'total', headerKey: 'empresas.form.total', isMono: true, render: (val) => formatCurrency(val) }
  ];

  renderTable({
    container: tableContainer,
    columns,
    data: res.data,
    onEdit: (id, item) => {
      openEmpresaForm({ item, onSave: loadData });
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
    const res = await empresasService.remove(id);
    if (res.ok) {
      showToast(t('toast.delete.success'), 'success');
      closeModal();
      loadData();
    } else {
      showToast(res.message || t('toast.error'), 'error');
    }
  });
}

createBtn.addEventListener('click', () => {
  openEmpresaForm({ onSave: loadData });
});

loadData();
