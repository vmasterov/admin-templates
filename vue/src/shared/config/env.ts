const env = window.__env__ ?? {
  API_URL: 'http://localhost:3001',
};

export const API_URL = env.API_URL;
