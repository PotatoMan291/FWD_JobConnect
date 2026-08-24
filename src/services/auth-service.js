import { httpClient } from './http-client.js';
import { storage } from '../utils/storage.js';

export const authService = {
  async login(username, password) {
    const res = await httpClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        expiresInMins: 120
      })
    });

    const token = res.data ? (res.data.accessToken || res.data.token) : null;

    const ROLE_MAP = {
      emilys: 'admin',
      michaelw: 'admin',
      sophiab: 'recruiter',
      jamesd: 'recruiter',
      oliviaw: 'user',
      benjaminw: 'user',
      isabellad: 'user'
    };

    if (res.ok && res.data && token) {
      const uname = res.data.username ? res.data.username.toLowerCase() : '';
      const userObj = {
        id: res.data.id,
        username: res.data.username,
        email: res.data.email,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        image: res.data.image,
        role: ROLE_MAP[uname] || res.data.role || 'recruiter'
      };

      storage.set('session', {
        token: token,
        refreshToken: res.data.refreshToken || token,
        user: userObj
      });

      return { ok: true, user: userObj };
    }

    return { ok: false, message: res.message || 'Credenciales inválidas' };
  },

  logout() {
    storage.remove('session');
    window.location.href = '/src/pages/login/login.html';
  },

  getCurrentUser() {
    const session = storage.get('session');
    return session ? session.user : null;
  },

  getToken() {
    const session = storage.get('session');
    return session ? session.token : null;
  },

  isAuthenticated() {
    const session = storage.get('session');
    return !!(session && session.token);
  }
};
