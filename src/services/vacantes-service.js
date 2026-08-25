import { httpClient } from './http-client.js';
import { buildQueryParams } from '../utils/query-params.js';
import { mergeDemoList, addDemoItem, updateDemoItem, deleteDemoItem, getDemoStore } from '../utils/demo-store.js';
import { applyRecordFilters } from '../utils/apply-filters.js';

const RESOURCE = '/products';

const NOT_AVAILABLE = 'No disponible';

function textOrFallback(value, fallback = NOT_AVAILABLE) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function numericOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

/** Adapta las vacantes de la API al modelo compartido del catálogo. */
export function normalizeJob(raw = {}) {
  const salaryMin = numericOrNull(raw.salaryMin ?? raw.price);
  const salaryMax = numericOrNull(raw.salaryMax ?? raw.price);

  return {
    ...raw,
    id: raw.id,
    title: textOrFallback(raw.title, 'Puesto no disponible'),
    companyName: textOrFallback(raw.companyName, 'Empresa confidencial'),
    companyLogo: textOrFallback(raw.companyLogo, ''),
    companyImage: textOrFallback(raw.companyImage, ''),
    location: textOrFallback(raw.location),
    modality: textOrFallback(raw.modality),
    contractType: textOrFallback(raw.contractType),
    category: textOrFallback(raw.category),
    experienceLevel: textOrFallback(raw.experienceLevel),
    salaryMin,
    salaryMax,
    currency: textOrFallback(raw.currency, 'USD'),
    salaryPeriod: textOrFallback(raw.salaryPeriod, 'por mes'),
    shortDescription: textOrFallback(raw.shortDescription || raw.description, 'Descripción no disponible.'),
    description: textOrFallback(raw.description || raw.shortDescription, 'Descripción no disponible.'),
    responsibilities: Array.isArray(raw.responsibilities) ? raw.responsibilities : [],
    requirements: Array.isArray(raw.requirements) ? raw.requirements : [],
    benefits: Array.isArray(raw.benefits) ? raw.benefits : [],
    skills: Array.isArray(raw.skills) ? raw.skills.slice(0, 5) : [],
    publishedAt: textOrFallback(raw.publishedAt),
    closingDate: textOrFallback(raw.closingDate),
    featured: Boolean(raw.featured),
    saved: Boolean(raw.saved)
  };
}

export const vacantesService = {
  async getAll({ cursor = 0, limit = 10, q = '', filters = {} } = {}) {
    const query = buildQueryParams({ limit: 1000, skip: 0, q });
    const endpoint = q ? `${RESOURCE}/search${query}` : `${RESOURCE}${query}`;
    const res = await httpClient(endpoint);

    if (res.ok && res.data) {
      const rawProducts = res.data.products || [];
      const mergedProducts = mergeDemoList('vacantes', rawProducts).map(normalizeJob);

      let finalData = mergedProducts;
      if (q) {
        const queryLower = q.toLowerCase();
        finalData = mergedProducts.filter(p =>
          (p.title && p.title.toLowerCase().includes(queryLower)) ||
          (p.category && p.category.toLowerCase().includes(queryLower)) ||
          (p.companyName && p.companyName.toLowerCase().includes(queryLower)) ||
          (p.location && p.location.toLowerCase().includes(queryLower))
        );
      }

      finalData = applyRecordFilters(finalData, filters);
      const total = finalData.length;
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
    const store = getDemoStore('vacantes');
    const localItem = store.created.find(item => String(item.id) === String(id));
    if (localItem) return { ok: true, data: normalizeJob(localItem) };

    const res = await httpClient(`${RESOURCE}/${id}`);
    if (!res.ok || !res.data) return res;

    const localChanges = store.updated[id] || {};
    return { ...res, data: normalizeJob({ ...res.data, ...localChanges }) };
  },

  async create(payload) {
    const res = await httpClient(`${RESOURCE}/add`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) return res;
    const createdObj = { ...payload, ...(res.data || {}) };
    const item = addDemoItem('vacantes', createdObj);
    return { ok: true, data: item };
  },

  async update(id, payload) {
    const res = await httpClient(`${RESOURCE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (!res.ok) return res;
    updateDemoItem('vacantes', id, payload);
    return { ok: true, data: res.data || { id, ...payload } };
  },

  async patch(id, payload) {
    const res = await httpClient(`${RESOURCE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    if (!res.ok) return res;
    updateDemoItem('vacantes', id, payload);
    return { ok: true, data: res.data || { id, ...payload } };
  },

  async remove(id) {
    const res = await httpClient(`${RESOURCE}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) return res;
    deleteDemoItem('vacantes', id);
    return { ok: true, id };
  }
};
