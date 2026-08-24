import { openModal, closeModal } from '../../components/modal.js';
import { candidatosService } from '../../services/candidatos-service.js';
import { showToast } from '../../components/toast.js';
import { t } from '../../utils/i18n.js';

export function openCandidatoForm({ item = null, onSave }) {
  const isEdit = !!item;
  const title = isEdit ? t('candidatos.edit') : t('candidatos.new');
  const companyValue = typeof item?.company === 'string' ? item.company : item?.company?.name || '';

  const bodyHTML = `
    <form id="candidato-form">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
        <div class="form-group">
          <label for="firstName" data-i18n="candidatos.form.name">Nombre</label>
          <input type="text" id="firstName" class="input" value="${item ? item.firstName || '' : ''}" required />
        </div>
        <div class="form-group">
          <label for="lastName" data-i18n="candidatos.form.lastname">Apellido</label>
          <input type="text" id="lastName" class="input" value="${item ? item.lastName || '' : ''}" required />
        </div>
      </div>

      <div class="form-group">
        <label for="email" data-i18n="candidatos.form.email">Correo Electrónico</label>
        <input type="email" id="email" class="input" value="${item ? item.email || '' : ''}" required />
      </div>

      <div class="form-group">
        <label for="phone" data-i18n="candidatos.form.phone">Teléfono</label>
        <input type="text" id="phone" class="input" value="${item ? item.phone || '' : ''}" />
      </div>

      <div class="form-group">
        <label for="company" data-i18n="candidatos.form.company">Empresa Actual</label>
        <input type="text" id="company" class="input" value="${companyValue}" />
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary cancel-modal-btn">${t('modal.cancel')}</button>
    <button type="submit" form="candidato-form" class="btn btn-primary">${t('modal.save')}</button>
  `;

  const overlay = openModal({ title, bodyHTML, footerHTML });

  const cancelBtn = overlay.querySelector('.cancel-modal-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }

  const form = overlay.querySelector('#candidato-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      ...(item || {}),
      firstName: overlay.querySelector('#firstName').value.trim(),
      lastName: overlay.querySelector('#lastName').value.trim(),
      email: overlay.querySelector('#email').value.trim(),
      phone: overlay.querySelector('#phone').value.trim(),
      company: { name: overlay.querySelector('#company').value.trim() }
    };

    let res;
    if (isEdit) {
      // Usar PUT o PATCH según requerimiento
      res = await candidatosService.update(item.id, payload);
    } else {
      res = await candidatosService.create(payload);
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
