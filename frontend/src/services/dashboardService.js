import apiClient from './apiClient';

export const dashboardService = {
  async getSummary({ from, to } = {}) {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await apiClient.get('/dashboard/summary', { params });
    return response.data.data;
  },
};