/**
 * Single source of truth for the backend API base URL.
 * Set REACT_APP_API_BASE in `.env` to override (e.g. http://192.168.1.5:8000/api)
 */
const DEFAULT_API_BASE = 'http://localhost:8000/api';

function normalizeBase(url) {
  return String(url || '').replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeBase(
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
    DEFAULT_API_BASE
);

/** Returns the API root (no trailing slash), same as API_BASE_URL */
export function apiBase() {
  return API_BASE_URL;
}

export function authHeaders() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
