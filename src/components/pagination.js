import { t } from '../utils/i18n.js';
import { icons } from '../assets/icons/icons.js';

export function renderPagination({
  container,
  skip = 0,
  limit = 10,
  total = 0,
  onCursorChange
}) {
  if (!container) return;

  const renderContent = () => {
    const from = total > 0 ? skip + 1 : 0;
    const to = Math.min(skip + limit, total);
    const hasPrev = skip > 0;
    const hasNext = skip + limit < total;

    const html = `
      <div class="pagination-bar">
        <div class="pagination-info">
          ${t('pagination.showing', { from, to, total })}
        </div>
        <div class="pagination-controls">
          <button id="prev-btn" class="btn btn-secondary" ${!hasPrev ? 'disabled' : ''}>
            ${icons.chevronLeft}
            <span>${t('pagination.prev')}</span>
          </button>
          <button id="next-btn" class="btn btn-secondary" ${!hasNext ? 'disabled' : ''}>
            <span>${t('pagination.next')}</span>
            ${icons.chevronRight}
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    const prevBtn = container.querySelector('#prev-btn');
    const nextBtn = container.querySelector('#next-btn');

    if (prevBtn && hasPrev) {
      prevBtn.addEventListener('click', () => {
        const prevCursor = Math.max(0, skip - limit);
        onCursorChange(prevCursor);
      });
    }

    if (nextBtn && hasNext) {
      nextBtn.addEventListener('click', () => {
        const nextCursor = skip + limit;
        onCursorChange(nextCursor);
      });
    }
  };

  renderContent();

  if (!container.dataset.languageChangeBound) {
    window.addEventListener('languagechange', renderContent);
    container.dataset.languageChangeBound = 'true';
  }
}
