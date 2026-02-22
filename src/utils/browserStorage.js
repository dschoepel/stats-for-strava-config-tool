// Safe browser storage helpers — no-ops on server
export const hasLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getItem = (key) => {
  try {
    return hasLocalStorage() ? window.localStorage.getItem(key) : null;
  } catch (e) {
    return null;
  }
};

export const setItem = (key, value) => {
  try {
    if (hasLocalStorage()) window.localStorage.setItem(key, value);
  } catch (e) {
    // ignore
  }
};

export const removeItem = (key) => {
  try {
    if (hasLocalStorage()) window.localStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
};

export const safeDispatch = (name, detail = null) => {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch (e) {
    // ignore
  }
};

export default { hasLocalStorage, getItem, setItem, removeItem, safeDispatch };
