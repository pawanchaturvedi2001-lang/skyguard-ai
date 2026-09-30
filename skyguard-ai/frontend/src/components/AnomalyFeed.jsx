import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';

export default function AnomalyFeed({ anomalies = [], onViewAll, loading }) {
  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return <span className="badge badge-high">CRITICAL HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-medium">WARNING MED</span>;
      case 'LOW':
        return <span className="badge badge-warning">LOW ADVISORY</span>;
      default:
        return <span className="badge badge-critical">ANOMALY</span>;
    }
  };

  return (
    <div className="telemetry-card">
      <div className="card-header">
        <div className="card-title">
          <AlertTriangle size={18} color="#dc2626" />
          <span>Active Incident Feed & Detected Outliers</span>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll} 
            className="btn btn-outline" 
            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
          >
            <span>Full History</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="telemetry-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Node / Station</th>
              <th>Temp (°C)</th>
              <th>Pressure (hPa)</th>
              <th>Humidity (%)</th>
              <th>Score</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {loading && anomalies.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  Loading telemetry outliers...
                </td>
              </tr>
            ) : anomalies.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No active telemetry anomalies detected in recent window. All channels nominal.
                </td>
              </tr>
            ) : (
              anomalies.slice(0, 6).map((item, idx) => (
                <tr key={idx}>
                  <td className="mono-value" style={{ fontSize: '0.76rem', color: '#334155' }}>
                    {item.timestamp || 'N/A'}
                  </td>
                  <td>
                    <span className="badge badge-info">{item.station_id || 'SAT-001'}</span>
                  </td>
                  <td className="mono-value" style={{ color: Number(item.temperature) > 40 ? '#ea580c' : '#0f172a', fontWeight: Number(item.temperature) > 40 ? '600' : 'normal' }}>
                    {item.temperature != null ? Number(item.temperature).toFixed(1) : '--'}
                  </td>
                  <td className="mono-value" style={{ color: Number(item.pressure) > 1025 || Number(item.pressure) < 995 ? '#0284c7' : '#0f172a', fontWeight: Number(item.pressure) > 1025 || Number(item.pressure) < 995 ? '600' : 'normal' }}>
                    {item.pressure != null ? Number(item.pressure).toFixed(1) : '--'}
                  </td>
                  <td className="mono-value" style={{ color: Number(item.humidity) > 90 ? '#0284c7' : '#0f172a', fontWeight: Number(item.humidity) > 90 ? '600' : 'normal' }}>
                    {item.humidity != null ? Number(item.humidity).toFixed(1) : '--'}
                  </td>
                  <td className="mono-value" style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: '600' }}>
                    {item.anomaly_score != null ? Number(item.anomaly_score).toFixed(4) : '--'}
                  </td>
                  <td>
                    {getSeverityBadge(item.severity)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
