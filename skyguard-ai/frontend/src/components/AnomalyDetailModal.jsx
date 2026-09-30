import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Thermometer, 
  Gauge, 
  Droplets, 
  CloudSun, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Wind,
  Compass,
  AlertOctagon,
  Layers,
  Info
} from 'lucide-react';
import { formatToIST } from '../utils/dateUtils';
import { apiService } from '../services/api';

export default function AnomalyDetailModal({ anomaly, onClose }) {
  const [cityWeather, setCityWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!anomaly) return null;

  const cityName = anomaly.city || 'Indore';

  const handleFetchCityWeather = async () => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      // Query Open-Meteo live weather via backend
      const data = await apiService.getCityWeather(cityName);
      setCityWeather(data);
    } catch (err) {
      console.error('Failed to load city weather:', err);
      setWeatherError(err.message || 'Unable to retrieve current weather from Open-Meteo.');
    } finally {
      setLoadingWeather(false);
    }
  };

  const getSeverityBadge = (severity) => {
    const s = String(severity || '').toUpperCase();
    if (s === 'HIGH') {
      return <span className="badge badge-high" style={{ fontSize: '0.78rem' }}>CRITICAL HIGH</span>;
    }
    if (s === 'MEDIUM') {
      return <span className="badge badge-medium" style={{ fontSize: '0.78rem' }}>WARNING MEDIUM</span>;
    }
    if (s === 'LOW') {
      return <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>LOW ADVISORY</span>;
    }
    return <span className="badge badge-normal" style={{ fontSize: '0.78rem' }}>NOMINAL</span>;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={styles.modalCard}
      >
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-critical" style={{ fontSize: '0.72rem' }}>
                <AlertTriangle size={12} />
                <span>INCIDENT INSPECTION</span>
              </span>
              <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                {anomaly.station_id || 'AWS-001'}
              </span>
              <span style={styles.simulatedBadge}>
                {anomaly.station_type || 'Simulated Station Metadata'}
              </span>
            </div>
            <h3 style={styles.modalTitle}>
              {anomaly.station_name || `${anomaly.station_id || 'AWS-001'} Station`}
            </h3>
            <div style={styles.locationSubtitle}>
              <MapPin size={13} color="var(--cyan)" />
              <span>{anomaly.city || 'Indore'}, {anomaly.district ? `${anomaly.district}, ` : ''}{anomaly.state || 'Madhya Pradesh'}</span>
              {anomaly.latitude != null && (
                <span style={styles.coords}>
                  ({Number(anomaly.latitude).toFixed(4)}°N, {Number(anomaly.longitude).toFixed(4)}°E)
                </span>
              )}
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="btn btn-outline" 
            style={styles.closeBtn}
            title="Close modal (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={styles.modalBody}>
          {/* SECTION A: AWS SENSOR OBSERVATION */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <span style={styles.sectionSuper}>DATA CONCEPT A</span>
                <h4 style={styles.sectionTitle}>AWS SENSOR OBSERVATION</h4>
              </div>
              <div style={styles.sourceTag}>
                <span style={styles.sourceDotBlue}></span>
                <span>Source: SkyGuard AWS telemetry</span>
              </div>
            </div>

            {/* Timestamp */}
            <div style={styles.timestampRow}>
              <Clock size={14} color="var(--cyan)" />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Observation Time:</span>
              <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {formatToIST(anomaly.timestamp, 'full')}
              </strong>
            </div>

            {/* Sensor Telemetry 3-Grid */}
            <div style={styles.telemetryGrid}>
              {/* Temperature */}
              <div style={styles.telemetryBox}>
                <div style={styles.telemetryBoxTop}>
                  <span style={styles.telemetryLabel}>TEMPERATURE</span>
                  <Thermometer size={14} color="#ea580c" />
                </div>
                <div className="mono-value" style={styles.telemetryValue}>
                  {anomaly.temperature != null ? Number(anomaly.temperature).toFixed(1) : '--'}
                  <span style={styles.telemetryUnit}>°C</span>
                </div>
                <div style={styles.telemetrySub}>Nominal: 18 - 35°C</div>
              </div>

              {/* Pressure */}
              <div style={styles.telemetryBox}>
                <div style={styles.telemetryBoxTop}>
                  <span style={styles.telemetryLabel}>PRESSURE</span>
                  <Gauge size={14} color="var(--cyan)" />
                </div>
                <div className="mono-value" style={styles.telemetryValue}>
                  {anomaly.pressure != null ? Number(anomaly.pressure).toFixed(1) : '--'}
                  <span style={styles.telemetryUnit}>hPa</span>
                </div>
                <div style={styles.telemetrySub}>Nominal: 995 - 1025 hPa</div>
              </div>

              {/* Humidity */}
              <div style={styles.telemetryBox}>
                <div style={styles.telemetryBoxTop}>
                  <span style={styles.telemetryLabel}>HUMIDITY</span>
                  <Droplets size={14} color="#0d9488" />
                </div>
                <div className="mono-value" style={styles.telemetryValue}>
                  {anomaly.humidity != null ? Number(anomaly.humidity).toFixed(1) : '--'}
                  <span style={styles.telemetryUnit}>%</span>
                </div>
                <div style={styles.telemetrySub}>Nominal: 20 - 85%</div>
              </div>
            </div>

            {/* ML Evaluation Metrics */}
            <div style={styles.mlEvalBox}>
              <div style={styles.mlEvalTop}>
                <span style={styles.mlEvalTitle}>
                  <ShieldCheck size={14} color="var(--cyan)" />
                  <span>Isolation Forest Evaluation</span>
                </span>
                <div>{getSeverityBadge(anomaly.severity)}</div>
              </div>

              <div style={styles.mlMetricsRow}>
                <div>
                  <span style={styles.mlMetricLabel}>Decision Score</span>
                  <div className="mono-value" style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: Number(anomaly.anomaly_score) < 0 ? 'var(--status-critical)' : 'var(--status-normal)'
                  }}>
                    {anomaly.anomaly_score != null ? Number(anomaly.anomaly_score).toFixed(6) : '--'}
                  </div>
                  <span style={styles.mlScoreHint}>&lt; 0 triggers outlier alarm</span>
                </div>

                <div>
                  <span style={styles.mlMetricLabel}>Model Confidence</span>
                  <div className="mono-value" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {anomaly.confidence != null ? `${(Number(anomaly.confidence) * 100).toFixed(1)}%` : '--'}
                  </div>
                  <span style={styles.mlScoreHint}>Calibrated probability</span>
                </div>

                <div>
                  <span style={styles.mlMetricLabel}>Anomaly Classification</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {anomaly.injected_anomaly_type || (anomaly.anomaly ? 'Outlier Signal' : 'Nominal')}
                  </div>
                  <span style={styles.mlScoreHint}>15-feature space</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: EXTERNAL CURRENT WEATHER DATA */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <span style={styles.sectionSuper}>DATA CONCEPT B</span>
                <h4 style={styles.sectionTitle}>CURRENT CITY WEATHER</h4>
              </div>
              <div style={styles.sourceTag}>
                <span style={styles.sourceDotGreen}></span>
                <span>Source: Open-Meteo REST API</span>
              </div>
            </div>

            {!cityWeather && !loadingWeather && (
              <div style={styles.weatherPrompt}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.45 }}>
                  Retrieve live external meteorological observations for <strong>{cityName}</strong> to cross-examine whether ambient regional weather conditions correlate with the physical sensor reading.
                </p>
                <button 
                  onClick={handleFetchCityWeather}
                  className="btn btn-primary"
                  style={{ fontSize: '0.80rem', padding: '7px 14px' }}
                >
                  <CloudSun size={15} />
                  <span>View Current City Weather ({cityName})</span>
                </button>
              </div>
            )}

            {loadingWeather && (
              <div style={styles.weatherLoading}>
                <RefreshCw size={20} color="var(--cyan)" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Querying Open-Meteo weather endpoint for {cityName}...</span>
              </div>
            )}

            {weatherError && (
              <div style={styles.weatherError}>
                <AlertOctagon size={16} color="var(--status-critical)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--status-critical)' }}>{weatherError}</span>
                <button 
                  onClick={handleFetchCityWeather} 
                  className="btn btn-outline"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                >
                  Retry
                </button>
              </div>
            )}

            {cityWeather && (
              <div style={styles.weatherDetails}>
                <div style={styles.weatherMetaRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CloudSun size={18} color="var(--cyan)" />
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                        {cityWeather.city}, {cityWeather.state || 'India'}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        Condition: {cityWeather.weather_condition}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={handleFetchCityWeather} 
                    className="btn btn-outline"
                    style={{ fontSize: '0.70rem', padding: '3px 8px' }}
                    title="Refresh live weather"
                  >
                    <RefreshCw size={11} />
                    <span>Sync</span>
                  </button>
                </div>

                <div style={styles.telemetryGrid}>
                  <div style={styles.telemetryBox}>
                    <span style={styles.telemetryLabel}>METEO TEMP</span>
                    <div className="mono-value" style={styles.telemetryValue}>
                      {cityWeather.temperature != null ? Number(cityWeather.temperature).toFixed(1) : '--'}
                      <span style={styles.telemetryUnit}>°C</span>
                    </div>
                    <div style={styles.telemetrySub}>
                      Feels like: {cityWeather.apparent_temperature != null ? `${Number(cityWeather.apparent_temperature).toFixed(1)}°C` : '--'}
                    </div>
                  </div>

                  <div style={styles.telemetryBox}>
                    <span style={styles.telemetryLabel}>PRESSURE MSL</span>
                    <div className="mono-value" style={styles.telemetryValue}>
                      {cityWeather.pressure != null ? Number(cityWeather.pressure).toFixed(1) : '--'}
                      <span style={styles.telemetryUnit}>hPa</span>
                    </div>
                    <div style={styles.telemetrySub}>
                      Surface: {cityWeather.surface_pressure != null ? `${Number(cityWeather.surface_pressure).toFixed(1)} hPa` : '--'}
                    </div>
                  </div>

                  <div style={styles.telemetryBox}>
                    <span style={styles.telemetryLabel}>HUMIDITY</span>
                    <div className="mono-value" style={styles.telemetryValue}>
                      {cityWeather.humidity != null ? Number(cityWeather.humidity).toFixed(0) : '--'}
                      <span style={styles.telemetryUnit}>%</span>
                    </div>
                    <div style={styles.telemetrySub}>
                      Wind: {cityWeather.wind_speed != null ? `${cityWeather.wind_speed} km/h ${cityWeather.wind_direction_compass || ''}` : '--'}
                    </div>
                  </div>
                </div>

                <div style={styles.weatherFooterNote}>
                  <Info size={12} color="var(--cyan)" />
                  <span>
                    Observed: {formatToIST(cityWeather.observation_time, 'full')} • Data represents regional atmospheric condition, not sensor hardware state.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={styles.modalFooter}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Press Esc or click outside to dismiss
          </span>
          <button onClick={onClose} className="btn btn-outline" style={{ fontSize: '0.80rem' }}>
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalCard: {
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-card-subtle)',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    margin: '6px 0 2px 0',
  },
  locationSubtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  coords: {
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
  },
  simulatedBadge: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-base)',
    border: '1px solid var(--border-subtle)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'var(--font-mono)',
  },
  closeBtn: {
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  sectionCard: {
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 18px',
    backgroundColor: 'var(--bg-surface)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--border-subtle)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sectionSuper: {
    fontSize: '0.64rem',
    fontWeight: 700,
    color: 'var(--cyan)',
    letterSpacing: '0.06em',
    display: 'block',
  },
  sectionTitle: {
    fontSize: '0.92rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    letterSpacing: '0.01em',
  },
  sourceTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.70rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-card-subtle)',
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid var(--border-subtle)',
    fontFamily: 'var(--font-mono)',
  },
  sourceDotBlue: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
  },
  sourceDotGreen: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#059669',
  },
  timestampRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
    backgroundColor: 'var(--bg-card-subtle)',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-subtle)',
  },
  telemetryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '14px',
  },
  telemetryBox: {
    backgroundColor: 'var(--bg-card-subtle)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    padding: '10px 12px',
  },
  telemetryBoxTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  telemetryLabel: {
    fontSize: '0.66rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
  },
  telemetryValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
  telemetryUnit: {
    fontSize: '0.78rem',
    fontWeight: 'normal',
    color: 'var(--text-muted)',
    marginLeft: '3px',
  },
  telemetrySub: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    marginTop: '3px',
  },
  mlEvalBox: {
    backgroundColor: 'var(--bg-card-subtle)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    padding: '12px 14px',
  },
  mlEvalTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  mlEvalTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.76rem',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
  mlMetricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  mlMetricLabel: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    display: 'block',
  },
  mlScoreHint: {
    fontSize: '0.64rem',
    color: 'var(--text-dim)',
    display: 'block',
    marginTop: '2px',
  },
  weatherPrompt: {
    textAlign: 'center',
    padding: '14px 10px',
  },
  weatherLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '24px',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  weatherError: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: 'var(--status-critical-bg)',
    border: '1px solid var(--status-critical-border)',
    borderRadius: '6px',
  },
  weatherDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  weatherMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherFooterNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.70rem',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-card-subtle)',
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid var(--border-subtle)',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 24px',
    borderTop: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-card-subtle)',
  },
};
