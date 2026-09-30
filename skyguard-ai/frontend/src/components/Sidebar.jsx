import React from 'react';
import { 
  Radio, 
  Activity, 
  AlertTriangle, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Wifi, 
  WifiOff,
  CloudSun
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, systemHealth, isBackendConnected }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity, desc: 'Mission dashboard' },
    { id: 'live', label: 'Live Telemetry', icon: Radio, desc: 'Real-time sensor charts' },
    { id: 'predict', label: 'Analyze Telemetry', icon: AlertTriangle, desc: 'Manual & Batch AI prediction' },
    { id: 'weather', label: 'India Weather', icon: CloudSun, desc: 'Real-time weather network' },
    { id: 'history', label: 'Event History', icon: Database, desc: 'Telemetry & anomaly logs' },
    { id: 'model', label: 'Model Status', icon: Cpu, desc: 'Isolation Forest details' },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoIcon}>
          <ShieldCheck size={22} color="#0284c7" />
        </div>
        <div>
          <div style={styles.brandTitle}>SKYGUARD AI</div>
          <div style={styles.brandSubtitle}>Satellite Intelligence</div>
        </div>
      </div>

      {/* Mission Badge */}
      <div style={styles.missionTag}>
        <span style={styles.missionDot}></span>
        <span>ORBITAL MONITORING / SIH</span>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.navButtonActive : {}),
              }}
            >
              <Icon 
                size={18} 
                color={isActive ? '#0284c7' : '#64748b'} 
                style={{ flexShrink: 0 }}
              />
              <div style={styles.navTextContainer}>
                <span style={{
                  ...styles.navLabel,
                  color: isActive ? '#0369a1' : '#334155',
                }}>
                  {item.label}
                </span>
                <span style={{
                  ...styles.navDesc,
                  color: isActive ? '#0284c7' : '#94a3b8',
                }}>
                  {item.desc}
                </span>
              </div>
              {isActive && <div style={styles.activeIndicator}></div>}
            </button>
          );
        })}
      </nav>

      {/* Bottom System Status */}
      <div style={styles.bottomStatus}>
        <div style={styles.statusRow}>
          <div style={styles.statusLabel}>
            {isBackendConnected ? (
              <Wifi size={14} color="#059669" />
            ) : (
              <WifiOff size={14} color="#dc2626" />
            )}
            <span>Backend Link</span>
          </div>
          <span style={{
            ...styles.statusValue,
            color: isBackendConnected ? '#059669' : '#dc2626'
          }}>
            {isBackendConnected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        <div style={styles.statusRow}>
          <div style={styles.statusLabel}>
            <Cpu size={14} color="#0284c7" />
            <span>ML Engine</span>
          </div>
          <span style={{
            ...styles.statusValue,
            color: systemHealth?.model_loaded ? '#059669' : '#d97706'
          }}>
            {systemHealth?.model_loaded ? 'READY' : 'STANDBY'}
          </span>
        </div>

        <div style={styles.serverInfo}>
          127.0.0.1:8000 / FastAPI
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    backgroundColor: '#ffffff',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    zIndex: 20,
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '22px 20px 16px 20px',
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    letterSpacing: '0.04em',
    color: '#0f172a',
    fontFamily: 'var(--font-mono)',
  },
  brandSubtitle: {
    fontSize: '0.72rem',
    color: '#0284c7',
    fontWeight: '600',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  missionTag: {
    margin: '0 16px 16px 16px',
    padding: '6px 10px',
    borderRadius: '4px',
    background: '#f1f5f9',
    border: '1px solid var(--border-subtle)',
    fontSize: '0.67rem',
    fontFamily: 'var(--font-mono)',
    color: '#475569',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  missionDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
  },
  nav: {
    flex: 1,
    padding: '0 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    position: 'relative',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.15s ease',
  },
  navButtonActive: {
    background: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  navTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  navLabel: {
    fontSize: '0.86rem',
    fontWeight: '600',
  },
  navDesc: {
    fontSize: '0.70rem',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '20%',
    height: '60%',
    width: '3px',
    backgroundColor: '#0284c7',
    borderRadius: '2px 0 0 2px',
  },
  bottomStatus: {
    padding: '16px',
    borderTop: '1px solid var(--border-subtle)',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
  },
  statusLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#475569',
  },
  statusValue: {
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
    fontSize: '0.72rem',
  },
  serverInfo: {
    marginTop: '4px',
    fontSize: '0.67rem',
    fontFamily: 'var(--font-mono)',
    color: '#94a3b8',
    textAlign: 'center',
  },
};
