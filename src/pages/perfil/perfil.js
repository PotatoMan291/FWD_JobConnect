import '../../guards/auth-guard.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n } from '../../utils/i18n.js';
import { renderMenu } from '../../components/menu.js';
import { renderThemeSwitcher } from '../../components/theme-switcher.js';
import { renderAccessibilityMenu } from '../../components/accessibility-menu.js';
import { renderLanguageSwitcher } from '../../components/language-switcher.js';
import { initAccessibility } from '../../utils/accessibility.js';
import { authService } from '../../services/auth-service.js';
import { candidatosService } from '../../services/candidatos-service.js';
import { normalizeCandidate } from '../../services/candidatos-service.js';
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
let profile = normalizeCandidate(currentUser || {});
let skills = [];

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
  if (candidate.cvUrl) cvStatus.textContent = 'Ya tienes un currículum guardado. Selecciona otro para reemplazarlo.';
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
  fillSelect(provinceSelect, provinces, province, 'Selecciona una provincia o estado');
  const cantons = countryData[province] || [];
  fillSelect(cantonSelect, cantons, canton, 'Selecciona un cantón o ciudad');
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

fillSelect(document.getElementById('country'), Object.keys(locations), profile.country, 'Selecciona un país');
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
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const file = cvFile.files[0];
  if (file && file.size > 5 * 1024 * 1024) {
    showToast('El archivo no puede superar los 5 MB.', 'error');
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
    showToast(result.message || 'No se pudo guardar el perfil.', 'error');
    return;
  }

  const updatedUser = { ...currentUser, ...payload };
  delete updatedUser.password;
  const session = JSON.parse(localStorage.getItem('jobconnect_session') || '{}');
  localStorage.setItem('jobconnect_session', JSON.stringify({ ...session, user: updatedUser }));
  profile = normalizeCandidate(payload);
  populateForm(profile);
  showToast('Tu perfil se guardó correctamente.', 'success');
});

loadProfile();
