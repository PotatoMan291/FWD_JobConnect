import { httpClient } from './http-client.js';
import { storage } from '../utils/storage.js';

export const authService = {
  register({ firstName, lastName, email, username, password }) {
    const users = storage.get('registered_users', []);
    const normalizedUsername = username.trim().toLowerCase();
    if (users.some(user => user.username === normalizedUsername)) {
      return { ok: false, message: 'Ese usuario ya está registrado.' };
    }

    const user = {
      id: `local-${Date.now()}`,
      username: normalizedUsername,
      password,
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'user'
    };
    users.push(user);
    storage.set('registered_users', users);

    const sessionUser = { ...user };
    delete sessionUser.password;
    storage.set('session', { token: `local-${Date.now()}`, refreshToken: '', user: sessionUser });
    return { ok: true, user: sessionUser };
  },

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

    const localUser = storage.get('registered_users', []).find(user =>
      user.username === username.trim().toLowerCase() && user.password === password
    );
    if (localUser) {
      const user = { ...localUser };
      delete user.password;
      storage.set('session', { token: `local-${Date.now()}`, refreshToken: '', user });
      return { ok: true, user };
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
