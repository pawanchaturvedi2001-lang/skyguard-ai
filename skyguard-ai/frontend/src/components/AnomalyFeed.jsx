import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, ArrowRight, Filter, RotateCcw, Eye, MapPin } from 'lucide-react';
import { formatToIST } from '../utils/dateUtils';
import AnomalyDetailModal from './AnomalyDetailModal';
import { apiService } from '../services/api';

export default function AnomalyFeed({ anomalies = [], onViewAll, loading }) {
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [stationsList, setStationsList] = useState([]);
  
  // Cascading filter states
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');

  // Fetch stations for metadata and cascading filter dropdowns
  useEffect(() => {
    let isMounted = true;
    apiService.getStations().then((res) => {
      if (isMounted && res?.stations) {
        setStationsList(res.stations);
      }
    }).catch(err => {
      console.warn('Could not fetch station list for filters:', err);
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
      .filter(s => !selectedState || s.state === selectedState)
      .forEach(s => { if (s.city) cities.add(s.city); });
    return Array.from(cities).sort();
  }, [stationsList, selectedState]);

  const stationOptions = useMemo(() => {
    return stationsList
      .filter(s => (!selectedState || s.state === selectedState) && (!selectedCity || s.city === selectedCity));
  }, [stationsList, selectedState, selectedCity]);

  // Handle cascading state change
  const handleStateChange = (val) => {
    setSelectedState(val);
    setSelectedCity('');
    setSelectedStation('');
  };

  // Handle cascading city change
  const handleCityChange = (val) => {
    setSelectedCity(val);
    setSelectedStation('');
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedState('');
    setSelectedCity('');
    setSelectedStation('');
    setSelectedSeverity('');
  };

  const hasActiveFilters = Boolean(selectedState || selectedCity || selectedStation || selectedSeverity);

  // Filter anomalies client-side
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((item) => {
      if (selectedState && item.state !== selectedState) return false;
      if (selectedCity && item.city !== selectedCity) return false;
      if (selectedStation && item.station_id !== selectedStation) return false;
      if (selectedSeverity && item.severity?.toUpperCase() !== selectedSeverity.toUpperCase()) return false;
      return true;
    });
  }, [anomalies, selectedState, selectedCity, selectedStation, selectedSeverity]);

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

      {/* Cascading Anomaly Filters Bar */}
      <div style={styles.filterBar}>
        <div style={styles.filterTitle}>
          <Filter size={13} color="var(--primary-color)" />
          <span>CASCADING FILTERS:</span>
        </div>

        {/* 1. State Filter */}
        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>State</label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            style={styles.select}
          >
            <option value="">All States</option>
            {stateOptions.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* 2. City Filter */}
        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>City</label>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            style={styles.select}
          >
            <option value="">All Cities</option>
            {cityOptions.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* 3. Station Filter */}
        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>Station ID</label>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
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

        {/* 4. Severity Filter */}
        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>Severity</label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            style={styles.select}
          >
            <option value="">All Severities</option>
            <option value="HIGH">Critical High</option>
            <option value="MEDIUM">Warning Med</option>
            <option value="LOW">Low Advisory</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="btn btn-outline"
            style={styles.clearBtn}
            title="Reset all cascading filters"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="telemetry-table">
          <thead>
            <tr>
              <th>Timestamp (IST)</th>
              <th>AWS Station</th>
              <th>Location</th>
              <th>Temp (°C)</th>
              <th>Pressure (hPa)</th>
              <th>Humidity (%)</th>
              <th>Score</th>
              <th>Severity</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && filteredAnomalies.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  Loading telemetry outliers...
                </td>
              </tr>
            ) : filteredAnomalies.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  {hasActiveFilters 
                    ? 'No telemetry anomalies match the selected filters.' 
                    : 'No active telemetry anomalies detected in recent window. All channels nominal.'}
                </td>
              </tr>
            ) : (
              filteredAnomalies.slice(0, 7).map((item, idx) => (
                <tr 
                  key={idx}
                  onClick={() => setSelectedAnomaly(item)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view detailed incident inspection and current city weather"
                >
                  <td className="mono-value" style={{ fontSize: '0.74rem', color: 'var(--text-main)' }}>
                    {formatToIST(item.timestamp, 'full')}
                  </td>
                  <td>
                    <span className="badge badge-info">{item.station_id || 'AWS-001'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                      <MapPin size={12} color="var(--primary-color)" />
                      <span>{item.city || 'Indore'}, {item.state || 'Madhya Pradesh'}</span>
                    </div>
                  </td>
                  <td className="mono-value" style={{ color: Number(item.temperature) > 40 ? '#ea580c' : 'var(--text-main)', fontWeight: Number(item.temperature) > 40 ? '600' : 'normal' }}>
                    {item.temperature != null ? Number(item.temperature).toFixed(1) : '--'}
                  </td>
                  <td className="mono-value" style={{ color: Number(item.pressure) > 1025 || Number(item.pressure) < 995 ? '#0284c7' : 'var(--text-main)', fontWeight: Number(item.pressure) > 1025 || Number(item.pressure) < 995 ? '600' : 'normal' }}>
                    {item.pressure != null ? Number(item.pressure).toFixed(1) : '--'}
                  </td>
                  <td className="mono-value" style={{ color: Number(item.humidity) > 90 ? '#0284c7' : 'var(--text-main)', fontWeight: Number(item.humidity) > 90 ? '600' : 'normal' }}>
                    {item.humidity != null ? Number(item.humidity).toFixed(1) : '--'}
                  </td>
                  <td className="mono-value" style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: '600' }}>
                    {item.anomaly_score != null ? Number(item.anomaly_score).toFixed(4) : '--'}
                  </td>
                  <td>
                    {getSeverityBadge(item.severity)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnomaly(item);
                      }}
                      className="btn btn-outline"
                      style={{ padding: '3px 8px', fontSize: '0.70rem' }}
                      title="Inspect incident details"
                    >
                      <Eye size={12} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Anomaly Details View Modal */}
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
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    padding: '10px 14px',
    backgroundColor: 'var(--bg-canvas)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '14px',
  },
  filterTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.68rem',
    fontWeight: '700',
    color: 'var(--primary-color)',
    fontFamily: 'var(--font-mono)',
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--bg-card)',
    padding: '4px 8px',
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
  clearBtn: {
    padding: '4px 8px',
    fontSize: '0.70rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
};
