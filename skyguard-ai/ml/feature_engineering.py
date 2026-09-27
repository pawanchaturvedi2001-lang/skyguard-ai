import pandas as pd


MODEL_FEATURES = [
    "temperature",
    "humidity",
    "pressure",

    "temperature_change",
    "humidity_change",
    "pressure_change",

    "temperature_rate",
    "humidity_rate",
    "pressure_rate",

    "rolling_temperature_mean",
    "rolling_humidity_mean",
    "rolling_pressure_mean",

    "rolling_temperature_std",
    "rolling_humidity_std",
    "rolling_pressure_std"
]


def create_features(df: pd.DataFrame) -> pd.DataFrame:

    df = df.copy()

    df = df.sort_values(
        ["station_id", "timestamp"]
    ).reset_index(drop=True)

    grouped = df.groupby(
        "station_id",
        group_keys=False
    )

    # Change from previous observation
    df["temperature_change"] = (
        grouped["temperature"].diff()
    )

    df["humidity_change"] = (
        grouped["humidity"].diff()
    )

    df["pressure_change"] = (
        grouped["pressure"].diff()
    )

    # Calculate elapsed time.
    df["time_difference_minutes"] = (
        grouped["timestamp"]
        .diff()
        .dt.total_seconds()
        .div(60)
    )

    df["time_difference_minutes"] = (
        df["time_difference_minutes"]
        .replace(0, pd.NA)
    )

    # Rate of change per minute.
    df["temperature_rate"] = (
        df["temperature_change"]
        / df["time_difference_minutes"]
    )

    df["humidity_rate"] = (
        df["humidity_change"]
        / df["time_difference_minutes"]
    )

    df["pressure_rate"] = (
        df["pressure_change"]
        / df["time_difference_minutes"]
    )

    # Rolling statistics.
    window = 8

    for column in [
        "temperature",
        "humidity",
        "pressure"
    ]:

        df[f"rolling_{column}_mean"] = (
            grouped[column]
            .transform(
                lambda x: x.rolling(
                    window=window,
                    min_periods=1
                ).mean()
            )
        )

        df[f"rolling_{column}_std"] = (
            grouped[column]
            .transform(
                lambda x: x.rolling(
                    window=window,
                    min_periods=2
                ).std()
            )
        )

    df[MODEL_FEATURES] = (
        df[MODEL_FEATURES]
        .fillna(0)
    )

    return df