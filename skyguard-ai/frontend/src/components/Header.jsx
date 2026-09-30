import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { getCurrentISTClock } from '../utils/dateUtils';

export default function Header({ 
  title, 
  subtitle, 
  onRefresh, 
  isRefreshing, 
  isBackendConnected,
  unreadAlertsCount = 0,
  theme = 'light',
  toggleTheme
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getCurrentISTClock());
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

      {/* Meta Controls, Clock, & Theme Toggle */}
      <div style={styles.rightSection}>
        {/* IST Clock */}
        <div style={styles.clockCard} title="Indian Standard Time (Asia/Kolkata, UTC+05:30)">
          <Clock size={14} color="var(--primary-color)" />
          <span style={styles.clockText}>{currentTime || 'SYNCHRONIZING IST...'}</span>
        </div>

        {/* Network Status Pill */}
        <div style={{
          ...styles.networkPill,
          background: isBackendConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderColor: isBackendConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          color: isBackendConnected ? 'var(--status-normal-text)' : 'var(--status-critical-text)'
        }}>
          {isBackendConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isBackendConnected ? 'TELEMETRY ONLINE' : 'DISCONNECTED'}</span>
        </div>

        {/* Light / Dark Mode Toggle Button */}
        {toggleTheme && (
          <button
            onClick={toggleTheme}
            style={styles.themeToggleBtn}
            title={theme === 'dark' ? 'Switch to Clean Light Theme' : 'Switch to Mission Dark Theme'}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? (
              <Sun size={15} color="#f59e0b" />
            ) : (
              <Moon size={15} color="#64748b" />
            )}
          </button>
        )}

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={styles.refreshButton}
          title="Manually refresh telemetry data"
        >
          <RefreshCw 
            size={14} 
            color="var(--text-muted)" 
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
    backgroundColor: 'var(--bg-card)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    transition: 'background-color 0.25s ease, border-color 0.25s ease',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    letterSpacing: '-0.01em',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  liveText: {
    fontSize: '0.66rem',
    fontWeight: '700',
    color: 'var(--status-normal-text)',
    letterSpacing: '0.06em',
    fontFamily: 'var(--font-mono)',
  },
  subtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  clockCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-canvas)',
    border: '1px solid var(--border-subtle)',
  },
  clockText: {
    fontSize: '0.74rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-main)',
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
  themeToggleBtn: {
    padding: '7px 9px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-canvas)',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  refreshButton: {
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-canvas)',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
};
