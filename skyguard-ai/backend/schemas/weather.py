from typing import Optional, List
from pydantic import BaseModel, Field


class GeocodingLocation(BaseModel):
    id: Optional[int] = Field(None, description="Unique location identifier")
    name: str = Field(..., description="City or place name")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    elevation: Optional[float] = Field(None, description="Elevation in meters")
    country: str = Field(default="India", description="Country name")
    country_code: str = Field(default="IN", description="Two-letter country code")
    admin1: Optional[str] = Field(None, description="State or primary administrative region")
    admin2: Optional[str] = Field(None, description="District or secondary administrative region")
    admin3: Optional[str] = Field(None, description="Tehsil or tertiary administrative division")
    timezone: Optional[str] = Field(None, description="Local timezone string")


class LocationSearchResponse(BaseModel):
    query: str = Field(..., description="Original search string")
    total: int = Field(..., description="Number of matching Indian locations found")
    results: List[GeocodingLocation] = Field(..., description="List of location matches")


class CityInfo(BaseModel):
    name: str = Field(..., description="City name")
    state: str = Field(..., description="State or administrative region")
    district: Optional[str] = Field(None, description="District name")
    country: str = Field(default="India", description="Country")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    station_code: str = Field(..., description="Associated station or sensor identifier")


class CityWeatherResponse(BaseModel):
    city: str = Field(..., description="City name")
    state: Optional[str] = Field(None, description="State or primary administrative region")
    district: Optional[str] = Field(None, description="District or secondary administrative division")
    country: str = Field(default="India", description="Country")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    elevation: Optional[float] = Field(None, description="Station elevation in meters")
    station_code: str = Field(..., description="Weather sensor / station code")
    
    # Real Physical Meteorological Observations
    temperature: Optional[float] = Field(None, description="Current ambient temperature in Celsius")
    apparent_temperature: Optional[float] = Field(None, description="Feels-like temperature in Celsius")
    humidity: Optional[float] = Field(None, description="Current relative humidity percentage")
    pressure: Optional[float] = Field(None, description="Atmospheric pressure normalized to Sea Level (hPa MSL)")
    surface_pressure: Optional[float] = Field(None, description="Actual localized surface barometric pressure (hPa)")
    wind_speed: Optional[float] = Field(None, description="Wind speed at 10m in km/h")
    wind_direction: Optional[float] = Field(None, description="Wind direction in degrees (0-360)")
    wind_direction_compass: Optional[str] = Field(None, description="Wind direction compass heading (e.g. N, NW, SE)")
    cloud_cover: Optional[float] = Field(None, description="Total cloud cover percentage (0-100%)")
    precipitation: Optional[float] = Field(None, description="Current precipitation rate in mm")
    rain: Optional[float] = Field(None, description="Current rain in mm")
    is_day: Optional[int] = Field(None, description="1 if daytime, 0 if night")
    weather_code: Optional[int] = Field(None, description="WMO standard weather code")
    weather_condition: str = Field(default="Unknown", description="Human-readable weather status (e.g. Clear Sky, Overcast)")
    observation_time: str = Field(..., description="Timestamp of the weather reading")
    weather_available: bool = Field(default=True, description="True if external data was retrieved successfully")
    
    # SkyGuard AI ML Evaluation
    analysis_status: str = Field(
        ...,
        description="SkyGuard ML evaluation: 'normal', 'anomaly', or 'not_analyzed'"
    )
    is_anomaly: Optional[bool] = Field(None, description="True if anomaly detected by Isolation Forest")
    anomaly_score: Optional[float] = Field(None, description="Isolation Forest decision score (< 0 is outlier)")
    confidence: Optional[float] = Field(None, description="Model anomaly detection confidence score")
    severity: Optional[str] = Field(None, description="Calculated severity: NORMAL, LOW, MEDIUM, HIGH")
    analysis_note: Optional[str] = Field(None, description="Contextual explanation of ML compatibility or result")


class AllCitiesWeatherResponse(BaseModel):
    total_cities: int = Field(..., description="Total cities monitored")
    cities: List[CityWeatherResponse] = Field(..., description="List of city weather observations")
    timestamp: str = Field(..., description="Generation timestamp")


class SupportedCitiesResponse(BaseModel):
    total: int = Field(..., description="Total supported cities")
    cities: List[CityInfo] = Field(..., description="List of supported cities")
