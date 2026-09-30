import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.routes.prediction import router as prediction_router
from backend.routes.telemetry import router as telemetry_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.weather import router as weather_router, locations_router
from backend.services.model_service import ModelService
from backend.schemas.telemetry import HealthResponse, ModelInfoResponse

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("skyguard.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager: loads ML models on startup and cleans up on shutdown."""
    logger.info("Initializing SkyGuard AI Backend...")
    service = ModelService.get_instance()
    success = service.load_model()
    if success:
        logger.info("SkyGuard AI ML pipeline is ready for inference.")
    else:
        logger.warning("ML models could not be loaded on startup. Check /api/health for status.")
    yield
    logger.info("Shutting down SkyGuard AI Backend.")


app = FastAPI(
    title="SkyGuard AI API",
    description="Satellite Telemetry Anomaly Detection Backend",
    version="1.0.0",
    lifespan=lifespan
)

import os

# CORS middleware for frontend communication (local development and Vercel production)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    origins = ["*"]
else:
    origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app" if origins != ["*"] else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Returns clean, client-friendly error messages for validation failures without raw traces."""
    errors = []
    for err in exc.errors():
        field_path = " -> ".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        errors.append({
            "field": field_path or "root",
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "validation_error")
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "The telemetry data failed validation checks.",
            "details": errors
        }
    )


# Include modular routers
app.include_router(prediction_router)
app.include_router(telemetry_router)
app.include_router(dashboard_router)
app.include_router(weather_router)
app.include_router(locations_router)


@app.get(
    "/",
    tags=["General"],
    summary="Root API Status",
    description="Returns basic system status and identification."
)
def root():
    return {
        "system": "SkyGuard AI",
        "status": "online",
        "message": "Satellite Telemetry Anomaly Detection API"
    }


@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="System and Model Health Check",
    description="Returns API health status and verification of whether model and scaler artifacts are loaded."
)
def health_check():
    service = ModelService.get_instance()
    return service.get_health()


@app.get(
    "/api/model-info",
    response_model=ModelInfoResponse,
    tags=["System"],
    summary="Machine Learning Model Details",
    description="Returns detailed metadata about the Isolation Forest algorithm, expected input features, and detection parameters."
)
def get_model_info():
    service = ModelService.get_instance()
    return service.get_model_info()


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
