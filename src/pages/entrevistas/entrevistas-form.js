import { openModal, closeModal } from '../../components/modal.js';
import { entrevistasService } from '../../services/entrevistas-service.js';
import { vacantesService } from '../../services/vacantes-service.js';
import { postulacionesService } from '../../services/postulaciones-service.js';
import { candidatosService } from '../../services/candidatos-service.js';
import { showToast } from '../../components/toast.js';
import { t } from '../../utils/i18n.js';

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));
}

function vacancyLabel(vacancy) {
  return vacancy.title && vacancy.title !== 'Puesto no disponible'
    ? `${vacancy.title} (#${vacancy.id})`
    : `Vacante #${vacancy.id}`;
}

export async function openEntrevistaForm({ item = null, onSave }) {
  const isEdit = !!item;
  const title = isEdit ? t('entrevistas.edit') : t('entrevistas.new');
  const [vacanciesRes, applicationsRes] = await Promise.all([
    vacantesService.getAll({ cursor: 0, limit: 1000 }),
    postulacionesService.getAll({ cursor: 0, limit: 1000 })
  ]);
  const vacancies = vacanciesRes.ok ? vacanciesRes.data : [];
  const applications = applicationsRes.ok ? applicationsRes.data : [];
  const currentApplication = applications.find(application => String(application.id) === String(item?.postId));
  const selectedVacancyId = item?.vacancyId || currentApplication?.vacancyId || '';

  const bodyHTML = `
    <form id="entrevista-form">
      <div class="form-group">
        <label for="body" data-i18n="entrevistas.form.body">${t('entrevistas.form.body')}</label>
        <textarea id="body" class="textarea" rows="4" required>${item ? item.body || '' : ''}</textarea>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label for="vacancyId">${t('entrevistas.form.vacancy')}</label>
          <select id="vacancyId" class="input" required>
            <option value="">${t('entrevistas.form.selectVacancy')}</option>
            ${vacancies.map(vacancy => `<option value="${escapeHTML(vacancy.id)}"${String(vacancy.id) === String(selectedVacancyId) ? ' selected' : ''}>${escapeHTML(vacancyLabel(vacancy))}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="postId">${t('entrevistas.form.candidate')}</label>
          <select id="postId" class="input" required disabled>
            <option value="">${t('entrevistas.form.selectCandidate')}</option>
          </select>
        </div>
      </div>

      <div class="form-grid-2">
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

  const vacancySelect = overlay.querySelector('#vacancyId');
  const candidateSelect = overlay.querySelector('#postId');

  async function loadCandidates(vacancyId) {
    candidateSelect.innerHTML = `<option value="">${t('entrevistas.form.selectCandidate')}</option>`;
    candidateSelect.disabled = !vacancyId;
    if (!vacancyId) return;

    const [candidatesRes, vacancyApplications] = await Promise.all([
      candidatosService.getAll({ cursor: 0, limit: 1000, filters: { vacancyId } }),
      Promise.resolve(applications.filter(application => String(application.vacancyId) === String(vacancyId)))
    ]);
    const candidatesById = new Map((candidatesRes.ok ? candidatesRes.data : []).map(candidate => [String(candidate.id), candidate]));

    vacancyApplications.forEach(application => {
      const candidate = candidatesById.get(String(application.userId));
      if (!candidate) return;
      const option = document.createElement('option');
      option.value = application.id;
      option.textContent = `${candidate.fullName || candidate.username} (#${candidate.id})`;
      option.selected = String(application.id) === String(item?.postId);
      candidateSelect.appendChild(option);
    });
    candidateSelect.disabled = candidateSelect.options.length === 1;
  }

  vacancySelect.addEventListener('change', () => loadCandidates(vacancySelect.value));
  await loadCandidates(selectedVacancyId);

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
