import { httpClient } from './http-client.js';
import { buildQueryParams } from '../utils/query-params.js';
import { mergeDemoList, addDemoItem, updateDemoItem, deleteDemoItem } from '../utils/demo-store.js';

const RESOURCE = '/products';

export const vacantesService = {
  async getAll({ cursor = 0, limit = 10, q = '', filters = {} } = {}) {
    const query = buildQueryParams({ limit, skip: cursor, q, filters });
    const endpoint = q ? `${RESOURCE}/search${query}` : `${RESOURCE}${query}`;
    const res = await httpClient(endpoint);

    if (res.ok && res.data) {
      const rawProducts = res.data.products || [];
      const mergedProducts = mergeDemoList('vacantes', rawProducts);

      let finalData = mergedProducts;
      if (q) {
        const queryLower = q.toLowerCase();
        finalData = mergedProducts.filter(p =>
          (p.title && p.title.toLowerCase().includes(queryLower)) ||
          (p.category && p.category.toLowerCase().includes(queryLower))
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
    const createdObj = (res.ok && res.data) ? res.data : payload;
    const item = addDemoItem('vacantes', createdObj);
    return { ok: true, data: item };
  },

  async update(id, payload) {
    await httpClient(`${RESOURCE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    updateDemoItem('vacantes', id, payload);
    return { ok: true, data: { id, ...payload } };
  },

  async patch(id, payload) {
    await httpClient(`${RESOURCE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    updateDemoItem('vacantes', id, payload);
    return { ok: true, data: { id, ...payload } };
  },

  async remove(id) {
    await httpClient(`${RESOURCE}/${id}`, {
      method: 'DELETE'
    });
    deleteDemoItem('vacantes', id);
    return { ok: true, id };
  }
};
