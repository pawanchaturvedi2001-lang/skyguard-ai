import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SystemErrorBanner from './components/SystemErrorBanner';
import OverviewPage from './pages/OverviewPage';
import LiveTelemetryPage from './pages/LiveTelemetryPage';
import AnalyzeTelemetryPage from './pages/AnalyzeTelemetryPage';
import EventHistoryPage from './pages/EventHistoryPage';
import ModelStatusPage from './pages/ModelStatusPage';
import CityWeatherPage from './pages/CityWeatherPage';
import { apiService } from './services/api';
import './styles/global.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [systemHealth, setSystemHealth] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [telemetryData, setTelemetryData] = useState([]);
  const [anomaliesData, setAnomaliesData] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const isMountedRef = useRef(true);

  // Centralized telemetry and system data loader
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    
    try {
      // Execute API calls in parallel
      const [healthRes, infoRes, summaryRes, telemRes, anomRes] = await Promise.all([
        apiService.getHealth().catch(e => { console.warn('Health error', e); return null; }),
        apiService.getModelInfo().catch(e => { console.warn('Model info error', e); return null; }),
        apiService.getDashboardSummary().catch(e => { console.warn('Summary error', e); return null; }),
        apiService.getTelemetry({ limit: 60, station_id: selectedStation }).catch(e => { console.warn('Telemetry error', e); return { records: [] }; }),
        apiService.getAnomalies({ limit: 30, station_id: selectedStation }).catch(e => { console.warn('Anomalies error', e); return { records: [] }; })
      ]);

      if (isMountedRef.current) {
        if (healthRes) {
          setSystemHealth(healthRes);
          setIsBackendConnected(true);
        } else {
          setIsBackendConnected(false);
        }

        if (infoRes) setModelInfo(infoRes);
        if (summaryRes) setSummaryData(summaryRes);
        if (telemRes?.records) setTelemetryData(telemRes.records);
        if (anomRes?.records) setAnomaliesData(anomRes.records);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      if (isMountedRef.current) {
        setIsBackendConnected(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [selectedStation]);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    loadDashboardData(false);
    return () => { isMountedRef.current = false; };
  }, [loadDashboardData]);

  // Controlled near-real-time polling (every 6 seconds if autoRefresh is enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboardData]);

  const pageHeaders = {
    overview: {
      title: 'Mission Control Overview',
      subtitle: 'Real-time orbital telemetry monitoring and AI-powered anomaly identification',
    },
    live: {
      title: 'Live Sensor Telemetry Feed',
      subtitle: 'Continuous multi-channel sensor telemetry streams and trajectory charts',
    },
    predict: {
      title: 'Real-Time Anomaly Inference',
      subtitle: 'Evaluate live telemetry packets against the trained 15-feature Isolation Forest model',
    },
    weather: {
      title: 'India Real-Time Weather Network',
      subtitle: 'Dynamic meteorological observations across India with Open-Meteo & SkyGuard AI anomaly evaluation',
    },
    history: {
      title: 'Telemetry & Incident Archive',
      subtitle: 'Complete historical satellite telemetry database and detected anomaly events',
    },
    model: {
      title: 'ML Model Intelligence & Health',
      subtitle: 'Isolation Forest parameters, 15-feature engineering hierarchy, and API microservice status',
    },
  };

  const currentHeader = pageHeaders[activeTab] || pageHeaders.overview;

  return (
    <div className="app-container">
      {/* Persistent Aerospace Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Layout Area */}
      <div className="main-layout">
        {/* Sticky Header with UTC clock and status */}
        <Header
          title={currentHeader.title}
          subtitle={currentHeader.subtitle}
          onRefresh={() => loadDashboardData(false)}
          isRefreshing={isRefreshing}
          isBackendConnected={isBackendConnected}
          unreadAlertsCount={summaryData?.total_anomalies || 0}
        />

        {/* Content View Container */}
        <main className="content-area">
          {/* Backend Connection Alert if Offline */}
          {!isBackendConnected && (
            <SystemErrorBanner
              onRetry={() => loadDashboardData(false)}
              isRetrying={isRefreshing}
            />
          )}

          {/* Dynamic Page Rendering */}
          {activeTab === 'overview' && (
            <OverviewPage
              summaryData={summaryData}
              telemetryData={telemetryData}
              anomaliesData={anomaliesData}
              systemHealth={systemHealth}
              modelInfo={modelInfo}
              loading={loading}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'live' && (
            <LiveTelemetryPage
              telemetryData={telemetryData}
              loading={loading}
              onRefresh={() => loadDashboardData(false)}
              autoRefresh={autoRefresh}
              setAutoRefresh={setAutoRefresh}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
            />
          )}

          {activeTab === 'predict' && (
            <AnalyzeTelemetryPage />
          )}

          {activeTab === 'weather' && (
            <CityWeatherPage />
          )}

          {activeTab === 'history' && (
            <EventHistoryPage />
          )}

          {activeTab === 'model' && (
            <ModelStatusPage
              modelInfo={modelInfo}
              systemHealth={systemHealth}
              loading={loading}
            />
          )}
        </main>
      </div>
    </div>
  );
}
