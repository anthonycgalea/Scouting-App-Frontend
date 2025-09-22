const removeTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return removeTrailingSlash(envUrl.trim());
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }

  console.warn('VITE_API_BASE_URL is not set. Falling back to relative API paths.');
  return '';
};

export const API_BASE_URL = getBaseUrl();

export const createApiUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
};
