import { candidatosService, normalizeCandidate } from '../services/candidatos-service.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';
import { bloquearScroll, desbloquearScroll } from '../utils/scroll-lock.js';
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
  if (allowedHosts.length === 0 && /^data:application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document);base64,/i.test(String(url || ''))) return true;
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
    return `<img class="candidate-profile-avatar" src="${escapeHTML(candidate.image)}" alt="Foto de ${escapeHTML(candidate.fullName)}" data-fallback-initials="${escapeHTML(initials)}">`;
  }
  return `<div class="candidate-profile-avatar candidate-profile-initials" aria-hidden="true">${escapeHTML(initials)}</div>`;
}

function localAvatarUrl(initials) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144"><rect width="144" height="144" rx="72" fill="#DCEBE7"/><text x="72" y="82" text-anchor="middle" dominant-baseline="middle" fill="#1F5C4F" font-family="sans-serif" font-size="42" font-weight="700">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function bindProfileAvatarFallback(container, candidate) {
  const image = container.querySelector('.candidate-profile-avatar[data-fallback-initials]');
  if (!image) return;
  image.addEventListener('error', () => {
    const initials = candidate.fullName.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';
    image.onerror = null;
    image.src = localAvatarUrl(initials);
    image.removeAttribute('data-fallback-initials');
  }, { once: true });
}

function infoItem(label, value, extraClass = '') {
  return `<div class="candidate-profile-info ${extraClass}"><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value || 'No disponible')}</dd></div>`;
}

function listMarkup(items, renderer, emptyText) {
  if (!items.length) return `<p class="candidate-profile-empty">${escapeHTML(emptyText)}</p>`;
  return `<div class="candidate-profile-timeline">${items.map(renderer).join('')}</div>`;
}

