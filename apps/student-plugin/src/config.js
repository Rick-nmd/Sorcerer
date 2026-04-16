const STORAGE_KEY = "sorcerer_api_base_url";
const API_KEY_STORAGE_KEY = "sorcerer_api_key";
const SESSION_STORAGE_KEY = "sorcerer_student_session_id";
const CONSENT_PREFS_STORAGE_KEY = "sorcerer_consent_preferences";

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

function createSessionId() {
  return `student_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export function getOrCreateStudentSessionId() {
  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const created = createSessionId();
  localStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

export function getConsentPreferences() {
  try {
    const raw = localStorage.getItem(CONSENT_PREFS_STORAGE_KEY);
    if (!raw) {
      return {
        telemetry: true,
        school_support: true,
        partner_offers: false
      };
    }
    const parsed = JSON.parse(raw);
    return {
      telemetry: Boolean(parsed.telemetry),
      school_support: Boolean(parsed.school_support),
      partner_offers: Boolean(parsed.partner_offers)
    };
  } catch (_error) {
    return {
      telemetry: true,
      school_support: true,
      partner_offers: false
    };
  }
}

export function setConsentPreferences(value) {
  localStorage.setItem(
    CONSENT_PREFS_STORAGE_KEY,
    JSON.stringify({
      telemetry: Boolean(value.telemetry),
      school_support: Boolean(value.school_support),
      partner_offers: Boolean(value.partner_offers)
    })
  );
}
