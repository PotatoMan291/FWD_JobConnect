const PREFIX = 'jobconnect_';

export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error al leer storage key "${key}":`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error al guardar storage key "${key}":`, e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {
      console.error(`Error al eliminar storage key "${key}":`, e);
    }
  },

  clear() {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.error('Error al limpiar storage:', e);
    }
  }
};
