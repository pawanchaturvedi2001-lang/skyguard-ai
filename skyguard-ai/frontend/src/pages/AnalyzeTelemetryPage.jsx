import React, { useState } from 'react';
import { apiService } from '../services/api';
import { 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Layers, 
  RefreshCw, 
  FileText, 
  Sparkles 
} from 'lucide-react';

export default function AnalyzeTelemetryPage() {
  // Single prediction form state
  const [formData, setFormData] = useState({
    temperature: '28.2',
    pressure: '1008.1',
    humidity: '64.5',
    station_id: 'SAT-001',
    timestamp: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Batch prediction state
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [batchError, setBatchError] = useState(null);

  // Demo presets for quick testing
  const presets = [
    {
      name: 'Nominal Baseline',
      desc: 'Normal orbit temperature, standard pressure, moderate humidity',
      data: { temperature: '28.2', pressure: '1008.1', humidity: '64.5', station_id: 'SAT-001' },
      tag: 'NORMAL',
    },
    {
      name: 'Thermal Spike Anomaly',
      desc: 'Sudden +26°C jump indicating battery thermal runaway or direct solar flare',
      data: { temperature: '54.5', pressure: '1008.0', humidity: '65.0', station_id: 'SAT-001' },
      tag: 'HIGH ANOMALY',
    },
    {
      name: 'Barometric Drop Anomaly',
      desc: 'Pressure drop to 975 hPa indicating atmospheric depressurization or sensor seal leak',
      data: { temperature: '28.0', pressure: '975.0', humidity: '60.0', station_id: 'SAT-002' },
      tag: 'HIGH ANOMALY',
    },
    {
      name: 'Humidity Saturation Spike',
      desc: 'Moisture surge to 98% indicating condensation near electronics bay',
      data: { temperature: '28.0', pressure: '1008.0', humidity: '98.0', station_id: 'SAT-003' },
      tag: 'MEDIUM ANOMALY',
    },
  ];

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.data,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }));
    setResult(null);
    setError(null);
  };

  const handleSinglePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        temperature: parseFloat(formData.temperature),
        pressure: parseFloat(formData.pressure),
        humidity: parseFloat(formData.humidity),
        station_id: formData.station_id || 'SAT-001',
      };
      if (formData.timestamp) {
        payload.timestamp = formData.timestamp;
      }

      const res = await apiService.predictSingle(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Prediction request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSampleBatch = async () => {
    setBatchLoading(true);
    setBatchError(null);
    setBatchResult(null);

    const sampleBatch = [
      { temperature: 28.0, humidity: 65.0, pressure: 1008.0, station_id: 'SAT-BATCH-1' },
      { temperature: 28.4, humidity: 64.0, pressure: 1008.2, station_id: 'SAT-BATCH-1' },
      { temperature: 56.5, humidity: 95.0, pressure: 1042.0, station_id: 'SAT-BATCH-2' }, // Anomaly
      { temperature: 27.8, humidity: 63.0, pressure: 1007.9, station_id: 'SAT-BATCH-3' },
      { temperature: 28.1, humidity: 65.2, pressure: 974.0, station_id: 'SAT-BATCH-4' },  // Anomaly
    ];

    try {
      const res = await apiService.predictBatch(sampleBatch);
      setBatchResult(res);
    } catch (err) {
      setBatchError(err.message || 'Batch prediction request failed.');
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
          Real-Time Anomaly Inference Engine
        </h2>
        <p style={{ fontSize: '0.80rem', color: '#64748b', marginTop: '2px' }}>
          Evaluate live sensor readings through the trained 15-feature Isolation Forest model.
        </p>
      </div>

      {/* Preset Action Bar for SIH Presentation */}
      <div style={styles.presetsCard}>
        <div style={styles.presetHeader}>
          <Sparkles size={16} color="#0284c7" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
            DEMONSTRATION PRESETS (1-Click SIH Live Test)
          </span>
        </div>
        <div style={styles.presetGrid}>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              style={styles.presetBtn}
            >
              <div style={styles.presetTop}>
                <span style={styles.presetName}>{preset.name}</span>
                <span className={`badge ${preset.tag.includes('HIGH') ? 'badge-critical' : preset.tag.includes('MEDIUM') ? 'badge-warning' : 'badge-normal'}`}>
                  {preset.tag}
                </span>
              </div>
              <p style={styles.presetDesc}>{preset.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid-cols-2" style={{ alignItems: 'flex-start' }}>
        {/* Left Form: Analyze Reading */}
        <div className="telemetry-card">
          <div className="card-header">
            <div className="card-title">
              <Zap size={18} color="#0284c7" />
              <span>Input Telemetry Packet</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              POST /api/predict
            </span>
          </div>

          <form onSubmit={handleSinglePredict}>
            <div className="form-group">
              <label className="form-label">Satellite Node / Station ID</label>
              <input
                type="text"
                className="form-input"
                value={formData.station_id}
                onChange={(e) => setFormData({ ...formData, station_id: e.target.value })}
                placeholder="e.g. SAT-001 or AWS-001"
                required
              />
            </div>

            <div className="grid-cols-3" style={{ gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  placeholder="28.0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pressure (hPa)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.pressure}
                  onChange={(e) => setFormData({ ...formData, pressure: e.target.value })}
                  placeholder="1008.0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Humidity (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.humidity}
                  onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                  placeholder="65.0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Observation Timestamp (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={formData.timestamp}
                onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                placeholder="Auto-generated UTC if omitted"
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <AlertTriangle size={15} color="#dc2626" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '10px', padding: '12px' }}
            >
              <Play size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>{loading ? 'RUNNING ISOLATION FOREST...' : 'ANALYZE TELEMETRY'}</span>
            </button>
          </form>
        </div>

        {/* Right Output: Analysis Result */}
        <div>
          {result ? (
            <div className={`telemetry-card ${result.is_anomaly ? 'highlight' : ''}`} style={{ borderColor: result.is_anomaly ? '#fca5a5' : '#a7f3d0' }}>
              <div className="card-header">
                <div className="card-title">
                  {result.is_anomaly ? (
                    <AlertTriangle size={20} color="#dc2626" />
                  ) : (
                    <CheckCircle size={20} color="#059669" />
                  )}
                  <span>Inference Decision</span>
                </div>
                <span className={`badge ${result.is_anomaly ? 'badge-critical' : 'badge-normal'}`}>
                  {result.status}
                </span>
              </div>

              {/* Status Banner */}
              <div style={{
                ...styles.resultBanner,
                background: result.is_anomaly ? '#fef2f2' : '#ecfdf5',
                borderColor: result.is_anomaly ? '#fecaca' : '#a7f3d0',
              }}>
                <div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: result.is_anomaly ? '#dc2626' : '#059669',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {result.is_anomaly ? 'ANOMALY DETECTED' : 'TELEMETRY NOMINAL'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                    Severity: <strong>{result.severity}</strong> • Node: {result.station_id}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono-value" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.70rem', color: '#64748b' }}>
                    Confidence Level
                  </div>
                </div>
              </div>

              {/* Score & Raw Telemetry Metrics */}
              <div className="grid-cols-2" style={{ gap: '12px', margin: '16px 0' }}>
                <div style={styles.metricBox}>
                  <span style={styles.metricLabel}>Anomaly Decision Score</span>
                  <span className="mono-value" style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: result.anomaly_score < 0 ? '#dc2626' : '#059669'
                  }}>
                    {result.anomaly_score.toFixed(6)}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    Threshold &lt; 0.0 indicates isolation outlier
                  </span>
                </div>

                <div style={styles.metricBox}>
                  <span style={styles.metricLabel}>Input Physical Readings</span>
                  <div className="mono-value" style={{ fontSize: '0.80rem', color: '#0f172a', fontWeight: 600, marginTop: '4px' }}>
                    {result.telemetry.temperature}°C • {result.telemetry.pressure} hPa • {result.telemetry.humidity}%
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    Scaled with StandardScaler
                  </span>
                </div>
              </div>

              {/* 15 Features Breakdown */}
              {result.features && (
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Calculated Feature Space (15 Features)
                  </div>
                  <div style={styles.featuresGrid}>
                    {Object.entries(result.features).map(([key, val]) => (
                      <div key={key} style={styles.featureItem}>
                        <span style={styles.featureKey}>{key}</span>
                        <span className="mono-value" style={styles.featureVal}>
                          {typeof val === 'number' ? val.toFixed(4) : val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="telemetry-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <FileText size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                Awaiting Telemetry Packet
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '320px', margin: '6px auto 0 auto' }}>
                Fill in the sensor parameters on the left or select a demonstration preset above to evaluate satellite telemetry.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Section: Batch Prediction */}
      <div className="telemetry-card" style={{ marginTop: '28px' }}>
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="#0284c7" />
            <span>Batch Telemetry Processing (POST /api/predict/batch)</span>
          </div>
          <button
            onClick={handleRunSampleBatch}
            disabled={batchLoading}
            className="btn btn-cyan"
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            <Play size={13} />
            <span>{batchLoading ? 'Evaluating Batch...' : 'Run 5-Record Flight Test'}</span>
          </button>
        </div>

        <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
          Evaluate sequential multi-point orbital telemetry records in a single high-throughput API payload.
        </p>

        {batchError && (
          <div style={styles.errorBox}>
            <AlertTriangle size={15} color="#dc2626" />
            <span>{batchError}</span>
          </div>
        )}

        {batchResult && (
          <div>
            <div className="grid-cols-3" style={{ gap: '12px', marginBottom: '16px' }}>
              <div style={styles.metricBox}>
                <span style={styles.metricLabel}>Total Packets</span>
                <span className="mono-value" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
                  {batchResult.total_records}
                </span>
              </div>
              <div style={styles.metricBox}>
                <span style={styles.metricLabel}>Nominal Packets</span>
                <span className="mono-value" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#059669' }}>
                  {batchResult.normal_count}
                </span>
              </div>
              <div style={styles.metricBox}>
                <span style={styles.metricLabel}>Anomalies Detected</span>
                <span className="mono-value" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#dc2626' }}>
                  {batchResult.anomaly_count}
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="telemetry-table">
                <thead>
                  <tr>
                    <th>Node ID</th>
                    <th>Temp (°C)</th>
                    <th>Pressure (hPa)</th>
                    <th>Humidity (%)</th>
                    <th>Score</th>
                    <th>Confidence</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResult.predictions.map((p, idx) => (
                    <tr key={idx}>
                      <td><span className="badge badge-info">{p.station_id}</span></td>
                      <td className="mono-value">{p.telemetry.temperature}°C</td>
                      <td className="mono-value">{p.telemetry.pressure} hPa</td>
                      <td className="mono-value">{p.telemetry.humidity}%</td>
                      <td className="mono-value" style={{ color: p.is_anomaly ? '#dc2626' : '#059669', fontWeight: '600' }}>
                        {p.anomaly_score.toFixed(4)}
                      </td>
                      <td className="mono-value">{(p.confidence * 100).toFixed(1)}%</td>
                      <td>
                        <span className={`badge ${p.is_anomaly ? 'badge-critical' : 'badge-normal'}`}>
                          {p.status} ({p.severity})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  presetsCard: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-card)',
    padding: '16px',
    marginBottom: '24px',
  },
  presetHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '12px',
  },
  presetBtn: {
    textAlign: 'left',
    background: '#f8fafc',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  presetTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  presetName: {
    fontSize: '0.80rem',
    fontWeight: '600',
    color: '#0f172a',
  },
  presetDesc: {
    fontSize: '0.70rem',
    color: '#64748b',
    lineHeight: 1.4,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    color: '#b91c1c',
    fontSize: '0.78rem',
    marginBottom: '14px',
  },
  resultBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
  },
  metricBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontSize: '0.70rem',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '8px',
    maxHeight: '220px',
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
  },
  featureItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  featureKey: {
    fontSize: '0.64rem',
    color: '#64748b',
    fontFamily: 'var(--font-mono)',
  },
  featureVal: {
    fontSize: '0.74rem',
    color: '#0284c7',
    fontWeight: '600',
  },
};
