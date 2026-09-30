# SkyGuard AI

## Overview
**SkyGuard AI** is an AI/ML-based intelligent satellite and environmental telemetry anomaly detection and real-time weather monitoring platform developed as a Smart India Hackathon (SIH) prototype.

The system ingests real-time and historical multi-channel telemetry streams (ambient temperature, barometric pressure, relative humidity, and dynamic rate-of-change indicators) to identify sensor faults, thermal deviations, and hardware degradations before failures impact missions. Additionally, it integrates the **India Real-Time Weather Network**, allowing operators to dynamically resolve locations across India via Open-Meteo Geocoding and retrieve live meteorological telemetry with Isolation Forest evaluation.

---

## Features
- **Automatic Weather Station Telemetry Monitoring**: High-frequency monitoring of AWS telemetry stations.
- **Indian Standard Time (IST / Asia/Kolkata, UTC+05:30)**: Complete localized timezone formatting across all dynamic clocks, charts, tables, incident feeds, and CSV exports.
- **Light & Dark Theme Modes**: Seamless theme switcher in the header with persistent `localStorage` preference and high-contrast, accessibility-compliant styling.
- **Station Geographic Metadata**: Registered 10 representative Indian AWS stations (`AWS-001` through `AWS-010`) with City, State, District, and Geographic Coordinates (explicitly transparent as simulated station metadata for hackathon prototype integrity).
- **Cascading Anomaly Filters**: State → City → Station → Severity cascading dropdown filters with one-click reset for rapid incident triage.
- **Anomaly Inspection Modal**: Interactive incident inspection displaying AWS telemetry metrics, ML anomaly decision score, confidence level, and real-time Open-Meteo current city weather cross-examination.
- **Multi-Sensor Tracking**: Continuous monitoring of ambient temperature, atmospheric pressure (MSL and surface), and relative humidity.
- **Isolation Forest Anomaly Detection**: Unsupervised machine learning using a 15-feature space (including derivatives, velocities, and rolling volatility).
- **Anomaly Severity & Confidence Scoring**: Intelligent classification into `NORMAL`, `LOW`, `MEDIUM`, and `HIGH` severity with normalized confidence metrics.
- **Mission Control Dashboard**: Professional, responsive interface featuring live status badges, multi-sensor trend charts, and incident feeds.
- **India Weather Network**: Live meteorological observations for locations across India via Open-Meteo REST APIs.
- **Dynamic Indian City / Location Search**: Dynamic geocoding with district and state metadata to disambiguate identical place names (e.g., Bilaspur, Ujjain, Rampur).
- **Real Current Weather using Open-Meteo**: 10+ physical meteorological indicators including temperature, feels-like temperature, humidity, pressure, wind speed/direction, cloud cover, and precipitation.
- **Meteorological vs. Sensor Anomaly Separation**: Clear architectural separation between natural weather states (Clear, Overcast, Rain) and hardware sensor defects.
- **FastAPI Backend**: Asynchronous REST API with Pydantic validation, CORS middleware, and in-memory TTL caching.
- **React Frontend**: Built with React, Vite, and Lucide React icons in a clean, professional design.

---

## Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Styling**: Modern CSS3, CSS Custom Properties, Responsive Grid

### Backend
- **Framework**: Python 3.12+ / FastAPI
- **Validation**: Pydantic v2
- **Server**: Uvicorn (ASGI)
- **Caching**: In-Memory TTL Cache (5-min weather, 1-hr geocoding)

### Machine Learning
- **Core Algorithm**: Scikit-learn `IsolationForest` (200 estimators, 1% contamination)
- **Feature Scaling**: `StandardScaler`
- **Data Engineering**: Pandas, NumPy
- **Model Persistence**: Joblib

### Weather Services
- **Weather Telemetry**: Open-Meteo Forecast & Archive API (WMO standard codes)
- **Geocoding & Resolution**: Open-Meteo Geocoding API (`country_code=IN`)

---

## Architecture

### 1. Telemetry & Anomaly Detection Pipeline

```
AWS / Sensor Data
        ↓
   Preprocessing
 (Cleaning & Sort)
        ↓
Feature Engineering
   (15 Features)
        ↓
  StandardScaler
        ↓
 Isolation Forest
(Decision Function)
        ↓
 Anomaly Detection
(Normal / Outlier)
        ↓
  FastAPI Engine
(Pydantic Validation)
        ↓
 React Dashboard
```

### 2. India Real-Time Weather Pipeline

```
 Location Search
 (Dynamic Query)
        ↓
Open-Meteo Geocoding
 (Country = IN)
        ↓
Latitude / Longitude
(District/State Meta)
        ↓
 Open-Meteo Weather
(Current + Hourly)
        ↓
  FastAPI Engine
(TTL Cache & Filter)
        ↓
India Weather Network
```

---

## Project Structure

