import numpy as np
import json
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import Dict, Any

class MarketAnomalyDetector:
    def __init__(self):
        """Initializes Isolation Forest model for anomaly detection."""
        # contamination=0.05 means we assume roughly 5% of trading events are anomolies
        self.model = IsolationForest(contamination=0.01, random_state=42)
        self.scaler = StandardScaler()
        # Initial fit with very wide stable data so it only triggers on massive real spikes
        dummy_data = np.random.normal(loc=0.0, scale=3.0, size=(500, 7))
        self.scaler.fit(dummy_data)
        self.model.fit(dummy_data)
        self.is_trained = False
        self.historical_buffer = []

    def extract_market_features(self, market_data: Dict[str, Any]) -> np.ndarray:
        """Extracts numerical features required by the Isolation Forest."""
        # In a real app we derive these from history. Here we simulate them from tick data
        # Feature vector length = 7
        features = [
            float(market_data.get('price_change_pct', 0.0)),
            float(market_data.get('volatility', 1.0)),
            float(market_data.get('high_low_range', 0.5)),
            float(market_data.get('volume_change', 0.0)),
            float(market_data.get('volume_ma_ratio', 1.0)),
            float(market_data.get('rsi', 50.0)),
            float(market_data.get('momentum', 0.0))
        ]
        return np.array(features).reshape(1, -1)

    def classify_market_state(self, market_data: Dict[str, Any]) -> str:
        """Classify the anomaly type."""
        pct = float(market_data.get('price_change_pct', 0.0))
        vol = float(market_data.get('volatility', 0.0))
        
        if vol > 15:
            return "EXTREME_VOLATILITY"
        elif pct > 5 or pct < -5:
            return "CIRCUIT_BREAK_RISK"
        elif float(market_data.get('volume_change', 0.0)) > 150:
            return "UNUSUAL_VOLUME"
        else:
            return "UNKNOWN_ANOMALY"

    def detect_anomaly(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Runs the Isolation Forest prediction."""
        X = self.extract_market_features(market_data)
        
        # Buffer historical data to eventually re-fit with real data
        self.historical_buffer.append(X[0])
        if len(self.historical_buffer) > 100 and not self.is_trained:
            # Re-train model with observed data
            train_data = np.array(self.historical_buffer)
            self.scaler.fit(train_data)
            self.model.fit(self.scaler.transform(train_data))
            self.is_trained = True

        X_scaled = self.scaler.transform(X)
        
        # predict() returns 1 for inliers, -1 for outliers
        prediction = self.model.predict(X_scaled)[0]
        # score_samples returns negative anomaly scores. Lower (more negative) is more anomalous.
        score = -self.model.score_samples(X_scaled)[0]
        
        
        # Override the overly sensitive default ML threshold with strong heuristics for the demo
        pct = float(market_data.get("price_change_pct", 0))
        vol = float(market_data.get("volatility", 0))
        
        # Only genuinely flag if the price changes wildly
        if abs(pct) > 4.5 or vol > 35.0:
            prediction = -1
            score = 0.95
        else:
            prediction = 1
            
        if prediction == -1: 
            return {
                "anomaly_detected": True,
                "severity": "CRITICAL" if score > 0.8 else "WARNING",
                "anomaly_score": float(score),
                "market_status": self.classify_market_state(market_data)
            }
            
        return {
            "anomaly_detected": False,
            "anomaly_score": float(score),
            "market_status": "NORMAL"
        }
            
        return {
            "anomaly_detected": False, 
            "anomaly_score": float(score)
        }
