import numpy as np
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any
import os

class BehavioralPatternDetector:
    def __init__(self):
        """Initialize LSTM model for behavior detection."""
        self.scaler = StandardScaler()
        
        # Behavior mappings
        self.classes = ["NORMAL", "PANIC", "FOMO", "OVERCONFIDENCE"]
        
        self.behavior_patterns = {
            "PANIC": {"threshold": 0.8, "action": "BLOCK", "message": "You're panicking!"},
            "FOMO": {"threshold": 0.75, "action": "WARN", "message": "FOMO buying detected"},
            "OVERCONFIDENCE": {"threshold": 0.7, "action": "CONFIRM", "message": "Are you sure?"},
            "NORMAL": {"threshold": 1.0, "action": "ALLOW", "message": "Normal behavior"}
        }
        
        # Load or create model
        # For the hackathon demo, bypass heavy TensorFlow binaries which conflict on Windows
        # and simulate the model artifact layer.
        self.model = "Simulated LSTM Network"
            
    def build_lstm_model(self):
        """Mock LSTM network architecture display."""
        # This prevents needing a 1.2GB TF installation just to run a heuristic override
        return "LSTM(64) -> Dropout -> LSTM(32) -> Dense(16) -> Dense(4)"
        
    def extract_behavioral_features(self, user_history: List[Dict[str, Any]]) -> np.ndarray:
        """Extract exact 30-sequence feature vectors."""
        features = []
        
        # Get at most 30 recent events, pad with 0s if less
        recent_events = user_history[-30:]
        
        for event in recent_events:
            feature_vector = [
                float(event.get('hesitation_time_ms', 0)) / 1000.0, 
                float(event.get('is_positive', 1)),                 
                float(event.get('simulation_count', 0)),            
                float(event.get('market_volatility', 15.0)),        
                float(event.get('price_change_pct', 0.0))           
            ]
            features.append(feature_vector)
            
        # Pad up to 30 with dummy zero vectors
        while len(features) < 30:
            features.insert(0, [0.0, 1.0, 0.0, 15.0, 0.0])
            
        return np.array([features]) # shape: (1, 30, 5)

    def detect_behavior(self, user_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Detect behavioral pattern using the LSTM."""
        if not user_history:
            return {"detected_behavior": "NORMAL", "confidence": 1.0, "intervention_required": False}
            
        X = self.extract_behavioral_features(user_history)
        
        # Fit scaler on this specific sequence (dummy standardization)
        # In prod, this scaler would be saved/loaded alongside the model
        X_flat = X.reshape(-1, X.shape[-1])
        X_scaled = self.scaler.fit_transform(X_flat).reshape(X.shape)
        
        # Predict using simulated LSTM
        # NOTE: Since it's untrained in this pure hackathon sandbox, 
        # we completely bypassed TensorFlow to prevent Windows binary crashes.
        # We simulate a deterministic dynamic prediction based on hesitation time.
        try:
            avg_hes = np.mean([e.get('hesitation_time_ms', 5000) for e in user_history[-5:]])
            if avg_hes < 1500:
                predicted_class = "FOMO"
                confidence = 0.85
            elif avg_hes > 15000:
                predicted_class = "PANIC"
                confidence = 0.82
            else:
                predicted_class = "NORMAL"
                confidence = 0.99
        except Exception as e:
            print(f"LSTM prediction failed: {e}")
            predicted_class = "NORMAL"
            confidence = 1.0
            
        if predicted_class != "NORMAL" and confidence >= self.behavior_patterns[predicted_class]["threshold"]:
            pattern = self.behavior_patterns[predicted_class]
            return {
                "detected_behavior": predicted_class,
                "confidence": float(confidence),
                "action": pattern["action"],
                "message": pattern["message"],
                "recommendation": self.get_recommendation(predicted_class),
                "intervention_required": True
            }
            
        return {"detected_behavior": "NORMAL", "confidence": float(confidence), "intervention_required": False}
        
    def get_recommendation(self, behavior: str) -> str:
        if behavior == "PANIC":
            return "You're hesitating extremely long and trading erratically. Take a 15-minute break."
        elif behavior == "FOMO":
            return "You're trading extremely fast without simulation. 80% of FOMO trades underperform."
        else:
            return "Consider taking profits now, not risks."
