const STORAGE_KEY = "sorcerer_api_base_url";

export const defaultApiBaseUrl = "http://localhost:8787";

export function getApiBaseUrl() {
  return localStorage.getItem(STORAGE_KEY) || defaultApiBaseUrl;
}

export function setApiBaseUrl(value) {
  localStorage.setItem(STORAGE_KEY, value.trim());
}
