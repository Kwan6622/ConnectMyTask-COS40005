"""
ConnectMyTask – Fraud Detection Model Trainer
=============================================
Trains Random Forest classifiers for 4 fraud detection domains:
  • Task / job posting fraud
  • Review / rating fraud
  • User profile / identity fraud
  • Payment / transaction fraud

Outputs serialised models + scaler to models/saved/
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (classification_report, confusion_matrix,
                             roc_auc_score, precision_recall_curve, average_precision_score)
from sklearn.utils import resample

# ─────────────────────────────────────────────────────────────────
MODELS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(MODELS_DIR, "..", "data")
SAVED_DIR  = os.path.join(MODELS_DIR, "saved")
os.makedirs(SAVED_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────
# Feature sets per domain
# ─────────────────────────────────────────────────────────────────
TASK_FEATURES = [
    "budget_aud", "description_length", "num_bids",
    "poster_account_age_days", "poster_avg_rating", "poster_completed_tasks",
    "payment_method_verified", "is_rush", "asks_contact_outside",
    "suspicious_keyword_count",
]
REVIEW_FEATURES = [
    "rating", "text_length", "reviewer_account_age_days",
    "reviewer_total_reviews", "hours_after_task_completion",
    "same_ip_as_reviewee", "account_review_burst", "text_similarity_score",
]
USER_FEATURES = [
    "account_age_days", "tasks_posted", "tasks_completed", "completion_rate",
    "avg_rating", "profile_completeness_pct", "email_verified",
    "phone_verified", "id_verified", "logins_last_7_days",
    "distinct_device_count", "ip_change_frequency", "times_reported",
]
TRANSACTION_FEATURES = [
    "amount_aud", "hour_of_day", "chargeback_history",
    "failed_attempts_24h", "velocity_score",
    "new_payment_method", "is_cross_border", "is_round_amount",
]

DOMAINS = {
    "task":        ("tasks.csv",        TASK_FEATURES),
    "review":      ("reviews.csv",      REVIEW_FEATURES),
    "user":        ("users.csv",        USER_FEATURES),
    "transaction": ("transactions.csv", TRANSACTION_FEATURES),
}


# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────

def oversample_minority(X_train, y_train):
    """SMOTE-lite: upsample minority class to balance."""
    df = pd.concat([X_train, y_train], axis=1)
    majority = df[df["is_fraud"] == 0]
    minority = df[df["is_fraud"] == 1]
    minority_up = resample(minority, replace=True,
                           n_samples=len(majority), random_state=42)
    balanced = pd.concat([majority, minority_up])
    return balanced.drop("is_fraud", axis=1), balanced["is_fraud"]


def evaluate(model, X_test, y_test, domain_name):
    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    auc   = roc_auc_score(y_test, y_proba)
    ap    = average_precision_score(y_test, y_proba)
    cm    = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"\n{'─'*55}")
    print(f"  {domain_name.upper()} FRAUD DETECTOR")
    print(f"{'─'*55}")
    print(f"  ROC-AUC:           {auc:.4f}")
    print(f"  Avg Precision:     {ap:.4f}")
    print(f"  Precision (fraud): {report['1']['precision']:.4f}")
    print(f"  Recall    (fraud): {report['1']['recall']:.4f}")
    print(f"  F1        (fraud): {report['1']['f1-score']:.4f}")
    print(f"  Confusion matrix:  {cm}")
    return {"roc_auc": auc, "avg_precision": ap, "classification_report": report, "confusion_matrix": cm}


def get_feature_importance(model, feature_names):
    if hasattr(model, "feature_importances_"):
        importance = model.feature_importances_
    elif hasattr(model, "coef_"):
        importance = np.abs(model.coef_[0])
    else:
        return {}
    return dict(sorted(zip(feature_names, importance.tolist()),
                        key=lambda x: x[1], reverse=True))


# ─────────────────────────────────────────────────────────────────
# Train one domain
# ─────────────────────────────────────────────────────────────────

def train_domain(domain: str):
    filename, features = DOMAINS[domain]
    csv_path = os.path.join(DATA_DIR, filename)

    if not os.path.exists(csv_path):
        print(f"[!] {csv_path} not found – run data/generate_data.py first")
        return None

    df = pd.read_csv(csv_path)
    X  = df[features].copy()
    y  = df["is_fraud"].copy()

    # Train / test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Balance training set
    X_train_bal, y_train_bal = oversample_minority(X_train.copy(), y_train.copy())

    # Scale
    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train_bal)
    X_test_sc  = scaler.transform(X_test)

    # Model: Gradient Boosted Trees (good fraud detection default)
    model = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.8,
        min_samples_split=10,
        random_state=42,
    )
    model.fit(X_train_sc, y_train_bal)

    # Evaluate
    metrics = evaluate(model, X_test_sc, y_test, domain)
    metrics["feature_importance"] = get_feature_importance(model, features)

    # Cross-validation score
    cv_scores = cross_val_score(model, X_train_sc, y_train_bal, cv=5, scoring="roc_auc")
    metrics["cv_roc_auc_mean"] = float(cv_scores.mean())
    metrics["cv_roc_auc_std"]  = float(cv_scores.std())
    print(f"  CV ROC-AUC:        {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Save artifacts
    model_path  = os.path.join(SAVED_DIR, f"{domain}_model.pkl")
    scaler_path = os.path.join(SAVED_DIR, f"{domain}_scaler.pkl")
    meta_path   = os.path.join(SAVED_DIR, f"{domain}_meta.json")

    joblib.dump(model,  model_path)
    joblib.dump(scaler, scaler_path)

    meta = {
        "domain":   domain,
        "features": features,
        "metrics":  metrics,
        "trained_on": pd.Timestamp.now().isoformat(),
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"  Saved → {model_path}")
    return meta


# ─────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 55)
    print("  ConnectMyTask – Fraud Detection Model Training")
    print("=" * 55)

    summary = {}
    domains_to_train = sys.argv[1:] if len(sys.argv) > 1 else list(DOMAINS.keys())

    for domain in domains_to_train:
        if domain not in DOMAINS:
            print(f"[!] Unknown domain: {domain}. Choices: {list(DOMAINS.keys())}")
            continue
        meta = train_domain(domain)
        if meta:
            summary[domain] = {
                "roc_auc": meta["metrics"]["roc_auc"],
                "avg_precision": meta["metrics"]["avg_precision"],
            }

    print("\n" + "=" * 55)
    print("  TRAINING SUMMARY")
    print("=" * 55)
    for d, s in summary.items():
        print(f"  {d:<14} ROC-AUC: {s['roc_auc']:.4f}  AvgPrec: {s['avg_precision']:.4f}")

    summary_path = os.path.join(SAVED_DIR, "training_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\n  Full summary → {summary_path}")
