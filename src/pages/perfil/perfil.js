import '../../guards/auth-guard.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n, t } from '../../utils/i18n.js';
import { renderMenu } from '../../components/menu.js';
import { renderThemeSwitcher } from '../../components/theme-switcher.js';
import { renderAccessibilityMenu } from '../../components/accessibility-menu.js';
import { renderLanguageSwitcher } from '../../components/language-switcher.js';
import { initAccessibility } from '../../utils/accessibility.js';
import { authService } from '../../services/auth-service.js';
import { candidatosService } from '../../services/candidatos-service.js';
import { normalizeCandidate } from '../../services/candidatos-service.js';
import { openModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';

initTheme();
initAccessibility();
initI18n();

const currentUser = authService.getCurrentUser();
const menuContainer = document.getElementById('menu');
renderMenu(menuContainer, currentUser);
renderThemeSwitcher(document.getElementById('theme-switcher-container'));
renderAccessibilityMenu(document.getElementById('accessibility-menu-container'));
renderLanguageSwitcher(document.getElementById('lang-switcher-container'));

document.getElementById('mobile-menu-btn')?.addEventListener('click', () => menuContainer.classList.toggle('open'));

const form = document.getElementById('profile-form');
const cvFile = document.getElementById('cvFile');
const cvStatus = document.getElementById('cv-status');
const skillInput = document.getElementById('skill-input');
const skillsList = document.getElementById('skills-list');

// Elementos de Foto de Perfil
const profileAvatarPreview = document.getElementById('profile-avatar-preview');
const profilePhotoFileInput = document.getElementById('profile-photo-file');
const openCameraBtn = document.getElementById('open-camera-btn');
const removePhotoBtn = document.getElementById('remove-photo-btn');
const photoStatusMsg = document.getElementById('photo-status-msg');

let profile = normalizeCandidate(currentUser || {});
let skills = [];
let currentAvatarImage = profile.image || currentUser?.image || '';
let cameraMediaStream = null;

const DEFAULT_AVATAR = '/public/favicon.svg';

const locations = {
  'Costa Rica': {
    'San José': ['San José', 'Escazú', 'Santa Ana', 'Desamparados'],
    'Alajuela': ['Alajuela', 'San Ramón', 'Grecia', 'San Carlos'],
    'Cartago': ['Cartago', 'La Unión', 'Turrialba'],
    'Heredia': ['Heredia', 'Belén', 'Santo Domingo'],
    'Guanacaste': ['Liberia', 'Nicoya', 'Santa Cruz'],
    'Puntarenas': ['Puntarenas', 'Quepos', 'Golfito'],
    'Limón': ['Limón', 'Pococí', 'Siquirres']
  },
  Mexico: { 'Ciudad de México': ['Ciudad de México'], Jalisco: ['Guadalajara', 'Zapopan'], 'Nuevo León': ['Monterrey', 'San Pedro Garza García'] },
  España: { Madrid: ['Madrid', 'Alcalá de Henares'], Cataluña: ['Barcelona', 'Girona'], Andalucía: ['Sevilla', 'Málaga'] },
  Argentina: { 'Buenos Aires': ['Buenos Aires', 'La Plata'], Córdoba: ['Córdoba', 'Villa María'], Mendoza: ['Mendoza', 'Godoy Cruz'] },
  Brasil: { 'São Paulo': ['São Paulo', 'Campinas'], Paraná: ['Curitiba', 'Londrina'], 'Rio de Janeiro': ['Rio de Janeiro', 'Niterói'] }
};

function setValue(id, value = '') {
  document.getElementById(id).value = value === 'No disponible' ? '' : value;
}

function updateAvatarUI(imageUrl) {
  currentAvatarImage = imageUrl || '';
  if (profileAvatarPreview) {
    profileAvatarPreview.src = currentAvatarImage || DEFAULT_AVATAR;
  }
  if (removePhotoBtn) {
    removePhotoBtn.style.display = currentAvatarImage && currentAvatarImage !== DEFAULT_AVATAR ? 'inline-flex' : 'none';
  }
  // Sincronizar en tiempo real el avatar del menú lateral
  const sidebarAvatar = document.querySelector('.sidebar-user-avatar');
  if (sidebarAvatar) {
    sidebarAvatar.src = currentAvatarImage || DEFAULT_AVATAR;
  }
}

/**
 * Recorta y redimensiona una imagen cuadrada en un canvas
 * para optimizar el tamaño en almacenamiento y red (max 360x360 px).
 */
function processImageToSquare(imgElement, size = 360) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const srcWidth = imgElement.naturalWidth || imgElement.videoWidth || imgElement.width;
  const srcHeight = imgElement.naturalHeight || imgElement.videoHeight || imgElement.height;
  const minDim = Math.min(srcWidth, srcHeight);
  const startX = (srcWidth - minDim) / 2;
  const startY = (srcHeight - minDim) / 2;

  ctx.drawImage(imgElement, startX, startY, minDim, minDim, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.88);
}

