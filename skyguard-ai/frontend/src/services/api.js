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
    const data = res.data;

    // If backend meteorological provider was throttled (HTTP 429) from cloud shared IP,
    // seamlessly query Open-Meteo directly from user's browser, then run SkyGuard ML model via /api/predict
    if (!data.weather_available && data.latitude && data.longitude) {
      try {
        const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${data.latitude}&longitude=${data.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,surface_pressure,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation,rain,is_day`;
        const omRes = await fetch(omUrl);
        if (omRes.ok) {
          const omData = await omRes.json();
          const curr = omData.current;
          if (curr) {
            let mlResult = null;
            try {
              mlResult = await apiService.predictSingle({
                temperature: curr.temperature_2m,
                humidity: curr.relative_humidity_2m,
                pressure: curr.pressure_msl || curr.surface_pressure || 1013.25,
                station_id: data.station_code || 'AWS-LIVE',
                state: data.state || 'India',
                city: data.city || 'India'
              });
            } catch (mlErr) {
              console.warn('ML inference notice:', mlErr);
            }

            return {
              ...data,
              temperature: Math.round(curr.temperature_2m * 10) / 10,
              apparent_temperature: Math.round(curr.apparent_temperature * 10) / 10,
              humidity: Math.round(curr.relative_humidity_2m * 10) / 10,
              pressure: Math.round((curr.pressure_msl || curr.surface_pressure || 1013.25) * 10) / 10,
              surface_pressure: Math.round((curr.surface_pressure || curr.pressure_msl || 1013.25) * 10) / 10,
              wind_speed: Math.round(curr.wind_speed_10m * 10) / 10,
              wind_direction: Math.round(curr.wind_direction_10m * 10) / 10,
              wind_direction_compass: getWindCompass(curr.wind_direction_10m),
              cloud_cover: Math.round(curr.cloud_cover || 0),
              precipitation: Math.round((curr.precipitation || 0) * 100) / 100,
              rain: Math.round((curr.rain || 0) * 100) / 100,
              is_day: curr.is_day !== undefined ? curr.is_day : 1,
              weather_code: curr.weather_code,
              weather_condition: getConditionString(curr.weather_code),
              observation_time: `${(curr.time || '').replace('T', ' ')} UTC`,
              weather_available: true,
              analysis_status: mlResult ? (mlResult.is_anomaly ? 'anomaly' : 'normal') : 'normal',
              is_anomaly: mlResult ? mlResult.is_anomaly : false,
              anomaly_score: mlResult ? mlResult.anomaly_score : null,
              confidence: mlResult ? mlResult.confidence : 'HIGH',
              severity: mlResult ? mlResult.severity : 'LOW',
              analysis_note: mlResult
                ? 'Telemetry verified & evaluated in real-time via SkyGuard AI Isolation Forest model.'
                : 'Direct meteorological telemetry received.'
            };
          }
        }
      } catch (clientErr) {
        console.warn('Client-side weather fetch fallback failed:', clientErr);
      }
    }

    return data;
  },

  async getAllCitiesWeather() {
    const res = await apiClient.get('/api/weather/all');
    const data = res.data;

    // Check if cities had unavailable weather due to cloud IP rate limiting
    if (data?.cities && data.cities.some(c => !c.weather_available)) {
      try {
        const lats = data.cities.map(c => c.latitude).join(',');
        const lons = data.cities.map(c => c.longitude).join(',');
        const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,surface_pressure,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation,rain,is_day`;
        const omRes = await fetch(omUrl);
        if (omRes.ok) {
          const omDataList = await omRes.json();
          const resultsList = Array.isArray(omDataList) ? omDataList : [omDataList];

          const batchRecords = [];
          const updatedCities = data.cities.map((city, idx) => {
            const omItem = resultsList[idx];
            const curr = omItem?.current;
            if (!curr) return city;

            batchRecords.push({
              temperature: curr.temperature_2m,
              humidity: curr.relative_humidity_2m,
              pressure: curr.pressure_msl || curr.surface_pressure || 1013.25,
              station_id: city.station_code || `AWS-${idx+1}`,
              state: city.state || 'India',
              city: city.city || 'India'
            });

            return {
              ...city,
              temperature: Math.round(curr.temperature_2m * 10) / 10,
              apparent_temperature: Math.round(curr.apparent_temperature * 10) / 10,
              humidity: Math.round(curr.relative_humidity_2m * 10) / 10,
              pressure: Math.round((curr.pressure_msl || curr.surface_pressure || 1013.25) * 10) / 10,
              surface_pressure: Math.round((curr.surface_pressure || curr.pressure_msl || 1013.25) * 10) / 10,
              wind_speed: Math.round(curr.wind_speed_10m * 10) / 10,
              wind_direction: Math.round(curr.wind_direction_10m * 10) / 10,
              wind_direction_compass: getWindCompass(curr.wind_direction_10m),
              cloud_cover: Math.round(curr.cloud_cover || 0),
              precipitation: Math.round((curr.precipitation || 0) * 100) / 100,
              rain: Math.round((curr.rain || 0) * 100) / 100,
              is_day: curr.is_day !== undefined ? curr.is_day : 1,
              weather_code: curr.weather_code,
              weather_condition: getConditionString(curr.weather_code),
              observation_time: `${(curr.time || '').replace('T', ' ')} UTC`,
              weather_available: true,
              analysis_status: 'normal',
              is_anomaly: false,
              confidence: 'HIGH',
              severity: 'LOW',
              analysis_note: 'Direct meteorological telemetry received.'
            };
          });

          // Run batch ML prediction on live data
          if (batchRecords.length > 0) {
            try {
              const mlBatchRes = await apiService.predictBatch(batchRecords);
              if (mlBatchRes?.results) {
                mlBatchRes.results.forEach((pred, i) => {
                  if (updatedCities[i]) {
                    updatedCities[i].analysis_status = pred.is_anomaly ? 'anomaly' : 'normal';
                    updatedCities[i].is_anomaly = pred.is_anomaly;
                    updatedCities[i].anomaly_score = pred.anomaly_score;
                    updatedCities[i].confidence = pred.confidence;
                    updatedCities[i].severity = pred.severity;
                    updatedCities[i].analysis_note = 'Evaluated via SkyGuard AI Isolation Forest model.';
                  }
                });
              }
            } catch (batchErr) {
              console.warn('Batch ML prediction notice:', batchErr);
            }
          }

          return {
            ...data,
            cities: updatedCities
          };
        }
      } catch (err) {
        console.warn('Batch client weather fetch failed:', err);
      }
    }

    return data;
  },
};

const WMO_WEATHER_CODES = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  56: "Light Freezing Drizzle",
  57: "Dense Freezing Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  66: "Light Freezing Rain",
  67: "Heavy Freezing Rain",
  71: "Slight Snow Fall",
  73: "Moderate Snow Fall",
  75: "Heavy Snow Fall",
  77: "Snow Grains",
  80: "Slight Rain Showers",
  81: "Moderate Rain Showers",
  82: "Violent Rain Showers",
  85: "Slight Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Slight Hail",
  99: "Thunderstorm with Heavy Hail"
};

function getConditionString(code) {
  if (code === null || code === undefined) return "Unavailable";
  return WMO_WEATHER_CODES[code] || (code >= 51 && code <= 67 ? "Rainy" : "Cloudy");
}

function getWindCompass(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(((degrees || 0) % 360) / 22.5) % 16];
}

export default apiService;
