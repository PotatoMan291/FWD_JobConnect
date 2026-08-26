import { t } from '../utils/i18n.js';
import { icons } from '../assets/icons/icons.js';

function escapeAttr(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function fieldLabel(field) {
  if (field.labelKey) return t(field.labelKey);
  if (field.label) return t(field.label) || field.label;
  return t('filter.all');
}

function optionLabel(opt) {
  return t(opt.labelKey) || opt.label || opt.value;
}

export function createFilterLayout({
  container,
  fields = [],
  onFilterChange,
  onAction
}) {
  if (!container) return;

  const currentFilters = {};
  fields.forEach(field => {
    if (field.type === 'action') return;
    if (field.type === 'date-range') {
      currentFilters[field.fromKey || `${field.key}From`] = field.defaultFrom || '';
      currentFilters[field.toKey || `${field.key}To`] = field.defaultTo || '';
      return;
    }
    currentFilters[field.key] = field.defaultValue || '';
  });

  const notify = () => {
    if (onFilterChange) onFilterChange({ ...currentFilters });
  };

  const renderFilterContent = () => {
    const searchField = fields.find(field => field.type === 'text' || field.key === 'q' || field.key === 'search');
    const selectFields = fields.filter(field => field !== searchField && (field.type === 'select' || field.type === 'text') && field.type !== 'action');
    const dateFields = fields.filter(field => field.type === 'date' || field.type === 'date-range');
    const actionFields = fields.filter(field => field.type === 'action');

    container.innerHTML = `
      <div class="filter-bar">
        <div class="filter-inputs">
          ${searchField ? `
            <div class="filter-search-wrapper">
              <span class="filter-search-icon">${icons.search}</span>
              <input
                type="text"
                id="filter-${searchField.key}"
                class="input filter-search-input"
                placeholder="${escapeAttr(searchField.placeholder ? (t(searchField.placeholder) || searchField.placeholder) : t('filter.search'))}"
                value="${escapeAttr(currentFilters[searchField.key] || '')}"
              />
            </div>
          ` : ''}

          ${selectFields.length > 0 ? `
            <div class="filter-selects-grid">
              ${selectFields.map(field => {
                if (field.type === 'select') {
                  const isSelected = Boolean(currentFilters[field.key]);
                  return `
                    <div class="filter-select-wrapper ${isSelected ? 'has-value' : ''}">
                      <select id="filter-${field.key}" class="select filter-custom-select" aria-label="${escapeAttr(fieldLabel(field))}">
                        <option value="">${escapeAttr(fieldLabel(field))}</option>
                        ${(field.options || []).map(opt => `
                          <option value="${escapeAttr(opt.value)}" ${String(currentFilters[field.key] || '') === String(opt.value) ? 'selected' : ''}>
                            ${escapeAttr(optionLabel(opt))}
                          </option>
                        `).join('')}
                      </select>
                      <span class="filter-select-arrow" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </span>
                    </div>
                  `;
                }

                if (field.type === 'text') {
                  return `
                    <div class="filter-select-wrapper">
                      <input type="text" id="filter-${field.key}" class="input" placeholder="${escapeAttr(fieldLabel(field))}" value="${escapeAttr(currentFilters[field.key] || '')}" />
                    </div>
                  `;
                }

                return '';
              }).join('')}
            </div>
          ` : ''}

          ${dateFields.length > 0 ? `
            <div class="filter-dates-group">
              ${dateFields.map(field => {
                if (field.type === 'date') {
                  return `
                    <label class="filter-date-wrapper">
                      <span class="filter-date-label">${escapeAttr(fieldLabel(field))}</span>
                      <input type="date" id="filter-${field.key}" class="input filter-date-input" value="${escapeAttr(currentFilters[field.key] || '')}" />
                    </label>
                  `;
                }

                if (field.type === 'date-range') {
                  const fromKey = field.fromKey || `${field.key}From`;
                  const toKey = field.toKey || `${field.key}To`;
                  return `
                    <div class="filter-date-range" role="group" aria-label="${escapeAttr(fieldLabel(field))}">
                      <span class="filter-date-label">${escapeAttr(fieldLabel(field))}</span>
                      <div class="filter-date-inputs-row">
                        <input type="date" id="filter-${fromKey}" class="input filter-date-input" value="${escapeAttr(currentFilters[fromKey] || '')}" aria-label="${escapeAttr(t('filter.date.from'))}" />
                        <span class="filter-date-separator">–</span>
                        <input type="date" id="filter-${toKey}" class="input filter-date-input" value="${escapeAttr(currentFilters[toKey] || '')}" aria-label="${escapeAttr(t('filter.date.to'))}" />
                      </div>
                    </div>
                  `;
                }

                return '';
              }).join('')}
            </div>
          ` : ''}
        </div>

        <div class="filter-actions">
          ${actionFields.map(field => `
            <button type="button" id="filter-action-${field.key}" class="btn ${field.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} ${field.key === 'ai' ? 'btn-ai' : ''}" title="${escapeAttr(t(field.labelKey) || field.label || '')}">
              ${field.icon && icons[field.icon] ? icons[field.icon] : icons.sparkles}
              <span>${escapeAttr(t(field.labelKey) || field.label || '')}</span>
            </button>
          `).join('')}
          <button id="clear-filters-btn" class="btn btn-secondary btn-clear-filters" title="${t('filter.clear')}">
            ${icons.close}
            <span>${t('filter.clear')}</span>
          </button>
        </div>
      </div>
    `;

    let debounceTimer = null;

    fields.forEach(field => {
      if (field.type === 'action') {
        const button = container.querySelector(`#filter-action-${field.key}`);
        if (button) {
          button.addEventListener('click', () => {
            if (onAction) onAction(field.key, { ...currentFilters });
          });
        }
        return;
      }

      if (field.type === 'date-range') {
        const fromKey = field.fromKey || `${field.key}From`;
        const toKey = field.toKey || `${field.key}To`;
        [fromKey, toKey].forEach(key => {
          const input = container.querySelector(`#filter-${key}`);
          if (!input) return;
          input.addEventListener('change', event => {
            currentFilters[key] = event.target.value;
            notify();
          });
        });
        return;
      }

      const el = container.querySelector(`#filter-${field.key}`);
      if (!el) return;

      if (field.type === 'text' || field.key === 'search' || field.key === 'q') {
        el.addEventListener('input', event => {
          clearTimeout(debounceTimer);
          currentFilters[field.key] = event.target.value;
          debounceTimer = setTimeout(notify, 300);
        });
        return;
      }

      el.addEventListener('change', event => {
        currentFilters[field.key] = event.target.value;
        notify();
      });
    });

    const clearBtn = container.querySelector('#clear-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        fields.forEach(field => {
          if (field.type === 'action') return;
          if (field.type === 'date-range') {
            const fromKey = field.fromKey || `${field.key}From`;
            const toKey = field.toKey || `${field.key}To`;
            currentFilters[fromKey] = '';
            currentFilters[toKey] = '';
            const fromEl = container.querySelector(`#filter-${fromKey}`);
            const toEl = container.querySelector(`#filter-${toKey}`);
            if (fromEl) fromEl.value = '';
            if (toEl) toEl.value = '';
            return;
          }
          currentFilters[field.key] = '';
          const el = container.querySelector(`#filter-${field.key}`);
          if (el) el.value = '';
        });
        notify();
      });
    }
  };

  renderFilterContent();

  return {
    setOptions(key, options = []) {
      const field = fields.find(item => item.key === key);
      if (!field) return;
      field.options = options;
      renderFilterContent();
    }
  };

  if (!container.dataset.languageChangeBound) {
    window.addEventListener('languagechange', renderFilterContent);
    container.dataset.languageChangeBound = 'true';
  }
}
