import { storage } from './storage.js';

export function getDemoStore(resourceKey) {
  const store = storage.get(`demo_${resourceKey}`, {
    created: [],
    updated: {},
    deleted: []
  });
  return store;
}

export function saveDemoStore(resourceKey, store) {
  storage.set(`demo_${resourceKey}`, store);
}

export function addDemoItem(resourceKey, item) {
  const store = getDemoStore(resourceKey);
  const newItem = {
    id: item.id || Date.now(),
    ...item,
    _isLocal: true
  };
  // Evitar duplicados por id en el almacén local
  store.created = store.created.filter(c => String(c.id) !== String(newItem.id));
  store.created.unshift(newItem);
  saveDemoStore(resourceKey, store);
  return newItem;
}

export function updateDemoItem(resourceKey, id, payload) {
  const store = getDemoStore(resourceKey);
  store.updated[id] = {
    ...(store.updated[id] || {}),
    ...payload
  };
  saveDemoStore(resourceKey, store);
}

export function deleteDemoItem(resourceKey, id) {
  const store = getDemoStore(resourceKey);
  if (!store.deleted.includes(String(id))) {
    store.deleted.push(String(id));
  }
  // También eliminar de los creados localmente si aplica
  store.created = store.created.filter(item => String(item.id) !== String(id));
  saveDemoStore(resourceKey, store);
}

export function mergeDemoList(resourceKey, apiItems = [], transformFn = null) {
  const store = getDemoStore(resourceKey);

  // 1. Mapear items de la API aplicando actualizaciones locales y filtrando eliminados
  const processedApiItems = apiItems
    .filter(item => !store.deleted.includes(String(item.id)))
    .map(item => {
      let merged = store.updated[item.id]
        ? { ...item, ...store.updated[item.id] }
        : item;
      return transformFn ? transformFn(merged) : merged;
    });

  const apiIds = new Set(processedApiItems.map(item => String(item.id)));

  // 2. Anteponer solo los items creados localmente que no existan ya en la API
  const createdItems = store.created
    .filter(item => !store.deleted.includes(String(item.id)) && !apiIds.has(String(item.id)))
    .map(item => (transformFn ? transformFn(item) : item));

  return [...createdItems, ...processedApiItems];
}
