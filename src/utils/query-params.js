export function buildQueryParams({ limit = 10, skip = 0, q = '', filters = {} } = {}) {
  const params = new URLSearchParams();

  if (limit !== undefined && limit !== null) {
    params.append('limit', String(limit));
  }

  if (skip !== undefined && skip !== null) {
    params.append('skip', String(skip));
  }

  if (q && q.trim() !== '') {
    params.append('q', q.trim());
  }

  Object.keys(filters).forEach(key => {
    const val = filters[key];
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, String(val));
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}
