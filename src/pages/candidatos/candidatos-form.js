import { openModal, closeModal } from '../../components/modal.js';
import { candidatosService } from '../../services/candidatos-service.js';
import { showToast } from '../../components/toast.js';
import { t } from '../../utils/i18n.js';

export function openCandidatoForm({ item = null, onSave }) {
  const isEdit = !!item;
  const title = isEdit ? t('candidatos.edit') : t('candidatos.new');
  const companyValue = typeof item?.company === 'string' ? item.company : item?.company?.name || '';
  const initialPhotoLetters = `${item?.firstName?.[0] || ''}${item?.lastName?.[0] || ''}`.toUpperCase() || '?';
  const initialPhotoPreview = item?.image
    ? `<img src="${item.image}" alt="${t('candidatos.form.photo.alt_current')}">`
    : `<span class="candidate-photo-initials">${initialPhotoLetters}</span>`;

  const bodyHTML = `
    <form id="candidato-form" autocomplete="on">
      <div class="candidate-photo-field">
        <div class="candidate-photo-preview" aria-live="polite">
          ${initialPhotoPreview}
        </div>
        <div class="candidate-photo-controls">
          <div class="form-group">
            <label for="candidate-image" data-i18n="candidatos.form.photo">${t('candidatos.form.photo')}</label>
            <input type="file" id="candidate-image" class="input" accept="image/*" capture="user">
            <small data-i18n="candidatos.form.photo.desc">${t('candidatos.form.photo.desc')}</small>
          </div>
          <button type="button" class="btn btn-secondary candidate-camera-btn">${t('candidatos.form.photo.take')}</button>
        </div>
      </div>
      <div class="candidate-camera-view" hidden>
        <video class="candidate-camera-video" autoplay playsinline></video>
        <div class="candidate-camera-actions">
          <button type="button" class="btn btn-primary candidate-capture-btn">${t('candidatos.form.photo.capture')}</button>
          <button type="button" class="btn btn-secondary candidate-camera-close-btn">${t('candidatos.form.photo.close')}</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
        <div class="form-group">
          <label for="firstName" data-i18n="candidatos.form.name">${t('candidatos.form.name')}</label>
          <input type="text" id="firstName" class="input" autocomplete="given-name" value="${item ? item.firstName || '' : ''}" required />
        </div>
        <div class="form-group">
          <label for="lastName" data-i18n="candidatos.form.lastname">${t('candidatos.form.lastname')}</label>
          <input type="text" id="lastName" class="input" autocomplete="family-name" value="${item ? item.lastName || '' : ''}" required />
        </div>
      </div>

      <div class="form-group">
        <label for="email" data-i18n="candidatos.form.email">${t('candidatos.form.email')}</label>
        <input type="email" id="email" class="input" autocomplete="email" value="${item ? item.email || '' : ''}" required />
      </div>

      <div class="form-group">
        <label for="phone" data-i18n="candidatos.form.phone">${t('candidatos.form.phone')}</label>
        <input type="tel" id="phone" class="input" autocomplete="tel" value="${item ? item.phone || '' : ''}" />
      </div>

      <div class="form-group">
        <label for="company" data-i18n="candidatos.form.company">${t('candidatos.form.company')}</label>
        <input type="text" id="company" class="input" autocomplete="organization" value="${companyValue}" />
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
  const firstNameInput = overlay.querySelector('#firstName');
  const lastNameInput = overlay.querySelector('#lastName');
  const imageInput = overlay.querySelector('#candidate-image');
  const imagePreview = overlay.querySelector('.candidate-photo-preview');
  const cameraView = overlay.querySelector('.candidate-camera-view');
  const cameraVideo = overlay.querySelector('.candidate-camera-video');
  let imageValue = item?.image || '';
  let cameraStream = null;

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(track => track.stop());
    cameraStream = null;
    if (cameraView) cameraView.hidden = true;
    if (cameraVideo) cameraVideo.srcObject = null;
  };

  const closeButton = overlay.querySelector('.modal-close-btn');
  closeButton?.addEventListener('click', stopCamera);
  overlay.querySelector('.candidate-camera-close-btn')?.addEventListener('click', stopCamera);
  overlay.addEventListener('click', event => {
    if (event.target === overlay) stopCamera();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') stopCamera();
  }, { once: true });

  const updatePhotoPreview = () => {
    if (imageValue) return;
    const initials = `${firstNameInput.value.trim()[0] || ''}${lastNameInput.value.trim()[0] || ''}`.toUpperCase() || '?';
    imagePreview.innerHTML = `<span class="candidate-photo-initials">${initials}</span>`;
  };

  [firstNameInput, lastNameInput].forEach(input => input?.addEventListener('input', updatePhotoPreview));

  if (imageInput && imagePreview) {
    imageInput.addEventListener('change', () => {
      const file = imageInput.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        imageValue = reader.result;
        imagePreview.innerHTML = `<img src="${imageValue}" alt="${t('candidatos.form.photo.alt_selected')}">`;
      });
      reader.readAsDataURL(file);
    });
  }

  const cameraBtn = overlay.querySelector('.candidate-camera-btn');
  if (cameraBtn && imageInput) {
    cameraBtn.addEventListener('click', async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        imageInput.click();
        return;
      }

      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        cameraVideo.srcObject = cameraStream;
        cameraView.hidden = false;
      } catch (error) {
        showToast(t('candidatos.js.cameraError'), 'error');
      }
    });
  }

  overlay.querySelector('.candidate-capture-btn')?.addEventListener('click', () => {
    if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) return;
    const canvas = document.createElement('canvas');
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    canvas.getContext('2d').drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    imageValue = canvas.toDataURL('image/jpeg', 0.88);
    imagePreview.innerHTML = `<img src="${imageValue}" alt="${t('candidatos.form.photo.alt_taken')}">`;
    imageInput.value = '';
    stopCamera();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      ...(item || {}),
      firstName: overlay.querySelector('#firstName').value.trim(),
      lastName: overlay.querySelector('#lastName').value.trim(),
      email: overlay.querySelector('#email').value.trim(),
      phone: overlay.querySelector('#phone').value.trim(),
      company: { name: overlay.querySelector('#company').value.trim() },
      image: imageValue
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
      stopCamera();
      closeModal();
      if (onSave) onSave();
    } else {
      showToast(res.message || t('toast.error'), 'error');
    }
  });
}
