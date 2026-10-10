import apiClient from './apiClient';

export const anomalyService = {
  async list({ severity, reviewed, page = 1, pageSize = 10 } = {}) {
    const params = { page, pageSize };
    if (severity) params.severity = severity;
    if (reviewed !== undefined && reviewed !== '') params.reviewed = reviewed;

    const response = await apiClient.get('/anomalies', { params });
    return response.data.data;
  },

  async scan(windowDays = 90) {
    const response = await apiClient.post('/anomalies/scan', null, {
      params: { windowDays },
    });
    return response.data.data;
  },

  async markReviewed(id) {
    const response = await apiClient.patch(`/anomalies/${id}/review`);
    return response.data.data;
  },
};