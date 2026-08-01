import apiClient from './apiClient';

export async function login(email, password) {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data.data; // unwraps the { success, data } envelope from Document 4
}

export async function register(fullName, email, password, companyName) {
  const response = await apiClient.post('/auth/register', {
    fullName,
    email,
    password,
    companyName,
  });
  return response.data.data;
}

export async function getCurrentUser(token) {
  const response = await apiClient.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
}