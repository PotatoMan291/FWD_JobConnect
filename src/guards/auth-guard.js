import { authService } from '../services/auth-service.js';

export function checkAuthGuard() {
  const currentPath = window.location.pathname;

  if (!authService.isAuthenticated()) {
    if (!currentPath.includes('/login.html')) {
      window.location.href = '/src/pages/login/login.html';
      return false;
    }
    return true;
  }

  const user = authService.getCurrentUser() || {};
  const userRole = user.role || 'user';

  if (userRole === 'user') {
    const restrictedPathsForUser = ['/dashboard/', '/candidatos/', '/empresas/', '/entrevistas/'];
    if (restrictedPathsForUser.some(p => currentPath.includes(p))) {
      window.location.href = '/src/pages/vacantes/vacantes.html';
      return false;
    }
  }

  return true;
}

// Ejecución inmediata al importar el guard en scripts protegidos
checkAuthGuard();
