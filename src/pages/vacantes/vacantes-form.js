import { openModal, closeModal } from '../../components/modal.js';
import { vacantesService } from '../../services/vacantes-service.js';
import { showToast } from '../../components/toast.js';
import { t } from '../../utils/i18n.js';

export function openVacanteForm({ item = null, onSave }) {
  const isEdit = !!item;
  const title = isEdit ? t('vacantes.edit') : t('vacantes.new');

  const bodyHTML = `
    <form id="vacante-form">
      <div class="form-group">
        <label for="title" data-i18n="vacantes.form.title">Título del Puesto</label>
        <input type="text" id="title" class="input" value="${item ? item.title || '' : ''}" required />
      </div>

      <div class="form-group">
        <label for="category" data-i18n="vacantes.form.category">Categoría / Área</label>
        <input type="text" id="category" class="input" value="${item ? item.category || '' : ''}" required />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
        <div class="form-group">
          <label for="price" data-i18n="vacantes.form.price">Rango Salarial ($)</label>
          <input type="number" id="price" class="input" value="${item ? item.price || '' : ''}" step="100" required />
        </div>
        <div class="form-group">
          <label for="stock" data-i18n="vacantes.form.stock">Plazas Disponibles</label>
          <input type="number" id="stock" class="input" value="${item ? item.stock || '1' : '1'}" min="1" required />
        </div>
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary cancel-modal-btn">${t('modal.cancel')}</button>
    <button type="submit" form="vacante-form" class="btn btn-primary">${t('modal.save')}</button>
  `;

  const overlay = openModal({ title, bodyHTML, footerHTML });

  overlay.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);

  const form = overlay.querySelector('#vacante-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      ...(item || {}),
      title: overlay.querySelector('#title').value.trim(),
      category: overlay.querySelector('#category').value.trim(),
      price: parseFloat(overlay.querySelector('#price').value),
      stock: parseInt(overlay.querySelector('#stock').value, 10)
    };

    let res;
    if (isEdit) {
      res = await vacantesService.update(item.id, payload);
    } else {
      res = await vacantesService.create(payload);
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
