import pandas as pd


REQUIRED_COLUMNS = [
    "timestamp",
    "station_id",
    "temperature",
    "humidity",
    "pressure"
]


def load_and_preprocess(filepath: str) -> pd.DataFrame:

    df = pd.read_csv(filepath)

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["timestamp", "station_id"]
    )

    numeric_columns = [
        "temperature",
        "humidity",
        "pressure"
    ]

    for column in numeric_columns:

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

    df = df.sort_values(
        ["station_id", "timestamp"]
    ).reset_index(drop=True)

    # Interpolate separately for each station.
    df[numeric_columns] = (
        df
        .groupby("station_id")[numeric_columns]
        .transform(
            lambda x: x.interpolate(
                limit_direction="both"
            )
        )
    )

    return df