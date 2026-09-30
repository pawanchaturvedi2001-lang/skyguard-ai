import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { 
  CloudSun, 
  CloudRain, 
  Sun, 
  Moon,
  Cloud, 
  CloudFog, 
  Wind, 
  Droplets, 
  Thermometer, 
  Gauge, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  Search, 
  MapPin, 
  CheckCircle2, 
  AlertOctagon, 
  Activity, 
  Info, 
  ArrowRight,
  Clock,
  Compass,
  Mountain,
  X
} from 'lucide-react';

const FAVORITE_CITIES = [
  'Indore', 'Delhi', 'Mumbai', 'Bengaluru', 'Bhopal', 
  'Jaipur', 'Chennai', 'Kolkata', 'Hyderabad', 'Kochi', 'Guwahati'
];

export default function CityWeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState({
    name: 'Indore',
    city: 'Indore',
    state: 'Madhya Pradesh',
    district: 'Indore District',
    country: 'India',
    latitude: 22.7196,
    longitude: 75.8577,
  });

  const [currentWeather, setCurrentWeather] = useState(null);
  const [allCities, setAllCities] = useState([]);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Dynamic Geocoding Location Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [tableFilter, setTableFilter] = useState('');

  const searchContainerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch weather for a given target (supports object with lat/lon or city string)
  const fetchWeather = useCallback(async (target) => {
    setLoadingCurrent(true);
    setError(null);
    try {
      const data = await apiService.getCityWeather(target);
      setCurrentWeather(data);
      if (typeof target === 'object' && target !== null) {
        setSelectedLocation(prev => ({
          ...prev,
          name: data.city || target.name || prev.name,
          city: data.city || target.city || prev.city,
          state: data.state || target.state || prev.state,
          district: data.district || target.district || prev.district,
          country: data.country || 'India',
          latitude: data.latitude,
          longitude: data.longitude,
          elevation: data.elevation
        }));
      } else if (typeof target === 'string') {
        setSelectedLocation(prev => ({
          ...prev,
          name: data.city || target,
          city: data.city || target,
          state: data.state,
          district: data.district,
          country: data.country || 'India',
          latitude: data.latitude,
          longitude: data.longitude,
          elevation: data.elevation
        }));
      }
    } catch (err) {
      console.error('Error loading weather data:', err);
      setError(err.message || 'Weather telemetry temporarily unavailable.');
    } finally {
      setLoadingCurrent(false);
    }
  }, []);

  // Fetch all reference cities overview
  const fetchAllCitiesWeather = useCallback(async (silent = false) => {
    if (!silent) setLoadingAll(true);
    try {
      const data = await apiService.getAllCitiesWeather();
      if (data?.cities) {
        setAllCities(data.cities);
      }
    } catch (err) {
      console.error('Error loading reference stations weather:', err);
    } finally {
      if (!silent) setLoadingAll(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchWeather(selectedLocation);
    fetchAllCitiesWeather();
  }, [fetchAllCitiesWeather]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle dynamic location search with debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length >= 2) {
      setIsSearching(true);
      setShowDropdown(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await apiService.searchLocations(val.trim());
          setSearchResults(res.results || []);
        } catch (err) {
          console.warn('Geocoding search failed:', err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 350);
    } else {
      setSearchResults([]);
      setIsSearching(false);
      setShowDropdown(false);
    }
  };

  const handleSelectLocation = (loc) => {
    setShowDropdown(false);
    setSearchQuery('');
    const target = {
      lat: loc.latitude,
      lon: loc.longitude,
      name: loc.name,
      state: loc.admin1 || '',
      district: loc.admin2 || '',
      country: loc.country || 'India',
      elevation: loc.elevation
    };
    fetchWeather(target);
  };

  const handleSelectFavorite = (cityName) => {
    fetchWeather(cityName);
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchWeather(selectedLocation),
      fetchAllCitiesWeather(true)
    ]);
    setIsRefreshing(false);
  };

  // Weather icon helper
  const getWeatherIcon = (code, isDay = 1, size = 20) => {
    if (code === 0 || code === 1) {
      return isDay === 0 ? <Moon size={size} color="#6366f1" /> : <Sun size={size} color="#f59e0b" />;
    }
    if (code === 2) return <CloudSun size={size} color="#0284c7" />;
    if (code === 3) return <Cloud size={size} color="#64748b" />;
    if (code >= 45 && code <= 48) return <CloudFog size={size} color="#94a3b8" />;
    if (code >= 51 && code <= 67) return <CloudRain size={size} color="#0284c7" />;
    if (code >= 80 && code <= 82) return <CloudRain size={size} color="#2563eb" />;
    if (code >= 95) return <Wind size={size} color="#7c3aed" />;
    return <CloudSun size={size} color="#0284c7" />;
  };

  // ML Analysis Badge helper
  const getAnalysisBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'normal':
        return (
          <span className="badge badge-normal" style={{ fontSize: '0.74rem' }}>
            <CheckCircle2 size={11} />
            <span>NORMAL (INLIER)</span>
          </span>
        );
      case 'anomaly':
        return (
          <span className="badge badge-critical" style={{ fontSize: '0.74rem' }}>
            <AlertTriangle size={11} />
            <span>ANOMALY DETECTED</span>
          </span>
        );
      case 'not_analyzed':
      default:
        return (
          <span className="badge badge-muted" style={{ fontSize: '0.74rem', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
            <HelpCircle size={11} />
            <span>NOT ANALYZED</span>
          </span>
        );
    }
  };

  const filteredCities = allCities.filter(c => 
    c.city.toLowerCase().includes(tableFilter.toLowerCase()) ||
    (c.state && c.state.toLowerCase().includes(tableFilter.toLowerCase())) ||
    c.weather_condition.toLowerCase().includes(tableFilter.toLowerCase())
  );

  return (
    <div>
      {/* Top Banner */}
      <div style={styles.topBanner}>
        <div>
          <h2 style={styles.bannerTitle}>
            India Real-Time Weather Network
          </h2>
          <p style={styles.bannerSubtitle}>
            Live meteorological observations across India via Open-Meteo Geocoding & Weather APIs with SkyGuard AI Isolation Forest sensor anomaly detection.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.providerBadge}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#059669' }}></span>
            <span>OPEN-METEO REST API • INDIA</span>
          </div>

          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#ffffff' }}
            title="Refresh network weather observations"
          >
            <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshing ? 'Updating...' : 'Sync Network'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={styles.errorBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertOctagon size={18} color="#dc2626" />
            <div>
              <strong style={{ color: '#991b1b' }}>Weather Service Notice: </strong>
              <span style={{ color: '#b91c1c' }}>{error}</span>
            </div>
          </div>
          <button 
            onClick={() => fetchWeather(selectedLocation)} 
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.72rem', background: '#ffffff', borderColor: '#fca5a5', color: '#b91c1c' }}
          >
            Retry Station
          </button>
        </div>
      )}

      {/* Dynamic Location Search Bar & Quick Favorites Bar */}
      <div style={styles.searchSectionCard}>
        <div style={{ position: 'relative', flex: '1 1 320px' }} ref={searchContainerRef}>
          <label style={styles.inputLabel}>
            <Search size={14} color="#0284c7" />
            <span>SEARCH CITY OR LOCATION IN INDIA</span>
          </label>
          
          <div style={styles.searchInputWrapper}>
            <Search size={16} color="#64748b" style={styles.searchIconInside} />
            <input
              type="text"
              placeholder="Search city, district, or town (e.g. Indore, Bilaspur, Ujjain, Gwalior)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              style={styles.locationSearchInput}
            />
            {isSearching && (
              <RefreshCw size={14} color="#0284c7" style={{ animation: 'spin 1s linear infinite', marginRight: '10px' }} />
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}
                style={styles.clearSearchBtn}
                title="Clear"
              >
                <X size={14} color="#64748b" />
              </button>
            )}
          </div>

          {/* Autocomplete / Disambiguation Results Dropdown */}
          {showDropdown && (
            <div style={styles.resultsDropdown}>
              {isSearching ? (
                <div style={styles.dropdownLoading}>
                  <RefreshCw size={14} color="#0284c7" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Searching Indian geographical registry...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div style={styles.dropdownEmpty}>
                  No matching Indian locations found for "{searchQuery}".
                </div>
              ) : (
                <div>
                  <div style={styles.dropdownHeader}>
                    MATCHING LOCATIONS ({searchResults.length}) — SELECT TO MONITOR
                  </div>
                  {searchResults.map((loc) => {
                    const stateText = loc.admin1 || 'India';
                    const districtText = loc.admin2 ? `${loc.admin2}, ` : '';
                    return (
                      <div
                        key={loc.id || `${loc.name}-${loc.latitude}-${loc.longitude}`}
                        onClick={() => handleSelectLocation(loc)}
                        style={styles.dropdownItem}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={15} color="#0284c7" />
                            <div>
                              <span style={styles.itemCityName}>{loc.name}</span>
                              <span style={styles.itemDisambiguation}>
                                {districtText}{stateText}
                              </span>
                            </div>
                          </div>
                          <div style={styles.itemCoords}>
                            {loc.latitude.toFixed(2)}°N, {loc.longitude.toFixed(2)}°E
                            {loc.elevation != null && ` • ${loc.elevation}m`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Favorite Quick Chips */}
        <div style={{ flex: '2 1 450px' }}>
          <label style={styles.inputLabel}>
            <MapPin size={14} color="#0284c7" />
            <span>QUICK-ACCESS INDIAN CITIES</span>
          </label>
          <div style={styles.favoriteChipsRow}>
            {FAVORITE_CITIES.map((city) => {
              const isSelected = selectedLocation.city?.toLowerCase() === city.toLowerCase() ||
                                 selectedLocation.name?.toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  onClick={() => handleSelectFavorite(city)}
                  style={{
                    ...styles.favoriteChip,
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    borderColor: isSelected ? '#93c5fd' : '#e2e8f0',
                    color: isSelected ? '#0284c7' : '#334155',
                    fontWeight: isSelected ? '600' : 'normal',
                    boxShadow: isSelected ? '0 1px 2px rgba(2, 132, 199, 0.1)' : 'none'
                  }}
                >
                  <span>{city}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Location Highlight Card */}
      <div className="telemetry-card" style={{ marginBottom: '26px' }}>
        {loadingCurrent && !currentWeather ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px auto', display: 'block' }} color="#0284c7" />
            Connecting to Open-Meteo & retrieving live telemetry for {selectedLocation.name}...
          </div>
        ) : currentWeather ? (
          <div>
            {/* Header info */}
            <div style={styles.stationHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0f172a' }}>
                    {currentWeather.city}
                  </h3>
                  <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                    {currentWeather.station_code}
                  </span>
                  {currentWeather.state && (
                    <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 500 }}>
                      • {currentWeather.district ? `${currentWeather.district}, ` : ''}{currentWeather.state}, {currentWeather.country}
                    </span>
                  )}
                  {currentWeather.is_day != null && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: currentWeather.is_day === 1 ? '#fef3c7' : '#e0e7ff',
                      color: currentWeather.is_day === 1 ? '#b45309' : '#3730a3',
                      fontWeight: 600
                    }}>
                      {currentWeather.is_day === 1 ? <Sun size={11} /> : <Moon size={11} />}
                      {currentWeather.is_day === 1 ? 'DAYTIME' : 'NIGHT'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    Coords: {currentWeather.latitude.toFixed(4)}° N, {currentWeather.longitude.toFixed(4)}° E
                  </span>
                  {currentWeather.elevation != null && (
                    <>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>•</span>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mountain size={12} color="#64748b" />
                        Elevation: {currentWeather.elevation}m MSL
                      </span>
                    </>
                  )}
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>•</span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} color="#64748b" />
                    Observed: {currentWeather.observation_time}
                  </span>
                </div>
              </div>

              {/* Weather condition box */}
              <div style={styles.conditionBox}>
                {getWeatherIcon(currentWeather.weather_code, currentWeather.is_day, 28)}
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                    {currentWeather.weather_condition}
                  </div>
                  <div style={{ fontSize: '0.70rem', color: '#64748b' }}>
                    WMO Code: {currentWeather.weather_code != null ? currentWeather.weather_code : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Comprehensive 6 Physical Metric Cards */}
            <div style={styles.metricsGrid}>
              {/* 1. Ambient Temperature */}
              <div style={styles.sensorMetricCard}>
                <div style={styles.sensorMetricTop}>
                  <span style={styles.metricCardLabel}>AMBIENT TEMPERATURE</span>
                  <div style={{ ...styles.iconPill, background: '#fff7ed', color: '#ea580c' }}>
                    <Thermometer size={15} />
                  </div>
                </div>
                <div className="mono-value" style={styles.metricBigValue}>
                  {currentWeather.temperature != null ? currentWeather.temperature.toFixed(1) : '--'}
                  <span style={styles.metricUnit}>°C</span>
                </div>
                <div style={styles.metricSubInfo}>
                  Measured at 2m above ground level
                </div>
              </div>

              {/* 2. Feels Like / Apparent Temperature */}
              <div style={styles.sensorMetricCard}>
                <div style={styles.sensorMetricTop}>
                  <span style={styles.metricCardLabel}>FEELS LIKE (APPARENT)</span>
                  <div style={{ ...styles.iconPill, background: '#fef2f2', color: '#dc2626' }}>
                    <Thermometer size={15} />
                  </div>
                </div>
                <div className="mono-value" style={styles.metricBigValue}>
                  {currentWeather.apparent_temperature != null ? currentWeather.apparent_temperature.toFixed(1) : '--'}
                  <span style={styles.metricUnit}>°C</span>
                </div>
                <div style={styles.metricSubInfo}>
                  Biometeorological wind/humidity index
                </div>
              </div>

              {/* 3. Relative Humidity */}
              <div style={styles.sensorMetricCard}>
                <div style={styles.sensorMetricTop}>
                  <span style={styles.metricCardLabel}>RELATIVE HUMIDITY</span>
                  <div style={{ ...styles.iconPill, background: '#f0fdfa', color: '#0d9488' }}>
                    <Droplets size={15} />
                  </div>
                </div>
                <div className="mono-value" style={styles.metricBigValue}>
                  {currentWeather.humidity != null ? currentWeather.humidity.toFixed(0) : '--'}
                  <span style={styles.metricUnit}>%</span>
                </div>
                <div style={styles.metricSubInfo}>
                  Water vapor saturation level
                </div>
              </div>

              {/* 4. Atmospheric Pressure */}
              <div style={styles.sensorMetricCard}>
                <div style={styles.sensorMetricTop}>
                  <span style={styles.metricCardLabel}>ATMOSPHERIC PRESSURE</span>
                  <div style={{ ...styles.iconPill, background: '#eff6ff', color: '#0284c7' }}>
                    <Gauge size={15} />
                  </div>
                </div>
                <div className="mono-value" style={styles.metricBigValue}>
                  {currentWeather.pressure != null ? currentWeather.pressure.toFixed(1) : '--'}
                  <span style={styles.metricUnit}>hPa</span>
                </div>
                <div style={styles.metricSubInfo}>
                  MSL ({currentWeather.surface_pressure != null ? `${currentWeather.surface_pressure.toFixed(1)} hPa surface` : 'Standard'})
                </div>
              </div>

              {/* 5. Wind Speed & Direction */}
              <div style={styles.sensorMetricCard}>
                <div style={styles.sensorMetricTop}>
                  <span style={styles.metricCardLabel}>WIND SPEED & HEADING</span>
                  <div style={{ ...styles.iconPill, background: '#f5f3ff', color: '#7c3aed' }}>
                    <Compass size={15} />
                  </div>
                </div>
                <div className="mono-value" style={styles.metricBigValue}>
                  {currentWeather.wind_speed != null ? currentWeather.wind_speed.toFixed(1) : '--'}
                  <span style={styles.metricUnit}>km/h</span>
                </div>
                <div style={styles.metricSubInfo}>
                  Heading: {currentWeather.wind_direction_compass || 'N/A'} ({currentWeather.wind_direction != null ? `${currentWeather.wind_direction.toFixed(0)}°` : '--'})
                </div>
              </div>

              {/* 6. Precipitation & Cloud Cover */}
              <div style={styles.sensorMetricCard}>
                <div style={styles.sensorMetricTop}>
                  <span style={styles.metricCardLabel}>PRECIPITATION & CLOUD</span>
                  <div style={{ ...styles.iconPill, background: '#f0fdf4', color: '#16a34a' }}>
                    <CloudRain size={15} />
                  </div>
                </div>
                <div className="mono-value" style={styles.metricBigValue}>
                  {currentWeather.precipitation != null ? currentWeather.precipitation.toFixed(1) : '0.0'}
                  <span style={styles.metricUnit}>mm</span>
                </div>
                <div style={styles.metricSubInfo}>
                  Cloud Cover: {currentWeather.cloud_cover != null ? `${currentWeather.cloud_cover.toFixed(0)}%` : '--'}
                </div>
              </div>
            </div>

            {/* SkyGuard AI Isolation Forest Evaluation Box */}
            <div style={styles.mlEvaluationCard}>
              <div style={styles.mlCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#0284c7" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                    SkyGuard AI Isolation Forest Sensor Evaluation
                  </span>
                </div>
                <div>
                  {getAnalysisBadge(currentWeather.analysis_status)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', margin: '14px 0' }}>
                <div style={styles.mlDetailBox}>
                  <span style={styles.mlDetailBoxLabel}>Algorithm Status</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                    {currentWeather.analysis_status === 'normal' ? 'Nominal Inlier' :
                     currentWeather.analysis_status === 'anomaly' ? 'Anomaly Detected' : 'Uncalibrated / Excluded'}
                  </span>
                </div>

                <div style={styles.mlDetailBox}>
                  <span style={styles.mlDetailBoxLabel}>Isolation Decision Score</span>
                  <span className="mono-value" style={{
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: currentWeather.is_anomaly === true ? '#dc2626' : 
                           currentWeather.is_anomaly === false ? '#059669' : '#64748b'
                  }}>
                    {currentWeather.anomaly_score != null ? currentWeather.anomaly_score.toFixed(6) : 'N/A (< 0 is outlier)'}
                  </span>
                </div>

                <div style={styles.mlDetailBox}>
                  <span style={styles.mlDetailBoxLabel}>Detection Confidence</span>
                  <span className="mono-value" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                    {currentWeather.confidence != null ? `${(currentWeather.confidence * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>

                <div style={styles.mlDetailBox}>
                  <span style={styles.mlDetailBoxLabel}>Assessed Severity</span>
                  <span style={{
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: currentWeather.is_anomaly === true ? '#dc2626' :
                           currentWeather.is_anomaly === false ? '#059669' : '#64748b'
                  }}>
                    {currentWeather.severity || 'NOMINAL'}
                  </span>
                </div>
              </div>

              {/* Technical Distinction & Note */}
              <div style={styles.explanationPanel}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Info size={16} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.80rem', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                      Distinction: Weather Condition vs. Sensor Telemetry Anomaly
                    </div>
                    <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45, margin: 0 }}>
                      <strong>Weather Condition</strong> ({currentWeather.weather_condition}) indicates natural atmospheric state. 
                      In contrast, <strong>SkyGuard AI's Isolation Forest</strong> detects hardware sensor defects by comparing observations against a 15-feature space (including 1st/2nd derivatives, velocities, and 8-step rolling standard deviations).
                      Active precipitation events (WMO ≥ 51) are meteorologically isolated from anomaly alarms to prevent false-positive sensor alerts.
                    </p>
                    {currentWeather.analysis_note && (
                      <div style={styles.technicalNote}>
                        <strong>Evaluation Note: </strong>
                        {currentWeather.analysis_note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Network Reference Stations Overview Table */}
      <div className="telemetry-card">
        <div className="card-header">
          <div className="card-title">
            <Wind size={18} color="#0284c7" />
            <span>National Automatic Weather Station (AWS) Registry ({allCities.length} Reference Stations)</span>
          </div>

          {/* Table Search Filter */}
          <div style={styles.tableSearchBox}>
            <Search size={14} color="#64748b" />
            <input
              type="text"
              placeholder="Filter stations by city, state, condition..."
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              style={styles.tableSearchInput}
            />
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
          Real-time weather telemetry comparison across Indian metropolitan and regional monitoring stations. Click "Inspect" or any row to display live readings and Isolation Forest evaluation.
        </p>

        <div className="table-responsive">
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>City & Region</th>
                <th>Station Code</th>
                <th>Temperature</th>
                <th>Feels Like</th>
                <th>Humidity</th>
                <th>Pressure (MSL)</th>
                <th>Weather Condition</th>
                <th>SkyGuard Analysis</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingAll && allCities.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 6px auto', display: 'block' }} color="#0284c7" />
                    Querying meteorological stations across India...
                  </td>
                </tr>
              ) : filteredCities.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No matching reference stations found for "{tableFilter}".
                  </td>
                </tr>
              ) : (
                filteredCities.map((cityData) => {
                  const isSelected = selectedLocation.name?.toLowerCase() === cityData.city.toLowerCase() ||
                                     selectedLocation.city?.toLowerCase() === cityData.city.toLowerCase();
                  return (
                    <tr 
                      key={cityData.city}
                      style={{
                        backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        fetchWeather({
                          lat: cityData.latitude,
                          lon: cityData.longitude,
                          name: cityData.city,
                          state: cityData.state,
                          district: cityData.district,
                          country: cityData.country,
                          elevation: cityData.elevation
                        });
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{cityData.city}</span>
                          {cityData.state && (
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              ({cityData.state})
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-info">{cityData.station_code}</span>
                      </td>

                      <td className="mono-value" style={{ fontWeight: 600, color: '#0f172a' }}>
                        {cityData.temperature != null ? `${cityData.temperature.toFixed(1)} °C` : '--'}
                      </td>

                      <td className="mono-value" style={{ color: '#475569' }}>
                        {cityData.apparent_temperature != null ? `${cityData.apparent_temperature.toFixed(1)} °C` : '--'}
                      </td>

                      <td className="mono-value">
                        {cityData.humidity != null ? `${cityData.humidity.toFixed(0)} %` : '--'}
                      </td>

                      <td className="mono-value">
                        {cityData.pressure != null ? `${cityData.pressure.toFixed(1)} hPa` : '--'}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getWeatherIcon(cityData.weather_code, cityData.is_day, 15)}
                          <span style={{ fontSize: '0.78rem', color: '#334155' }}>
                            {cityData.weather_condition}
                          </span>
                        </div>
                      </td>

                      <td>
                        {getAnalysisBadge(cityData.analysis_status)}
                      </td>

                      <td className="mono-value" style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {cityData.observation_time?.split(' ')[1] || cityData.observation_time || 'Recent'}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchWeather({
                              lat: cityData.latitude,
                              lon: cityData.longitude,
                              name: cityData.city,
                              state: cityData.state,
                              district: cityData.district,
                              country: cityData.country,
                              elevation: cityData.elevation
                            });
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className="btn btn-outline"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.70rem',
                            background: isSelected ? '#0284c7' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#475569',
                            borderColor: isSelected ? '#0284c7' : '#e2e8f0'
                          }}
                        >
                          <span>{isSelected ? 'Inspecting' : 'Inspect'}</span>
                          <ArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  topBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '20px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  bannerTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  bannerSubtitle: {
    fontSize: '0.80rem',
    color: '#64748b',
    marginTop: '3px',
  },
  providerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.70rem',
    fontWeight: '600',
    color: '#065f46',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '4px',
    padding: '4px 10px',
    fontFamily: 'var(--font-mono)',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  searchSectionCard: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  inputLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#475569',
    letterSpacing: '0.04em',
    marginBottom: '8px',
  },
  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  searchIconInside: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  locationSearchInput: {
    width: '100%',
    padding: '9px 36px 9px 36px',
    fontSize: '0.82rem',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '10px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  resultsDropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    zIndex: 50,
    maxHeight: '340px',
    overflowY: 'auto',
  },
  dropdownHeader: {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#64748b',
    backgroundColor: '#f8fafc',
    padding: '8px 12px',
    borderBottom: '1px solid #e2e8f0',
    letterSpacing: '0.03em',
  },
  dropdownLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    fontSize: '0.78rem',
    color: '#64748b',
    justifyContent: 'center',
  },
  dropdownEmpty: {
    padding: '16px',
    fontSize: '0.78rem',
    color: '#64748b',
    textAlign: 'center',
  },
  dropdownItem: {
    padding: '10px 14px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background-color 0.1s',
    '&:hover': {
      backgroundColor: '#f0f9ff',
    }
  },
  itemCityName: {
    fontSize: '0.86rem',
    fontWeight: 600,
    color: '#0f172a',
    marginRight: '6px',
  },
  itemDisambiguation: {
    fontSize: '0.74rem',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
  },
  itemCoords: {
    fontSize: '0.70rem',
    color: '#94a3b8',
    fontFamily: 'var(--font-mono)',
  },
  favoriteChipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  favoriteChip: {
    padding: '6px 12px',
    fontSize: '0.75rem',
    borderRadius: '6px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  stationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '16px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  conditionBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 16px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
    margin: '20px 0',
  },
  sensorMetricCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sensorMetricTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  metricCardLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.04em',
  },
  iconPill: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricBigValue: {
    fontSize: '1.45rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: '2px 0',
  },
  metricUnit: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginLeft: '3px',
    fontWeight: 'normal',
  },
  metricSubInfo: {
    fontSize: '0.70rem',
    color: '#64748b',
    marginTop: '4px',
  },
  mlEvaluationCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  mlCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '10px',
  },
  mlDetailBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  mlDetailBoxLabel: {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.03em',
  },
  explanationPanel: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '12px 16px',
    marginTop: '12px',
  },
  technicalNote: {
    marginTop: '6px',
    fontSize: '0.72rem',
    color: '#0369a1',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '4px',
    padding: '6px 10px',
  },
  tableSearchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 10px',
    width: '280px',
  },
  tableSearchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.76rem',
    color: '#0f172a',
    width: '100%',
    backgroundColor: 'transparent',
  },
};
