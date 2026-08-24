import { authService } from '../../services/auth-service.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n, t } from '../../utils/i18n.js';
import { renderThemeSwitcher } from '../../components/theme-switcher.js';
import { renderLanguageSwitcher } from '../../components/language-switcher.js';

// Inicialización de UI, tema e i18n
initTheme();
initI18n();

// Si ya está autenticado, redirigir al dashboard
if (authService.isAuthenticated()) {
  window.location.href = '/src/pages/dashboard/dashboard.html';
}

const themeContainer = document.getElementById('theme-switcher-container');
const langContainer = document.getElementById('lang-switcher-container');

renderThemeSwitcher(themeContainer);
renderLanguageSwitcher(langContainer);

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorDiv = document.getElementById('login-error');
const submitBtn = document.getElementById('submit-btn');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorDiv.style.display = 'none';
  submitBtn.disabled = true;

  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = `<span>${t('login.submitting')}</span>`;

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  const res = await authService.login(username, password);

  if (res.ok) {
    window.location.href = '/src/pages/dashboard/dashboard.html';
  } else {
    errorDiv.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// Manejador para botones de credenciales de demo
document.querySelectorAll('.demo-cred-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const user = btn.getAttribute('data-user');
    const pass = btn.getAttribute('data-pass');
    usernameInput.value = user;
    passwordInput.value = pass;
    // Opcional: auto enviar formulario
    loginForm.dispatchEvent(new Event('submit'));
  });
});

