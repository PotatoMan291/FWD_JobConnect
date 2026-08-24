import { candidatosService, normalizeCandidate } from '../services/candidatos-service.js';
import { icons } from '../assets/icons/icons.js';

let activeOverlay = null;
let focusOrigin = null;
let requestVersion = 0;

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function isSafeUrl(url, allowedHosts = []) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && (allowedHosts.length === 0 || allowedHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)));
  } catch {
    return false;
  }
}

function statusClass(status) {
  return {
    'Nuevo': 'badge-neutral',
    'En revisión': 'badge-warning',
    'Entrevista': 'badge-pending',
    'Seleccionado': 'badge-success',
    'Rechazado': 'badge-error'
  }[status] || 'badge-neutral';
}

function avatarMarkup(candidate) {
  const initials = candidate.fullName.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';
  if (isSafeUrl(candidate.image)) {
    return `<img class="candidate-profile-avatar" src="${escapeHTML(candidate.image)}" alt="Foto de ${escapeHTML(candidate.fullName)}">`;
  }
  return `<div class="candidate-profile-avatar candidate-profile-initials" aria-hidden="true">${escapeHTML(initials)}</div>`;
}

function infoItem(label, value, extraClass = '') {
  return `<div class="candidate-profile-info ${extraClass}"><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value || 'No disponible')}</dd></div>`;
}

function listMarkup(items, renderer, emptyText) {
  if (!items.length) return `<p class="candidate-profile-empty">${escapeHTML(emptyText)}</p>`;
  return `<div class="candidate-profile-timeline">${items.map(renderer).join('')}</div>`;
}

function profileMarkup(candidate) {
  const hasEmail = candidate.email !== 'No disponible';
  const hasPhone = candidate.phone !== 'No disponible';
  const hasLinkedIn = isSafeUrl(candidate.linkedinUrl, ['linkedin.com']);
  const hasPortfolio = isSafeUrl(candidate.portfolioUrl);
  const hasCv = isSafeUrl(candidate.cvUrl);

  const experience = listMarkup(candidate.experience, item => `
    <article class="candidate-profile-timeline-item">
      <h4>${escapeHTML(item.title || item.position || 'Experiencia profesional')}</h4>
      <p class="candidate-profile-muted">${escapeHTML(item.company || 'No disponible')} · ${escapeHTML(item.startDate || item.start || 'No disponible')} — ${escapeHTML(item.endDate || item.end || 'Actualidad')}</p>
      ${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}
      ${item.achievements ? `<p><strong>Logros:</strong> ${escapeHTML(Array.isArray(item.achievements) ? item.achievements.join(', ') : item.achievements)}</p>` : ''}
    </article>`, 'No hay experiencia profesional registrada.');

  const education = listMarkup(candidate.education, item => `
    <article class="candidate-profile-timeline-item">
      <h4>${escapeHTML(item.institution || 'Institución no disponible')}</h4>
      <p>${escapeHTML(item.degree || item.title || 'Título no disponible')}${item.specialty ? ` · ${escapeHTML(item.specialty)}` : ''}</p>
      <p class="candidate-profile-muted">${escapeHTML(item.period || `${item.startDate || item.start || 'No disponible'} — ${item.endDate || item.end || 'No disponible'}`)}</p>
    </article>`, 'No hay formación académica registrada.');

  return `
    <div class="candidate-profile-content">
      <section class="candidate-profile-hero">
        ${avatarMarkup(candidate)}
        <div class="candidate-profile-heading">
          <span class="mono candidate-profile-code">${escapeHTML(candidate.candidateCode)}</span>
          <h2 id="candidate-profile-title">${escapeHTML(candidate.fullName)}</h2>
          <p>${escapeHTML(candidate.professionalTitle)} · ${escapeHTML(candidate.company)}</p>
          <p class="candidate-profile-muted">${escapeHTML(candidate.location)}</p>
        </div>
        <span class="badge ${statusClass(candidate.recruitmentStatus)}">${escapeHTML(candidate.recruitmentStatus)}</span>
      </section>

      <section class="candidate-profile-section">
        <h3>Presentación profesional</h3>
        <h4>Acerca de mí</h4>
        <p>${escapeHTML(candidate.about)}</p>
        <h4>Carta de presentación</h4>
        <p>${escapeHTML(candidate.coverLetter)}</p>
        <dl class="candidate-profile-info-grid">
          ${infoItem('Experiencia', candidate.yearsOfExperience || 'No disponible')}
          ${infoItem('Disponibilidad', candidate.availability)}
          ${infoItem('Modalidad preferida', candidate.workMode)}
          ${infoItem('Aspiración salarial', candidate.salaryExpectation)}
        </dl>
      </section>

      <section class="candidate-profile-section">
        <h3>Información de contacto</h3>
        <dl class="candidate-profile-info-grid">
          <div class="candidate-profile-info"><dt>Correo electrónico</dt><dd>${hasEmail ? `<a href="mailto:${escapeHTML(candidate.email)}">${escapeHTML(candidate.email)}</a>` : 'No disponible'}</dd></div>
          <div class="candidate-profile-info"><dt>Teléfono</dt><dd>${hasPhone ? `<a href="tel:${escapeHTML(candidate.phone)}">${escapeHTML(candidate.phone)}</a>` : 'No disponible'}</dd></div>
          ${infoItem('Ubicación', candidate.location)}
          <div class="candidate-profile-info"><dt>Portafolio</dt><dd>${hasPortfolio ? `<a href="${escapeHTML(candidate.portfolioUrl)}" target="_blank" rel="noopener noreferrer">Visitar portafolio</a>` : 'No disponible'}</dd></div>
          <div class="candidate-profile-info"><dt>LinkedIn</dt><dd>${hasLinkedIn ? `<a href="${escapeHTML(candidate.linkedinUrl)}" target="_blank" rel="noopener noreferrer">Ver LinkedIn</a>` : 'No disponible'}</dd></div>
        </dl>
      </section>

      <section class="candidate-profile-section"><h3>Experiencia profesional</h3>${experience}</section>
      <section class="candidate-profile-section"><h3>Educación</h3>${education}</section>
      <section class="candidate-profile-section">
        <h3>Habilidades</h3>
        ${candidate.skills.length ? `<div class="candidate-profile-skills">${candidate.skills.map(skill => `<span class="badge badge-active">${escapeHTML(skill)}</span>`).join('')}</div>` : '<p class="candidate-profile-empty">No hay habilidades registradas.</p>'}
      </section>

      <section class="candidate-profile-section">
        <h3>Currículum</h3>
        ${hasCv ? '<p class="candidate-profile-muted">Archivo de currículum disponible.</p>' : '<p class="candidate-profile-empty">Currículum no disponible.</p>'}
        <div class="candidate-profile-actions">
          ${hasCv ? `<a class="btn btn-secondary" href="${escapeHTML(candidate.cvUrl)}" target="_blank" rel="noopener noreferrer">Ver currículum</a><a class="btn btn-secondary" href="${escapeHTML(candidate.cvUrl)}" download>Descargar CV</a>` : '<button class="btn btn-secondary" disabled>Ver currículum</button><button class="btn btn-secondary" disabled>Descargar CV</button>'}
        </div>
      </section>

      <section class="candidate-profile-section candidate-profile-recruitment">
        <h3>Acciones de reclutamiento</h3>
        <div class="candidate-profile-actions">
          ${hasEmail ? `<a class="btn btn-primary" href="mailto:${escapeHTML(candidate.email)}">Contactar</a>` : '<button class="btn btn-primary" disabled>Contactar</button>'}
          <button class="btn btn-secondary" disabled title="La programación se gestiona desde Entrevistas">Programar entrevista</button>
          ${hasLinkedIn ? `<a class="btn btn-secondary" href="${escapeHTML(candidate.linkedinUrl)}" target="_blank" rel="noopener noreferrer">Ver LinkedIn</a>` : '<button class="btn btn-secondary" disabled>LinkedIn no disponible</button>'}
          <button class="btn btn-secondary candidate-profile-edit-btn">Editar candidato</button>
        </div>
      </section>
    </div>`;
}