/**
 * Captura un cuadro de video en espejo y lo recorta a cuadrado
 */
function captureVideoToSquare(videoElement, size = 360) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const srcWidth = videoElement.videoWidth;
  const srcHeight = videoElement.videoHeight;
  const minDim = Math.min(srcWidth, srcHeight);
  const startX = (srcWidth - minDim) / 2;
  const startY = (srcHeight - minDim) / 2;

  // Espejo horizontal para selfie natural
  ctx.translate(size, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoElement, startX, startY, minDim, minDim, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.88);
}

function populateForm(candidate) {
  setValue('firstName', candidate.firstName);
  setValue('lastName', candidate.lastName);
  setValue('professionalTitle', candidate.professionalTitle === 'No disponible' ? '' : candidate.professionalTitle);
  setValue('country', candidate.country);
  updateLocationOptions(candidate.country, candidate.province, candidate.canton);
  setValue('email', candidate.email);
  setValue('phone', candidate.phone);
  setValue('workMode', candidate.workMode);
  setValue('availability', candidate.availability);
  skills = Array.isArray(candidate.skills) ? [...candidate.skills] : [];
  renderSkills();
  setValue('about', candidate.about === 'Información profesional no disponible.' ? '' : candidate.about);
  setValue('linkedinUrl', candidate.linkedinUrl);
  setValue('portfolioUrl', candidate.portfolioUrl);
  if (candidate.cvUrl) cvStatus.textContent = t('profile.js.cvExists');

  // Foto de perfil
  updateAvatarUI(candidate.image || currentUser?.image || '');
}

