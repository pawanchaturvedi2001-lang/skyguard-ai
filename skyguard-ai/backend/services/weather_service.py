import time
import json
import logging
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pandas as pd

from backend.schemas.weather import (
    CityInfo,
    CityWeatherResponse,
    AllCitiesWeatherResponse,
    GeocodingLocation,
    LocationSearchResponse,
)
from backend.services.model_service import ModelService
from ml.feature_engineering import MODEL_FEATURES

logger = logging.getLogger("skyguard.weather_service")

# WMO Weather Code Descriptions (World Meteorological Organization standards)
WMO_WEATHER_CODES: Dict[int, str] = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    56: "Light Freezing Drizzle",
    57: "Dense Freezing Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    66: "Light Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Slight Snow Fall",
    73: "Moderate Snow Fall",
    75: "Heavy Snow Fall",
    77: "Snow Grains",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    85: "Slight Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail"
}

# 10 Default Indian Meteorological Reference Stations
DEFAULT_CITIES: Dict[str, Dict[str, Any]] = {
    "indore": {
        "name": "Indore",
        "state": "Madhya Pradesh",
        "district": "Indore District",
        "country": "India",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "elevation": 553.0,
        "station_code": "AWS-IND-01",
    },
    "delhi": {
        "name": "Delhi",
        "state": "Delhi NCR",
        "district": "Central Delhi",
        "country": "India",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "elevation": 216.0,
        "station_code": "AWS-DEL-02",
    },
    "mumbai": {
        "name": "Mumbai",
        "state": "Maharashtra",
        "district": "Mumbai City",
        "country": "India",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "elevation": 14.0,
        "station_code": "AWS-BOM-03",
    },
    "bhopal": {
        "name": "Bhopal",
        "state": "Madhya Pradesh",
        "district": "Bhopal District",
        "country": "India",
        "latitude": 23.2599,
        "longitude": 77.4126,
        "elevation": 527.0,
        "station_code": "AWS-BHO-04",
    },
    "pune": {
        "name": "Pune",
        "state": "Maharashtra",
        "district": "Pune District",
        "country": "India",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "elevation": 560.0,
        "station_code": "AWS-PNQ-05",
    },
    "bengaluru": {
        "name": "Bengaluru",
        "state": "Karnataka",
        "district": "Bangalore Urban",
        "country": "India",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "elevation": 920.0,
        "station_code": "AWS-BLR-06",
    },
    "chennai": {
        "name": "Chennai",
        "state": "Tamil Nadu",
        "district": "Chennai District",
        "country": "India",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "elevation": 6.0,
        "station_code": "AWS-MAA-07",
    },
    "kolkata": {
        "name": "Kolkata",
        "state": "West Bengal",
        "district": "Kolkata District",
        "country": "India",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "elevation": 9.0,
        "station_code": "AWS-CCU-08",
    },
    "hyderabad": {
        "name": "Hyderabad",
        "state": "Telangana",
        "district": "Hyderabad District",
        "country": "India",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "elevation": 505.0,
        "station_code": "AWS-HYD-09",
    },
    "jaipur": {
        "name": "Jaipur",
        "state": "Rajasthan",
        "district": "Jaipur District",
        "country": "India",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "elevation": 431.0,
        "station_code": "AWS-JAI-10",
    }
}


def degrees_to_compass(deg: Optional[float]) -> Optional[str]:
    """Converts wind direction degrees (0-360) into compass points (N, NE, etc.)."""
    if deg is None:
        return None
    val = int((deg / 22.5) + 0.5)
    points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
              "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return points[val % 16]


