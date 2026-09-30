import React from 'react';
import { 
  Radio, 
  Activity, 
  AlertTriangle, 
  Database, 
  Cpu, 
  Wifi, 
  WifiOff,
  CloudSun
} from 'lucide-react';
import SkyGuardLogo from './SkyGuardLogo';

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
      {/* Interactive Brand Header with Tappable SkyGuard Logo */}
      <div 
        onClick={() => setActiveTab('overview')} 
        style={styles.brandContainer}
        className="brand-interactive-raised"
        role="button"
        tabIndex={0}
        title="SkyGuard AI - Tap logo to return to Overview"
      >
        <SkyGuardLogo size={38} onClick={() => setActiveTab('overview')} interactive={true} />
        <div>
          <div style={styles.brandTitle}>SKYGUARD AI</div>
          <div style={styles.brandSubtitle}>Weather Station Intelligence</div>
        </div>
      </div>

      {/* Mission Badge */}
      <div style={styles.missionTag}>
        <span style={styles.missionDot}></span>
        <span>AWS MONITORING / SIH</span>
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
              className="nav-button-raised"
              style={{
                ...styles.navButton,
                ...(isActive ? styles.navButtonActive : {}),
              }}
            >
              <Icon 
                size={18} 
                color={isActive ? 'var(--primary-color)' : 'var(--text-muted)'} 
                style={{ flexShrink: 0 }}
              />
              <div style={styles.navTextContainer}>
                <span style={{
                  ...styles.navLabel,
                  color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                }}>
                  {item.label}
                </span>
                <span style={{
                  ...styles.navDesc,
                  color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
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
              <Wifi size={14} color="var(--status-normal-text)" />
            ) : (
              <WifiOff size={14} color="var(--status-critical-text)" />
            )}
            <span>Backend Link</span>
          </div>
          <span style={{
            ...styles.statusValue,
            color: isBackendConnected ? 'var(--status-normal-text)' : 'var(--status-critical-text)'
          }}>
            {isBackendConnected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        <div style={styles.statusRow}>
          <div style={styles.statusLabel}>
            <Cpu size={14} color="var(--primary-color)" />
            <span>ML Engine</span>
          </div>
          <span style={{
            ...styles.statusValue,
            color: systemHealth?.model_loaded ? 'var(--status-normal-text)' : 'var(--status-warning-text)'
          }}>
            {systemHealth?.model_loaded ? 'READY' : 'STANDBY'}
          </span>
        </div>

        <div style={styles.serverInfo}>
          FastAPI • Isolation Forest (200 Trees)
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    backgroundColor: 'var(--bg-card)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    zIndex: 20,
    transition: 'background-color 0.25s ease, border-color 0.25s ease',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '18px 16px 14px 16px',
    margin: '6px 8px 10px 8px',
  },
  brandTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    letterSpacing: '0.04em',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontSize: '0.68rem',
    color: 'var(--primary-color)',
    fontWeight: '600',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginTop: '2px',
  },
  missionTag: {
    margin: '0 16px 16px 16px',
    padding: '6px 10px',
    borderRadius: '6px',
    background: 'var(--bg-space)',
    border: '1px solid var(--border-subtle)',
    fontSize: '0.67rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  missionDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-color)',
    boxShadow: '0 0 6px var(--cyan-glow)',
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
  },
  navButtonActive: {
    background: 'rgba(2, 132, 199, 0.1)',
    borderColor: 'rgba(2, 132, 199, 0.3)',
    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
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
    left: '0px',
    top: '20%',
    bottom: '20%',
    width: '3px',
    backgroundColor: 'var(--primary-color)',
    borderRadius: '0 2px 2px 0',
  },
  bottomStatus: {
    padding: '16px',
    borderTop: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-card-subtle)',
    margin: 'auto 10px 12px 10px',
    borderRadius: 'var(--radius-md)',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '0.74rem',
  },
  statusLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-muted)',
  },
  statusValue: {
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    fontSize: '0.70rem',
  },
  serverInfo: {
    fontSize: '0.66rem',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    marginTop: '6px',
    textAlign: 'center',
  },
};
