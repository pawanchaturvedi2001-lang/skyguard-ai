import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function SystemErrorBanner({ onRetry, isRetrying }) {
  return (
    <div style={styles.banner}>
      <div style={styles.left}>
        <div style={styles.iconContainer}>
          <AlertCircle size={20} color="#dc2626" />
        </div>
        <div>
          <div style={styles.title}>Backend Connection Offline</div>
          <div style={styles.desc}>
            Unable to communicate with SkyGuard AI REST API on <code>http://127.0.0.1:8000</code>. Ensure the FastAPI service is running.
          </div>
        </div>
      </div>
      <button 
        onClick={onRetry} 
        disabled={isRetrying}
        style={styles.retryBtn}
      >
        <RefreshCw size={14} style={{ animation: isRetrying ? 'spin 1s linear infinite' : 'none' }} />
        <span>{isRetrying ? 'Checking...' : 'Retry Connection'}</span>
      </button>
    </div>
  );
}

const styles = {
  banner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)',
    padding: '14px 18px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: '#991b1b',
  },
  desc: {
    fontSize: '0.78rem',
    color: '#b91c1c',
    marginTop: '2px',
  },
  retryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
