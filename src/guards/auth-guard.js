import { authService } from '../services/auth-service.js';

export function checkAuthGuard() {
  if (!authService.isAuthenticated()) {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/login.html')) {
      window.location.href = '/src/pages/login/login.html';
      return false;
    }
  }
  return true;
}

// Ejecución inmediata al importar el guard en scripts protegidos
checkAuthGuard();
