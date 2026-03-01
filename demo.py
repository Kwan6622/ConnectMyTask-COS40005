"""
ConnectMyTask – Fraud Detection Demo
=====================================
Demonstrates the FraudDetector on realistic examples without the REST API.
Run:  python3 demo.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.detector import FraudDetector

def hr(title=""): print(f"\n{'─'*60}\n  {title}")

fd = FraudDetector()

# ─────────────────────────────────────────────────────────────────
# 1. TASK / JOB POSTING
# ─────────────────────────────────────────────────────────────────
hr("TASK POSTING CHECKS")

legit_task = dict(
    budget_aud=120, description_length=180, num_bids=8,
    poster_account_age_days=240, poster_avg_rating=4.6,
    poster_completed_tasks=22, payment_method_verified=1,
    is_rush=0, asks_contact_outside=0, suspicious_keyword_count=0,
)
fake_task = dict(
    budget_aud=1200, description_length=45, num_bids=1,
    poster_account_age_days=2, poster_avg_rating=1.0,
    poster_completed_tasks=0, payment_method_verified=0,
    is_rush=1, asks_contact_outside=1, suspicious_keyword_count=3,
)

print(fd.check_task(legit_task).summary())
print(fd.check_task(fake_task).summary())

# ─────────────────────────────────────────────────────────────────
# 2. REVIEWS
# ─────────────────────────────────────────────────────────────────
hr("REVIEW CHECKS")

legit_review = dict(
    rating=4, text_length=142, reviewer_account_age_days=310,
    reviewer_total_reviews=28, hours_after_task_completion=36,
    same_ip_as_reviewee=0, account_review_burst=0, text_similarity_score=0.12,
)
fake_review = dict(
    rating=5, text_length=40, reviewer_account_age_days=3,
    reviewer_total_reviews=1, hours_after_task_completion=0.5,
    same_ip_as_reviewee=1, account_review_burst=1, text_similarity_score=0.95,
)

print(fd.check_review(legit_review).summary())
print(fd.check_review(fake_review).summary())

# ─────────────────────────────────────────────────────────────────
# 3. USER PROFILES
# ─────────────────────────────────────────────────────────────────
hr("USER PROFILE CHECKS")

legit_user = dict(
    account_age_days=420, tasks_posted=35, tasks_completed=32,
    completion_rate=0.91, avg_rating=4.7, profile_completeness_pct=88,
    email_verified=1, phone_verified=1, id_verified=1,
    logins_last_7_days=12, distinct_device_count=1, ip_change_frequency=0.02,
    times_reported=0,
)
bot_user = dict(
    account_age_days=1, tasks_posted=1, tasks_completed=0,
    completion_rate=0.0, avg_rating=0.0, profile_completeness_pct=15,
    email_verified=0, phone_verified=0, id_verified=0,
    logins_last_7_days=1, distinct_device_count=7, ip_change_frequency=0.9,
    times_reported=4,
)

print(fd.check_user(legit_user).summary())
print(fd.check_user(bot_user).summary())

# ─────────────────────────────────────────────────────────────────
# 4. TRANSACTIONS
# ─────────────────────────────────────────────────────────────────
hr("TRANSACTION CHECKS")

legit_tx = dict(
    amount_aud=95.00, hour_of_day=14, chargeback_history=0,
    failed_attempts_24h=0, velocity_score=0.05,
    new_payment_method=0, is_cross_border=0, is_round_amount=0,
)
fraud_tx = dict(
    amount_aud=2500.00, hour_of_day=3, chargeback_history=3,
    failed_attempts_24h=7, velocity_score=0.92,
    new_payment_method=1, is_cross_border=1, is_round_amount=1,
)

print(fd.check_transaction(legit_tx).summary())
print(fd.check_transaction(fraud_tx).summary())

# ─────────────────────────────────────────────────────────────────
# 5. COMBINED CHECK (new user posting suspicious task)
# ─────────────────────────────────────────────────────────────────
hr("COMBINED CHECK – New user with suspicious task + fake review")

combined = fd.check_all(
    task=fake_task,
    user=bot_user,
    review=fake_review,
    transaction=fraud_tx,
)

print(f"\n  Overall risk:  {combined['overall_risk']}")
print(f"  Any flagged:   {combined['any_flagged']}")
for domain, result in combined["domain_results"].items():
    flag = "⚠️  FLAGGED" if result["is_flagged"] else "✅  CLEAR"
    print(f"    {domain:<14} score={result['fraud_score']:.3f}  {flag}")

print("\n" + "─"*60)
print("  Demo complete.\n")