function loadingMarkup() {
  return `<div class="candidate-profile-loading" aria-live="polite"><span class="skeleton" style="width: 72px; height: 72px;"></span><span class="skeleton" style="width: 60%; height: 24px;"></span><span class="skeleton" style="width: 100%; height: 16px;"></span><span class="skeleton" style="width: 88%; height: 16px;"></span></div>`;
}

function closeCandidateProfile() {
  const overlay = activeOverlay;
  activeOverlay = null;
  requestVersion += 1;
  if (overlay) overlay.remove();
  if (focusOrigin && document.contains(focusOrigin)) focusOrigin.focus();
  focusOrigin = null;
}

/** Opens the shared candidate detail panel used by Candidates and Dashboard. */
export function openCandidateProfile({ candidateId, candidate = null, onEdit = null }) {
  const isNewPanel = !activeOverlay;
  if (isNewPanel) {
    focusOrigin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeOverlay = document.createElement('div');
    activeOverlay.className = 'candidate-profile-overlay';
    activeOverlay.innerHTML = `
      <aside class="candidate-profile-panel" role="dialog" aria-modal="true" aria-label="Perfil del candidato" tabindex="-1">
        <header class="candidate-profile-header"><span>Perfil del candidato</span><button class="btn btn-icon candidate-profile-close" aria-label="Cerrar perfil">${icons.close}</button></header>
        <div class="candidate-profile-body">${loadingMarkup()}</div>
      </aside>`;
    document.body.appendChild(activeOverlay);
    requestAnimationFrame(() => activeOverlay?.classList.add('open'));
    activeOverlay.querySelector('.candidate-profile-close').addEventListener('click', closeCandidateProfile);
    activeOverlay.addEventListener('click', event => {
      if (event.target === activeOverlay) closeCandidateProfile();
    });
    activeOverlay.querySelector('.candidate-profile-panel').focus();
  }

  const version = ++requestVersion;
  const body = activeOverlay.querySelector('.candidate-profile-body');
  body.innerHTML = loadingMarkup();

  const renderProfile = profile => {
    if (!activeOverlay || version !== requestVersion) return;
    body.innerHTML = profileMarkup(profile);
    body.querySelector('.candidate-profile-edit-btn').addEventListener('click', () => {
      closeCandidateProfile();
      if (onEdit) onEdit(profile);
    });
  };

  const loadProfile = async () => {
    const response = await candidatosService.getById(candidateId);
    if (response.ok && response.data) {
      renderProfile(normalizeCandidate(response.data));
      return;
    }
    if (!activeOverlay || version !== requestVersion) return;
    body.innerHTML = `<div class="candidate-profile-state" role="alert"><h3>No se pudo cargar el perfil</h3><p>${escapeHTML(response.message || 'Inténtalo nuevamente.')}</p><button class="btn btn-secondary candidate-profile-retry-btn">Reintentar</button></div>`;
    body.querySelector('.candidate-profile-retry-btn').addEventListener('click', loadProfile);
  };

  loadProfile();
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activeOverlay) closeCandidateProfile();
});
