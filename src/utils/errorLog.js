const KEY = 'restropos_error_log';
const MAX = 200;

export function logClientError(message, extra = {}) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    list.unshift({ at: new Date().toISOString(), message: String(message).slice(0, 2000), ...extra });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function readClientErrors() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearClientErrors() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function installGlobalErrorLogging() {
  window.addEventListener('error', (e) => {
    logClientError(e.message, { source: e.filename, line: e.lineno });
  });
  window.addEventListener('unhandledrejection', (e) => {
    logClientError(e.reason?.message || String(e.reason), { type: 'promise' });
  });
}
