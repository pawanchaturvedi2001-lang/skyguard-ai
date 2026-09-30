import React from 'react';
import { Thermometer, Gauge, Droplets } from 'lucide-react';
import { formatToIST } from '../utils/dateUtils';

export default function CoreSensorCards({ latestTelemetry, loading }) {
  const getStatusBadge = (value, minNorm, maxNorm, isAnomaly) => {
    if (isAnomaly) {
      return <span className="badge badge-critical">ANOMALY</span>;
    }
    if (value < minNorm || value > maxNorm) {
      return <span className="badge badge-warning">ELEVATED</span>;
    }
    return <span className="badge badge-normal">NOMINAL</span>;
  };

  const temp = latestTelemetry?.temperature != null ? Number(latestTelemetry.temperature).toFixed(1) : '--';
  const pres = latestTelemetry?.pressure != null ? Number(latestTelemetry.pressure).toFixed(1) : '--';
  const hum = latestTelemetry?.humidity != null ? Number(latestTelemetry.humidity).toFixed(1) : '--';

  const isAnom = latestTelemetry?.anomaly === true;
  const updateTimeIST = latestTelemetry?.timestamp 
    ? formatToIST(latestTelemetry.timestamp, 'time_short') 
    : 'Realtime';
  const stationId = latestTelemetry?.station_id || 'AWS-001';

  return (
    <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
      {/* 1. TEMPERATURE CARD */}
      <div className={`telemetry-card ${isAnom && latestTelemetry?.temperature > 40 ? 'highlight' : ''}`}>
        <div className="card-header">
          <div className="card-title">
            <div style={{ ...styles.iconBox, color: '#ea580c', background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.25)' }}>
              <Thermometer size={18} />
            </div>
            <span>Thermal Subsystem</span>
          </div>
          {getStatusBadge(Number(temp), 18, 38, isAnom && (Number(temp) > 38 || Number(temp) < 15))}
        </div>

        <div style={styles.readingContainer}>
          <div style={styles.metricRow}>
            <span className="mono-value" style={styles.mainNumber}>{temp}</span>
            <span style={styles.unit}>°C</span>
          </div>
          <div style={styles.subtext}>
            <span>Temperature Sensor</span>
          </div>
        </div>

        <div style={styles.cardFooter}>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Nominal Range</span>
            <span className="mono-value" style={styles.footerValue}>18.0 - 35.0 °C</span>
          </div>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Sensor Node</span>
            <span className="mono-value" style={styles.footerValue}>{stationId}</span>
          </div>
        </div>
      </div>

      {/* 2. ATMOSPHERIC PRESSURE CARD */}
      <div className={`telemetry-card ${isAnom && (latestTelemetry?.pressure > 1030 || latestTelemetry?.pressure < 990) ? 'highlight' : ''}`}>
        <div className="card-header">
          <div className="card-title">
            <div style={{ ...styles.iconBox, color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
              <Gauge size={18} />
            </div>
            <span>Barometric Sensor</span>
          </div>
          {getStatusBadge(Number(pres), 998, 1020, isAnom && (Number(pres) > 1025 || Number(pres) < 990))}
        </div>

        <div style={styles.readingContainer}>
          <div style={styles.metricRow}>
            <span className="mono-value" style={styles.mainNumber}>{pres}</span>
            <span style={styles.unit}>hPa</span>
          </div>
          <div style={styles.subtext}>
            <span>Atmospheric Pressure</span>
          </div>
        </div>

        <div style={styles.cardFooter}>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Standard Target</span>
            <span className="mono-value" style={styles.footerValue}>1008.0 hPa</span>
          </div>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Subsystem</span>
            <span className="mono-value" style={styles.footerValue}>BARO-01</span>
          </div>
        </div>
      </div>

      {/* 3. RELATIVE HUMIDITY CARD */}
      <div className={`telemetry-card ${isAnom && latestTelemetry?.humidity > 90 ? 'highlight' : ''}`}>
        <div className="card-header">
          <div className="card-title">
            <div style={{ ...styles.iconBox, color: '#0d9488', background: 'rgba(13, 148, 136, 0.1)', border: '1px solid rgba(13, 148, 136, 0.25)' }}>
              <Droplets size={18} />
            </div>
            <span>Relative Humidity</span>
          </div>
          {getStatusBadge(Number(hum), 30, 85, isAnom && Number(hum) > 85)}
        </div>

        <div style={styles.readingContainer}>
          <div style={styles.metricRow}>
            <span className="mono-value" style={styles.mainNumber}>{hum}</span>
            <span style={styles.unit}>%</span>
          </div>
          <div style={styles.subtext}>
            <span>Moisture & Vapor Density</span>
          </div>
        </div>

        <div style={styles.cardFooter}>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Moisture Band</span>
            <span className="mono-value" style={styles.footerValue}>30.0 - 80.0 %</span>
          </div>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Last Ping (IST)</span>
            <span className="mono-value" style={styles.footerValue}>{updateTimeIST}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  iconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingContainer: {
    margin: '14px 0 16px 0',
  },
  metricRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  mainNumber: {
    fontSize: '2.4rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    lineHeight: 1,
  },
  unit: {
    fontSize: '1rem',
    fontWeight: '500',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  subtext: {
    fontSize: '0.76rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
  },
  cardFooter: {
    borderTop: '1px solid var(--border-subtle)',
    paddingTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  footerLabel: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  footerValue: {
    fontSize: '0.75rem',
    color: 'var(--text-main)',
    fontWeight: '500',
  },
};
