import { storage } from '../utils/storage.js';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';

export async function httpClient(endpoint, options = {}) {
  const session = storage.get('session');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (session && session.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const config = {
    ...options,
    headers
  };

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = (data && data.message) || `Error HTTP ${response.status}: ${response.statusText}`;
      return { ok: false, status: response.status, message: errorMessage, data };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error(`HttpClient Network/Fetch Error [${url}]:`, error);
    return {
      ok: false,
      status: 0,
      message: error.message || 'Error de conexión a la red. Por favor verifique su conexión internet.',
      error
    };
  }
}
