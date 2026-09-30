from pathlib import Path

from ml.preprocessing import load_and_preprocess
from ml.feature_engineering import create_features
from ml.anomaly_detector import AnomalyDetector


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "raw" / "aws_historical.csv"
OUTPUT_PATH = BASE_DIR / "data" / "generated" / "anomaly_results.csv"


def main():

    print("=" * 60)
    print("SkyGuard AI")
    print("Phase 1 - Isolation Forest Training")
    print("=" * 60)

    print("\n[1/5] Loading dataset...")

    df = load_and_preprocess(
        DATA_PATH
    )

    print(
        f"Loaded {len(df)} observations."
    )

    print("\n[2/5] Creating features...")

    featured_df = create_features(df)

    print(
        f"Created features for "
        f"{len(featured_df)} observations."
    )

    print("\n[3/5] Training Isolation Forest...")

    detector = AnomalyDetector(
        contamination=0.01
    )

    detector.train(featured_df)

    print("Training completed.")

    print("\n[4/5] Detecting anomalies...")

    results = detector.predict(
        featured_df
    )

    anomaly_count = int(
        results["anomaly"].sum()
    )

    print(
        f"Detected anomalies: "
        f"{anomaly_count}"
    )

    print("\n[5/5] Saving results...")

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    results.to_csv(
        OUTPUT_PATH,
        index=False
    )

    detector.save()

    print(
        f"Results saved: {OUTPUT_PATH}"
    )

    print("\n" + "=" * 60)
    print("Sample detected anomalies")
    print("=" * 60)

    columns = [
        "timestamp",
        "station_id",
        "temperature",
        "humidity",
        "pressure",
        "anomaly_score",
        "confidence",
        "severity",
        "injected_anomaly_type"
    ]

    anomalies = results[
        results["anomaly"]
    ]

    print(
        anomalies[columns]
        .head(15)
        .to_string(index=False)
    )

    if "injected_anomaly" in results.columns:

        injected = results[
            results["injected_anomaly"]
        ]

        detected_injected = injected[
            injected["anomaly"]
        ]

        print("\nInjected anomalies:")
        print(len(injected))

        print(
            "Injected anomalies detected:",
            len(detected_injected)
        )

        if len(injected) > 0:

            detection_rate = (
                len(detected_injected)
                / len(injected)
            ) * 100

            print(
                f"Detection rate on injected "
                f"anomalies: "
                f"{detection_rate:.2f}%"
            )

    print("\nPhase 1 completed successfully.")


if __name__ == "__main__":
    main()