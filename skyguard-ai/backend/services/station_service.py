from typing import Dict, List, Optional, Any

# Centralized station registry for SkyGuard AI Automatic Weather Stations.
# Note: Since the training dataset used simulated station coordinates, all station
# entries are transparently labeled as 'Simulated Station Metadata' (Requirement 4).

STATION_REGISTRY: Dict[str, Dict[str, Any]] = {
    "AWS-001": {
        "station_id": "AWS-001",
        "station_name": "Indore Central AWS",
        "city": "Indore",
        "district": "Indore District",
        "state": "Madhya Pradesh",
        "latitude": 22.6624,
        "longitude": 75.9852,
        "station_type": "Simulated Station Metadata"
    },
    "AWS-002": {
        "station_id": "AWS-002",
        "station_name": "Bhopal Lake View AWS",
        "city": "Bhopal",
        "district": "Bhopal District",
        "state": "Madhya Pradesh",
        "latitude": 23.2599,
        "longitude": 77.4126,
        "station_type": "Simulated Station Metadata"
    },
    "AWS-003": {
        "station_id": "AWS-003",
        "station_name": "Mumbai Coastal AWS",
        "city": "Mumbai",
        "district": "Mumbai City",
        "state": "Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "station_type": "Simulated Station Metadata"
    },
    "AWS-004": {
        "station_id": "AWS-004",
        "station_name": "Pune Deccan AWS",
        "city": "Pune",
        "district": "Pune District",
        "state": "Maharashtra",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "station_type": "Simulated Station Metadata"
    },
    "AWS-005": {
        "station_id": "AWS-005",
        "station_name": "Bengaluru Urban AWS",
        "city": "Bengaluru",
        "district": "Bangalore Urban",
        "state": "Karnataka",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "station_type": "Simulated Station Metadata"
    },
    "AWS-006": {
        "station_id": "AWS-006",
        "station_name": "Jaipur Pink City AWS",
        "city": "Jaipur",
        "district": "Jaipur District",
        "state": "Rajasthan",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "station_type": "Simulated Station Metadata"
    },
    "AWS-007": {
        "station_id": "AWS-007",
        "station_name": "Delhi Ridge AWS",
        "city": "Delhi",
        "district": "Central Delhi",
        "state": "Delhi NCR",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "station_type": "Simulated Station Metadata"
    },
    "AWS-008": {
        "station_id": "AWS-008",
        "station_name": "Ujjain Mahakal AWS",
        "city": "Ujjain",
        "district": "Ujjain District",
        "state": "Madhya Pradesh",
        "latitude": 23.1765,
        "longitude": 75.7885,
        "station_type": "Simulated Station Metadata"
    },
    "AWS-009": {
        "station_id": "AWS-009",
        "station_name": "Chennai Marina AWS",
        "city": "Chennai",
        "district": "Chennai District",
        "state": "Tamil Nadu",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "station_type": "Simulated Station Metadata"
    },
    "AWS-010": {
        "station_id": "AWS-010",
        "station_name": "Kolkata Salt Lake AWS",
        "city": "Kolkata",
        "district": "Kolkata District",
        "state": "West Bengal",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "station_type": "Simulated Station Metadata"
    }
}

DEFAULT_FALLBACK = {
    "station_id": "AWS-001",
    "station_name": "Indore Central AWS",
    "city": "Indore",
    "district": "Indore District",
    "state": "Madhya Pradesh",
    "latitude": 22.6624,
    "longitude": 75.9852,
    "station_type": "Simulated Station Metadata"
}


def get_station_metadata(station_id: Optional[str]) -> Dict[str, Any]:
    """Resolves station ID to geographic metadata or returns a sensible default."""
    if not station_id:
        return DEFAULT_FALLBACK.copy()
    key = station_id.strip().upper()
    if key in STATION_REGISTRY:
        return STATION_REGISTRY[key].copy()
    # If station matches pattern like AWS-00X
    for st_id, data in STATION_REGISTRY.items():
        if key == st_id.upper():
            return data.copy()
    return {
        "station_id": station_id,
        "station_name": f"{station_id} Node",
        "city": "Indore",
        "district": "Indore District",
        "state": "Madhya Pradesh",
        "latitude": 22.70,
        "longitude": 75.85,
        "station_type": "Simulated Station Metadata"
    }


def get_all_stations() -> List[Dict[str, Any]]:
    """Returns list of all registered weather stations."""
    return list(STATION_REGISTRY.values())


def get_all_states() -> List[str]:
    """Returns sorted unique list of states with registered stations."""
    return sorted(list({s["state"] for s in STATION_REGISTRY.values()}))


def get_cities_by_state(state: Optional[str] = None) -> List[str]:
    """Returns sorted unique list of cities, optionally filtered by state."""
    if state and state.upper() != "ALL":
        return sorted(list({s["city"] for s in STATION_REGISTRY.values() if s["state"].upper() == state.upper()}))
    return sorted(list({s["city"] for s in STATION_REGISTRY.values()}))


def get_stations_by_city(city: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns stations filtered by city, or all if city is None."""
    if city and city.upper() != "ALL":
        return [s for s in STATION_REGISTRY.values() if s["city"].upper() == city.upper()]
    return list(STATION_REGISTRY.values())