function openInterviewScheduler(candidate) {
  const today = new Date();
  const twoDaysLater = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
  const minDate = today.toISOString().split('T')[0];
  const defaultDate = twoDaysLater.toISOString().split('T')[0];

  const modal = openModal({
    title: 'Agendar entrevista',
    bodyHTML: `
      <div style="display:grid; gap: 1.1rem; min-height: 360px; width: min(100%, 760px);">
        <div style="display:flex; align-items:center; justify-content: space-between; gap:0.75rem; flex-wrap: wrap;">
          <div>
            <div style="font-size:0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(100,116,139,0.9);">Candidato</div>
            <h3 style="margin:0.2rem 0 0; font-size: clamp(1.4rem, 2vw, 2rem); color:#0f172a;">${escapeHTML(candidate.fullName || 'Candidato')}</h3>
          </div>
          <button class="btn btn-secondary interview-teams-btn" type="button" style="background: linear-gradient(135deg, #e5d5a8, #d8bd68); color: #101827; border-color: transparent;">Invitar por Teams</button>
        </div>

        <div style="display:grid; gap: 1rem; align-content: start;">
          <div style="padding: 0.9rem 1rem; border-radius: 14px; background: linear-gradient(180deg, #f8fafc, #eef2ff); border: 1px solid rgba(148,163,184,0.3);">
            <div style="font-size:0.72rem; text-transform: uppercase; letter-spacing:0.08em; color: rgba(71,85,105,0.9); margin-bottom:0.3rem;">Reunión</div>
            <div style="font-weight:800; font-size: 1.25rem; color:#0f172a;">Entrevista técnica</div>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
            <label style="display:grid; gap: 0.45rem; font-weight: 600; color: #0f172a;">
              <span style="font-size:0.8rem; color: rgba(71,85,105,0.9);">Fecha</span>
              <input type="date" id="interview-date" value="${defaultDate}" min="${minDate}" required style="padding:0.9rem 1rem; border-radius:12px; border:1px solid rgba(148,163,184,0.4); background: #ffffff; color:#0f172a; box-shadow: inset 0 1px 2px rgba(15,23,42,0.04);">
            </label>

            <label style="display:grid; gap: 0.45rem; font-weight: 600; color: #0f172a;">
              <span style="font-size:0.8rem; color: rgba(71,85,105,0.9);">Hora</span>
              <input type="time" id="interview-time" value="10:00" required style="padding:0.9rem 1rem; border-radius:12px; border:1px solid rgba(148,163,184,0.4); background: #ffffff; color:#0f172a; box-shadow: inset 0 1px 2px rgba(15,23,42,0.04);">
            </label>
          </div>

          <label style="display:grid; gap: 0.45rem; font-weight: 600; color: #0f172a;">
            <span style="font-size:0.8rem; color: rgba(71,85,105,0.9);">Plataforma</span>
            <select id="interview-platform" style="padding:0.9rem 1rem; border-radius:12px; border:1px solid rgba(148,163,184,0.4); background: #ffffff; color:#0f172a; box-shadow: inset 0 1px 2px rgba(15,23,42,0.04);">
              <option selected>Microsoft Teams</option>
              <option>Google Meet</option>
              <option>Zoom</option>
            </select>
          </label>

          <div style="padding:0.9rem 1rem; border-radius:12px; background: #f8fafc; border:1px solid rgba(148,163,184,0.25); color: #0f172a;">
            <div style="font-size:0.72rem; text-transform: uppercase; letter-spacing:0.08em; color: rgba(71,85,105,0.9); margin-bottom:0.45rem;">Contacto</div>
            <div style="font-weight:600;">${escapeHTML(candidate.email || 'correo no disponible')}</div>
          </div>
        </div>
      </div>
    `,
    footerHTML: `
      <button class="btn btn-primary interview-submit-btn">Guardar cita</button>
      <button class="btn btn-secondary interview-cancel-btn">Cancelar</button>
    `
  });

  const cancelBtn = modal.querySelector('.interview-cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal());

  const teamsBtn = modal.querySelector('.interview-teams-btn');
  if (teamsBtn) {
    teamsBtn.addEventListener('click', () => {
      const platformSelect = modal.querySelector('#interview-platform');
      if (platformSelect) platformSelect.value = 'Microsoft Teams';
      showToast('Se preparó la invitación para Microsoft Teams.', 'success');
    });
  }

  const submitBtn = modal.querySelector('.interview-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const dateInput = modal.querySelector('#interview-date');
      const timeInput = modal.querySelector('#interview-time');
      const platformSelect = modal.querySelector('#interview-platform');

      if (!dateInput.value || !timeInput.value) {
        showToast('Selecciona la fecha y la hora para la entrevista.', 'error');
        return;
      }

      const meetingDate = new Date(`${dateInput.value}T${timeInput.value}:00`);
      const formattedDate = new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(meetingDate);

      const stored = JSON.parse(localStorage.getItem('jobconnect_interviews') || '[]');
      stored.push({
        id: Date.now(),
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        date: dateInput.value,
        time: timeInput.value,
        platform: platformSelect.value,
        scheduledAt: new Date().toISOString()
      });
      localStorage.setItem('jobconnect_interviews', JSON.stringify(stored));

      closeModal();
      showToast(`Entrevista agendada para ${formattedDate} en ${platformSelect.value}.`, 'success');
    });
  }
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
          <button class="btn btn-secondary candidate-profile-schedule-btn">Programar entrevista</button>
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
  desbloquearScroll();
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
    bloquearScroll();
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
    bindProfileAvatarFallback(body, profile);

    const scheduleBtn = body.querySelector('.candidate-profile-schedule-btn');
    if (scheduleBtn) {
      scheduleBtn.addEventListener('click', () => {
        closeCandidateProfile();
        openInterviewScheduler(profile);
      });
    }

    const editBtn = body.querySelector('.candidate-profile-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        closeCandidateProfile();
        if (onEdit) onEdit(profile);
      });
    }
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
