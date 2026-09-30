import React from 'react';
import CoreSensorCards from '../components/CoreSensorCards';
import TelemetryChart from '../components/TelemetryChart';
import { Play, Pause, RefreshCw, Filter, Layers } from 'lucide-react';
import { formatToIST } from '../utils/dateUtils';

export default function LiveTelemetryPage({
  telemetryData = [],
  loading,
  onRefresh,
  autoRefresh,
  setAutoRefresh,
  selectedStation,
  setSelectedStation,
}) {
  const stations = [
    'ALL', 
    'AWS-001', 'AWS-002', 'AWS-003', 'AWS-004', 'AWS-005', 
    'AWS-006', 'AWS-007', 'AWS-008', 'AWS-009', 'AWS-010'
  ];
  const latest = telemetryData && telemetryData.length > 0 ? telemetryData[0] : null;

  return (
    <div>
      {/* Header Controls Bar */}
      <div style={styles.topControlBar}>
        <div style={styles.leftInfo}>
          <div style={styles.streamBadge}>
            <span className="live-pulse"></span>
            <span>NEAR REAL-TIME TELEMETRY FEED (IST)</span>
          </div>
          <span style={styles.streamDetails}>
            Polling REST API every 6 seconds • Zero backend WebSocket overhead
          </span>
        </div>

        <div style={styles.rightControls}>
          {/* Station Filter */}
          <div style={styles.stationFilter}>
            <Filter size={13} color="var(--primary-color)" />
            <select
              value={selectedStation || 'ALL'}
              onChange={(e) => setSelectedStation(e.target.value === 'ALL' ? null : e.target.value)}
              style={styles.select}
            >
              <option value="ALL">All Weather Stations</option>
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
              background: autoRefresh ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-canvas)',
              borderColor: autoRefresh ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)',
              color: autoRefresh ? 'var(--status-normal-text)' : 'var(--text-muted)',
            }}
          >
            {autoRefresh ? <Pause size={13} /> : <Play size={13} />}
            <span>{autoRefresh ? 'STREAMING' : 'PAUSED'}</span>
          </button>

          {/* Manual Refresh */}
          <button onClick={onRefresh} disabled={loading} style={styles.iconBtn} title="Fetch new packets">
            <RefreshCw size={14} color="var(--text-muted)" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
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
            <Layers size={18} color="var(--primary-color)" />
            <span>Incoming Observation Log ({telemetryData.length} Recent Packets)</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Filter: {selectedStation || 'ALL WEATHER STATIONS'}
          </span>
        </div>

        <div className="table-responsive">
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Timestamp (IST)</th>
                <th>Station ID</th>
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
                    Receiving AWS telemetry packets...
                  </td>
                </tr>
              ) : telemetryData.slice(0, 15).map((row, idx) => {
                const isAnom = row.anomaly === true;
                return (
                  <tr key={idx}>
                    <td className="mono-value" style={{ fontSize: '0.74rem', color: 'var(--text-main)' }}>
                      {formatToIST(row.timestamp, 'full')}
                    </td>
                    <td>
                      <span className="badge badge-info">{row.station_id || 'AWS-001'}</span>
                    </td>
                    <td className="mono-value" style={{ color: Number(row.temperature) > 40 ? '#ea580c' : 'var(--text-main)', fontWeight: Number(row.temperature) > 40 ? '600' : 'normal' }}>
                      {row.temperature != null ? Number(row.temperature).toFixed(1) : '--'}
                    </td>
                    <td className="mono-value" style={{ color: Number(row.pressure) > 1025 || Number(row.pressure) < 995 ? '#0284c7' : 'var(--text-main)', fontWeight: Number(row.pressure) > 1025 || Number(row.pressure) < 995 ? '600' : 'normal' }}>
                      {row.pressure != null ? Number(row.pressure).toFixed(1) : '--'}
                    </td>
                    <td className="mono-value" style={{ color: Number(row.humidity) > 90 ? '#0284c7' : 'var(--text-main)', fontWeight: Number(row.humidity) > 90 ? '600' : 'normal' }}>
                      {row.humidity != null ? Number(row.humidity).toFixed(1) : '--'}
                    </td>
                    <td className="mono-value" style={{ color: isAnom ? '#dc2626' : 'var(--status-normal-text)', fontSize: '0.75rem', fontWeight: '600' }}>
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
    backgroundColor: 'var(--bg-card)',
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
    color: 'var(--primary-color)',
    fontFamily: 'var(--font-mono)',
  },
  streamDetails: {
    fontSize: '0.74rem',
    color: 'var(--text-muted)',
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
    background: 'var(--bg-canvas)',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
  },
  select: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-main)',
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
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
