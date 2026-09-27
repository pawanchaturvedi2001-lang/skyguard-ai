from pathlib import Path

import joblib
import numpy as np

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from ml.feature_engineering import MODEL_FEATURES


MODEL_PATH = Path(
    "models/isolation_forest.pkl"
)

SCALER_PATH = Path(
    "models/scaler.pkl"
)


class AnomalyDetector:

    def __init__(
        self,
        contamination=0.01,
        random_state=42
    ):

        self.scaler = StandardScaler()

        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1
        )

    def train(self, df):

        X = df[MODEL_FEATURES]

        X_scaled = self.scaler.fit_transform(X)

        self.model.fit(X_scaled)

        return self

    def predict(self, df):

        result = df.copy()

        X = result[MODEL_FEATURES]

        X_scaled = self.scaler.transform(X)

        predictions = self.model.predict(
            X_scaled
        )

        decision_scores = (
            self.model.decision_function(
                X_scaled
            )
        )

        result["anomaly"] = (
            predictions == -1
        )

        # More negative decision score =
        # more abnormal according to Isolation Forest.
        result["anomaly_score"] = (
            decision_scores
        )

        # Convert model score to an easy-to-read
        # prototype confidence.
        min_score = decision_scores.min()
        max_score = decision_scores.max()

        normalized_abnormality = (
            (max_score - decision_scores)
            / (max_score - min_score + 1e-9)
        )

        result["confidence"] = np.where(
            result["anomaly"],
            0.50 + 0.49 * normalized_abnormality,
            1 - normalized_abnormality
        )

        result["confidence"] = (
            result["confidence"]
            .clip(0, 0.99)
            .round(3)
        )

        result["severity"] = "NORMAL"

        result.loc[
            result["anomaly"]
            & (result["confidence"] < 0.70),
            "severity"
        ] = "LOW"

        result.loc[
            result["anomaly"]
            & (result["confidence"] >= 0.70)
            & (result["confidence"] < 0.85),
            "severity"
        ] = "MEDIUM"

        result.loc[
            result["anomaly"]
            & (result["confidence"] >= 0.85),
            "severity"
        ] = "HIGH"

        return result

    def save(self):

        MODEL_PATH.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        joblib.dump(
            self.model,
            MODEL_PATH
        )

        joblib.dump(
            self.scaler,
            SCALER_PATH
        )

        print(
            f"Model saved: {MODEL_PATH}"
        )

        print(
            f"Scaler saved: {SCALER_PATH}"
        )