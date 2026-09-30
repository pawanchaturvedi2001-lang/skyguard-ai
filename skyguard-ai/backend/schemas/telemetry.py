from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone


class TelemetryInput(BaseModel):
    temperature: float = Field(..., description="Temperature in degrees Celsius", example=28.5)
    humidity: float = Field(..., description="Relative humidity percentage (0-100%)", example=65.0)
    pressure: float = Field(..., description="Atmospheric pressure in hPa", example=1008.2)
    timestamp: Optional[str] = Field(None, description="Timestamp (ISO format or YYYY-MM-DD HH:MM:SS)", example="2026-01-01 12:00:00")
    station_id: Optional[str] = Field("SAT-001", description="Satellite or Ground Station ID", example="SAT-001")
    latitude: Optional[float] = Field(None, description="Satellite latitude", example=22.75)
    longitude: Optional[float] = Field(None, description="Satellite longitude", example=75.88)

    # Optional precomputed engineered features (if provided by client)
    temperature_change: Optional[float] = Field(None, description="Change in temperature from previous reading")
    humidity_change: Optional[float] = Field(None, description="Change in humidity from previous reading")
    pressure_change: Optional[float] = Field(None, description="Change in pressure from previous reading")
    temperature_rate: Optional[float] = Field(None, description="Rate of temperature change per minute")
    humidity_rate: Optional[float] = Field(None, description="Rate of humidity change per minute")
    pressure_rate: Optional[float] = Field(None, description="Rate of pressure change per minute")
    rolling_temperature_mean: Optional[float] = Field(None, description="Rolling mean of temperature")
    rolling_humidity_mean: Optional[float] = Field(None, description="Rolling mean of humidity")
    rolling_pressure_mean: Optional[float] = Field(None, description="Rolling mean of pressure")
    rolling_temperature_std: Optional[float] = Field(None, description="Rolling std of temperature")
    rolling_humidity_std: Optional[float] = Field(None, description="Rolling std of humidity")
    rolling_pressure_std: Optional[float] = Field(None, description="Rolling std of pressure")

    @field_validator("temperature")
    @classmethod
    def validate_temperature(cls, v: float) -> float:
        if v < -150.0 or v > 200.0:
            raise ValueError(f"Temperature value {v} is outside physical satellite sensor bounds (-150°C to 200°C)")
        return v

    @field_validator("humidity")
    @classmethod
    def validate_humidity(cls, v: float) -> float:
        if v < 0.0 or v > 100.0:
            raise ValueError(f"Humidity value {v} must be between 0.0 and 100.0%")
        return v

    @field_validator("pressure")
    @classmethod
    def validate_pressure(cls, v: float) -> float:
        if v < 300.0 or v > 1500.0:
            raise ValueError(f"Pressure value {v} is outside physical bounds (300 hPa to 1500 hPa)")
        return v


class PredictionResponse(BaseModel):
    is_anomaly: bool = Field(..., description="True if telemetry is anomalous, False if normal")
    status: str = Field(..., description="ANOMALY or NORMAL")
    severity: str = Field(..., description="Severity classification: NORMAL, LOW, MEDIUM, HIGH")
    anomaly_score: float = Field(..., description="Isolation Forest decision score (< 0 is abnormal)")
    confidence: float = Field(..., description="Calculated detection confidence (0.0 to 0.99)")
    timestamp: str = Field(..., description="Timestamp of the observation")
    station_id: str = Field(..., description="Satellite or Station identifier")
    telemetry: Dict[str, float] = Field(..., description="Sensor readings (temperature, humidity, pressure)")
    features: Optional[Dict[str, float]] = Field(None, description="Features used by the ML model")


class BatchPredictionRequest(BaseModel):
    records: List[TelemetryInput] = Field(..., min_length=1, description="List of telemetry records to evaluate")


class BatchPredictionResponse(BaseModel):
    total_records: int = Field(..., description="Total records evaluated")
    normal_count: int = Field(..., description="Number of normal records detected")
    anomaly_count: int = Field(..., description="Number of anomalous records detected")
    predictions: List[PredictionResponse] = Field(..., description="List of predictions")


class TelemetryListResponse(BaseModel):
    total: int = Field(..., description="Total matching records available")
    limit: int = Field(..., description="Records per page")
    offset: int = Field(..., description="Pagination offset")
    records: List[Dict[str, Any]] = Field(..., description="Telemetry records")


class DashboardSummaryResponse(BaseModel):
    total_records: int
    normal_records: int
    total_anomalies: int
    anomaly_percentage: float
    high_severity: int
    medium_severity: int
    low_severity: int


class HealthResponse(BaseModel):
    api: str
    model_loaded: bool
    scaler_loaded: bool


class ModelInfoResponse(BaseModel):
    system: str
    algorithm: str
    purpose: str
    model_status: str
    expected_features: List[str]
    feature_count: int
    contamination: float
    severity_levels: List[str]
