import apiClient from './apiClient';

export const predictionService = {
  async getForecast(metricType, horizonDays = 30) {
    const response = await apiClient.get('/predictions', {
      params: { metricType, horizonDays },
    });

    return response.data.data;
  },
};
