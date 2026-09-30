import React from 'react';
import { Database, ShieldCheck, AlertOctagon, Percent, Activity } from 'lucide-react';

export default function SummaryCards({ summaryData, loading }) {
  const total = summaryData?.total_records?.toLocaleString() || '--';
  const normal = summaryData?.normal_records?.toLocaleString() || '--';
  const anomalies = summaryData?.total_anomalies?.toLocaleString() || '--';
  const rate = summaryData?.anomaly_percentage != null ? `${summaryData.anomaly_percentage}%` : '--';
  const highSev = summaryData?.high_severity ?? '--';
  const medSev = summaryData?.medium_severity ?? '--';

  const cards = [
    {
      title: 'TOTAL OBSERVATIONS',
      value: total,
      sub: 'Telemetry Packets Processed',
      icon: Database,
      iconColor: '#0284c7',
      iconBg: '#eff6ff',
    },
    {
      title: 'NOMINAL READINGS',
      value: normal,
      sub: 'Within Baseline Nominal Bounds',
      icon: ShieldCheck,
      iconColor: '#059669',
      iconBg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'DETECTED ANOMALIES',
      value: anomalies,
      sub: `${highSev} High / ${medSev} Medium Severity`,
      icon: AlertOctagon,
      iconColor: '#dc2626',
      iconBg: 'rgba(239, 68, 68, 0.1)',
    },
    {
      title: 'CONTAMINATION RATE',
      value: rate,
      sub: 'Isolation Forest Baseline: 1.0%',
      icon: Percent,
      iconColor: '#d97706',
      iconBg: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  return (
    <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="telemetry-card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <span className="card-subtitle" style={{ letterSpacing: '0.05em', fontWeight: '600' }}>
                {card.title}
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: card.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={16} color={card.iconColor} />
              </div>
            </div>

            <div className="mono-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
              {loading ? <span className="skeleton" style={{ display: 'inline-block', width: '90px', height: '32px' }}></span> : card.value}
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {card.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
