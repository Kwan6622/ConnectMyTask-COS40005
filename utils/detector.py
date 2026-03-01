"""
ConnectMyTask – Fraud Detection Inference Engine
=================================================
Loads trained models and provides prediction methods for all 4 domains.
Can be used standalone or imported by the REST API.

Usage:
    from utils.detector import FraudDetector
    fd = FraudDetector()
    result = fd.check_task({...})
"""

import os
import json
import joblib
import numpy as np
from dataclasses import dataclass, field
from typing import Optional

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models", "saved")

# ─────────────────────────────────────────────────────────────────
# Risk levels
# ─────────────────────────────────────────────────────────────────
def risk_level(score: float) -> str:
    if score >= 0.85: return "CRITICAL"
    if score >= 0.65: return "HIGH"
    if score >= 0.40: return "MEDIUM"
    return "LOW"

RISK_COLOURS = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🟢"}


@dataclass
class FraudResult:
    domain:         str
    fraud_score:    float           # 0.0 – 1.0
    risk_level:     str             # LOW / MEDIUM / HIGH / CRITICAL
    is_flagged:     bool
    top_signals:    list            # list of (feature, importance)
    threshold_used: float
    raw_input:      dict = field(default_factory=dict)

    def to_dict(self):
        return {
            "domain":         self.domain,
            "fraud_score":    round(self.fraud_score, 4),
            "risk_level":     self.risk_level,
            "is_flagged":     self.is_flagged,
            "top_signals":    self.top_signals,
            "threshold_used": self.threshold_used,
        }

    def summary(self) -> str:
        icon = RISK_COLOURS.get(self.risk_level, "⚪")
        flag = "⚠️  FLAGGED" if self.is_flagged else "✅  CLEAR"
        signals = ", ".join(f"{s[0]}={s[1]:.3f}" for s in self.top_signals[:3])
        return (f"{icon} [{self.domain.upper()}] {flag}  "
                f"score={self.fraud_score:.3f}  risk={self.risk_level}  "
                f"top_signals=[{signals}]")


# ─────────────────────────────────────────────────────────────────
# Main detector class
# ─────────────────────────────────────────────────────────────────

class FraudDetector:
    """Load all domain models once, then call check_*(input_dict)."""

    # Default flagging thresholds (tunable per business needs)
    THRESHOLDS = {
        "task":        0.50,
        "review":      0.50,
        "user":        0.50,
        "transaction": 0.45,   # stricter for financial fraud
    }

    def __init__(self, models_dir: str = MODELS_DIR):
        self._dir = models_dir
        self._cache = {}
        self._meta  = {}
        self._load_all()

    # ── internal ─────────────────────────────────────────────────

    def _load_all(self):
        for domain in ["task", "review", "user", "transaction"]:
            model_path  = os.path.join(self._dir, f"{domain}_model.pkl")
            scaler_path = os.path.join(self._dir, f"{domain}_scaler.pkl")
            meta_path   = os.path.join(self._dir, f"{domain}_meta.json")

            if not os.path.exists(model_path):
                print(f"[!] Model not found for '{domain}'. Run models/train.py first.")
                continue

            self._cache[domain] = {
                "model":  joblib.load(model_path),
                "scaler": joblib.load(scaler_path),
            }
            if os.path.exists(meta_path):
                with open(meta_path) as f:
                    self._meta[domain] = json.load(f)

        print(f"[✓] FraudDetector loaded {len(self._cache)} domain models.")

    def _predict(self, domain: str, input_dict: dict) -> FraudResult:
        if domain not in self._cache:
            raise ValueError(f"Domain '{domain}' not loaded.")

        meta     = self._meta.get(domain, {})
        features = meta.get("features", list(input_dict.keys()))
        model    = self._cache[domain]["model"]
        scaler   = self._cache[domain]["scaler"]

        # Build feature vector (missing → 0.0)
        x = np.array([[input_dict.get(f, 0.0) for f in features]], dtype=float)
        x_scaled = scaler.transform(x)

        fraud_score = float(model.predict_proba(x_scaled)[0][1])
        threshold   = self.THRESHOLDS[domain]
        flagged     = fraud_score >= threshold
        level       = risk_level(fraud_score)

        # Top contributing signals
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            importances = np.abs(model.coef_[0])
        else:
            importances = np.ones(len(features))

        signals = sorted(zip(features, importances.tolist()),
                         key=lambda t: t[1], reverse=True)[:5]

        return FraudResult(
            domain=domain,
            fraud_score=fraud_score,
            risk_level=level,
            is_flagged=flagged,
            top_signals=signals,
            threshold_used=threshold,
            raw_input=input_dict,
        )

    # ── Public API ────────────────────────────────────────────────

    def check_task(self, data: dict) -> FraudResult:
        """
        Detect fraudulent task / job postings (fake jobs, upfront-fee scams, etc.).
        Required keys: budget_aud, description_length, num_bids,
                       poster_account_age_days, poster_avg_rating,
                       poster_completed_tasks, payment_method_verified,
                       is_rush, asks_contact_outside, suspicious_keyword_count
        """
        return self._predict("task", data)

    def check_review(self, data: dict) -> FraudResult:
        """
        Detect fake / bot reviews and rating manipulation.
        Required keys: rating, text_length, reviewer_account_age_days,
                       reviewer_total_reviews, hours_after_task_completion,
                       same_ip_as_reviewee, account_review_burst, text_similarity_score
        """
        return self._predict("review", data)

    def check_user(self, data: dict) -> FraudResult:
        """
        Detect fake / stolen-identity / bot user profiles.
        Required keys: account_age_days, tasks_posted, tasks_completed,
                       completion_rate, avg_rating, profile_completeness_pct,
                       email_verified, phone_verified, id_verified,
                       logins_last_7_days, distinct_device_count,
                       ip_change_frequency, times_reported
        """
        return self._predict("user", data)

    def check_transaction(self, data: dict) -> FraudResult:
        """
        Detect payment fraud (chargebacks, stolen cards, money laundering).
        Required keys: amount_aud, hour_of_day, chargeback_history,
                       failed_attempts_24h, velocity_score,
                       new_payment_method, is_cross_border, is_round_amount
        """
        return self._predict("transaction", data)

    def check_all(self, task=None, review=None, user=None, transaction=None) -> dict:
        """Run all available checks and return combined assessment."""
        results = {}
        calls   = {"task": task, "review": review, "user": user, "transaction": transaction}
        for domain, data in calls.items():
            if data is not None:
                results[domain] = self._predict(domain, data)

        # Overall risk: highest individual risk wins
        LEVEL_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
        overall_level = max(results.values(),
                            key=lambda r: LEVEL_ORDER[r.risk_level]).risk_level if results else "LOW"
        any_flagged = any(r.is_flagged for r in results.values())

        return {
            "overall_risk":  overall_level,
            "any_flagged":   any_flagged,
            "domain_results": {k: v.to_dict() for k, v in results.items()},
        }
