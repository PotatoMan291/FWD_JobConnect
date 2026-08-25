const EXACT_KEYS = ['category', 'modality', 'contractType', 'experienceLevel', 'workMode', 'recruitmentStatus'];

function valueOf(item, key) {
  const value = item?.[key];
  if (value && typeof value === 'object' && 'name' in value) return String(value.name);
  return value;
}

export function applyRecordFilters(items = [], filters = {}) {
  const active = Object.entries(filters || {}).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!active.length) return items;

  return items.filter(item => active.every(([key, raw]) => {
    const expected = String(raw);

    if (EXACT_KEYS.includes(key)) {
      return String(valueOf(item, key) || '') === expected;
    }

    if (key === 'location') {
      return String(item.location || '').toLowerCase().includes(expected.toLowerCase());
    }

    if (key === 'vacancyId') {
      return String(item.vacancyId ?? item.productId ?? '') === expected;
    }

    if (key === 'publishedFrom') {
      return !item.publishedAt || String(item.publishedAt) >= expected;
    }

    if (key === 'publishedTo') {
      return !item.publishedAt || String(item.publishedAt) <= expected;
    }

    if (key === 'createdFrom') {
      return !item.createdAt || String(item.createdAt) >= expected;
    }

    if (key === 'createdTo') {
      return !item.createdAt || String(item.createdAt) <= expected;
    }

    if (key === 'completed') {
      const done = Boolean(item.completed);
      return expected === 'true' ? done : expected === 'false' ? !done : true;
    }

    if (key === 'search' || key === 'q' || key === 'ai') return true;

    return String(valueOf(item, key) ?? '') === expected;
  }));
}
