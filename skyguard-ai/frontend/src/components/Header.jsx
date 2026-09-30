import React, { useState, useEffect } from 'react';
import { RefreshCw, Bell, Shield, Clock, Wifi, WifiOff } from 'lucide-react';

export default function Header({ 
  title, 
  subtitle, 
  onRefresh, 
  isRefreshing, 
  isBackendConnected,
  unreadAlertsCount = 0 
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={styles.header}>
      {/* Title Section */}
      <div>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>{title}</h1>
          <div style={styles.liveIndicator}>
            <span className="live-pulse"></span>
            <span style={styles.liveText}>LIVE MONITORING</span>
          </div>
        </div>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>

      {/* Meta Controls & Clock */}
      <div style={styles.rightSection}>
        {/* UTC Clock */}
        <div style={styles.clockCard}>
          <Clock size={14} color="#0284c7" />
          <span style={styles.clockText}>{currentTime || 'SYNCHRONIZING...'}</span>
        </div>

        {/* Network Status Pill */}
        <div style={{
          ...styles.networkPill,
          background: isBackendConnected ? '#ecfdf5' : '#fef2f2',
          borderColor: isBackendConnected ? '#a7f3d0' : '#fecaca',
          color: isBackendConnected ? '#059669' : '#dc2626'
        }}>
          {isBackendConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isBackendConnected ? 'TELEMETRY ONLINE' : 'DISCONNECTED'}</span>
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={styles.refreshButton}
          title="Manually refresh telemetry data"
        >
          <RefreshCw 
            size={14} 
            color="#64748b" 
            style={{ 
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
            }} 
          />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}

const styles = {
  header: {
    height: 'var(--header-height)',
    borderBottom: '1px solid var(--border-subtle)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    borderRadius: '4px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
  },
  liveText: {
    fontSize: '0.66rem',
    fontWeight: '700',
    color: '#059669',
    letterSpacing: '0.06em',
    fontFamily: 'var(--font-mono)',
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '2px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  clockCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: '#f8fafc',
    border: '1px solid var(--border-subtle)',
  },
  clockText: {
    fontSize: '0.74rem',
    fontFamily: 'var(--font-mono)',
    color: '#334155',
    letterSpacing: '0.02em',
    fontWeight: '500',
  },
  networkPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    fontSize: '0.72rem',
    fontWeight: '600',
    fontFamily: 'var(--font-mono)',
  },
  refreshButton: {
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: '#ffffff',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
};
