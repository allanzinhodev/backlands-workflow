// Equivalente do g_settings do client: persistencia simples de configuracao.
// O client grava em config.otml no diretorio do APP_NAME; aqui o equivalente e o localStorage,
// com fallback em memoria para rodar em teste (jsdom sem storage) e em SSR.

const memory = new Map();

function backend() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {
    // acesso a storage pode lancar em contexto sem permissao
  }
  return null;
}

const PREFIX = 'backlands-uisim:';

export const g_settings = {
  get(key, fallback = null) {
    const store = backend();
    if (store) {
      const value = store.getItem(PREFIX + key);
      return value === null ? fallback : value;
    }
    return memory.has(key) ? memory.get(key) : fallback;
  },

  set(key, value) {
    const store = backend();
    if (store) store.setItem(PREFIX + key, String(value));
    else memory.set(key, String(value));
  },

  remove(key) {
    const store = backend();
    if (store) store.removeItem(PREFIX + key);
    else memory.delete(key);
  },

  clear() {
    const store = backend();
    if (store) {
      const keys = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key && key.startsWith(PREFIX)) keys.push(key);
      }
      for (const key of keys) store.removeItem(key);
    }
    memory.clear();
  },
};
