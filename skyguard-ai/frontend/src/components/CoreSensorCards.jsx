import React from 'react';
import { Thermometer, Gauge, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  const updateTime = latestTelemetry?.timestamp || 'Live Stream Active';
  const stationId = latestTelemetry?.station_id || 'SAT-001';

  return (
    <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
      {/* 1. TEMPERATURE CARD */}
      <div className={`telemetry-card ${isAnom && latestTelemetry?.temperature > 40 ? 'highlight' : ''}`}>
        <div className="card-header">
          <div className="card-title">
            <div style={{ ...styles.iconBox, color: '#ea580c', background: '#fff7ed', border: '1px solid #ffedd5' }}>
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
            <span>Core Satellite Temperature</span>
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
            <div style={{ ...styles.iconBox, color: '#0284c7', background: '#eff6ff', border: '1px solid #dbeafe' }}>
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
            <div style={{ ...styles.iconBox, color: '#0284c7', background: '#f0f9ff', border: '1px solid #e0f2fe' }}>
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
            <span style={styles.footerLabel}>Last Ping</span>
            <span className="mono-value" style={styles.footerValue}>{updateTime.split(' ')[1] || 'Realtime'}</span>
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
    color: '#0f172a',
    lineHeight: 1,
  },
  unit: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#64748b',
    fontFamily: 'var(--font-mono)',
  },
  subtext: {
    fontSize: '0.76rem',
    color: '#64748b',
    marginTop: '6px',
  },
  cardFooter: {
    borderTop: '1px solid #f1f5f9',
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
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  footerValue: {
    fontSize: '0.75rem',
    color: '#334155',
    fontWeight: '500',
  },
};
