import { authService } from '../../services/auth-service.js';
import { initTheme } from '../../utils/theme.js';
import { initI18n, t } from '../../utils/i18n.js';
import { renderThemeSwitcher } from '../../components/theme-switcher.js';
import { renderAccessibilityMenu } from '../../components/accessibility-menu.js';
import { initAccessibility } from '../../utils/accessibility.js';
import { renderLanguageSwitcher } from '../../components/language-switcher.js';

// Inicialización de UI, tema e i18n
initTheme();
initAccessibility();
initI18n();

function redirectByUserRole(user) {
  const role = user ? user.role : 'user';
  if (role === 'user') {
    window.location.href = '/src/pages/vacantes/vacantes.html';
  } else {
    window.location.href = '/src/pages/dashboard/dashboard.html';
  }
}

// Si ya está autenticado, redirigir según su rol
if (authService.isAuthenticated()) {
  redirectByUserRole(authService.getCurrentUser());
}

const themeContainer = document.getElementById('theme-switcher-container');
const accessibilityContainer = document.getElementById('accessibility-menu-container');
const langContainer = document.getElementById('lang-switcher-container');

renderThemeSwitcher(themeContainer);
renderAccessibilityMenu(accessibilityContainer);
renderLanguageSwitcher(langContainer);

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorDiv = document.getElementById('login-error');
const submitBtn = document.getElementById('submit-btn');
const registerToggle = document.getElementById('register-toggle');
const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');

registerToggle.addEventListener('click', () => {
  const isHidden = registerForm.style.display === 'none';
  registerForm.style.display = isHidden ? 'block' : 'none';
  registerToggle.textContent = isHidden ? t('login.backToLogin') : t('login.registerLink');
  if (isHidden) loginForm.style.display = 'none';
  else loginForm.style.display = 'block';
});

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  registerError.style.display = 'none';
  const result = authService.register({
    firstName: document.getElementById('register-first-name').value,
    lastName: document.getElementById('register-last-name').value,
    email: document.getElementById('register-email').value,
    username: document.getElementById('register-username').value,
    password: document.getElementById('register-password').value
  });
  if (result.ok) redirectByUserRole(result.user);
  else {
    registerError.textContent = result.message;
    registerError.style.display = 'block';
  }
});

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
    redirectByUserRole(res.user);
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
    // Auto enviar formulario
    loginForm.dispatchEvent(new Event('submit'));
  });
});
