import { httpClient } from './http-client.js';
import { buildQueryParams } from '../utils/query-params.js';
import { mergeDemoList, addDemoItem, updateDemoItem, deleteDemoItem, getDemoStore } from '../utils/demo-store.js';

const RESOURCE = '/users';

const NOT_AVAILABLE = 'No disponible';
const RECRUITMENT_STATUSES = new Set(['Nuevo', 'En revisión', 'Entrevista', 'Seleccionado', 'Rechazado']);

function valueOrFallback(value, fallback = NOT_AVAILABLE) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeYearsOfExperience(value) {
  if (typeof value !== 'string') return valueOrFallback(value, '');

  const trimmed = value.trim();
  if (!trimmed) return '';

  return trimmed.replace(/\b(\d+)\s*an(?:io|o)s\b/gi, '$1 años');
}

function companyName(company) {
  if (typeof company === 'string') return valueOrFallback(company);
  return valueOrFallback(company?.name);
}

/**
 * Adapta cualquier respuesta de la fuente de candidatos al contrato interno
 * de JobConnect. Las vistas nunca consumen directamente el formato de la API.
 */
export function normalizeCandidate(raw = {}) {
  const firstName = valueOrFallback(raw.firstName, '');
  const lastName = valueOrFallback(raw.lastName, '');
  const fullName = valueOrFallback(raw.fullName, `${firstName} ${lastName}`.trim() || NOT_AVAILABLE);
  const rawLocation = raw.location || raw.address?.city;

  return {
    id: raw.id,
    candidateCode: valueOrFallback(raw.candidateCode, raw.id !== undefined ? `#CAN-${String(raw.id).padStart(4, '0')}` : NOT_AVAILABLE),
    firstName,
    lastName,
    fullName,
    image: valueOrFallback(raw.image, ''),
    professionalTitle: valueOrFallback(raw.professionalTitle || raw.role),
    email: valueOrFallback(raw.email),
    phone: valueOrFallback(raw.phone),
    company: companyName(raw.company),
    location: valueOrFallback(rawLocation),
    about: valueOrFallback(raw.about, 'Información profesional no disponible.'),
    coverLetter: valueOrFallback(raw.coverLetter, 'Carta de presentación no disponible.'),
    experience: asArray(raw.experience),
    education: asArray(raw.education),
    skills: asArray(raw.skills),
    yearsOfExperience: normalizeYearsOfExperience(raw.yearsOfExperience),
    availability: valueOrFallback(raw.availability),
    workMode: valueOrFallback(raw.workMode),
    salaryExpectation: valueOrFallback(raw.salaryExpectation),
    portfolioUrl: valueOrFallback(raw.portfolioUrl, ''),
    linkedinUrl: valueOrFallback(raw.linkedinUrl, ''),
    cvUrl: valueOrFallback(raw.cvUrl, ''),
    recruitmentStatus: RECRUITMENT_STATUSES.has(raw.recruitmentStatus) ? raw.recruitmentStatus : 'Nuevo'
  };
}

function getLocalCandidate(id) {
  const store = getDemoStore('candidatos');
  const created = store.created.find(item => String(item.id) === String(id));
  if (created) return created;
  return store.updated[id] || null;
}

export const candidatosService = {
  async getAll({ cursor = 0, limit = 10, q = '', filters = {} } = {}) {
    const query = buildQueryParams({ limit, skip: cursor, q, filters });
    const endpoint = q ? `${RESOURCE}/search${query}` : `${RESOURCE}${query}`;
    const res = await httpClient(endpoint);

    if (res.ok && res.data) {
      const rawUsers = res.data.users || [];
      const mergedUsers = mergeDemoList('candidatos', rawUsers);

      let finalData = mergedUsers;
      if (q) {
        const queryLower = q.toLowerCase();
        finalData = mergedUsers.filter(u =>
          (u.firstName && u.firstName.toLowerCase().includes(queryLower)) ||
          (u.lastName && u.lastName.toLowerCase().includes(queryLower)) ||
          (u.email && u.email.toLowerCase().includes(queryLower))
        );
      }

      const total = q ? finalData.length : (res.data.total ?? finalData.length);
      const paginated = finalData.slice(cursor, cursor + limit);

      return {
        ok: true,
        data: paginated,
        total,
        skip: cursor,
        nextCursor: (cursor + limit < total) ? cursor + limit : null,
        prevCursor: (cursor - limit >= 0) ? cursor - limit : null
      };
    }
    return { ok: false, message: res.message, data: [], total: 0 };
  },

  async getById(id) {
    const localCandidate = getLocalCandidate(id);
    const isLocalOnly = localCandidate?._isLocal;

    if (isLocalOnly) {
      return { ok: true, data: normalizeCandidate(localCandidate) };
    }

    const res = await httpClient(`${RESOURCE}/${id}`);
    if (!res.ok || !res.data) return res;

    const localChanges = getDemoStore('candidatos').updated[id] || {};
    return { ...res, data: normalizeCandidate({ ...res.data, ...localChanges }) };
  },

  async create(payload) {
    const res = await httpClient(`${RESOURCE}/add`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const createdObj = (res.ok && res.data) ? res.data : payload;
    const item = addDemoItem('candidatos', createdObj);
    return { ok: true, data: item };
  },

  async update(id, payload) {
    await httpClient(`${RESOURCE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    updateDemoItem('candidatos', id, payload);
    return { ok: true, data: { id, ...payload } };
  },

  async patch(id, payload) {
    await httpClient(`${RESOURCE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    updateDemoItem('candidatos', id, payload);
    return { ok: true, data: { id, ...payload } };
  },

  async remove(id) {
    await httpClient(`${RESOURCE}/${id}`, {
      method: 'DELETE'
    });
    deleteDemoItem('candidatos', id);
    return { ok: true, id };
  }
};
