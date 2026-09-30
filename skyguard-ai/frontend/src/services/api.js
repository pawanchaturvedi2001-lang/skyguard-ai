import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Unable to communicate with SkyGuard AI backend.';
    let details = null;
    let status = null;

    if (error.response) {
      status = error.response.status;
      if (status === 422 && error.response.data?.details) {
        message = error.response.data.message || 'Validation failed on telemetry input.';
        details = error.response.data.details;
      } else if (error.response.data?.detail) {
        message = typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail);
      } else if (error.response.statusText) {
        message = `HTTP ${status}: ${error.response.statusText}`;
      }
    } else if (error.request) {
      message = 'Backend server offline or unreachable on ' + API_BASE_URL;
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject({
      message,
      details,
      status,
      originalError: error,
    });
  }
);

export const apiService = {
  // System & Health
  async getHealth() {
    const res = await apiClient.get('/api/health');
    return res.data;
  },

  async getModelInfo() {
    const res = await apiClient.get('/api/model-info');
    return res.data;
  },

  // Dashboard Aggregates
  async getDashboardSummary() {
    const res = await apiClient.get('/api/dashboard/summary');
    return res.data;
  },

  // Telemetry Records
  async getTelemetry({ limit = 50, offset = 0, station_id = null, state = null, city = null } = {}) {
    const params = { limit, offset };
    if (station_id) params.station_id = station_id;
    if (state) params.state = state;
    if (city) params.city = city;
    const res = await apiClient.get('/api/telemetry', { params });
    return res.data;
  },

  // Anomalies Records
  async getAnomalies({ limit = 50, offset = 0, severity = null, station_id = null, state = null, city = null } = {}) {
    const params = { limit, offset };
    if (severity) params.severity = severity;
    if (station_id) params.station_id = station_id;
    if (state) params.state = state;
    if (city) params.city = city;
    const res = await apiClient.get('/api/anomalies', { params });
    return res.data;
  },

  // AWS Stations Registry
  async getStations() {
    const res = await apiClient.get('/api/stations');
    return res.data;
  },

  // Single Telemetry Prediction
  async predictSingle(telemetryRecord) {
    const res = await apiClient.post('/api/predict', telemetryRecord);
    return res.data;
  },

  // Batch Telemetry Prediction
  async predictBatch(records) {
    const res = await apiClient.post('/api/predict/batch', { records });
    return res.data;
  },

  // City Weather Network Microservices
  async getWeatherCities() {
    const res = await apiClient.get('/api/weather/cities');
    return res.data;
  },

  async searchLocations(query) {
    const res = await apiClient.get('/api/locations/search', {
      params: { q: query }
    });
    return res.data;
  },

  async getCityWeather(target) {
    const params = typeof target === 'string' ? { city: target } : target;
    const res = await apiClient.get('/api/weather/current', { params });
    return res.data;
  },

  async getAllCitiesWeather() {
    const res = await apiClient.get('/api/weather/all');
    return res.data;
  },
};

export default apiService;
