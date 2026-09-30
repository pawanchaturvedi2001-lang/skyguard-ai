from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
import numpy as np

from backend.schemas.telemetry import TelemetryListResponse, StationListResponse, StationInfo
from backend.services.model_service import ModelService
from backend.services.station_service import (
    get_station_metadata,
    get_all_stations,
    get_all_states,
    get_cities_by_state,
    STATION_REGISTRY
)

router = APIRouter(prefix="/api", tags=["Automatic Weather Station Telemetry"])


@router.get(
    "/stations",
    response_model=StationListResponse,
    summary="Get List of Registered Automatic Weather Stations with Geographic Metadata",
    description="Returns registered weather stations with their geographic location, district, state, and technical accuracy status."
)
def get_stations():
    stations_data = get_all_stations()
    stations_list = [StationInfo(**s) for s in stations_data]
    return StationListResponse(
        total=len(stations_list),
        stations=stations_list,
        states=get_all_states(),
        cities=get_cities_by_state()
    )


@router.get(
    "/telemetry",
    response_model=TelemetryListResponse,
    summary="Get paginated historical weather station telemetry records",
    description="Returns telemetry readings from the weather station dataset with pagination and optional geographic filters."
)
def get_telemetry(
    limit: int = Query(50, ge=1, le=1000, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Offset starting index"),
    station_id: Optional[str] = Query(None, description="Optional station ID filter (e.g. AWS-001)"),
    state: Optional[str] = Query(None, description="Optional state filter (e.g. Madhya Pradesh)"),
    city: Optional[str] = Query(None, description="Optional city filter (e.g. Indore)")
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

    # Filter by station_id
    if station_id and station_id.upper() != "ALL":
        filtered = filtered[filtered["station_id"].str.upper() == station_id.upper()]

    # Filter by state
    if state and state.upper() != "ALL":
        valid_stations = [
            sid for sid, meta in STATION_REGISTRY.items()
            if meta["state"].upper() == state.upper()
        ]
        filtered = filtered[filtered["station_id"].isin(valid_stations)]

    # Filter by city
    if city and city.upper() != "ALL":
        valid_stations = [
            sid for sid, meta in STATION_REGISTRY.items()
            if meta["city"].upper() == city.upper()
        ]
        filtered = filtered[filtered["station_id"].isin(valid_stations)]

    total = len(filtered)
    slice_df = filtered.iloc[offset: offset + limit]

    cols_to_include = [
        "timestamp", "station_id", "temperature", "humidity", "pressure",
        "anomaly", "anomaly_score", "severity", "confidence"
    ]
    existing_cols = [c for c in cols_to_include if c in slice_df.columns]

    raw_records = slice_df[existing_cols].replace({np.nan: None}).to_dict(orient="records")

    # Enrich each record with station location metadata (Requirement 3 & 4)
    enriched_records = []
    for rec in raw_records:
        meta = get_station_metadata(rec.get("station_id"))
        rec["station_name"] = meta.get("station_name")
        rec["city"] = meta.get("city")
        rec["district"] = meta.get("district")
        rec["state"] = meta.get("state")
        rec["latitude"] = meta.get("latitude")
        rec["longitude"] = meta.get("longitude")
        rec["station_type"] = meta.get("station_type", "Simulated Station Metadata")
        enriched_records.append(rec)

    return TelemetryListResponse(
        total=total,
        limit=limit,
        offset=offset,
        records=enriched_records
    )


@router.get(
    "/anomalies",
    response_model=TelemetryListResponse,
    summary="Get detected Automatic Weather Station telemetry anomalies",
    description="Returns detected anomaly events with severity, confidence, score, and geographic station metadata."
)
def get_anomalies(
    limit: int = Query(50, ge=1, le=1000, description="Number of anomalies to return"),
    offset: int = Query(0, ge=0, description="Offset index"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, or HIGH"),
    station_id: Optional[str] = Query(None, description="Optional station ID filter (e.g. AWS-001)"),
    state: Optional[str] = Query(None, description="Optional state filter (e.g. Madhya Pradesh)"),
    city: Optional[str] = Query(None, description="Optional city filter (e.g. Indore)")
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

    if severity and severity.upper() != "ALL":
        anomalies_df = anomalies_df[anomalies_df["severity"].str.upper() == severity.upper()]

    if station_id and station_id.upper() != "ALL":
        anomalies_df = anomalies_df[anomalies_df["station_id"].str.upper() == station_id.upper()]

    if state and state.upper() != "ALL":
        valid_stations = [
            sid for sid, meta in STATION_REGISTRY.items()
            if meta["state"].upper() == state.upper()
        ]
        anomalies_df = anomalies_df[anomalies_df["station_id"].isin(valid_stations)]

    if city and city.upper() != "ALL":
        valid_stations = [
            sid for sid, meta in STATION_REGISTRY.items()
            if meta["city"].upper() == city.upper()
        ]
        anomalies_df = anomalies_df[anomalies_df["station_id"].isin(valid_stations)]

    total = len(anomalies_df)
    slice_df = anomalies_df.iloc[offset: offset + limit]

    cols_to_include = [
        "timestamp", "station_id", "temperature", "humidity", "pressure",
        "anomaly", "anomaly_score", "severity", "confidence", "injected_anomaly_type"
    ]
    existing_cols = [c for c in cols_to_include if c in slice_df.columns]

    raw_records = slice_df[existing_cols].replace({np.nan: None}).to_dict(orient="records")

    # Enrich each anomaly with geographic station metadata (Requirement 3 & 4)
    enriched_records = []
    for rec in raw_records:
        meta = get_station_metadata(rec.get("station_id"))
        rec["station_name"] = meta.get("station_name")
        rec["city"] = meta.get("city")
        rec["district"] = meta.get("district")
        rec["state"] = meta.get("state")
        rec["latitude"] = meta.get("latitude")
        rec["longitude"] = meta.get("longitude")
        rec["station_type"] = meta.get("station_type", "Simulated Station Metadata")
        enriched_records.append(rec)

    return TelemetryListResponse(
        total=total,
        limit=limit,
        offset=offset,
        records=enriched_records
    )
