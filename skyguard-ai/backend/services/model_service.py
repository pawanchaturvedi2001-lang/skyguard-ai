import logging
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
import numpy as np
import pandas as pd

from ml.feature_engineering import MODEL_FEATURES
from ml.anomaly_detector import AnomalyDetector
from backend.schemas.telemetry import (
    TelemetryInput,
    PredictionResponse,
    BatchPredictionResponse,
    DashboardSummaryResponse,
    ModelInfoResponse,
    HealthResponse
)

logger = logging.getLogger("skyguard.model_service")

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class ModelService:
    _instance: Optional["ModelService"] = None

    def __init__(self):
        self.detector: Optional[AnomalyDetector] = None
        self.model_loaded: bool = False
        self.scaler_loaded: bool = False
        self._station_history: Dict[str, deque] = {}
        self._cached_results_df: Optional[pd.DataFrame] = None
        self._history_maxlen = 16

    @classmethod
    def get_instance(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load_model(self) -> bool:
        """Loads Isolation Forest model and StandardScaler from disk once."""
        try:
            # Check ml/models first, fallback to models/
            model_path = BASE_DIR / "ml" / "models" / "isolation_forest.pkl"
            if not model_path.exists():
                model_path = BASE_DIR / "models" / "isolation_forest.pkl"

            scaler_path = BASE_DIR / "ml" / "models" / "scaler.pkl"
            if not scaler_path.exists():
                scaler_path = BASE_DIR / "models" / "scaler.pkl"

            if not model_path.exists() or not scaler_path.exists():
                logger.error(f"Model or Scaler file not found at {model_path} / {scaler_path}")
                self.model_loaded = False
                self.scaler_loaded = False
                return False

            self.detector = AnomalyDetector.load(model_path=model_path, scaler_path=scaler_path)
            self.model_loaded = self.detector.model is not None
            self.scaler_loaded = self.detector.scaler is not None

            logger.info("Successfully loaded Isolation Forest model and StandardScaler.")
            return True
        except Exception as e:
            logger.error(f"Failed to load model artifacts: {e}", exc_info=True)
            self.model_loaded = False
            self.scaler_loaded = False
            return False

    def get_health(self) -> HealthResponse:
        return HealthResponse(
            api="healthy",
            model_loaded=self.model_loaded,
            scaler_loaded=self.scaler_loaded
        )

    def get_model_info(self) -> ModelInfoResponse:
        status = "ready" if (self.model_loaded and self.scaler_loaded) else "unavailable"
        contamination = getattr(self.detector, "contamination", 0.01) if self.detector else 0.01

        return ModelInfoResponse(
            system="SkyGuard AI",
            algorithm="Isolation Forest",
            purpose="Satellite Telemetry Anomaly Detection",
            model_status=status,
            expected_features=list(MODEL_FEATURES),
            feature_count=len(MODEL_FEATURES),
            contamination=float(contamination),
            severity_levels=["NORMAL", "LOW", "MEDIUM", "HIGH"]
        )

    def _extract_record_features(self, record: TelemetryInput) -> Dict[str, float]:
        """Extracts and orders the 15 features required by the Isolation Forest model."""
        station_id = record.station_id or "SAT-001"

        # Check if caller supplied explicit pre-engineered features
        if record.temperature_change is not None and record.rolling_temperature_mean is not None:
            return {
                "temperature": float(record.temperature),
                "humidity": float(record.humidity),
                "pressure": float(record.pressure),
                "temperature_change": float(record.temperature_change),
                "humidity_change": float(record.humidity_change or 0.0),
                "pressure_change": float(record.pressure_change or 0.0),
                "temperature_rate": float(record.temperature_rate or 0.0),
                "humidity_rate": float(record.humidity_rate or 0.0),
                "pressure_rate": float(record.pressure_rate or 0.0),
                "rolling_temperature_mean": float(record.rolling_temperature_mean),
                "rolling_humidity_mean": float(record.rolling_humidity_mean or record.humidity),
                "rolling_pressure_mean": float(record.rolling_pressure_mean or record.pressure),
                "rolling_temperature_std": float(record.rolling_temperature_std or 0.0),
                "rolling_humidity_std": float(record.rolling_humidity_std or 0.0),
                "rolling_pressure_std": float(record.rolling_pressure_std or 0.0),
            }

        # Parse timestamp or use current UTC
        if record.timestamp:
            try:
                current_time = pd.to_datetime(record.timestamp)
            except Exception:
                current_time = datetime.now(timezone.utc)
        else:
            current_time = datetime.now(timezone.utc)

        history = self._station_history.setdefault(station_id, deque(maxlen=self._history_maxlen))

        if len(history) > 0:
            prev_record = history[-1]
            prev_time = prev_record["timestamp"]
            prev_temp = prev_record["temperature"]
            prev_hum = prev_record["humidity"]
            prev_pres = prev_record["pressure"]

            temp_change = record.temperature - prev_temp
            hum_change = record.humidity - prev_hum
            pres_change = record.pressure - prev_pres

            try:
                diff_minutes = (current_time - prev_time).total_seconds() / 60.0
            except Exception:
                diff_minutes = 15.0

            if diff_minutes <= 0.0:
                diff_minutes = 15.0

            temp_rate = temp_change / diff_minutes
            hum_rate = hum_change / diff_minutes
            pres_rate = pres_change / diff_minutes

            # Rolling stats with window=8 including current reading
            recent_temps = [h["temperature"] for h in history] + [record.temperature]
            recent_hums = [h["humidity"] for h in history] + [record.humidity]
            recent_pres = [h["pressure"] for h in history] + [record.pressure]

            window_temps = recent_temps[-8:]
            window_hums = recent_hums[-8:]
            window_pres = recent_pres[-8:]

            roll_temp_mean = float(np.mean(window_temps))
            roll_hum_mean = float(np.mean(window_hums))
            roll_pres_mean = float(np.mean(window_pres))

            roll_temp_std = float(np.std(window_temps, ddof=1)) if len(window_temps) > 1 else 0.0
            roll_hum_std = float(np.std(window_hums, ddof=1)) if len(window_hums) > 1 else 0.0
            roll_pres_std = float(np.std(window_pres, ddof=1)) if len(window_pres) > 1 else 0.0
        else:
            # First observation baseline (diff=0, rate=0, rolling_mean=val, rolling_std=0)
            temp_change = 0.0
            hum_change = 0.0
            pres_change = 0.0
            temp_rate = 0.0
            hum_rate = 0.0
            pres_rate = 0.0
            roll_temp_mean = float(record.temperature)
            roll_hum_mean = float(record.humidity)
            roll_pres_mean = float(record.pressure)
            roll_temp_std = 0.0
            roll_hum_std = 0.0
            roll_pres_std = 0.0

        # Update in-memory station history
        history.append({
            "timestamp": current_time,
            "temperature": float(record.temperature),
            "humidity": float(record.humidity),
            "pressure": float(record.pressure)
        })

        return {
            "temperature": float(record.temperature),
            "humidity": float(record.humidity),
            "pressure": float(record.pressure),
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

    def predict_single(self, record: TelemetryInput) -> PredictionResponse:
        """Performs end-to-end anomaly prediction on a single telemetry record."""
        if not self.model_loaded or not self.scaler_loaded or self.detector is None:
            raise RuntimeError("ML model or scaler is not loaded. Please verify /api/health.")

        features_dict = self._extract_record_features(record)
        feature_df = pd.DataFrame([[features_dict[col] for col in MODEL_FEATURES]], columns=MODEL_FEATURES)

        # Scale features using saved StandardScaler
        scaled_vector = self.detector.scaler.transform(feature_df)

        # Predict using Isolation Forest
        prediction = int(self.detector.model.predict(scaled_vector)[0])
        decision_score = float(self.detector.model.decision_function(scaled_vector)[0])

        is_anomaly = bool(prediction == -1)
        status = "ANOMALY" if is_anomaly else "NORMAL"

        # Calculate confidence using calibrated detector bounds
        min_score = getattr(self.detector, "score_min_", -0.15)
        max_score = getattr(self.detector, "score_max_", 0.18)

        normalized_abnormality = (max_score - decision_score) / (max_score - min_score + 1e-9)

        if is_anomaly:
            confidence = float(np.clip(0.50 + 0.49 * normalized_abnormality, 0.50, 0.99))
        else:
            confidence = float(np.clip(1.0 - normalized_abnormality, 0.50, 0.99))
        confidence = round(confidence, 3)

        # Severity classification matching training logic
        if not is_anomaly:
            severity = "NORMAL"
        elif confidence < 0.70:
            severity = "LOW"
        elif confidence < 0.85:
            severity = "MEDIUM"
        else:
            severity = "HIGH"

        ts_str = record.timestamp or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        return PredictionResponse(
            is_anomaly=is_anomaly,
            status=status,
            severity=severity,
            anomaly_score=round(decision_score, 6),
            confidence=confidence,
            timestamp=ts_str,
            station_id=record.station_id or "SAT-001",
            telemetry={
                "temperature": float(record.temperature),
                "humidity": float(record.humidity),
                "pressure": float(record.pressure)
            },
            features=features_dict
        )

    def predict_batch(self, records: List[TelemetryInput]) -> BatchPredictionResponse:
        """Processes multiple telemetry records and returns batch anomaly summary."""
        predictions: List[PredictionResponse] = []
        normal_count = 0
        anomaly_count = 0

        for rec in records:
            pred = self.predict_single(rec)
            predictions.append(pred)
            if pred.is_anomaly:
                anomaly_count += 1
            else:
                normal_count += 1

        return BatchPredictionResponse(
            total_records=len(records),
            normal_count=normal_count,
            anomaly_count=anomaly_count,
            predictions=predictions
        )

    def get_generated_dataset(self) -> pd.DataFrame:
        """Returns the anomaly results dataframe from data/generated/anomaly_results.csv."""
        if self._cached_results_df is not None:
            return self._cached_results_df

        results_path = BASE_DIR / "data" / "generated" / "anomaly_results.csv"
        if not results_path.exists():
            raise FileNotFoundError(f"Generated results file not found at {results_path}")

        df = pd.read_csv(results_path)
        self._cached_results_df = df
        return df

    def get_dashboard_summary(self) -> DashboardSummaryResponse:
        """Calculates authentic dashboard statistics from actual dataset."""
        df = self.get_generated_dataset()
        total = int(len(df))
        anomaly_mask = df["anomaly"] == True
        total_anomalies = int(anomaly_mask.sum())
        normal_records = total - total_anomalies
        anomaly_percentage = round((total_anomalies / total * 100.0) if total > 0 else 0.0, 2)

        high_count = int((df["severity"] == "HIGH").sum())
        med_count = int((df["severity"] == "MEDIUM").sum())
        low_count = int((df["severity"] == "LOW").sum())

        return DashboardSummaryResponse(
            total_records=total,
            normal_records=normal_records,
            total_anomalies=total_anomalies,
            anomaly_percentage=anomaly_percentage,
            high_severity=high_count,
            medium_severity=med_count,
            low_severity=low_count
        )
