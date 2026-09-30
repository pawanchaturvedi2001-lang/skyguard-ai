import React, { useState } from 'react';
import CoreSensorCards from '../components/CoreSensorCards';
import TelemetryChart from '../components/TelemetryChart';
import { Radio, Play, Pause, RefreshCw, Filter, Layers } from 'lucide-react';

export default function LiveTelemetryPage({
  telemetryData = [],
  loading,
  onRefresh,
  autoRefresh,
  setAutoRefresh,
  selectedStation,
  setSelectedStation,
}) {
  const stations = ['ALL', 'AWS-001', 'AWS-002', 'AWS-003', 'AWS-004', 'AWS-005'];
  const latest = telemetryData && telemetryData.length > 0 ? telemetryData[0] : null;

  return (
    <div>
      {/* Header Controls Bar */}
      <div style={styles.topControlBar}>
        <div style={styles.leftInfo}>
          <div style={styles.streamBadge}>
            <span className="live-pulse"></span>
            <span>NEAR REAL-TIME TELEMETRY FEED</span>
          </div>
          <span style={styles.streamDetails}>
            Polling REST API every 6 seconds • Zero backend WebSocket overhead
          </span>
        </div>

        <div style={styles.rightControls}>
          {/* Station Filter */}
          <div style={styles.stationFilter}>
            <Filter size={13} color="#64748b" />
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value === 'ALL' ? null : e.target.value)}
              style={styles.select}
            >
              <option value="ALL">All Satellite Nodes</option>
              {stations.filter(s => s !== 'ALL').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Auto-refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              ...styles.controlBtn,
              background: autoRefresh ? '#ecfdf5' : '#f1f5f9',
              borderColor: autoRefresh ? '#a7f3d0' : '#e2e8f0',
              color: autoRefresh ? '#059669' : '#64748b',
            }}
          >
            {autoRefresh ? <Pause size={13} /> : <Play size={13} />}
            <span>{autoRefresh ? 'STREAMING' : 'PAUSED'}</span>
          </button>

          {/* Manual Refresh */}
          <button onClick={onRefresh} disabled={loading} style={styles.iconBtn} title="Fetch new packets">
            <RefreshCw size={14} color="#64748b" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Core Sensor Gauges */}
      <CoreSensorCards latestTelemetry={latest} loading={loading} />

      {/* Primary Chart */}
      <TelemetryChart telemetryData={telemetryData} loading={loading} />

      {/* Live Stream Table */}
      <div className="telemetry-card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="#0284c7" />
            <span>Incoming Observation Log ({telemetryData.length} Recent Packets)</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            Filter: {selectedStation || 'ALL NODES'}
          </span>
        </div>

        <div className="table-responsive">
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Node ID</th>
                <th>Temp (°C)</th>
                <th>Pressure (hPa)</th>
                <th>Humidity (%)</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && telemetryData.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Receiving satellite packets...
                  </td>
                </tr>
              ) : telemetryData.slice(0, 15).map((row, idx) => {
                const isAnom = row.anomaly === true;
                return (
                  <tr key={idx}>
                    <td className="mono-value" style={{ fontSize: '0.76rem', color: '#334155' }}>
                      {row.timestamp}
                    </td>
                    <td>
                      <span className="badge badge-info">{row.station_id || 'SAT-001'}</span>
                    </td>
                    <td className="mono-value" style={{ color: Number(row.temperature) > 40 ? '#ea580c' : '#0f172a', fontWeight: Number(row.temperature) > 40 ? '600' : 'normal' }}>
                      {row.temperature != null ? Number(row.temperature).toFixed(2) : '--'}
                    </td>
                    <td className="mono-value" style={{ color: Number(row.pressure) > 1025 || Number(row.pressure) < 995 ? '#0284c7' : '#0f172a', fontWeight: Number(row.pressure) > 1025 || Number(row.pressure) < 995 ? '600' : 'normal' }}>
                      {row.pressure != null ? Number(row.pressure).toFixed(2) : '--'}
                    </td>
                    <td className="mono-value" style={{ color: Number(row.humidity) > 90 ? '#0284c7' : '#0f172a', fontWeight: Number(row.humidity) > 90 ? '600' : 'normal' }}>
                      {row.humidity != null ? Number(row.humidity).toFixed(2) : '--'}
                    </td>
                    <td className="mono-value" style={{ color: isAnom ? '#dc2626' : '#059669', fontSize: '0.75rem', fontWeight: '600' }}>
                      {row.anomaly_score != null ? Number(row.anomaly_score).toFixed(4) : '--'}
                    </td>
                    <td>
                      {isAnom ? (
                        <span className="badge badge-critical">{row.severity || 'ANOMALY'}</span>
                      ) : (
                        <span className="badge badge-normal">NOMINAL</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  topControlBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    backgroundColor: '#ffffff',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-card)',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  leftInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  streamBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.74rem',
    fontWeight: '700',
    color: '#0284c7',
    fontFamily: 'var(--font-mono)',
  },
  streamDetails: {
    fontSize: '0.74rem',
    color: '#64748b',
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  stationFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#f8fafc',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
  },
  select: {
    background: 'transparent',
    border: 'none',
    color: '#0f172a',
    fontSize: '0.76rem',
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    cursor: 'pointer',
  },
  controlBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    fontSize: '0.72rem',
    fontWeight: '600',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  iconBtn: {
    padding: '7px',
    borderRadius: 'var(--radius-sm)',
    background: '#ffffff',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
