import { openModal, closeModal } from '../../components/modal.js';
import { empresasService } from '../../services/empresas-service.js';
import { showToast } from '../../components/toast.js';
import { t } from '../../utils/i18n.js';

export function openEmpresaForm({ item = null, onSave }) {
  const isEdit = !!item;
  const title = isEdit ? t('empresas.edit') : t('empresas.new');

  const bodyHTML = `
    <form id="empresa-form">
      <div class="form-group">
        <label for="userId" data-i18n="empresas.form.userid">${t('empresas.form.userid')}</label>
        <input type="number" id="userId" class="input" value="${item ? item.userId || '1' : '1'}" required />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
        <div class="form-group">
          <label for="total" data-i18n="empresas.form.total">${t('empresas.form.total')}</label>
          <input type="number" id="total" class="input" value="${item ? item.total || '5000' : '5000'}" step="100" required />
        </div>
        <div class="form-group">
          <label for="totalProducts" data-i18n="empresas.form.quantity">${t('empresas.form.quantity')}</label>
          <input type="number" id="totalProducts" class="input" value="${item ? item.totalProducts || '3' : '3'}" min="1" required />
        </div>
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary cancel-modal-btn">${t('modal.cancel')}</button>
    <button type="submit" form="empresa-form" class="btn btn-primary">${t('modal.save')}</button>
  `;

  const overlay = openModal({ title, bodyHTML, footerHTML });
  overlay.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);

  const form = overlay.querySelector('#empresa-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      userId: parseInt(overlay.querySelector('#userId').value, 10),
      total: parseFloat(overlay.querySelector('#total').value),
      totalProducts: parseInt(overlay.querySelector('#totalProducts').value, 10),
      products: item ? item.products : [{ id: 1, quantity: 1 }]
    };

    let res;
    if (isEdit) {
      // Reemplazo total PUT (único verbo soportado por /carts según la tabla)
      res = await empresasService.update(item.id, payload);
    } else {
      res = await empresasService.create(payload);
    }

    if (res.ok) {
      showToast(isEdit ? t('toast.update.success') : t('toast.create.success'), 'success');
      closeModal();
      if (onSave) onSave();
    } else {
      showToast(res.message || t('toast.error'), 'error');
    }
  });
}
