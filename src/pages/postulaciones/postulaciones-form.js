import { openModal, closeModal } from '../../components/modal.js';
import { postulacionesService } from '../../services/postulaciones-service.js';
import { showToast } from '../../components/toast.js';
import { t } from '../../utils/i18n.js';

export function openPostulacionForm({ item = null, onSave }) {
  const isEdit = !!item;
  const title = isEdit ? t('postulaciones.edit') : t('postulaciones.new');

  const bodyHTML = `
    <form id="postulacion-form">
      <div class="form-group">
        <label for="title" data-i18n="postulaciones.form.title">${t('postulaciones.form.title')}</label>
        <input type="text" id="title" class="input" value="${item ? item.title || '' : ''}" required />
      </div>

      <div class="form-group">
        <label for="body" data-i18n="postulaciones.form.body">${t('postulaciones.form.body')}</label>
        <textarea id="body" class="textarea" rows="4" required>${item ? item.body || '' : ''}</textarea>
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary cancel-modal-btn">${t('modal.cancel')}</button>
    <button type="submit" form="postulacion-form" class="btn btn-primary">${t('modal.save')}</button>
  `;

  const overlay = openModal({ title, bodyHTML, footerHTML });
  overlay.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);

  const form = overlay.querySelector('#postulacion-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      title: overlay.querySelector('#title').value.trim(),
      body: overlay.querySelector('#body').value.trim(),
      userId: item ? item.userId : 1
    };

    let res;
    if (isEdit) {
      // PATCH (único método de actualización soportado en /posts según tabla)
      res = await postulacionesService.patch(item.id, payload);
    } else {
      res = await postulacionesService.create(payload);
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
