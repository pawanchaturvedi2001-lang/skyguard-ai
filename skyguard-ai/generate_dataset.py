from pathlib import Path

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_PATH = BASE_DIR / "data" / "raw" / "aws_historical.csv"

NUM_STATIONS = 10
DAYS = 30
INTERVAL_MINUTES = 15

RANDOM_SEED = 42

np.random.seed(RANDOM_SEED)


def create_station_data(station_number: int) -> pd.DataFrame:

    station_id = f"AWS-{station_number:03d}"

    periods = DAYS * 24 * (60 // INTERVAL_MINUTES)

    timestamps = pd.date_range(
        start="2026-01-01 00:00:00",
        periods=periods,
        freq=f"{INTERVAL_MINUTES}min"
    )

    # Give each station a slightly different location.
    latitude = 22.70 + np.random.uniform(-0.15, 0.15)
    longitude = 75.85 + np.random.uniform(-0.15, 0.15)

    hours = timestamps.hour.to_numpy() + timestamps.minute.to_numpy() / 60

    # Daily temperature cycle.
    temperature_cycle = 5 * np.sin(
        2 * np.pi * (hours - 8) / 24
    )

    temperature = (
        28
        + temperature_cycle
        + np.random.normal(0, 0.6, periods)
    )

    # Humidity generally moves opposite to temperature.
    humidity = (
        65
        - temperature_cycle * 2
        + np.random.normal(0, 2, periods)
    )

    humidity = np.clip(humidity, 20, 100)

    # Small pressure variations.
    pressure = (
        1008
        + 2 * np.sin(2 * np.pi * hours / 24)
        + np.random.normal(0, 0.7, periods)
    )

    df = pd.DataFrame({
        "timestamp": timestamps,
        "station_id": station_id,
        "latitude": latitude,
        "longitude": longitude,
        "temperature": temperature,
        "humidity": humidity,
        "pressure": pressure
    })

    return df


def inject_anomalies(df: pd.DataFrame) -> pd.DataFrame:

    df = df.copy()

    df["injected_anomaly"] = False
    df["injected_anomaly_type"] = "normal"

    anomaly_count = max(10, int(len(df) * 0.005))

    available_indexes = df.index.to_numpy()

    selected_indexes = np.random.choice(
        available_indexes,
        size=anomaly_count,
        replace=False
    )

    for i, index in enumerate(selected_indexes):

        anomaly_type = i % 3

        if anomaly_type == 0:

            # Temperature spike
            df.loc[index, "temperature"] += np.random.uniform(15, 25)

            df.loc[index, "injected_anomaly_type"] = \
                "temperature_spike"

        elif anomaly_type == 1:

            # Humidity spike
            df.loc[index, "humidity"] = min(
                100,
                df.loc[index, "humidity"] +
                np.random.uniform(20, 35)
            )

            df.loc[index, "injected_anomaly_type"] = \
                "humidity_spike"

        else:

            # Pressure spike/drop
            df.loc[index, "pressure"] += \
                np.random.choice([-1, 1]) * \
                np.random.uniform(15, 30)

            df.loc[index, "injected_anomaly_type"] = \
                "pressure_spike"

        df.loc[index, "injected_anomaly"] = True

    return df


def generate_dataset():

    all_stations = []

    for station_number in range(1, NUM_STATIONS + 1):

        station_df = create_station_data(station_number)

        station_df = inject_anomalies(station_df)

        all_stations.append(station_df)

    final_df = pd.concat(
        all_stations,
        ignore_index=True
    )

    final_df = final_df.sort_values(
        ["station_id", "timestamp"]
    )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    final_df.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("=" * 60)
    print("SkyGuard AI - Synthetic AWS Dataset")
    print("=" * 60)

    print(f"Stations: {final_df['station_id'].nunique()}")
    print(f"Total observations: {len(final_df)}")

    print(
        f"Injected anomalies: "
        f"{final_df['injected_anomaly'].sum()}"
    )

    print(f"Dataset saved to: {OUTPUT_PATH}")

    print("\nSample:")
    print(final_df.head())

    print("\nAnomaly types:")
    print(
        final_df[
            "injected_anomaly_type"
        ].value_counts()
    )


if __name__ == "__main__":
    generate_dataset()







