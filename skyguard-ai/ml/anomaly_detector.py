from pathlib import Path
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from ml.feature_engineering import MODEL_FEATURES

BASE_DIR = Path(__file__).resolve().parent.parent

# Primary location: ml/models/, with fallback to models/
MODEL_PATH = BASE_DIR / "ml" / "models" / "isolation_forest.pkl"
SCALER_PATH = BASE_DIR / "ml" / "models" / "scaler.pkl"


class AnomalyDetector:

    def __init__(
        self,
        contamination=0.01,
        random_state=42
    ):
        self.contamination = contamination
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1
        )
        self.score_min_ = -0.15
        self.score_max_ = 0.18

    def train(self, df):
        X = df[MODEL_FEATURES]
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)

        # Calibrate score bounds for confidence calculation
        decision_scores = self.model.decision_function(X_scaled)
        self.score_min_ = float(decision_scores.min())
        self.score_max_ = float(decision_scores.max())

        return self

    def predict(self, df):
        result = df.copy()
        X = result[MODEL_FEATURES]
        X_scaled = self.scaler.transform(X)

        predictions = self.model.predict(X_scaled)
        decision_scores = self.model.decision_function(X_scaled)

        result["anomaly"] = (predictions == -1)

        # More negative decision score = more abnormal
        result["anomaly_score"] = decision_scores

        # Convert model score to an easy-to-read confidence
        if len(decision_scores) > 1 and decision_scores.max() > decision_scores.min():
            min_score = decision_scores.min()
            max_score = decision_scores.max()
        else:
            min_score = getattr(self, "score_min_", -0.15)
            max_score = getattr(self, "score_max_", 0.18)

        normalized_abnormality = (
            (max_score - decision_scores)
            / (max_score - min_score + 1e-9)
        )

        result["confidence"] = np.where(
            result["anomaly"],
            0.50 + 0.49 * normalized_abnormality,
            1.0 - normalized_abnormality
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
        # Save to preferred path ml/models/
        save_model_path = BASE_DIR / "ml" / "models" / "isolation_forest.pkl"
        save_scaler_path = BASE_DIR / "ml" / "models" / "scaler.pkl"
        save_model_path.parent.mkdir(parents=True, exist_ok=True)

        joblib.dump(self.model, save_model_path)
        joblib.dump(self.scaler, save_scaler_path)

        # Also sync to models/ for backwards compatibility
        alt_model_path = BASE_DIR / "models" / "isolation_forest.pkl"
        alt_scaler_path = BASE_DIR / "models" / "scaler.pkl"
        alt_model_path.parent.mkdir(parents=True, exist_ok=True)

        joblib.dump(self.model, alt_model_path)
        joblib.dump(self.scaler, alt_scaler_path)

        print(f"Model saved: {save_model_path} (and {alt_model_path})")
        print(f"Scaler saved: {save_scaler_path} (and {alt_scaler_path})")

    @classmethod
    def load(cls, model_path=None, scaler_path=None):
        instance = cls()
        m_path = Path(model_path) if model_path else (
            MODEL_PATH if MODEL_PATH.exists() else BASE_DIR / "models" / "isolation_forest.pkl"
        )
        s_path = Path(scaler_path) if scaler_path else (
            SCALER_PATH if SCALER_PATH.exists() else BASE_DIR / "models" / "scaler.pkl"
        )

        instance.model = joblib.load(m_path)
        instance.scaler = joblib.load(s_path)
        return instance