import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Database, AlertOctagon, ChevronLeft, ChevronRight, Filter, Download, RotateCcw, MapPin, Eye } from 'lucide-react';
import { formatToIST } from '../utils/dateUtils';
import AnomalyDetailModal from '../components/AnomalyDetailModal';

export default function EventHistoryPage() {
  const [activeSubTab, setActiveSubTab] = useState('anomalies'); // 'anomalies' | 'telemetry'
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cascading filters
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Modal inspection
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [stationsList, setStationsList] = useState([]);

  // Fetch stations for metadata and filter options
  useEffect(() => {
    let isMounted = true;
    apiService.getStations().then((res) => {
      if (isMounted && res?.stations) {
        setStationsList(res.stations);
      }
    }).catch(err => {
      console.warn('Could not fetch station list for event history:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Compute cascading options
  const stateOptions = useMemo(() => {
    const states = new Set();
    stationsList.forEach(s => { if (s.state) states.add(s.state); });
    return Array.from(states).sort();
  }, [stationsList]);

  const cityOptions = useMemo(() => {
    const cities = new Set();
    stationsList
      .filter(s => !stateFilter || s.state === stateFilter)
      .forEach(s => { if (s.city) cities.add(s.city); });
    return Array.from(cities).sort();
  }, [stationsList, stateFilter]);

  const stationOptions = useMemo(() => {
    return stationsList
      .filter(s => (!stateFilter || s.state === stateFilter) && (!cityFilter || s.city === cityFilter));
  }, [stationsList, stateFilter, cityFilter]);

  const handleStateChange = (val) => {
    setStateFilter(val);
    setCityFilter('');
    setStationFilter('');
    setPage(0);
  };

  const handleCityChange = (val) => {
    setCityFilter(val);
    setStationFilter('');
    setPage(0);
  };

  const handleStationChange = (val) => {
    setStationFilter(val);
    setPage(0);
  };

  const handleClearFilters = () => {
    setStateFilter('');
    setCityFilter('');
    setStationFilter('');
    setSeverityFilter('');
    setPage(0);
  };

  const hasActiveFilters = Boolean(stateFilter || cityFilter || stationFilter || severityFilter);

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
          state: stateFilter || null,
          city: cityFilter || null,
        });
        setData(res.records || []);
        setTotal(res.total || 0);
      } else {
        const res = await apiService.getTelemetry({
          limit,
          offset,
          station_id: stationFilter || null,
          state: stateFilter || null,
          city: cityFilter || null,
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
  }, [activeSubTab, page, severityFilter, stationFilter, stateFilter, cityFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const formattedData = data.map(row => ({
      ...row,
      timestamp_ist: formatToIST(row.timestamp, 'full'),
    }));
    const headers = Object.keys(formattedData[0]).join(',');
    const rows = formattedData.map(row => Object.values(row).map(v => `"${v != null ? v : ''}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skyguard_${activeSubTab}_page${page + 1}_ist.csv`);
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
              background: activeSubTab === 'anomalies' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
              borderColor: activeSubTab === 'anomalies' ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
              color: activeSubTab === 'anomalies' ? 'var(--status-critical-text)' : 'var(--text-muted)',
            }}
          >
            <AlertOctagon size={15} />
            <span>Detected Anomalies Archive</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('telemetry'); setPage(0); }}
            style={{
              ...styles.tabBtn,
              background: activeSubTab === 'telemetry' ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
              borderColor: activeSubTab === 'telemetry' ? 'rgba(2, 132, 199, 0.3)' : 'transparent',
              color: activeSubTab === 'telemetry' ? 'var(--primary-color)' : 'var(--text-muted)',
            }}
          >
            <Database size={15} />
            <span>Complete Telemetry Stream</span>
          </button>
        </div>

        <button 
          onClick={handleExportCSV} 
          disabled={data.length === 0} 
          className="btn btn-outline" 
          style={{ padding: '6px 12px', fontSize: '0.74rem' }}
        >
          <Download size={13} />
          <span>Export Page to CSV</span>
        </button>
      </div>

      {/* Cascading Filter Toolbar */}
      <div style={styles.filterToolbar}>
        <div style={styles.filterGroup}>
          <Filter size={13} color="var(--primary-color)" />
          <span style={styles.filterGroupTitle}>FILTERS:</span>
        </div>

        {/* State Filter */}
        <div style={styles.filterBox}>
          <span style={styles.filterLabel}>State:</span>
          <select
            value={stateFilter}
            onChange={(e) => handleStateChange(e.target.value)}
            style={styles.select}
          >
            <option value="">All States</option>
            {stateOptions.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div style={styles.filterBox}>
          <span style={styles.filterLabel}>City:</span>
          <select
            value={cityFilter}
            onChange={(e) => handleCityChange(e.target.value)}
            style={styles.select}
          >
            <option value="">All Cities</option>
            {cityOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Station Filter */}
        <div style={styles.filterBox}>
          <span style={styles.filterLabel}>Station:</span>
          <select
            value={stationFilter}
            onChange={(e) => handleStationChange(e.target.value)}
            style={styles.select}
          >
            <option value="">All Stations</option>
            {stationOptions.map(st => (
              <option key={st.station_id} value={st.station_id}>
                {st.station_id} ({st.city})
              </option>
            ))}
          </select>
        </div>

        {/* Severity Filter (only on anomalies subtab) */}
        {activeSubTab === 'anomalies' && (
          <div style={styles.filterBox}>
            <span style={styles.filterLabel}>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(0); }}
              style={styles.select}
            >
              <option value="">All Severities</option>
              <option value="HIGH">Critical High</option>
              <option value="MEDIUM">Warning Med</option>
              <option value="LOW">Low Advisory</option>
            </select>
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: '0.70rem' }}
            title="Reset all filters"
          >
            <RotateCcw size={12} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Main Table Card */}
      <div className="telemetry-card">
        {error && (
          <div style={{ color: '#dc2626', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <div className="table-responsive">
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Timestamp (IST)</th>
                <th>AWS Node</th>
                <th>Location</th>
                <th>Temp (°C)</th>
                <th>Pressure (hPa)</th>
                <th>Humidity (%)</th>
                {activeSubTab === 'anomalies' && <th>Score</th>}
                {activeSubTab === 'anomalies' && <th>Severity</th>}
                {activeSubTab === 'anomalies' && <th>Confidence</th>}
                {activeSubTab === 'anomalies' && <th style={{ textAlign: 'right' }}>Action</th>}
                {activeSubTab === 'telemetry' && <th>Status</th>}
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading database records...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const isAnom = row.anomaly === true;
                  return (
                    <tr 
                      key={idx}
                      onClick={() => {
                        if (activeSubTab === 'anomalies' || isAnom) {
                          setSelectedAnomaly(row);
                        }
                      }}
                      style={{ cursor: (activeSubTab === 'anomalies' || isAnom) ? 'pointer' : 'default' }}
                      title={(activeSubTab === 'anomalies' || isAnom) ? 'Click to inspect incident and view real current city weather' : ''}
                    >
                      <td className="mono-value" style={{ fontSize: '0.74rem', color: 'var(--text-main)' }}>
                        {formatToIST(row.timestamp, 'full')}
                      </td>
                      <td>
                        <span className="badge badge-info">{row.station_id || 'AWS-001'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem' }}>
                          <MapPin size={11} color="var(--primary-color)" />
                          <span>{row.city || 'Indore'}, {row.state || 'Madhya Pradesh'}</span>
                        </div>
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
                          <td className="mono-value" style={{ fontSize: '0.74rem', color: 'var(--text-main)' }}>
                            {row.confidence != null ? `${(row.confidence * 100).toFixed(1)}%` : '--'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAnomaly(row);
                              }}
                              className="btn btn-outline"
                              style={{ padding: '3px 8px', fontSize: '0.70rem' }}
                              title="Inspect incident details"
                            >
                              <Eye size={12} />
                              <span>Inspect</span>
                            </button>
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
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing <strong>{total === 0 ? 0 : page * limit + 1}</strong> to <strong>{Math.min((page + 1) * limit, total)}</strong> of <strong>{total.toLocaleString()}</strong> events (IST)
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

      {/* Incident Inspection Modal */}
      {selectedAnomaly && (
        <AnomalyDetailModal
          anomaly={selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
        />
      )}
    </div>
  );
}

const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '14px',
  },
  tabToggleGroup: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-card)',
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
  filterToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    padding: '10px 14px',
    backgroundColor: 'var(--bg-canvas)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '18px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  filterGroupTitle: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: 'var(--primary-color)',
    fontFamily: 'var(--font-mono)',
  },
  filterBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--bg-card)',
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
  },
  filterLabel: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  select: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-main)',
    fontSize: '0.74rem',
    outline: 'none',
    cursor: 'pointer',
  },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    marginTop: '16px',
    borderTop: '1px solid var(--border-subtle)',
  },
};