function fillSelect(select, values, selectedValue, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>${values.map(value => `<option value="${value}">${value}</option>`).join('')}`;
  select.value = values.includes(selectedValue) ? selectedValue : '';
}

function updateLocationOptions(country, province = '', canton = '') {
  const provinceSelect = document.getElementById('province');
  const cantonSelect = document.getElementById('canton');
  const countryData = locations[country] || {};
  const provinces = Object.keys(countryData);
  fillSelect(provinceSelect, provinces, province, t('profile.js.provincePh'));
  const cantons = countryData[province] || [];
  fillSelect(cantonSelect, cantons, canton, t('profile.js.cantonPh'));
}

function renderSkills() {
  skillsList.innerHTML = '';
  skills.forEach((skill, index) => {
    const tag = document.createElement('span');
    tag.className = 'badge badge-active';
    tag.textContent = skill;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = ' ×';
    remove.setAttribute('aria-label', `Eliminar ${skill}`);
    remove.style.cssText = 'border:0;background:transparent;color:inherit;cursor:pointer;font-weight:700;padding:0 0 0 4px;';
    remove.addEventListener('click', () => { skills.splice(index, 1); renderSkills(); });
    tag.append(remove);
    skillsList.append(tag);
  });
}

fillSelect(document.getElementById('country'), Object.keys(locations), profile.country, t('profile.js.countryPh'));
document.getElementById('country').addEventListener('change', event => updateLocationOptions(event.target.value));
document.getElementById('province').addEventListener('change', event => {
  updateLocationOptions(document.getElementById('country').value, event.target.value);
});

document.getElementById('add-skill-btn').addEventListener('click', () => {
  const value = skillInput.value.trim();
  if (value && !skills.some(skill => skill.toLowerCase() === value.toLowerCase())) {
    skills.push(value);
    skillInput.value = '';
    renderSkills();
  }
  skillInput.focus();
});

skillInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('add-skill-btn').click();
  }
});

// ==========================================
// Manejo de Subida de Archivo de Foto
// ==========================================
profilePhotoFileInput?.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast(t('profile.js.photoInvalid'), 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast(t('profile.js.photoSize'), 'error');
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const optimizedDataUrl = processImageToSquare(img, 360);
        updateAvatarUI(optimizedDataUrl);
        showToast(t('profile.js.photoLoaded'), 'success');
      };
      img.onerror = () => showToast(t('profile.js.photoError'), 'error');
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } catch (err) {
    showToast(t('profile.js.photoFailed'), 'error');
  }
});

// ==========================================
// Botón Eliminar Foto Personalizada
// ==========================================
removePhotoBtn?.addEventListener('click', () => {
  updateAvatarUI('');
  if (profilePhotoFileInput) profilePhotoFileInput.value = '';
  showToast(t('profile.js.photoRemoved'), 'info');
});

// ==========================================
// Modal y Captura con Cámara Web
// ==========================================
function stopCameraStream() {
  if (cameraMediaStream) {
    cameraMediaStream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch (e) {
        // stream already closed
      }
    });
    cameraMediaStream = null;
  }
}

async function openCameraModal() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast(t('profile.js.cameraNoSupport'), 'error');
    return;
  }

  const modalBody = `
    <div class="camera-modal-wrapper">
      <div class="camera-preview-box">
        <video id="camera-video" class="camera-video-elem" autoplay playsinline muted></video>
        <img id="camera-snapshot-img" class="camera-snapshot-elem" style="display: none;" alt="Captura de cámara">
        <div id="camera-viewfinder" class="camera-viewfinder-guide"></div>
        <div id="camera-status" class="camera-status-indicator">
          <span class="camera-status-dot"></span>
          <span>${t('profile.js.cameraLive')}</span>
        </div>
      </div>
      <p id="camera-hint" style="font-size: var(--fs-small); color: var(--color-ink-muted); text-align: center; margin: 0;">
        ${t('profile.js.cameraHint')}
      </p>
      <div id="camera-error-container" style="display: none;" class="camera-error-message"></div>
    </div>
  `;

  const modalFooter = `
    <div class="camera-actions-toolbar">
      <button type="button" id="camera-cancel-btn" class="btn btn-secondary">${t('profile.js.cameraCancel')}</button>
      <button type="button" id="camera-capture-btn" class="btn btn-shutter" disabled>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="4"/><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/></svg>
        <span>${t('profile.js.cameraCaptureBtn')}</span>
      </button>
      <button type="button" id="camera-retake-btn" class="btn btn-secondary" style="display: none;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        <span>${t('profile.js.cameraRetakeBtn')}</span>
      </button>
      <button type="button" id="camera-confirm-btn" class="btn btn-primary" style="display: none;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${t('profile.js.cameraConfirmBtn')}</span>
      </button>
    </div>
  `;

  openModal({
    title: t('profile.js.cameraModalTitle'),
    bodyHTML: modalBody,
    footerHTML: modalFooter,
    onClose: () => {
      stopCameraStream();
    }
  });

  const video = document.getElementById('camera-video');
  const snapshotImg = document.getElementById('camera-snapshot-img');
  const viewfinder = document.getElementById('camera-viewfinder');
  const statusIndicator = document.getElementById('camera-status');
  const hintText = document.getElementById('camera-hint');
  const errorContainer = document.getElementById('camera-error-container');
  const captureBtn = document.getElementById('camera-capture-btn');
  const retakeBtn = document.getElementById('camera-retake-btn');
  const confirmBtn = document.getElementById('camera-confirm-btn');
  const cancelBtn = document.getElementById('camera-cancel-btn');

  cancelBtn?.addEventListener('click', () => {
    stopCameraStream();
    closeModal();
  });

  let capturedDataUrl = null;

  try {
    cameraMediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 640 }
      },
      audio: false
    });

    if (video) {
      video.srcObject = cameraMediaStream;
      video.onloadedmetadata = () => {
        video.play();
        if (captureBtn) captureBtn.disabled = false;
      };
    }
  } catch (err) {
    if (errorContainer) {
      errorContainer.style.display = 'block';
      let msg = 'No se pudo acceder a la cámara. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = t('profile.js.cameraErrorPerm');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = t('profile.js.cameraErrorNotFound');
      } else {
        msg += (err.message || 'Verifica que tu cámara no esté en uso por otra aplicación.');
      }
      errorContainer.textContent = msg;
    }
    if (hintText) hintText.style.display = 'none';
    if (statusIndicator) statusIndicator.style.display = 'none';
    if (captureBtn) captureBtn.style.display = 'none';
    return;
  }

  // Capturar Fotografía
  captureBtn?.addEventListener('click', () => {
    if (!video || video.videoWidth === 0) return;

    capturedDataUrl = captureVideoToSquare(video, 360);

    if (snapshotImg) {
      snapshotImg.src = capturedDataUrl;
      snapshotImg.style.display = 'block';
    }
    if (video) video.style.display = 'none';
    if (viewfinder) viewfinder.style.display = 'none';
    if (statusIndicator) statusIndicator.style.display = 'none';

    if (hintText) {
      hintText.innerHTML = t('profile.js.cameraConfirmHint');
    }

    if (captureBtn) captureBtn.style.display = 'none';
    if (retakeBtn) retakeBtn.style.display = 'inline-flex';
    if (confirmBtn) confirmBtn.style.display = 'inline-flex';
  });

  // Tomar otra
  retakeBtn?.addEventListener('click', () => {
    capturedDataUrl = null;
    if (snapshotImg) snapshotImg.style.display = 'none';
    if (video) video.style.display = 'block';
    if (viewfinder) viewfinder.style.display = 'flex';
    if (statusIndicator) statusIndicator.style.display = 'inline-flex';

    if (hintText) {
      hintText.innerHTML = t('profile.js.cameraHint');
    }

    if (captureBtn) captureBtn.style.display = 'inline-flex';
    if (retakeBtn) retakeBtn.style.display = 'none';
    if (confirmBtn) confirmBtn.style.display = 'none';
  });

  // Confirmar y Usar foto
  confirmBtn?.addEventListener('click', () => {
    if (capturedDataUrl) {
      updateAvatarUI(capturedDataUrl);
      showToast(t('profile.js.cameraSuccess'), 'success');
    }
    stopCameraStream();
    closeModal();
  });
}

openCameraBtn?.addEventListener('click', openCameraModal);

// ==========================================
// Cargar Datos del Perfil
// ==========================================
async function loadProfile() {
  if (!currentUser?.id) return;
  const result = await candidatosService.getById(currentUser.id);
  if (result.ok && result.data) profile = result.data;
  populateForm(profile);
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(t('profile.js.cvError')));
    reader.readAsDataURL(file);
  });
}

// ==========================================
// Guardar Perfil
// ==========================================
form.addEventListener('submit', async event => {
  event.preventDefault();
  const file = cvFile.files[0];
  if (file && file.size > 5 * 1024 * 1024) {
    showToast(t('profile.js.cvSize'), 'error');
    return;
  }

  let cvUrl = profile.cvUrl || '';
  if (file) {
    try {
      cvUrl = await readFile(file);
    } catch (error) {
      showToast(error.message, 'error');
      return;
    }
  }

  const payload = {
    ...profile,
    id: currentUser.id,
    image: currentAvatarImage || '',
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    professionalTitle: document.getElementById('professionalTitle').value.trim(),
    country: document.getElementById('country').value,
    province: document.getElementById('province').value,
    canton: document.getElementById('canton').value,
    location: [document.getElementById('canton').value, document.getElementById('province').value, document.getElementById('country').value].filter(Boolean).join(', '),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    workMode: document.getElementById('workMode').value,
    availability: document.getElementById('availability').value.trim(),
    skills,
    about: document.getElementById('about').value.trim(),
    linkedinUrl: document.getElementById('linkedinUrl').value.trim(),
    portfolioUrl: document.getElementById('portfolioUrl').value.trim(),
    cvUrl
  };

  const result = await candidatosService.update(currentUser.id, payload);
  if (!result.ok) {
    showToast(result.message || t('profile.js.saveError'), 'error');
    return;
  }

  const updatedUser = { ...currentUser, ...payload };
  delete updatedUser.password;

  // Actualizar sesión persistente
  const session = JSON.parse(localStorage.getItem('jobconnect_session') || '{}');
  localStorage.setItem('jobconnect_session', JSON.stringify({ ...session, user: updatedUser }));

  // Actualizar en registered_users si existe
  try {
    const regUsers = JSON.parse(localStorage.getItem('jobconnect_registered_users') || '[]');
    const regIdx = regUsers.findIndex(u => String(u.id) === String(currentUser.id) || u.username === currentUser.username);
    if (regIdx !== -1) {
      regUsers[regIdx] = { ...regUsers[regIdx], ...updatedUser };
      localStorage.setItem('jobconnect_registered_users', JSON.stringify(regUsers));
    }
  } catch (e) {
    // Ignorar si no existe
  }

  profile = normalizeCandidate(payload);
  populateForm(profile);
  showToast(t('profile.js.saveSuccess'), 'success');
});

loadProfile();

