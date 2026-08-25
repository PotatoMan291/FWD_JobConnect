import { openModal, closeModal } from '../../components/modal.js';
import { entrevistasService } from '../../services/entrevistas-service.js';
import { showToast } from '../../components/toast.js';
import { t } from '../../utils/i18n.js';

export function openEntrevistaForm({ item = null, onSave }) {
  const isEdit = !!item;
  const title = isEdit ? t('entrevistas.edit') : t('entrevistas.new');

  const bodyHTML = `
    <form id="entrevista-form">
      <div class="form-group">
        <label for="body" data-i18n="entrevistas.form.body">${t('entrevistas.form.body')}</label>
        <textarea id="body" class="textarea" rows="4" required>${item ? item.body || '' : ''}</textarea>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label for="postId" data-i18n="entrevistas.form.postid">${t('entrevistas.form.postid')}</label>
          <input type="number" id="postId" class="input" value="${item ? item.postId || '1' : '1'}" required />
        </div>
        <div class="form-group">
          <label for="userId" data-i18n="entrevistas.form.userid">${t('entrevistas.form.userid')}</label>
          <input type="number" id="userId" class="input" value="${item && item.user ? item.user.id || '1' : '1'}" required />
        </div>
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary cancel-modal-btn">${t('modal.cancel')}</button>
    <button type="submit" form="entrevista-form" class="btn btn-primary">${t('modal.save')}</button>
  `;

  const overlay = openModal({ title, bodyHTML, footerHTML });
  overlay.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);

  const form = overlay.querySelector('#entrevista-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      body: overlay.querySelector('#body').value.trim(),
      postId: parseInt(overlay.querySelector('#postId').value, 10),
      userId: parseInt(overlay.querySelector('#userId').value, 10)
    };

    let res;
    if (isEdit) {
      // PATCH (único método de actualización soportado en /comments según tabla)
      res = await entrevistasService.patch(item.id, payload);
    } else {
      res = await entrevistasService.create(payload);
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
