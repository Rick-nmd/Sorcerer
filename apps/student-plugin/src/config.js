const STORAGE_KEY = "sorcerer_api_base_url";
const API_KEY_STORAGE_KEY = "sorcerer_api_key";

export const defaultApiBaseUrl = "http://localhost:8787";

export function getApiBaseUrl() {
  return localStorage.getItem(STORAGE_KEY) || defaultApiBaseUrl;
}

export function setApiBaseUrl(value) {
  localStorage.setItem(STORAGE_KEY, value.trim());
}

export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
}

export function setApiKey(value) {
  localStorage.setItem(API_KEY_STORAGE_KEY, value.trim());
}
