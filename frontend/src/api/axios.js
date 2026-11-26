import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const savedAdmin = sessionStorage.getItem('psncet_admin');
  if (savedAdmin) {
    const { token } = JSON.parse(savedAdmin);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default API;