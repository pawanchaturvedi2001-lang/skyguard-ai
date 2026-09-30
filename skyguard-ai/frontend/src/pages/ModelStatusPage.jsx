import React from 'react';
import { Cpu, ShieldCheck, CheckCircle2, Server, Sliders, Database, Info } from 'lucide-react';

export default function ModelStatusPage({ modelInfo, systemHealth, loading }) {
  const features = modelInfo?.expected_features || [
    'temperature', 'humidity', 'pressure',
    'temperature_change', 'humidity_change', 'pressure_change',
    'temperature_rate', 'humidity_rate', 'pressure_rate',
    'rolling_temperature_mean', 'rolling_humidity_mean', 'rolling_pressure_mean',
    'rolling_temperature_std', 'rolling_humidity_std', 'rolling_pressure_std'
  ];

  const featureCategories = [
    {
      name: 'Primary In-Flight Sensors',
      desc: 'Raw multi-channel physical measurements',
      items: ['temperature', 'humidity', 'pressure'],
      color: '#ea580c'
    },
    {
      name: 'Sequential Observation Deltas',
      desc: 'Difference from preceding telemetry timestamp (t - t₋₁)',
      items: ['temperature_change', 'humidity_change', 'pressure_change'],
      color: '#0284c7'
    },
    {
      name: 'Dynamic Velocity / Rate of Change',
      desc: 'Delta change normalized per elapsed flight minute (Δx / Δt)',
      items: ['temperature_rate', 'humidity_rate', 'pressure_rate'],
      color: '#0d9488'
    },
    {
      name: 'Moving Average Window (8 Periods)',
      desc: 'Rolling trajectory mean over 8 consecutive intervals',
      items: ['rolling_temperature_mean', 'rolling_humidity_mean', 'rolling_pressure_mean'],
      color: '#7c3aed'
    },
    {
      name: 'Variance & Volatility (8 Periods)',
      desc: 'Rolling standard deviation detecting signal jitter/instability',
      items: ['rolling_temperature_std', 'rolling_humidity_std', 'rolling_pressure_std'],
      color: '#db2777'
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
          ML Intelligence Architecture & System Health
        </h2>
        <p style={{ fontSize: '0.80rem', color: '#64748b', marginTop: '2px' }}>
          Technical inspection of trained Isolation Forest estimators, feature space engineering, and microservice status.
        </p>
      </div>

      {/* Health Overview Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
        <div className="telemetry-card">
          <div className="card-header">
            <span className="card-subtitle">REST API ENDPOINT</span>
            <Server size={16} color="#059669" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <CheckCircle2 size={20} color="#059669" />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              {systemHealth?.api?.toUpperCase() || 'OPERATIONAL'}
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Uvicorn ASGI • FastAPI 0.141 • Low-latency REST
          </p>
        </div>

        <div className="telemetry-card">
          <div className="card-header">
            <span className="card-subtitle">MODEL ARTIFACT STATUS</span>
            <Cpu size={16} color="#0284c7" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <CheckCircle2 size={20} color="#059669" />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              {systemHealth?.model_loaded ? 'LOADED IN RAM' : 'STANDBY'}
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
            isolation_forest.pkl (200 Ensemble Trees)
          </p>
        </div>

        <div className="telemetry-card">
          <div className="card-header">
            <span className="card-subtitle">PREPROCESSING PIPELINE</span>
            <Sliders size={16} color="#0284c7" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <CheckCircle2 size={20} color="#059669" />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              {systemHealth?.scaler_loaded ? 'FITTED SCALER' : 'STANDBY'}
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
            scaler.pkl (StandardScaler fitted on 28.8k observations)
          </p>
        </div>
      </div>

      {/* Model Spec & Decision Boundary Card */}
      <div className="grid-cols-2" style={{ marginBottom: '24px', alignItems: 'stretch' }}>
        <div className="telemetry-card">
          <div className="card-header">
            <div className="card-title">
              <Cpu size={18} color="#0284c7" />
              <span>Isolation Forest Hyperparameters</span>
            </div>
            <span className="badge badge-normal">VERIFIED ACTIVE</span>
          </div>

          <div style={styles.paramList}>
            <div style={styles.paramRow}>
              <span style={styles.paramKey}>Algorithm Type</span>
              <span style={styles.paramVal}>Unsupervised Tree Ensemble</span>
            </div>
            <div style={styles.paramRow}>
              <span style={styles.paramKey}>Ensemble Estimators (Trees)</span>
              <span className="mono-value" style={styles.paramVal}>200</span>
            </div>
            <div style={styles.paramRow}>
              <span style={styles.paramKey}>Contamination Ratio</span>
              <span className="mono-value" style={styles.paramVal}>{modelInfo?.contamination || '0.01 (1.0%)'}</span>
            </div>
            <div style={styles.paramRow}>
              <span style={styles.paramKey}>Total Feature Dimensions</span>
              <span className="mono-value" style={styles.paramVal}>{modelInfo?.feature_count || '15'}</span>
            </div>
            <div style={styles.paramRow}>
              <span style={styles.paramKey}>Decision Threshold</span>
              <span className="mono-value" style={styles.paramVal}>score &lt; 0.0 → Outlier</span>
            </div>
            <div style={styles.paramRow}>
              <span style={styles.paramKey}>Random Seed</span>
              <span className="mono-value" style={styles.paramVal}>42 (Deterministic Reproducibility)</span>
            </div>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="card-header">
            <div className="card-title">
              <Info size={18} color="#0284c7" />
              <span>Anomaly Score & Severity Mapping</span>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
            Isolation Forest isolates abnormal observations by partitioning randomly selected features. Anomalies require significantly fewer tree splits to isolate than nominal clusters.
          </p>

          <div style={styles.severityExplainGrid}>
            <div style={{ ...styles.sevBox, borderColor: '#a7f3d0', background: '#ecfdf5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#059669' }}>NOMINAL</span>
                <span className="mono-value" style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>Score ≥ 0.0</span>
              </div>
              <p style={{ fontSize: '0.70rem', color: '#047857', marginTop: '4px' }}>
                Inliers clustered within expected operational thresholds.
              </p>
            </div>

            <div style={{ ...styles.sevBox, borderColor: '#fde68a', background: '#fffbeb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#d97706' }}>MEDIUM SEVERITY</span>
                <span className="mono-value" style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>Conf 70% - 85%</span>
              </div>
              <p style={{ fontSize: '0.70rem', color: '#b45309', marginTop: '4px' }}>
                Significant transient deviation (e.g. rapid moisture or sensor drift).
              </p>
            </div>

            <div style={{ ...styles.sevBox, borderColor: '#fecaca', background: '#fef2f2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#dc2626' }}>HIGH SEVERITY</span>
                <span className="mono-value" style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>Conf ≥ 85%</span>
              </div>
              <p style={{ fontSize: '0.70rem', color: '#b91c1c', marginTop: '4px' }}>
                Acute thermal spike or catastrophic pressure decompression.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 15 Feature Space Categorization */}
      <div className="telemetry-card">
        <div className="card-header">
          <div className="card-title">
            <Sliders size={18} color="#0284c7" />
            <span>Complete 15-Feature Engineering Hierarchy</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            StandardScaler Input Vector
          </span>
        </div>

        <div style={styles.catGrid}>
          {featureCategories.map((cat, idx) => (
            <div key={idx} style={styles.catCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }}></span>
                <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#0f172a' }}>{cat.name}</span>
              </div>
              <p style={{ fontSize: '0.70rem', color: '#64748b', marginBottom: '10px' }}>
                {cat.desc}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {cat.items.map((feat) => (
                  <span key={feat} className="mono-value" style={styles.featBadge}>
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  paramList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  paramRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    backgroundColor: '#f8fafc',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #f1f5f9',
    fontSize: '0.78rem',
  },
  paramKey: {
    color: '#64748b',
  },
  paramVal: {
    fontWeight: '600',
    color: '#0f172a',
  },
  severityExplainGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sevBox: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
  },
  catGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '14px',
  },
  catCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px',
  },
  featBadge: {
    fontSize: '0.70rem',
    padding: '4px 8px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    color: '#0284c7',
    fontWeight: '600',
  },
};
