import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Database, AlertOctagon, ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react';

export default function EventHistoryPage() {
  const [activeSubTab, setActiveSubTab] = useState('anomalies'); // 'anomalies' | 'telemetry'
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [error, setError] = useState(null);

  const stations = ['AWS-001', 'AWS-002', 'AWS-003', 'AWS-004', 'AWS-005', 'AWS-006', 'AWS-007', 'AWS-008', 'AWS-009', 'AWS-010'];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = page * limit;
      if (activeSubTab === 'anomalies') {
        const res = await apiService.getAnomalies({
          limit,
          offset,
          severity: severityFilter || null,
          station_id: stationFilter || null,
        });
        setData(res.records || []);
        setTotal(res.total || 0);
      } else {
        const res = await apiService.getTelemetry({
          limit,
          offset,
          station_id: stationFilter || null,
        });
        setData(res.records || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch historical observations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab, page, severityFilter, stationFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skyguard_${activeSubTab}_page${page + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Top Navigation & Subtabs */}
      <div style={styles.topBar}>
        <div style={styles.tabToggleGroup}>
          <button
            onClick={() => { setActiveSubTab('anomalies'); setPage(0); }}
            style={{
              ...styles.tabBtn,
              background: activeSubTab === 'anomalies' ? '#fef2f2' : 'transparent',
              borderColor: activeSubTab === 'anomalies' ? '#fecaca' : 'transparent',
              color: activeSubTab === 'anomalies' ? '#dc2626' : '#64748b',
            }}
          >
            <AlertOctagon size={15} />
            <span>Detected Anomalies Archive</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('telemetry'); setPage(0); }}
            style={{
              ...styles.tabBtn,
              background: activeSubTab === 'telemetry' ? '#eff6ff' : 'transparent',
              borderColor: activeSubTab === 'telemetry' ? '#bfdbfe' : 'transparent',
              color: activeSubTab === 'telemetry' ? '#0284c7' : '#64748b',
            }}
          >
            <Database size={15} />
            <span>Complete Telemetry Stream</span>
          </button>
        </div>

        {/* Action Controls */}
        <div style={styles.controlsRow}>
          {activeSubTab === 'anomalies' && (
            <div style={styles.filterBox}>
              <span style={styles.filterLabel}>Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); setPage(0); }}
                style={styles.select}
              >
                <option value="">ALL SEVERITIES</option>
                <option value="HIGH">CRITICAL HIGH</option>
                <option value="MEDIUM">WARNING MEDIUM</option>
                <option value="LOW">LOW ADVISORY</option>
              </select>
            </div>
          )}

          <div style={styles.filterBox}>
            <span style={styles.filterLabel}>Node:</span>
            <select
              value={stationFilter}
              onChange={(e) => { setStationFilter(e.target.value); setPage(0); }}
              style={styles.select}
            >
              <option value="">ALL STATIONS</option>
              {stations.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <button onClick={handleExportCSV} disabled={data.length === 0} className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.74rem' }}>
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="telemetry-card">
        {error && (
          <div style={{ color: '#dc2626', padding: '12px', background: '#fef2f2', borderRadius: '4px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <div className="table-responsive">
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Node ID</th>
                <th>Temp (°C)</th>
                <th>Pressure (hPa)</th>
                <th>Humidity (%)</th>
                {activeSubTab === 'anomalies' && <th>Score</th>}
                {activeSubTab === 'anomalies' && <th>Severity</th>}
                {activeSubTab === 'anomalies' && <th>Confidence</th>}
                {activeSubTab === 'telemetry' && <th>Status</th>}
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading database records...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const isAnom = row.anomaly === true;
                  return (
                    <tr key={idx}>
                      <td className="mono-value" style={{ fontSize: '0.76rem', color: '#334155' }}>
                        {row.timestamp}
                      </td>
                      <td>
                        <span className="badge badge-info">{row.station_id}</span>
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

                      {activeSubTab === 'anomalies' && (
                        <>
                          <td className="mono-value" style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: '600' }}>
                            {row.anomaly_score != null ? Number(row.anomaly_score).toFixed(4) : '--'}
                          </td>
                          <td>
                            <span className={`badge ${
                              row.severity === 'HIGH' ? 'badge-critical' : row.severity === 'MEDIUM' ? 'badge-warning' : 'badge-normal'
                            }`}>
                              {row.severity || 'ANOMALY'}
                            </span>
                          </td>
                          <td className="mono-value" style={{ fontSize: '0.75rem', color: '#334155' }}>
                            {row.confidence != null ? `${(row.confidence * 100).toFixed(1)}%` : '--'}
                          </td>
                        </>
                      )}

                      {activeSubTab === 'telemetry' && (
                        <td>
                          {isAnom ? (
                            <span className="badge badge-critical">{row.severity || 'ANOMALY'}</span>
                          ) : (
                            <span className="badge badge-normal">NOMINAL</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={styles.paginationRow}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Showing <strong>{total === 0 ? 0 : page * limit + 1}</strong> to <strong>{Math.min((page + 1) * limit, total)}</strong> of <strong>{total.toLocaleString()}</strong> events
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.74rem' }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.74rem' }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '14px',
  },
  tabToggleGroup: {
    display: 'flex',
    alignItems: 'center',
    background: '#ffffff',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-card)',
    gap: '4px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '4px',
    border: '1px solid transparent',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#ffffff',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-card)',
  },
  filterLabel: {
    fontSize: '0.70rem',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  select: {
    background: 'transparent',
    border: 'none',
    color: '#0f172a',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    cursor: 'pointer',
  },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    marginTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
};
