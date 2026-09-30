import React from 'react';
import { Cpu, CheckCircle2, Server, Sliders, Info } from 'lucide-react';

export default function ModelStatusPage({ modelInfo, systemHealth, loading }) {
  const featureCategories = [
    {
      name: 'Primary AWS Station Sensors',
      desc: 'Raw multi-channel physical AWS observations',
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
      desc: 'Delta change normalized per elapsed observation minute (Δx / Δt)',
      items: ['temperature_rate', 'humidity_rate', 'pressure_rate'],
      color: '#0d9488'
    },
    {
      name: 'Moving Average Window (8 Periods)',
      desc: 'Rolling sensor trend mean over 8 consecutive intervals',
      items: ['rolling_temperature_mean', 'rolling_humidity_mean', 'rolling_pressure_mean'],
      color: '#7c3aed'
    },
    {
      name: 'Variance & Volatility (8 Periods)',
      desc: 'Rolling standard deviation detecting sensor jitter/instability',
      items: ['rolling_temperature_std', 'rolling_humidity_std', 'rolling_pressure_std'],
      color: '#db2777'
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
          ML Intelligence Architecture & System Health
        </h2>
        <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Technical inspection of trained Isolation Forest estimators, feature space engineering, and microservice status.
        </p>
      </div>

      {/* Health Overview Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
        <div className="telemetry-card">
          <div className="card-header">
            <span className="card-subtitle">REST API ENDPOINT</span>
            <Server size={16} color="var(--status-normal-text)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <CheckCircle2 size={20} color="var(--status-normal-text)" />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {systemHealth?.api?.toUpperCase() || 'OPERATIONAL'}
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Uvicorn ASGI • FastAPI 0.141 • Low-latency REST
          </p>
        </div>

        <div className="telemetry-card">
          <div className="card-header">
            <span className="card-subtitle">MODEL ARTIFACT STATUS</span>
            <Cpu size={16} color="var(--primary-color)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <CheckCircle2 size={20} color="var(--status-normal-text)" />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {systemHealth?.model_loaded ? 'LOADED IN RAM' : 'STANDBY'}
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            isolation_forest.pkl (200 Ensemble Trees)
          </p>
        </div>

        <div className="telemetry-card">
          <div className="card-header">
            <span className="card-subtitle">PREPROCESSING PIPELINE</span>
            <Sliders size={16} color="var(--primary-color)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <CheckCircle2 size={20} color="var(--status-normal-text)" />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {systemHealth?.scaler_loaded ? 'FITTED SCALER' : 'STANDBY'}
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            scaler.pkl (StandardScaler fitted on 28.8k observations)
          </p>
        </div>
      </div>

      {/* Model Spec & Decision Boundary Card */}
      <div className="grid-cols-2" style={{ marginBottom: '24px', alignItems: 'stretch' }}>
        <div className="telemetry-card">
          <div className="card-header">
            <div className="card-title">
              <Cpu size={18} color="var(--primary-color)" />
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
              <Info size={18} color="var(--primary-color)" />
              <span>Anomaly Score & Severity Mapping</span>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            Isolation Forest isolates abnormal observations by partitioning randomly selected features. Anomalies require significantly fewer tree splits to isolate than nominal clusters.
          </p>

          <div style={styles.severityExplainGrid}>
            <div style={{ ...styles.sevBox, borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--status-normal-text)' }}>NOMINAL</span>
                <span className="mono-value" style={{ fontSize: '0.72rem', color: 'var(--status-normal-text)', fontWeight: 600 }}>Score ≥ 0.0</span>
              </div>
              <p style={{ fontSize: '0.70rem', color: 'var(--status-normal-text)', marginTop: '4px' }}>
                Inliers clustered within expected operational thresholds.
              </p>
            </div>

            <div style={{ ...styles.sevBox, borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--status-warning-text)' }}>MEDIUM SEVERITY</span>
                <span className="mono-value" style={{ fontSize: '0.72rem', color: 'var(--status-warning-text)', fontWeight: 600 }}>Conf 70% - 85%</span>
              </div>
              <p style={{ fontSize: '0.70rem', color: 'var(--status-warning-text)', marginTop: '4px' }}>
                Significant transient deviation (e.g. rapid moisture surge or sensor drift).
              </p>
            </div>

            <div style={{ ...styles.sevBox, borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--status-critical-text)' }}>HIGH SEVERITY</span>
                <span className="mono-value" style={{ fontSize: '0.72rem', color: 'var(--status-critical-text)', fontWeight: 600 }}>Conf ≥ 85%</span>
              </div>
              <p style={{ fontSize: '0.70rem', color: 'var(--status-critical-text)', marginTop: '4px' }}>
                Acute thermal spike or extreme barometric pressure decompression.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 15 Feature Space Categorization */}
      <div className="telemetry-card">
        <div className="card-header">
          <div className="card-title">
            <Sliders size={18} color="var(--primary-color)" />
            <span>Complete 15-Feature Engineering Hierarchy</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            StandardScaler Input Vector
          </span>
        </div>

        <div style={styles.catGrid}>
          {featureCategories.map((cat, idx) => (
            <div key={idx} style={styles.catCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }}></span>
                <span style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--text-main)' }}>{cat.name}</span>
              </div>
              <p style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
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
    backgroundColor: 'var(--bg-canvas)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
    fontSize: '0.78rem',
  },
  paramKey: {
    color: 'var(--text-muted)',
  },
  paramVal: {
    fontWeight: '600',
    color: 'var(--text-main)',
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
    backgroundColor: 'var(--bg-canvas)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px',
  },
  featBadge: {
    fontSize: '0.70rem',
    padding: '4px 8px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '4px',
    color: 'var(--primary-color)',
    fontWeight: '600',
  },
};
