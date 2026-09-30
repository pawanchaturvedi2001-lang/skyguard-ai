import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Scatter 
} from 'recharts';
import { LineChart as ChartIcon, Eye, EyeOff } from 'lucide-react';
import { formatToIST } from '../utils/dateUtils';

export default function TelemetryChart({ telemetryData = [], loading }) {
  const [showTemp, setShowTemp] = useState(true);
  const [showPres, setShowPres] = useState(true);
  const [showHum, setShowHum] = useState(true);
  const [viewPoints, setViewPoints] = useState(60);

  // Format data for Recharts
  const chartData = useMemo(() => {
    if (!telemetryData || telemetryData.length === 0) return [];
    
    // Take the most recent 'viewPoints' records and sort chronologically
    const sliced = telemetryData.slice(0, viewPoints).reverse();
    return sliced.map((item, idx) => {
      const timeStr = item.timestamp ? formatToIST(item.timestamp, 'time_short') : `T-${idx}`;
      const isAnom = item.anomaly === true;
      return {
        time: timeStr,
        timestamp: item.timestamp,
        station_id: item.station_id,
        temperature: item.temperature != null ? parseFloat(Number(item.temperature).toFixed(2)) : null,
        pressure: item.pressure != null ? parseFloat(Number(item.pressure).toFixed(2)) : null,
        humidity: item.humidity != null ? parseFloat(Number(item.humidity).toFixed(2)) : null,
        isAnomaly: isAnom,
        anomaly_score: item.anomaly_score,
        severity: item.severity || (isAnom ? 'ANOMALY' : 'NORMAL'),
        anomalyMarkerTemp: isAnom ? parseFloat(Number(item.temperature).toFixed(2)) : null,
      };
    });
  }, [telemetryData, viewPoints]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={styles.tooltip}>
          <div style={styles.tooltipHeader}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {data.timestamp ? formatToIST(data.timestamp, 'full') : label}
            </span>
            {data.isAnomaly && (
              <span className="badge badge-critical" style={{ marginLeft: '8px' }}>
                {data.severity}
              </span>
            )}
          </div>
          <div style={styles.tooltipBody}>
            {showTemp && data.temperature != null && (
              <div style={styles.tooltipRow}>
                <span style={{ color: '#ea580c', fontWeight: 500 }}>● Temperature:</span>
                <span className="mono-value" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{data.temperature} °C</span>
              </div>
            )}
            {showPres && data.pressure != null && (
              <div style={styles.tooltipRow}>
                <span style={{ color: '#0284c7', fontWeight: 500 }}>● Pressure:</span>
                <span className="mono-value" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{data.pressure} hPa</span>
              </div>
            )}
            {showHum && data.humidity != null && (
              <div style={styles.tooltipRow}>
                <span style={{ color: '#0d9488', fontWeight: 500 }}>● Humidity:</span>
                <span className="mono-value" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{data.humidity} %</span>
              </div>
            )}
            {data.isAnomaly && (
              <div style={{ ...styles.tooltipRow, borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', marginTop: '6px' }}>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>Anomaly Score:</span>
                <span className="mono-value" style={{ color: '#dc2626', fontWeight: 700 }}>
                  {data.anomaly_score != null ? Number(data.anomaly_score).toFixed(4) : 'Detected'}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="telemetry-card" style={{ marginBottom: '24px' }}>
      <div className="card-header">
        <div className="card-title">
          <ChartIcon size={18} color="var(--primary-color)" />
          <span>Multi-Sensor Weather Telemetry Trends</span>
        </div>

        {/* Controls & Filter */}
        <div style={styles.controlsRow}>
          {/* Channel Toggles */}
          <div style={styles.channelGroup}>
            <button
              onClick={() => setShowTemp(!showTemp)}
              style={{
                ...styles.toggleBtn,
                background: showTemp ? 'rgba(234, 88, 12, 0.12)' : 'var(--bg-canvas)',
                borderColor: showTemp ? 'rgba(234, 88, 12, 0.4)' : 'var(--border-subtle)',
                color: showTemp ? '#ea580c' : 'var(--text-muted)',
              }}
            >
              {showTemp ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>Temp (°C)</span>
            </button>

            <button
              onClick={() => setShowPres(!showPres)}
              style={{
                ...styles.toggleBtn,
                background: showPres ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-canvas)',
                borderColor: showPres ? 'rgba(2, 132, 199, 0.4)' : 'var(--border-subtle)',
                color: showPres ? '#0284c7' : 'var(--text-muted)',
              }}
            >
              {showPres ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>Pressure (hPa)</span>
            </button>

            <button
              onClick={() => setShowHum(!showHum)}
              style={{
                ...styles.toggleBtn,
                background: showHum ? 'rgba(13, 148, 136, 0.12)' : 'var(--bg-canvas)',
                borderColor: showHum ? 'rgba(13, 148, 136, 0.4)' : 'var(--border-subtle)',
                color: showHum ? '#0d9488' : 'var(--text-muted)',
              }}
            >
              {showHum ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>Humidity (%)</span>
            </button>
          </div>

          {/* Time range selection */}
          <div style={styles.rangeGroup}>
            {[30, 60, 100].map((num) => (
              <button
                key={num}
                onClick={() => setViewPoints(num)}
                style={{
                  ...styles.rangeBtn,
                  background: viewPoints === num ? 'var(--primary-color)' : 'transparent',
                  color: viewPoints === num ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: viewPoints === num ? '700' : '500',
                }}
              >
                {num}P
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: '100%', height: 340 }}>
        {loading && chartData.length === 0 ? (
          <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.7} />
              
              <XAxis 
                dataKey="time" 
                stroke="var(--text-muted)" 
                fontSize={11} 
                tickLine={false}
                fontFamily="var(--font-mono)"
              />

              {/* Left Y Axis for Temperature & Humidity */}
              <YAxis 
                yAxisId="left" 
                stroke="var(--text-muted)" 
                fontSize={11} 
                domain={['auto', 'auto']}
                fontFamily="var(--font-mono)"
                tickLine={false}
              />

              {/* Right Y Axis for Pressure */}
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#0284c7" 
                fontSize={11} 
                domain={['auto', 'auto']}
                fontFamily="var(--font-mono)"
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              {showTemp && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#ea580c"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {showPres && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pressure"
                  name="Pressure (hPa)"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {showHum && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%)"
                  stroke="#0d9488"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Red Scatter markers for anomaly points on temperature */}
              {showTemp && (
                <Scatter
                  yAxisId="left"
                  dataKey="anomalyMarkerTemp"
                  name="Detected Anomaly"
                  fill="#dc2626"
                  shape="circle"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={styles.chartLegendFooter}>
        <div style={styles.legendItem}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ea580c' }}></span>
          <span>Temperature (Left Axis)</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
          <span>Pressure (Right Axis)</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0d9488' }}></span>
          <span>Humidity (Left Axis)</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#dc2626' }}></span>
          <span style={{ color: '#dc2626', fontWeight: 600 }}>Red Dot = Isolation Forest Outlier</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  channelGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '0.72rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  rangeGroup: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-canvas)',
    padding: '2px',
    borderRadius: '4px',
    border: '1px solid var(--border-subtle)',
  },
  rangeBtn: {
    padding: '3px 8px',
    fontSize: '0.70rem',
    fontFamily: 'var(--font-mono)',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tooltip: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    boxShadow: 'var(--shadow-card)',
    fontSize: '0.78rem',
  },
  tooltipHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-subtle)',
    paddingBottom: '6px',
    marginBottom: '8px',
    color: 'var(--text-muted)',
  },
  tooltipBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  tooltipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
  },
  chartLegendFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '14px',
    paddingTop: '10px',
    borderTop: '1px solid var(--border-subtle)',
    fontSize: '0.74rem',
    color: 'var(--text-muted)',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};
