from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
import numpy as np

from backend.schemas.telemetry import TelemetryListResponse
from backend.services.model_service import ModelService

router = APIRouter(prefix="/api", tags=["Telemetry"])


@router.get(
    "/telemetry",
    response_model=TelemetryListResponse,
    summary="Get paginated historical telemetry records",
    description="Returns telemetry readings from the satellite telemetry dataset with pagination and optional station filter."
)
def get_telemetry(
    limit: int = Query(50, ge=1, le=1000, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Offset starting index"),
    station_id: Optional[str] = Query(None, description="Optional station ID filter (e.g. AWS-001)")
):
    service = ModelService.get_instance()
    try:
        df = service.get_generated_dataset()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Telemetry dataset unavailable: {str(e)}"
        )

    filtered = df
    if station_id:
        filtered = filtered[filtered["station_id"].str.upper() == station_id.upper()]

    total = len(filtered)
    slice_df = filtered.iloc[offset: offset + limit]

    cols_to_include = [
        "timestamp", "station_id", "temperature", "humidity", "pressure",
        "anomaly", "anomaly_score", "severity", "confidence"
    ]
    existing_cols = [c for c in cols_to_include if c in slice_df.columns]

    records = slice_df[existing_cols].replace({np.nan: None}).to_dict(orient="records")

    return TelemetryListResponse(
        total=total,
        limit=limit,
        offset=offset,
        records=records
    )


@router.get(
    "/anomalies",
    response_model=TelemetryListResponse,
    summary="Get detected satellite telemetry anomalies",
    description="Returns only detected anomaly events with severity, confidence, score, and root cause hints."
)
def get_anomalies(
    limit: int = Query(50, ge=1, le=1000, description="Number of anomalies to return"),
    offset: int = Query(0, ge=0, description="Offset index"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, or HIGH"),
    station_id: Optional[str] = Query(None, description="Optional station ID filter")
):
    service = ModelService.get_instance()
    try:
        df = service.get_generated_dataset()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Anomaly dataset unavailable: {str(e)}"
        )

    # Filter to anomalies only
    anomalies_df = df[df["anomaly"] == True]

    if severity:
        anomalies_df = anomalies_df[anomalies_df["severity"].str.upper() == severity.upper()]

    if station_id:
        anomalies_df = anomalies_df[anomalies_df["station_id"].str.upper() == station_id.upper()]

    total = len(anomalies_df)
    slice_df = anomalies_df.iloc[offset: offset + limit]

    cols_to_include = [
        "timestamp", "station_id", "temperature", "humidity", "pressure",
        "anomaly", "anomaly_score", "severity", "confidence", "injected_anomaly_type"
    ]
    existing_cols = [c for c in cols_to_include if c in slice_df.columns]

    records = slice_df[existing_cols].replace({np.nan: None}).to_dict(orient="records")

    return TelemetryListResponse(
        total=total,
        limit=limit,
        offset=offset,
        records=records
    )
