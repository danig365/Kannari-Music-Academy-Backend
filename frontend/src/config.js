const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

// API Configuration
// Uses environment variables when provided; otherwise falls back to same-origin paths.
// Note: Do NOT include trailing slash in REACT_APP_API_URL.
export const API_BASE_URL = process.env.REACT_APP_API_URL || `${currentOrigin}/api`;
export const SITE_URL = process.env.REACT_APP_SITE_URL || currentOrigin;
export const JITSI_BASE_URL = process.env.REACT_APP_JITSI_URL || 'https://meet.kannarimusicacademy.com';
