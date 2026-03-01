# ConnectMyTask – Fraud Detection AI

A machine-learning fraud detection system for the ConnectMyTask platform.
Covers **4 fraud domains** with trained Gradient Boosting classifiers.

---

## Project Structure

```
fraud_detection/
├── data/
│   ├── generate_data.py   # Synthetic training data generator
│   ├── tasks.csv          # 2 000 task posting records (25% fraud)
│   ├── reviews.csv        # 3 000 review records          (30% fraud)
│   ├── users.csv          # 1 500 user profile records    (20% fraud)
│   └── transactions.csv   # 4 000 payment records         (15% fraud)
├── models/
│   ├── train.py           # Model trainer (GradientBoostingClassifier)
│   └── saved/             # Serialised .pkl models + metadata JSON
├── utils/
│   └── detector.py        # FraudDetector inference engine
├── api/
│   └── app.py             # Flask REST API
├── demo.py                # Quick smoke-test demo
└── requirements.txt
```

---

## Fraud Types Detected

| Domain | Fraud Types |
|---|---|
| **Task/Job Posting** | Fake jobs, upfront-fee scams, unrealistic pay, identity harvesting, reshipping |
| **Reviews** | Fake positives, fake negatives, bot farms, rating manipulation |
| **User Profiles** | Stolen identity, bot accounts, fake profiles |
| **Transactions** | Chargeback fraud, stolen card, money laundering, unusual amounts |

---

## Quick Start

### 1 – Install dependencies
```bash
pip install -r requirements.txt
```

### 2 – Generate training data
```bash
python3 data/generate_data.py
```

### 3 – Train models
```bash
python3 models/train.py
```

### 4 – Run the demo
```bash
python3 demo.py
```

### 5 – Start the REST API
```bash
python3 api/app.py
# Runs on http://localhost:5000
```

---

## REST API Reference

### Health check
```
GET /api/health
```

### Check a task posting
```
POST /api/check/task
Content-Type: application/json

{
  "budget_aud": 1200,
  "description_length": 45,
  "num_bids": 1,
  "poster_account_age_days": 2,
  "poster_avg_rating": 1.0,
  "poster_completed_tasks": 0,
  "payment_method_verified": 0,
  "is_rush": 1,
  "asks_contact_outside": 1,
  "suspicious_keyword_count": 3
}
```

### Check a review
```
POST /api/check/review
{
  "rating": 5,
  "text_length": 40,
  "reviewer_account_age_days": 3,
  "reviewer_total_reviews": 1,
  "hours_after_task_completion": 0.5,
  "same_ip_as_reviewee": 1,
  "account_review_burst": 1,
  "text_similarity_score": 0.95
}
```

### Check a user profile
```
POST /api/check/user
{
  "account_age_days": 1,
  "tasks_posted": 1,
  "tasks_completed": 0,
  "completion_rate": 0.0,
  "avg_rating": 0.0,
  "profile_completeness_pct": 15,
  "email_verified": 0,
  "phone_verified": 0,
  "id_verified": 0,
  "logins_last_7_days": 1,
  "distinct_device_count": 7,
  "ip_change_frequency": 0.9,
  "times_reported": 4
}
```

### Check a transaction
```
POST /api/check/transaction
{
  "amount_aud": 2500,
  "hour_of_day": 3,
  "chargeback_history": 3,
  "failed_attempts_24h": 7,
  "velocity_score": 0.92,
  "new_payment_method": 1,
  "is_cross_border": 1,
  "is_round_amount": 1
}
```

### Combined check (all domains at once)
```
POST /api/check/all
{
  "task": { ... },
  "user": { ... },
  "review": { ... },
  "transaction": { ... }
}
```

### Response format
```json
{
  "domain": "task",
  "fraud_score": 0.982,
  "risk_level": "CRITICAL",
  "is_flagged": true,
  "top_signals": [
    ["poster_avg_rating", 0.331],
    ["budget_aud", 0.328],
    ["description_length", 0.172]
  ],
  "threshold_used": 0.5
}
```

HTTP status `200` = clear, `202` = flagged for review.

---

## Risk Levels

| Score | Level | Meaning |
|---|---|---|
| ≥ 0.85 | 🔴 CRITICAL | Immediate action / block |
| ≥ 0.65 | 🟠 HIGH | Manual review required |
| ≥ 0.40 | 🟡 MEDIUM | Monitor closely |
| < 0.40 | 🟢 LOW | Likely legitimate |

---

## Integrating Into the Backend

```python
from utils.detector import FraudDetector

fd = FraudDetector()   # load once at startup

# On new task creation:
result = fd.check_task(task_features_dict)
if result.is_flagged:
    send_to_moderation_queue(task_id, result.to_dict())
```

---

## Improving for Production

- Replace synthetic data with real platform data
- Add `SMOTE` or `class_weight` tuning for real imbalance ratios
- Implement online/incremental retraining as new fraud patterns emerge
- Add text-based NLP features (task title, description TF-IDF or embeddings)
- Store predictions in a database for audit trails
- Connect `times_reported` and `suspicious_keyword_count` to live platform signals
