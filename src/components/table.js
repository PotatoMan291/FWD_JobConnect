import { t } from '../utils/i18n.js';
import { icons } from '../assets/icons/icons.js';

export function renderTable({
  container,
  columns = [],
  data = [],
  onEdit = null,
  onDelete = null,
  isLoading = false,
  error = null
}) {
  if (!container) return;

  const renderContent = () => {
    if (isLoading) {
      container.innerHTML = `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                ${columns.map(col => `<th>${t(col.headerKey || col.header)}</th>`).join('')}
                ${(onEdit || onDelete) ? `<th>${t('table.actions')}</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${Array(5).fill(0).map(() => `
                <tr>
                  ${columns.map(() => `<td><span class="skeleton" style="width: 80%; height: 16px;"></span></td>`).join('')}
                  ${(onEdit || onDelete) ? `<td><span class="skeleton" style="width: 50px; height: 16px;"></span></td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    if (error) {
      container.innerHTML = `
        <div class="table-container">
          <div class="state-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <h4>${t('table.error.title')}</h4>
            <p>${error || t('table.error.desc')}</p>
          </div>
        </div>
      `;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="table-container">
          <div class="state-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            <h4>${t('table.empty.title')}</h4>
            <p>${t('table.empty.desc')}</p>
          </div>
        </div>
      `;
      return;
    }

    const html = `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              ${columns.map(col => `<th>${t(col.headerKey || col.header)}</th>`).join('')}
              ${(onEdit || onDelete) ? `<th style="width: 100px; text-align: right;">${t('table.actions')}</th>` : ''}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr data-id="${row.id}">
                ${columns.map(col => {
                  let cellValue = row[col.key];
                  if (col.render && typeof col.render === 'function') {
                    cellValue = col.render(cellValue, row);
                  } else if (cellValue === undefined || cellValue === null) {
                    cellValue = '—';
                  }
                  const isMono = col.isMono ? 'class="mono"' : '';
                  return `<td ${isMono}>${cellValue}</td>`;
                }).join('')}
                ${(onEdit || onDelete) ? `
                  <td style="text-align: right;">
                    <div class="actions-cell" style="justify-content: flex-end;">
                      ${onEdit ? `
                        <button class="btn btn-icon edit-btn" data-id="${row.id}" title="Editar">
                          ${icons.edit}
                        </button>
                      ` : ''}
                      ${onDelete ? `
                        <button class="btn btn-icon btn-danger delete-btn" data-id="${row.id}" title="Eliminar">
                          ${icons.delete}
                        </button>
                      ` : ''}
                    </div>
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

    if (onEdit) {
      container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const item = data.find(d => String(d.id) === String(id));
          onEdit(id, item);
        });
      });
    }

    if (onDelete) {
      container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const item = data.find(d => String(d.id) === String(id));
          onDelete(id, item);
        });
      });
    }
  };

  renderContent();

  window.addEventListener('languagechange', renderContent);
}