class WeatherService:
    _instance: Optional["WeatherService"] = None

    def __init__(self):
        # In-memory cache for weather: cache_key -> (timestamp_seconds, CityWeatherResponse)
        self._weather_cache: Dict[str, Tuple[float, CityWeatherResponse]] = {}
        # In-memory cache for geocoding search: query -> (timestamp_seconds, List[GeocodingLocation])
        self._search_cache: Dict[str, Tuple[float, List[GeocodingLocation]]] = {}
        self._weather_cache_ttl: float = 300.0   # 5 minutes for live weather
        self._search_cache_ttl: float = 3600.0   # 1 hour for geocoding searches

    @classmethod
    def get_instance(cls) -> "WeatherService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_supported_cities(self) -> List[CityInfo]:
        """Returns metadata for default Indian meteorological reference stations."""
        return [
            CityInfo(
                name=meta["name"],
                state=meta["state"],
                district=meta.get("district"),
                country=meta["country"],
                latitude=meta["latitude"],
                longitude=meta["longitude"],
                station_code=meta["station_code"]
            )
            for meta in DEFAULT_CITIES.values()
        ]

    def _get_condition_string(self, code: Optional[int]) -> str:
        if code is None:
            return "Unavailable"
        return WMO_WEATHER_CODES.get(code, f"Weather Code {code}")

    def search_locations(self, query: str) -> List[GeocodingLocation]:
        """
        Queries Open-Meteo Geocoding API to resolve places across India.
        Strictly prioritizes/filters locations in India, including district (admin2)
        and state (admin1) so duplicate city names are easily differentiated.
        """
        clean_query = query.strip()
        if not clean_query or len(clean_query) < 2:
            return []

        cache_key = clean_query.lower()
        now = time.time()
        if cache_key in self._search_cache:
            ts, cached_res = self._search_cache[cache_key]
            if now - ts < self._search_cache_ttl:
                return cached_res

        encoded_q = urllib.parse.quote(clean_query)
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_q}&count=15&language=en&format=json"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "SkyGuardAI-LocationSearch/1.0",
                "Accept": "application/json"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    raw_results = data.get("results", [])

                    # Restrict/strongly prefer geocoding results from India
                    india_matches: List[GeocodingLocation] = []
                    other_matches: List[GeocodingLocation] = []

                    for r in raw_results:
                        is_india = (
                            r.get("country_code", "").upper() == "IN" or
                            r.get("country", "").lower() == "india"
                        )
                        loc = GeocodingLocation(
                            id=r.get("id"),
                            name=r.get("name", clean_query),
                            latitude=float(r.get("latitude", 0.0)),
                            longitude=float(r.get("longitude", 0.0)),
                            elevation=float(r.get("elevation")) if r.get("elevation") is not None else None,
                            country=r.get("country", "India" if is_india else "Unknown"),
                            country_code=r.get("country_code", "IN" if is_india else ""),
                            admin1=r.get("admin1"),  # State
                            admin2=r.get("admin2"),  # District
                            admin3=r.get("admin3"),  # Tehsil / Sub-district
                            timezone=r.get("timezone")
                        )
                        if is_india:
                            india_matches.append(loc)
                        else:
                            other_matches.append(loc)

                    # Return India matches first; if India matches found, restrict to India
                    final_results = india_matches if india_matches else other_matches
                    self._search_cache[cache_key] = (now, final_results)
                    return final_results
                else:
                    logger.warning(f"Geocoding API returned status {response.status} for query '{clean_query}'")
                    return []
        except urllib.error.URLError as e:
            logger.warning(f"Network error querying Open-Meteo Geocoding for '{clean_query}': {e.reason}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in location search for '{clean_query}': {e}", exc_info=True)
            return []

    def _fetch_open_meteo_weather(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Queries Open-Meteo REST API for current weather + past 12-hour hourly telemetry."""
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,surface_pressure,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation,rain,is_day"
            f"&hourly=temperature_2m,relative_humidity_2m,pressure_msl"
            f"&past_hours=12&forecast_hours=1"
        )
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "SkyGuardAI-WeatherMonitoring/1.0",
                "Accept": "application/json"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    return data
                else:
                    logger.warning(f"Open-Meteo returned status {response.status} for lat={lat}, lon={lon}")
                    return None
        except urllib.error.URLError as e:
            logger.warning(f"Network error contacting Open-Meteo weather endpoint: {e.reason}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error querying Open-Meteo weather: {e}", exc_info=True)
            return None

    def _evaluate_ml_compatibility(
        self,
        current_temp: float,
        current_hum: float,
        current_pres: float,
        weather_code: int,
        hourly_data: Dict[str, Any],
        station_code: str
    ) -> Tuple[str, Optional[bool], Optional[float], Optional[float], Optional[str], str]:
        """
        Applies rigorous ML validation rules:
        - Only evaluates using Isolation Forest if at least 8 continuous historical
          hourly readings exist to compute the true 15-feature space without fabricating features.
        - Excludes active precipitation events (Rain/Drizzle/Snow/Thunderstorm) from AWS anomaly
          evaluations, returning 'not_analyzed' because the training dataset was calibrated on
          clean sensor telemetry and natural active weather events are distinct from sensor defects.
        """
        # Rule 1: Distinguish active precipitation from sensor defects
        if weather_code >= 51:
            return (
                "not_analyzed",
                None,
                None,
                None,
                None,
                f"Active precipitation event detected (WMO {weather_code}: {self._get_condition_string(weather_code)}). Model is calibrated on sensor fault baselines; natural rain/storm events are classified as meteorological conditions rather than sensor defects."
            )

        # Rule 2: Verify hourly historical context availability
        times = hourly_data.get("time", [])
        temps = hourly_data.get("temperature_2m", [])
        hums = hourly_data.get("relative_humidity_2m", [])
        press = hourly_data.get("pressure_msl", [])

        if len(times) < 8 or len(temps) < 8 or len(hums) < 8 or len(press) < 8:
            return (
                "not_analyzed",
                None,
                None,
                None,
                None,
                "Insufficient historical time-series intervals (< 8 consecutive readings). Rolling mean and volatility features cannot be computed without fabricating missing points."
            )

        # Rule 3: Check model service readiness
        model_svc = ModelService.get_instance()
        if not model_svc.model_loaded or not model_svc.scaler_loaded or model_svc.detector is None:
            return (
                "not_analyzed",
                None,
                None,
                None,
                None,
                "SkyGuard ML Isolation Forest pipeline is not loaded in RAM."
            )

        # Construct chronological DataFrame of the sequence ending with current observation
        try:
            seq_times = [pd.to_datetime(t) for t in times[-8:]]
            seq_temps = [float(t) for t in temps[-8:]]
            seq_hums = [float(h) for h in hums[-8:]]
            seq_press = [float(p) for p in press[-8:]]

            now_dt = datetime.now(timezone.utc).replace(tzinfo=None)
            seq_times.append(now_dt)
            seq_temps.append(float(current_temp))
            seq_hums.append(float(current_hum))
            seq_press.append(float(current_pres))

            window_temps = seq_temps[-8:]
            window_hums = seq_hums[-8:]
            window_press = seq_press[-8:]

            prev_temp = seq_temps[-2]
            prev_hum = seq_hums[-2]
            prev_pres = seq_press[-2]

            temp_change = current_temp - prev_temp
            hum_change = current_hum - prev_hum
            pres_change = current_pres - prev_pres

            diff_minutes = (seq_times[-1] - seq_times[-2]).total_seconds() / 60.0
            if diff_minutes <= 0.0:
                diff_minutes = 60.0

            temp_rate = temp_change / diff_minutes
            hum_rate = hum_change / diff_minutes
            pres_rate = pres_change / diff_minutes

            roll_temp_mean = float(np.mean(window_temps))
            roll_hum_mean = float(np.mean(window_hums))
            roll_pres_mean = float(np.mean(window_press))

            roll_temp_std = float(np.std(window_temps, ddof=1)) if len(window_temps) > 1 else 0.0
            roll_hum_std = float(np.std(window_hums, ddof=1)) if len(window_hums) > 1 else 0.0
            roll_pres_std = float(np.std(window_press, ddof=1)) if len(window_press) > 1 else 0.0

            features_dict = {
                "temperature": float(current_temp),
                "humidity": float(current_hum),
                "pressure": float(current_pres),
                "temperature_change": float(temp_change),
                "humidity_change": float(hum_change),
                "pressure_change": float(pres_change),
                "temperature_rate": float(temp_rate),
                "humidity_rate": float(hum_rate),
                "pressure_rate": float(pres_rate),
                "rolling_temperature_mean": float(roll_temp_mean),
                "rolling_humidity_mean": float(roll_hum_mean),
                "rolling_pressure_mean": float(roll_pres_mean),
                "rolling_temperature_std": float(roll_temp_std),
                "rolling_humidity_std": float(roll_hum_std),
                "rolling_pressure_std": float(roll_pres_std)
            }

            feature_df = pd.DataFrame([[features_dict[col] for col in MODEL_FEATURES]], columns=MODEL_FEATURES)
            scaled_vector = model_svc.detector.scaler.transform(feature_df)

            prediction = int(model_svc.detector.model.predict(scaled_vector)[0])
            decision_score = float(model_svc.detector.model.decision_function(scaled_vector)[0])

            is_anomaly = bool(prediction == -1)
            status = "anomaly" if is_anomaly else "normal"

            min_score = getattr(model_svc.detector, "score_min_", -0.15)
            max_score = getattr(model_svc.detector, "score_max_", 0.18)
            norm_abnormal = (max_score - decision_score) / (max_score - min_score + 1e-9)

            if is_anomaly:
                conf = float(np.clip(0.50 + 0.49 * norm_abnormal, 0.50, 0.99))
            else:
                conf = float(np.clip(1.0 - norm_abnormal, 0.50, 0.99))
            conf = round(conf, 3)

            if not is_anomaly:
                severity = "NORMAL"
            elif conf < 0.70:
                severity = "LOW"
            elif conf < 0.85:
                severity = "MEDIUM"
            else:
                severity = "HIGH"

            note = (
                f"Evaluated with Isolation Forest against 15-feature space using real {len(window_temps)}-interval sequential telemetry."
                if not is_anomaly else
                f"Potential outlier detected (Score: {decision_score:.4f}, Severity: {severity}). Volatility or rate of change exceeded nominal bounds."
            )

            return (status, is_anomaly, decision_score, conf, severity, note)

        except Exception as e:
            logger.error(f"Error computing ML prediction for weather station {station_code}: {e}", exc_info=True)
            return (
                "not_analyzed",
                None,
                None,
                None,
                None,
                f"Evaluation failed during feature scaling or inference: {str(e)}"
            )

    def get_weather_by_coordinates(
        self,
        lat: float,
        lon: float,
        name: str,
        state: Optional[str] = None,
        district: Optional[str] = None,
        country: str = "India",
        elevation: Optional[float] = None
    ) -> CityWeatherResponse:
        """Fetches live meteorological telemetry and ML analysis for arbitrary Indian coordinates."""
        cache_key = f"coord_{round(lat, 4)}_{round(lon, 4)}"
        now = time.time()

        if cache_key in self._weather_cache:
            ts, cached_resp = self._weather_cache[cache_key]
            if now - ts < self._weather_cache_ttl:
                return cached_resp.model_copy(update={
                    "city": name or cached_resp.city,
                    "state": state or cached_resp.state,
                    "district": district or cached_resp.district,
                    "elevation": elevation if elevation is not None else cached_resp.elevation
                })

        station_code = f"LOC-{abs(int(lat*100)):04d}-{abs(int(lon*100)):04d}"

        # Fetch Open-Meteo
        api_data = self._fetch_open_meteo_weather(lat, lon)
        obs_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        if not api_data or "current" not in api_data:
            resp = CityWeatherResponse(
                city=name,
                state=state,
                district=district,
                country=country,
                latitude=round(lat, 4),
                longitude=round(lon, 4),
                elevation=elevation,
                station_code=station_code,
                temperature=None,
                apparent_temperature=None,
                humidity=None,
                pressure=None,
                surface_pressure=None,
                wind_speed=None,
                wind_direction=None,
                wind_direction_compass=None,
                cloud_cover=None,
                precipitation=None,
                rain=None,
                is_day=None,
                weather_code=None,
                weather_condition="Weather data is temporarily unavailable.",
                observation_time=obs_time,
                weather_available=False,
                analysis_status="not_analyzed",
                is_anomaly=None,
                anomaly_score=None,
                severity=None,
                confidence=None,
                analysis_note="Meteorological provider did not return response within network timeout limit."
            )
            # Short cache for failed requests
            self._weather_cache[cache_key] = (now - self._weather_cache_ttl + 30.0, resp)
            return resp

        curr = api_data["current"]
        temp = float(curr.get("temperature_2m", 0.0))
        app_temp = float(curr.get("apparent_temperature", temp))
        hum = float(curr.get("relative_humidity_2m", 0.0))
        pres_msl = float(curr.get("pressure_msl", curr.get("surface_pressure", 1013.25)))
        surf_pres = float(curr.get("surface_pressure", pres_msl))
        wind_spd = float(curr.get("wind_speed_10m", 0.0))
        wind_dir = float(curr.get("wind_direction_10m", 0.0))
        cloud = float(curr.get("cloud_cover", 0.0))
        precip = float(curr.get("precipitation", 0.0))
        rain_val = float(curr.get("rain", 0.0))
        is_day_val = int(curr.get("is_day", 1))
        code = int(curr.get("weather_code", 0))

        if curr.get("time"):
            obs_time = f"{curr['time'].replace('T', ' ')} UTC"

        # ML Evaluation
        hourly = api_data.get("hourly", {})
        status, is_anom, score, conf, sev, note = self._evaluate_ml_compatibility(
            current_temp=temp,
            current_hum=hum,
            current_pres=pres_msl,
            weather_code=code,
            hourly_data=hourly,
            station_code=station_code
        )

        resp = CityWeatherResponse(
            city=name,
            state=state,
            district=district,
            country=country,
            latitude=round(lat, 4),
            longitude=round(lon, 4),
            elevation=elevation,
            station_code=station_code,
            temperature=round(temp, 1),
            apparent_temperature=round(app_temp, 1),
            humidity=round(hum, 1),
            pressure=round(pres_msl, 1),
            surface_pressure=round(surf_pres, 1),
            wind_speed=round(wind_spd, 1),
            wind_direction=round(wind_dir, 1),
            wind_direction_compass=degrees_to_compass(wind_dir),
            cloud_cover=round(cloud, 0),
            precipitation=round(precip, 2),
            rain=round(rain_val, 2),
            is_day=is_day_val,
            weather_code=code,
            weather_condition=self._get_condition_string(code),
            observation_time=obs_time,
            weather_available=True,
            analysis_status=status,
            is_anomaly=is_anom,
            anomaly_score=round(score, 6) if score is not None else None,
            confidence=conf,
            severity=sev,
            analysis_note=note
        )

        self._weather_cache[cache_key] = (now, resp)
        return resp

    def get_city_weather(self, city_name: str) -> CityWeatherResponse:
        """Fetches live weather for a city name, looking up coordinates via Geocoding if needed."""
        key = city_name.strip().lower()

        # Check default cities list first
        if key in DEFAULT_CITIES:
            meta = DEFAULT_CITIES[key]
            return self.get_weather_by_coordinates(
                lat=meta["latitude"],
                lon=meta["longitude"],
                name=meta["name"],
                state=meta["state"],
                district=meta.get("district"),
                country=meta["country"],
                elevation=meta.get("elevation")
            )

        # Dynamic location search via Geocoding
        matches = self.search_locations(city_name)
        if matches:
            best_match = matches[0]
            return self.get_weather_by_coordinates(
                lat=best_match.latitude,
                lon=best_match.longitude,
                name=best_match.name,
                state=best_match.admin1,
                district=best_match.admin2,
                country=best_match.country,
                elevation=best_match.elevation
            )

        # Location not found
        return CityWeatherResponse(
            city=city_name,
            state=None,
            district=None,
            country="India",
            latitude=0.0,
            longitude=0.0,
            elevation=None,
            station_code="AWS-NOTFOUND",
            observation_time=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            weather_available=False,
            weather_condition="Location not found.",
            analysis_status="not_analyzed",
            analysis_note="No matching location found in Indian geographical index."
        )

    def get_all_cities_weather(self) -> AllCitiesWeatherResponse:
        """Fetches live meteorological telemetry and ML analysis for default monitored Indian cities concurrently."""
        def fetch_single(meta: Dict[str, Any]) -> CityWeatherResponse:
            return self.get_weather_by_coordinates(
                lat=meta["latitude"],
                lon=meta["longitude"],
                name=meta["name"],
                state=meta["state"],
                district=meta.get("district"),
                country=meta["country"],
                elevation=meta.get("elevation")
            )

        with ThreadPoolExecutor(max_workers=5) as executor:
            results = list(executor.map(fetch_single, DEFAULT_CITIES.values()))

        return AllCitiesWeatherResponse(
            total_cities=len(results),
            cities=results,
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        )
