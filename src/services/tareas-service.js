import { httpClient } from './http-client.js';
import { buildQueryParams } from '../utils/query-params.js';
import { mergeDemoList, addDemoItem, updateDemoItem, deleteDemoItem } from '../utils/demo-store.js';
import { applyRecordFilters } from '../utils/apply-filters.js';

const RESOURCE = '/todos';

export const tareasService = {
  async getAll({ cursor = 0, limit = 10, filters = {} } = {}) {
    const query = buildQueryParams({ limit, skip: cursor, filters });
    const res = await httpClient(`${RESOURCE}${query}`);

    if (res.ok && res.data) {
      const rawTodos = res.data.todos || [];
      const mergedTodos = mergeDemoList('tareas', rawTodos);
      const filtered = applyRecordFilters(mergedTodos, filters);
      const total = filtered.length;
      const paginated = filtered.slice(cursor, cursor + limit);

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
    const item = addDemoItem('tareas', createdObj);
    return { ok: true, data: item };
  },

  async patch(id, payload) {
    await httpClient(`${RESOURCE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    updateDemoItem('tareas', id, payload);
    return { ok: true, data: { id, ...payload } };
  },

  async remove(id) {
    await httpClient(`${RESOURCE}/${id}`, {
      method: 'DELETE'
    });
    deleteDemoItem('tareas', id);
    return { ok: true, id };
  }
};
