from fastapi import APIRouter, HTTPException, status
from backend.schemas.telemetry import DashboardSummaryResponse
from backend.services.model_service import ModelService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get overall telemetry and anomaly summary for dashboard",
    description="Calculates actual aggregated metrics from historical observations: total records, normal records, total anomalies, anomaly percentage, and counts by severity."
)
def get_dashboard_summary():
    service = ModelService.get_instance()
    try:
        return service.get_dashboard_summary()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to calculate dashboard summary: {str(e)}"
        )
