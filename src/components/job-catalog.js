import { icons } from '../assets/icons/icons.js';
import { openModal, closeModal } from './modal.js';
import { vacantesService, normalizeJob } from '../services/vacantes-service.js';
import { postulacionesService } from '../services/postulaciones-service.js';
import { authService } from '../services/auth-service.js';
import { showToast } from './toast.js';
import { storage } from '../utils/storage.js';
import { formatDate } from '../utils/format.js';
import { getLanguage, t } from '../utils/i18n.js';

const FALLBACK_IMAGE = '/public/favicon.svg';
const SAVED_JOBS_KEY = 'saved_job_ids';
const jobsCache = new Map();

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'JC';
}

function companyLogoMarkup(job) {
  const logoUrl = job.companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.companyName)}&background=1f5c4f&color=ffffff&size=128&bold=true`;
  return `<img class="job-card-logo-image" src="${escapeHTML(logoUrl)}" alt="Logo de ${escapeHTML(job.companyName)}" data-fallback-src="${FALLBACK_IMAGE}">`;
}

function savedJobIds() {
  const ids = storage.get(SAVED_JOBS_KEY, []);
  return Array.isArray(ids) ? ids.map(String) : [];
}

function isSaved(job) {
  return job.saved || savedJobIds().includes(String(job.id));
}

function listMarkup(items, emptyMessage) {
  return items.length
    ? `<ul class="job-details-list">${items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`
    : `<p class="job-details-empty">${escapeHTML(emptyMessage)}</p>`;
}

export function formatSalary(job) {
  const min = Number(job.salaryMin);
  const max = Number(job.salaryMax);
  const currency = job.currency || 'USD';
  const period = job.salaryPeriod || t('job.salary.per_month');

  if (!Number.isFinite(min) && !Number.isFinite(max)) return t('job.salary.tbd');

  try {
    const locale = { es: 'es-CR', en: 'en-US', zh: 'zh-CN' }[getLanguage()] || 'es-CR';
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    });
    if (Number.isFinite(min) && Number.isFinite(max) && min !== max) {
      return `${formatter.format(Math.min(min, max))} – ${formatter.format(Math.max(min, max))} ${period}`;
    }
    return `${formatter.format(Number.isFinite(min) ? min : max)} ${period}`;
  } catch {
    return t('job.salary.tbd');
  }
}

export function renderJobCard(rawJob, { showManageActions = false, selected = false } = {}) {
  const job = normalizeJob(rawJob);
  jobsCache.set(String(job.id), job);
  const saved = isSaved(job);
  const currentUser = authService.getCurrentUser();
  const isOwner = currentUser?.role === 'recruiter' && String(job.createdBy) === String(currentUser.id);
  const imageSrc = job.companyImage || FALLBACK_IMAGE;
  const logo = companyLogoMarkup(job);

  return `
    <article class="job-card ${selected ? 'job-card-selected' : ''}" tabindex="0" data-job-id="${escapeHTML(job.id)}" aria-label="Seleccionar ${escapeHTML(job.title)} en ${escapeHTML(job.companyName)}">
      <div class="job-card-media">
        <img class="job-card-image" src="${escapeHTML(imageSrc)}" alt="${t('job.company.representation', { company: escapeHTML(job.companyName) })}" loading="lazy" data-fallback-src="${FALLBACK_IMAGE}">
        <div class="job-card-media-overlay"></div>
        ${job.featured ? `<span class="job-card-featured">${t('job.featured')}</span>` : ''}
        <button class="btn btn-icon job-card-save" type="button" data-save-job="${escapeHTML(job.id)}" aria-pressed="${saved}" aria-label="${saved ? t('job.unsave') : t('job.save')}">${icons.bookmark}</button>
        <div class="job-card-logo">${logo}</div>
      </div>
      <div class="job-card-content">
        <div class="job-card-heading">
          <p class="job-card-company">${escapeHTML(job.companyName)}</p>
          <h3>${escapeHTML(job.title)}</h3>
        </div>
        <div class="job-card-meta" aria-label="Información de la oferta">
          <span>${escapeHTML(job.location)}</span><span>${escapeHTML(job.modality)}</span><span>${escapeHTML(job.contractType)}</span>
        </div>
        <p class="job-card-category">${escapeHTML(job.category)} · ${escapeHTML(job.experienceLevel)}</p>
        <p class="job-card-salary">${escapeHTML(formatSalary(job))}</p>
        <p class="job-card-description">${escapeHTML(job.shortDescription)}</p>
        ${job.skills.length ? `<div class="job-card-skills">${job.skills.slice(0, 5).map(skill => `<span class="badge badge-active">${escapeHTML(skill)}</span>`).join('')}</div>` : `<p class="job-card-skills-empty">${t('job.skills.tbd')}</p>`}
        <p class="job-card-date">${t('job.published_at')}: ${escapeHTML(formatDate(job.publishedAt))}</p>
        <div class="job-card-actions">
          <button class="btn btn-secondary" type="button" data-details-job="${escapeHTML(job.id)}">${t('job.details')}</button>
          ${isOwner ? '<button class="btn btn-secondary" type="button" disabled>No puedes aplicar</button>' : `<button class="btn btn-primary" type="button" data-apply-job="${escapeHTML(job.id)}">Aplicar ahora</button>`}
        </div>
        ${showManageActions ? `<div class="job-card-manage-actions"><button class="job-card-text-action" type="button" data-edit-job="${escapeHTML(job.id)}">${t('job.edit')}</button><button class="job-card-text-action job-card-delete-action" type="button" data-delete-job="${escapeHTML(job.id)}">${t('job.delete')}</button></div>` : ''}
      </div>
    </article>`;
}

function renderState(container, type, message, onRetry) {
  container.innerHTML = `<div class="job-catalog-state" role="${type === 'error' ? 'alert' : 'status'}"><h3>${type === 'error' ? t('job.error.load') : t('job.empty')}</h3><p>${escapeHTML(message)}</p>${onRetry ? `<button type="button" class="btn btn-secondary job-catalog-retry">${t('job.retry')}</button>` : ''}</div>`;
  container.querySelector('.job-catalog-retry')?.addEventListener('click', onRetry);
}

function bindCatalogEvents(container, { onEdit = null, onDelete = null, onSelect = null } = {}) {
  container.querySelectorAll('.job-card-image, .job-card-logo-image').forEach(image => {
    image.addEventListener('error', () => {
      const fallback = image.dataset.fallbackSrc;
      if (image.src.endsWith(fallback)) image.hidden = true;
      else image.src = fallback;
    }, { once: true });
  });

  container.querySelectorAll('[data-save-job]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const saved = toggleSavedJob(button.dataset.saveJob);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', saved ? t('job.unsave') : t('job.save'));
      button.classList.toggle('job-card-save-active', saved);
    });
  });

  container.querySelectorAll('[data-details-job]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      openJobDetails(button.dataset.detailsJob);
    });
  });

  container.querySelectorAll('[data-apply-job]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      applyToJob(button.dataset.applyJob);
    });
  });

  container.querySelectorAll('[data-edit-job]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const job = jobsCache.get(String(button.dataset.editJob));
      if (job && onEdit) onEdit(job);
    });
  });

  container.querySelectorAll('[data-delete-job]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const job = jobsCache.get(String(button.dataset.deleteJob));
      if (job && onDelete) onDelete(job);
    });
  });

  container.querySelectorAll('.job-card').forEach(card => {
    const showDetails = () => openJobDetails(card.dataset.jobId);
    card.addEventListener('click', event => {
      if (!event.target.closest('button, a')) {
        if (onSelect) onSelect(card.dataset.jobId);
        else showDetails();
      }
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (onSelect) onSelect(card.dataset.jobId);
        else showDetails();
      }
    });
  });
}

export function renderJobCatalog({ container, jobs = [], isLoading = false, error = null, onRetry = null, onEdit = null, onDelete = null, onSelect = null, selectedJobId = null, emptyMessage = t('job.empty.filters') }) {
  if (!container) return;
  if (isLoading) {
    container.innerHTML = `<div class="job-catalog job-catalog-loading" aria-live="polite">${Array.from({ length: 4 }, () => '<div class="job-card-skeleton"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div>').join('')}</div>`;
    return;
  }
  if (error) {
    renderState(container, 'error', error, onRetry);
    return;
  }
  if (!jobs.length) {
    renderState(container, 'empty', emptyMessage);
    return;
  }
  container.innerHTML = `<div class="job-catalog">${jobs.map(job => renderJobCard(job, { showManageActions: Boolean(onEdit || onDelete), selected: String(job.id) === String(selectedJobId) })).join('')}</div>`;
  bindCatalogEvents(container, { onEdit, onDelete, onSelect });
}

export async function openJobDetails(jobId) {
  const cachedJob = jobsCache.get(String(jobId));
  const overlay = openModal({
    title: t('job.details.title'),
    bodyHTML: '<div class="job-details-loading" aria-live="polite"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div>'
  });
  overlay.querySelector('.modal-container').classList.add('job-details-modal');
  const body = overlay.querySelector('.modal-body');
  const currentUser = authService.getCurrentUser();

  const renderDetails = job => {
    const isOwner = currentUser?.role === 'recruiter' && String(job.createdBy) === String(currentUser.id);
    body.innerHTML = `
      <div class="job-details-tabs" role="tablist" aria-label="Información de la vacante">
        <button type="button" class="job-details-tab is-active" role="tab" aria-selected="true" data-job-tab="summary">Vacante</button>
        <button type="button" class="job-details-tab" role="tab" aria-selected="false" data-job-tab="details">Detalle</button>
      </div>
      <section class="job-details-panel is-active" data-job-panel="summary" role="tabpanel">
        <div class="job-details-header"><div class="job-card-logo">${companyLogoMarkup(job)}</div><div><p class="job-card-company">${escapeHTML(job.companyName)}</p><h3>${escapeHTML(job.title)}</h3><p class="job-card-salary">${escapeHTML(formatSalary(job))}</p></div></div>
        <div class="job-details-meta"><span>${escapeHTML(job.location)}</span><span>${escapeHTML(job.modality)}</span><span>${escapeHTML(job.contractType)}</span><span>Cierre: ${escapeHTML(formatDate(job.closingDate))}</span></div>
        <section><h4>Resumen</h4><p>${escapeHTML(job.shortDescription)}</p></section>
        <section><h4>Categoría</h4><p>${escapeHTML(job.category)} · ${escapeHTML(job.experienceLevel)}</p></section>
      </section>
      <section class="job-details-panel" data-job-panel="details" role="tabpanel" hidden>
        <section><h4>Descripción</h4><p>${escapeHTML(job.description)}</p></section>
        <section><h4>Responsabilidades</h4>${listMarkup(job.responsibilities, 'Responsabilidades no disponibles.')}</section>
        <section><h4>Requisitos</h4>${listMarkup(job.requirements, 'Requisitos no disponibles.')}</section>
        <section><h4>Beneficios</h4>${listMarkup(job.benefits, 'Beneficios no disponibles.')}</section>
        <section><h4>Información de la empresa</h4><p>${escapeHTML(job.companyDescription || 'Información de la empresa no disponible.')}</p></section>
      </section>
      <div class="job-details-footer"><button class="btn btn-secondary job-details-close">Cerrar</button>${isOwner ? '<button class="btn btn-secondary" disabled>No puedes aplicar a tu propia vacante</button>' : '<button class="btn btn-primary job-details-apply">Aplicar ahora</button>'}</div>`;
    body.querySelector('.job-details-close').addEventListener('click', closeModal);
    body.querySelector('.job-details-apply')?.addEventListener('click', () => applyToJob(job.id));
    body.querySelectorAll('[data-job-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        body.querySelectorAll('[data-job-tab]').forEach(item => {
          const active = item === tab;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', String(active));
        });
        body.querySelectorAll('[data-job-panel]').forEach(panel => {
          panel.hidden = panel.dataset.jobPanel !== tab.dataset.jobTab;
          panel.classList.toggle('is-active', !panel.hidden);
        });
      });
    });
  };

  if (cachedJob) renderDetails(cachedJob);
  const response = await vacantesService.getById(jobId);
  if (response.ok && response.data) {
    renderDetails(normalizeJob(response.data));
    return;
  }
  if (!cachedJob) {
    body.innerHTML = `<div class="job-catalog-state" role="alert"><h3>${t('job.error.load_single')}</h3><p>${escapeHTML(response.message || t('job.error.retry'))}</p><button class="btn btn-secondary job-details-retry">${t('job.retry')}</button></div>`;
    body.querySelector('.job-details-retry').addEventListener('click', () => openJobDetails(jobId));
  }
}

export async function applyToJob(jobId) {
  const cachedJob = jobsCache.get(String(jobId));
  let job = cachedJob;
  if (!job) {
    const res = await vacantesService.getById(jobId);
    if (res && res.ok && res.data) job = normalizeJob(res.data);
  }

  const titleStr = job ? job.title : `Vacante #${jobId}`;
  const companyStr = job ? job.companyName : t('job.company.default');
  const user = authService.getCurrentUser() || { firstName: t('job.applicant.default') };

  if (job?.createdBy && user.role === 'recruiter' && String(job.createdBy) === String(user.id)) {
    showToast('No puedes aplicar a una vacante que tú publicaste.', 'error');
    return;
  }

  showToast(t('job.apply.progress'), 'info');

  const createRes = await postulacionesService.create({
    title: `${t('job.apply.title_prefix')} ${titleStr}`,
    body: `${t('job.apply.body', { user: (user.firstName || user.username || t('job.applicant.default')) + ' ' + (user.lastName || ''), role: titleStr, company: companyStr })}`,
    userId: user.id || 1,
    vacancyId: Number(jobId) || jobId
  });

  if (createRes && createRes.ok) {
    showToast(t('job.apply.success'), 'success');
    setTimeout(() => {
      window.location.assign('/src/pages/postulaciones/postulaciones.html');
    }, 600);
  } else {
    showToast((createRes && createRes.message) || t('job.apply.error'), 'error');
  }
}

export function toggleSavedJob(jobId) {
  const ids = savedJobIds();
  const id = String(jobId);
  const index = ids.indexOf(id);
  if (index >= 0) {
    ids.splice(index, 1);
    storage.set(SAVED_JOBS_KEY, ids);
    return false;
  }
  ids.push(id);
  storage.set(SAVED_JOBS_KEY, ids);
  return true;
}
