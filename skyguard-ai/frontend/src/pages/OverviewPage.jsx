import React from 'react';
import SummaryCards from '../components/SummaryCards';
import CoreSensorCards from '../components/CoreSensorCards';
import TelemetryChart from '../components/TelemetryChart';
import AnomalyFeed from '../components/AnomalyFeed';
import { Cpu, ShieldCheck, Radio, ArrowRight } from 'lucide-react';

export default function OverviewPage({
  summaryData,
  telemetryData,
  anomaliesData,
  systemHealth,
  modelInfo,
  loading,
  setActiveTab,
}) {
  const latestTelemetry = telemetryData && telemetryData.length > 0 ? telemetryData[0] : null;

  return (
    <div>
      {/* Header Banner */}
      <div style={styles.topBanner}>
        <div>
          <h2 style={styles.bannerTitle}>
            Satellite Telemetry Intelligence & Anomaly Detection
          </h2>
          <p style={styles.bannerSubtitle}>
            Real-time multi-sensor telemetry monitoring with unsupervised Isolation Forest outlier identification.
          </p>
        </div>
        <div style={styles.modelStatusPill}>
          <Cpu size={15} color="#0284c7" />
          <span style={{ color: '#64748b' }}>Algorithm:</span>
          <span style={{ color: '#0f172a', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {modelInfo?.algorithm || 'Isolation Forest (200 Trees)'}
          </span>
          <span className="badge badge-normal" style={{ marginLeft: '4px' }}>
            {systemHealth?.model_loaded ? 'ACTIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <SummaryCards summaryData={summaryData} loading={loading} />

      {/* 3 Core Sensor Cards (Temperature, Pressure, Humidity) */}
      <CoreSensorCards latestTelemetry={latestTelemetry} loading={loading} />

      {/* Interactive Telemetry Trajectory Chart */}
      <TelemetryChart telemetryData={telemetryData} loading={loading} />

      {/* Anomaly Event Feed */}
      <AnomalyFeed 
        anomalies={anomaliesData} 
        onViewAll={() => setActiveTab('history')} 
        loading={loading} 
      />
    </div>
  );
}

const styles = {
  topBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '22px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  bannerTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  bannerSubtitle: {
    fontSize: '0.80rem',
    color: '#64748b',
    marginTop: '3px',
  },
  modelStatusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: 'var(--radius-sm)',
    background: '#ffffff',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-card)',
    fontSize: '0.78rem',
  },
};
