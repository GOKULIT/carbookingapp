const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('valam_token');
  },

  setAuth(token, user) {
    localStorage.setItem('valam_token', token);
    localStorage.setItem('valam_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('valam_token');
    localStorage.removeItem('valam_user');
  },

  getUser() {
    const raw = localStorage.getItem('valam_user');
    return raw ? JSON.parse(raw) : null;
  },

  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    const token = this.getToken();

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server request failure');
    return data;
  }
};