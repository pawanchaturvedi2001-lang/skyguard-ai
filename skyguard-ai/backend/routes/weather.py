from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from backend.schemas.weather import (
    CityWeatherResponse,
    AllCitiesWeatherResponse,
    SupportedCitiesResponse,
    LocationSearchResponse,
)
from backend.services.weather_service import WeatherService

router = APIRouter(prefix="/api/weather", tags=["India Weather Network"])
locations_router = APIRouter(prefix="/api/locations", tags=["Location Search"])


@locations_router.get(
    "/search",
    response_model=LocationSearchResponse,
    summary="Search Indian Cities and Locations via Geocoding",
    description="Dynamically queries the Open-Meteo Geocoding API to resolve places across India, disambiguating duplicates with district and state metadata."
)
def search_locations_api(
    q: str = Query(..., min_length=2, description="Search term for city, district, or place (e.g. Indore, Bilaspur, Ujjain)")
):
    service = WeatherService.get_instance()
    try:
        results = service.search_locations(q)
        return LocationSearchResponse(query=q, total=len(results), results=results)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Location search failed: {str(e)}"
        )


@router.get(
    "/search",
    response_model=LocationSearchResponse,
    summary="Search Indian Cities and Locations via Geocoding (Weather Alias)",
    description="Alias endpoint for searching locations across India."
)
def search_weather_locations(
    q: str = Query(..., min_length=2, description="Search term for city, district, or place")
):
    return search_locations_api(q=q)


@router.get(
    "/cities",
    response_model=SupportedCitiesResponse,
    summary="Get List of Monitored Cities & Reference Stations",
    description="Returns default Indian reference Automatic Weather Stations available for real-time meteorological monitoring."
)
def get_cities():
    service = WeatherService.get_instance()
    cities = service.get_supported_cities()
    return SupportedCitiesResponse(total=len(cities), cities=cities)


@router.get(
    "/current",
    response_model=CityWeatherResponse,
    summary="Get Live Weather Telemetry for a City or Coordinates",
    description="Fetches live temperature, humidity, pressure, and meteorological observations from Open-Meteo, evaluating sensor compatibility against SkyGuard AI's Isolation Forest anomaly pipeline."
)
def get_city_weather(
    city: Optional[str] = Query(None, description="Name of the city (e.g. Indore, Delhi, Mumbai)"),
    lat: Optional[float] = Query(None, description="Latitude coordinate"),
    lon: Optional[float] = Query(None, description="Longitude coordinate"),
    name: Optional[str] = Query(None, description="Display name for coordinate lookup"),
    state: Optional[str] = Query(None, description="State / Province"),
    district: Optional[str] = Query(None, description="District / Administrative Division"),
    country: Optional[str] = Query("India", description="Country"),
    elevation: Optional[float] = Query(None, description="Station elevation in meters"),
):
    service = WeatherService.get_instance()
    try:
        if lat is not None and lon is not None:
            display_name = name or city or f"Station ({round(lat, 2)}, {round(lon, 2)})"
            return service.get_weather_by_coordinates(
                lat=lat,
                lon=lon,
                name=display_name,
                state=state,
                district=district,
                country=country or "India",
                elevation=elevation
            )
        elif city:
            response = service.get_city_weather(city)
            if response.station_code in ("AWS-UNKNOWN", "AWS-NOTFOUND"):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"City '{city}' is not registered in the SkyGuard AI weather monitoring network or could not be found."
                )
            return response
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'city' name or coordinates ('lat' and 'lon') must be provided."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve weather data: {str(e)}"
        )


@router.get(
    "/all",
    response_model=AllCitiesWeatherResponse,
    summary="Get Live Weather Overview for All Monitored Cities",
    description="Returns live meteorological observations and SkyGuard ML anomaly evaluations for all registered stations across India."
)
def get_all_cities():
    service = WeatherService.get_instance()
    try:
        return service.get_all_cities_weather()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve all city weather observations: {str(e)}"
        )
