import { openModal, closeModal } from '../../components/modal.js';
import { tareasService } from '../../services/tareas-service.js';
import { showToast } from '../../components/toast.js';
import { t } from '../../utils/i18n.js';

export function openTareaForm({ item = null, onSave }) {
  const isEdit = !!item;
  const title = isEdit ? t('tareas.edit') : t('tareas.new');

  const bodyHTML = `
    <form id="tarea-form">
      <div class="form-group">
        <label for="todo" data-i18n="tareas.form.todo">${t('tareas.form.todo')}</label>
        <input type="text" id="todo" class="input" value="${item ? item.todo || '' : ''}" required />
      </div>

      <div class="form-group">
        <label for="completed" data-i18n="tareas.form.completed">${t('tareas.form.completed')}</label>
        <select id="completed" class="select">
          <option value="false" ${item && !item.completed ? 'selected' : ''}>${t('tareas.form.pending')}</option>
          <option value="true" ${item && item.completed ? 'selected' : ''}>${t('tareas.form.done')}</option>
        </select>
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary cancel-modal-btn">${t('modal.cancel')}</button>
    <button type="submit" form="tarea-form" class="btn btn-primary">${t('modal.save')}</button>
  `;

  const overlay = openModal({ title, bodyHTML, footerHTML });
  overlay.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);

  const form = overlay.querySelector('#tarea-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      todo: overlay.querySelector('#todo').value.trim(),
      completed: overlay.querySelector('#completed').value === 'true',
      userId: item ? item.userId : 1
    };

    let res;
    if (isEdit) {
      // PATCH (único método de actualización soportado en /todos según tabla)
      res = await tareasService.patch(item.id, payload);
    } else {
      res = await tareasService.create(payload);
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