```
skyguard-ai/
│
├── backend/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entrypoint & lifecycle
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── prediction.py        # /api/predict & /api/predict/batch
│   │   ├── telemetry.py         # /api/telemetry & /api/anomalies
│   │   ├── dashboard.py         # /api/dashboard/summary
│   │   └── weather.py           # /api/locations/search & /api/weather/*
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── telemetry.py         # Telemetry & prediction Pydantic models
│   │   └── weather.py           # Meteorological & geocoding models
│   └── services/
│       ├── __init__.py
│       ├── model_service.py     # ML model loader & feature extraction
│       └── weather_service.py   # Open-Meteo client & cache layer
│
├── ml/
│   ├── __init__.py
│   ├── anomaly_detector.py      # Isolation Forest wrapper class
│   ├── feature_engineering.py   # 15-feature engineering transformations
│   ├── preprocessing.py         # Dataset sanitization & sequencing
│   └── models/
│       ├── isolation_forest.pkl # Trained Isolation Forest model artifact
│       └── scaler.pkl           # Fitted StandardScaler artifact
│
├── frontend/                    # Mission-Control React Dashboard
│   ├── src/
│   │   ├── components/          # Header, Sidebar, TelemetryChart, Feeds
│   │   ├── pages/               # Overview, LiveTelemetry, Analyze, IndiaWeather, etc.
│   │   ├── services/            # Axios API service layer
│   │   ├── styles/              # Theme and design tokens
│   │   ├── App.jsx              # Main tab controller
│   │   └── main.jsx             # React DOM entrypoint
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── data/
│   ├── raw/
│   │   └── aws_historical.csv   # Baseline meteorological readings
│   └── generated/
│       └── anomaly_results.csv  # Pre-computed anomaly evaluations
│
├── models/
│   ├── isolation_forest.pkl     # Primary model artifact
│   └── scaler.pkl               # Primary scaler artifact
│
├── generate_dataset.py          # Synthetic dataset generator
├── train_model.py               # Model training script
├── requirements.txt             # Python backend dependencies
└── README.md                    # Project documentation
```

---

## Installation and Run Instructions

### Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18 or higher (with npm)
- **Git**

### Step 1: Clone Repository & Setup Virtual Environment

```bash
# Clone the repository
git clone https://github.com/pawanchaturvedi2001-lang/skyguard-ai.git
cd skyguard-ai/skyguard-ai

# Create and activate Python virtual environment
python -m venv .venv

# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

### Step 2: Setup Frontend

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Step 3: Run the Application

#### Terminal 1 — Start FastAPI Backend:
```bash
# From skyguard-ai/skyguard-ai directory:
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs on:* `http://127.0.0.1:8000`  
*Swagger Documentation:* `http://127.0.0.1:8000/docs`

#### Terminal 2 — Start React Frontend:
```bash
# From skyguard-ai/skyguard-ai/frontend directory:
npm run dev
```
*Frontend runs on:* `http://127.0.0.1:5173`

---

## API Documentation

The backend provides interactive OpenAPI documentation via Swagger UI at:
**`http://127.0.0.1:8000/docs`**

### Key Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System readiness, ML model status, and scaler loading state |
| `GET` | `/api/model-info` | Isolation Forest algorithm details, feature schema, and contamination |
| `GET` | `/api/dashboard/summary` | Aggregate metrics (total records, anomalies detected, severity split) |
| `GET` | `/api/stations` | Registered Indian AWS monitoring stations metadata |
| `GET` | `/api/telemetry` | Paginated raw telemetry historical readings (supports `station_id`, `state`, `city`) |
| `GET` | `/api/anomalies` | Filtered list of detected anomalies (supports `severity`, `station_id`, `state`, `city`) |
| `POST` | `/api/predict` | Single telemetry packet real-time anomaly inference with station metadata |
| `POST` | `/api/predict/batch` | High-throughput batch telemetry packet inference |
| `GET` | `/api/locations/search` | Dynamic Indian location geocoding (`?q={city}`) |
| `GET` | `/api/weather/current` | Real-time weather and ML evaluation by city or coordinates |
| `GET` | `/api/weather/all` | Overview of all default monitored reference stations across India |
| `GET` | `/api/weather/cities` | List of registered Indian Automatic Weather Stations |

---

## Screenshots

> *Placeholder: Add mission control dashboard screenshots below when deployed or presenting.*

### Mission Control Overview
<!-- Screenshot placeholder: Overview Dashboard -->
*![Overview Dashboard](docs/screenshots/overview_dashboard.png)*

### Real-Time Telemetry & Anomaly Analysis
<!-- Screenshot placeholder: Telemetry Charts -->
*![Live Telemetry Feed](docs/screenshots/live_telemetry.png)*

### India Real-Time Weather Network
<!-- Screenshot placeholder: India Weather Network -->
*![India Weather Network](docs/screenshots/india_weather_network.png)*

---

## License
Developed for educational, research, and hackathon presentation purposes (Smart India Hackathon).
