from fastapi import APIRouter, HTTPException, status
from backend.schemas.telemetry import (
    TelemetryInput,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse
)
from backend.services.model_service import ModelService

router = APIRouter(prefix="/api", tags=["Prediction"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict anomaly for single satellite telemetry record",
    description="Accepts one satellite telemetry observation, extracts features, scales with saved StandardScaler, and predicts using Isolation Forest."
)
def predict_telemetry(telemetry: TelemetryInput):
    service = ModelService.get_instance()
    if not service.model_loaded or not service.scaler_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly detection model or scaler is not loaded. Check /api/health."
        )

    try:
        return service.predict_single(telemetry)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    summary="Batch telemetry anomaly prediction",
    description="Accepts a batch of telemetry records and returns individual predictions plus summary counts."
)
def predict_batch_telemetry(payload: BatchPredictionRequest):
    service = ModelService.get_instance()
    if not service.model_loaded or not service.scaler_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly detection model or scaler is not loaded. Check /api/health."
        )

    try:
        return service.predict_batch(payload.records)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )
