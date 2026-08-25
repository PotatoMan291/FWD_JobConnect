import { t } from '../utils/i18n.js';
import { icons } from '../assets/icons/icons.js';

export function createFilterLayout({
  container,
  fields = [],
  onFilterChange
}) {
  if (!container) return;

  const currentFilters = {};
  fields.forEach(f => {
    currentFilters[f.key] = f.defaultValue || '';
  });

  const searchField = fields.find(f => f.type === 'text' || f.key === 'q' || f.key === 'search');
  const selectFields = fields.filter(f => f.type === 'select');

  const renderFilterContent = () => {
    const html = `
      <div class="filter-bar">
        <div class="filter-inputs">
          ${searchField ? `
            <div class="filter-search-wrapper">
              <span class="filter-search-icon">${icons.search}</span>
              <input
                type="text"
                id="filter-${searchField.key}"
                class="input filter-search-input"
                placeholder="${searchField.placeholder ? (t(searchField.placeholder) || searchField.placeholder) : t('filter.search')}"
                value="${currentFilters[searchField.key] || ''}"
              />
            </div>
          ` : ''}

          ${selectFields.map(f => `
            <div class="filter-select-wrapper">
              <select id="filter-${f.key}" class="select">
                <option value="">${f.label ? (t(f.label) || f.label) : t('filter.all')}</option>
                ${f.options.map(opt => `
                  <option value="${opt.value}" ${currentFilters[f.key] === opt.value ? 'selected' : ''}>
                    ${t(opt.labelKey) || opt.label || opt.value}
                  </option>
                `).join('')}
              </select>
            </div>
          `).join('')}
        </div>

        <button id="clear-filters-btn" class="btn btn-secondary btn-icon" title="${t('filter.clear')}">
          ${icons.close}
          <span>${t('filter.clear')}</span>
        </button>
      </div>
    `;

    container.innerHTML = html;

    let debounceTimer = null;

    if (searchField) {
      const inputEl = container.querySelector(`#filter-${searchField.key}`);
      if (inputEl) {
        inputEl.addEventListener('input', (e) => {
          clearTimeout(debounceTimer);
          currentFilters[searchField.key] = e.target.value;
          debounceTimer = setTimeout(() => {
            onFilterChange(currentFilters);
          }, 300);
        });
      }
    }

    selectFields.forEach(f => {
      const selectEl = container.querySelector(`#filter-${f.key}`);
      if (selectEl) {
        selectEl.addEventListener('change', (e) => {
          currentFilters[f.key] = e.target.value;
          onFilterChange(currentFilters);
        });
      }
    });

    const clearBtn = container.querySelector('#clear-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        fields.forEach(f => {
          currentFilters[f.key] = '';
          const el = container.querySelector(`#filter-${f.key}`);
          if (el) el.value = '';
        });
        onFilterChange(currentFilters);
      });
    }
  };

  renderFilterContent();

  if (!container.dataset.languageChangeBound) {
    window.addEventListener('languagechange', renderFilterContent);
    container.dataset.languageChangeBound = 'true';
  }
}
