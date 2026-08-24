import { httpClient } from './http-client.js';
import { buildQueryParams } from '../utils/query-params.js';
import { mergeDemoList, addDemoItem, updateDemoItem, deleteDemoItem } from '../utils/demo-store.js';

const RESOURCE = '/posts';

export const postulacionesService = {
  async getAll({ cursor = 0, limit = 10, q = '', filters = {} } = {}) {
    const query = buildQueryParams({ limit, skip: cursor, q, filters });
    const endpoint = q ? `${RESOURCE}/search${query}` : `${RESOURCE}${query}`;
    const res = await httpClient(endpoint);

    if (res.ok && res.data) {
      const rawPosts = res.data.posts || [];
      const mergedPosts = mergeDemoList('postulaciones', rawPosts);

      let finalData = mergedPosts;
      if (q) {
        const queryLower = q.toLowerCase();
        finalData = mergedPosts.filter(p =>
          (p.title && p.title.toLowerCase().includes(queryLower)) ||
          (p.body && p.body.toLowerCase().includes(queryLower))
        );
      }

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
    return await httpClient(`${RESOURCE}/${id}`);
  },

  async create(payload) {
    const res = await httpClient(`${RESOURCE}/add`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data) {
      addDemoItem('postulaciones', res.data);
      return { ok: true, data: res.data };
    }
    return { ok: false, message: res.message || 'Error al registrar la postulación' };
  },

  async patch(id, payload) {
    const res = await httpClient(`${RESOURCE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    updateDemoItem('postulaciones', id, payload);
    return { ok: true, data: res.ok && res.data ? res.data : { id, ...payload } };
  },

  async remove(id) {
    await httpClient(`${RESOURCE}/${id}`, {
      method: 'DELETE'
    });
    deleteDemoItem('postulaciones', id);
    return { ok: true, id };
  }
};
