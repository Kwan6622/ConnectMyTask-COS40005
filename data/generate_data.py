"""
ConnectMyTask - Fraud Detection Training Data Generator
"""
import pandas as pd
import numpy as np
import random, os, uuid
from datetime import datetime, timedelta

np.random.seed(42)
random.seed(42)
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

def gen_uuid(): return str(uuid.uuid4())
def coin(p=0.5): return random.random() < p
def fake_text(n=200):
    w=["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","eiusmod","tempor","labore","dolore"]
    return " ".join(random.choices(w,k=30))[:n]

# ── TASK POSTINGS ──────────────────────────────────────────────────
LEGIT_CATS=["Cleaning","Delivery","Moving","Gardening","IT Support","Plumbing","Electrical","Tutoring","Photography","Design"]
LEGIT_TITLES=["Need help moving furniture","Fix leaking tap","Home cleaning service","Website bug fix",
               "Garden trim needed","Deliver package","Math tutoring","Logo design","Electrical repair","Event photography"]
FRAUD_TITLES=["EARN $500/DAY WORKING FROM HOME!!!","Urgent wire transfer agent needed",
               "Easy money click ads all day","Mystery shopper upfront fee required",
               "Data entry job send bank details","Guaranteed income send $50 fee",
               "Work from home unlimited earnings","Re-ship luxury items earn $1000/week"]
SUSP_KW=["wire transfer","bank account","upfront fee","registration fee","guaranteed income","easy money","re-ship"]

def task_row(fraud):
    if fraud:
        return dict(task_id=gen_uuid(),title=random.choice(FRAUD_TITLES),category=random.choice(LEGIT_CATS),
            budget_aud=round(random.uniform(500,5000),2),description_length=random.randint(20,80),
            num_bids=random.randint(0,3),poster_account_age_days=random.randint(0,7),
            poster_avg_rating=round(random.uniform(0,2.5),1),poster_completed_tasks=random.randint(0,2),
            payment_method_verified=int(coin(0.1)),is_rush=int(coin(0.7)),asks_contact_outside=int(coin(0.6)),
            suspicious_keyword_count=random.randint(1,4),fraud_type=random.choice(["fake_job","upfront_fee","unrealistic_pay","reshipping"]),is_fraud=1)
    else:
        return dict(task_id=gen_uuid(),title=random.choice(LEGIT_TITLES),category=random.choice(LEGIT_CATS),
            budget_aud=round(random.uniform(20,500),2),description_length=random.randint(100,300),
            num_bids=random.randint(3,25),poster_account_age_days=random.randint(30,730),
            poster_avg_rating=round(random.uniform(3.5,5.0),1),poster_completed_tasks=random.randint(5,80),
            payment_method_verified=int(coin(0.85)),is_rush=int(coin(0.15)),asks_contact_outside=int(coin(0.05)),
            suspicious_keyword_count=random.randint(0,1),fraud_type="none",is_fraud=0)

def generate_tasks(n=2000):
    fn=int(n*0.25)
    rows=[task_row(True) for _ in range(fn)]+[task_row(False) for _ in range(n-fn)]
    random.shuffle(rows)
    df=pd.DataFrame(rows)
    df.to_csv(os.path.join(OUTPUT_DIR,"tasks.csv"),index=False)
    print(f"[✓] tasks.csv         – {len(df):>5} rows  (fraud: {df['is_fraud'].sum()})")
    return df

# ── REVIEWS ────────────────────────────────────────────────────────
LEGIT_R=["Great work very professional","Highly recommend this provider","Very reliable and friendly","Exceeded expectations"]
FAKE_R=["Best ever 5 stars perfect perfect","Absolutely flawless service 100 percent best","Outstanding work best ever perfect","Perfect amazing outstanding incredible five stars"]

def review_row(fraud):
    if fraud:
        ft=random.choice(["fake_positive","fake_negative","bot_farm"])
        return dict(review_id=gen_uuid(),rating=5 if ft!="fake_negative" else 1,
            text_length=len(random.choice(FAKE_R)),reviewer_account_age_days=random.randint(0,14),
            reviewer_total_reviews=random.randint(1,3),hours_after_task_completion=round(random.uniform(0,2),2),
            same_ip_as_reviewee=int(coin(0.75)),account_review_burst=int(coin(0.8)),
            text_similarity_score=round(random.uniform(0.7,1.0),3),fraud_type=ft,is_fraud=1)
    else:
        return dict(review_id=gen_uuid(),rating=random.choices([1,2,3,4,5],weights=[5,8,15,30,42])[0],
            text_length=random.randint(50,300),reviewer_account_age_days=random.randint(60,900),
            reviewer_total_reviews=random.randint(4,150),hours_after_task_completion=round(random.uniform(12,240),2),
            same_ip_as_reviewee=int(coin(0.05)),account_review_burst=int(coin(0.05)),
            text_similarity_score=round(random.uniform(0.0,0.35),3),fraud_type="none",is_fraud=0)

def generate_reviews(n=3000):
    fn=int(n*0.30)
    rows=[review_row(True) for _ in range(fn)]+[review_row(False) for _ in range(n-fn)]
    random.shuffle(rows)
    df=pd.DataFrame(rows)
    df.to_csv(os.path.join(OUTPUT_DIR,"reviews.csv"),index=False)
    print(f"[✓] reviews.csv       – {len(df):>5} rows  (fraud: {df['is_fraud'].sum()})")
    return df

# ── USER PROFILES ──────────────────────────────────────────────────
def user_row(fraud):
    if fraud:
        tp=random.randint(0,3); tc=random.randint(0,2)
        return dict(user_id=gen_uuid(),account_age_days=random.randint(0,10),tasks_posted=tp,tasks_completed=tc,
            completion_rate=round(tc/max(tp,1),3),avg_rating=round(random.uniform(0,2.5),1),
            profile_completeness_pct=random.randint(10,40),email_verified=int(coin(0.2)),
            phone_verified=int(coin(0.1)),id_verified=int(coin(0.05)),logins_last_7_days=random.randint(0,2),
            distinct_device_count=random.randint(3,10),ip_change_frequency=round(random.uniform(0.5,1.0),3),
            times_reported=random.randint(1,10),fraud_type=random.choice(["stolen_identity","bot_account","fake_profile"]),is_fraud=1)
    else:
        tp=random.randint(1,100); tc=random.randint(1,min(tp,90))
        return dict(user_id=gen_uuid(),account_age_days=random.randint(30,1000),tasks_posted=tp,tasks_completed=tc,
            completion_rate=round(tc/tp,3),avg_rating=round(random.uniform(3.5,5.0),1),
            profile_completeness_pct=random.randint(65,100),email_verified=int(coin(0.95)),
            phone_verified=int(coin(0.80)),id_verified=int(coin(0.60)),logins_last_7_days=random.randint(3,30),
            distinct_device_count=random.randint(1,2),ip_change_frequency=round(random.uniform(0.0,0.15),3),
            times_reported=random.randint(0,1),fraud_type="none",is_fraud=0)

def generate_users(n=1500):
    fn=int(n*0.20)
    rows=[user_row(True) for _ in range(fn)]+[user_row(False) for _ in range(n-fn)]
    random.shuffle(rows)
    df=pd.DataFrame(rows)
    df.to_csv(os.path.join(OUTPUT_DIR,"users.csv"),index=False)
    print(f"[✓] users.csv         – {len(df):>5} rows  (fraud: {df['is_fraud'].sum()})")
    return df

# ── TRANSACTIONS ───────────────────────────────────────────────────
def tx_row(fraud):
    if fraud:
        return dict(transaction_id=gen_uuid(),amount_aud=round(random.uniform(500,5000),2),
            hour_of_day=random.choice(list(range(0,6))+[23]),chargeback_history=random.randint(1,5),
            failed_attempts_24h=random.randint(2,10),velocity_score=round(random.uniform(0.7,1.0),3),
            new_payment_method=int(coin(0.8)),is_cross_border=int(coin(0.7)),is_round_amount=int(coin(0.6)),
            fraud_type=random.choice(["chargeback_fraud","stolen_card","money_laundering","unusual_amount"]),is_fraud=1)
    else:
        return dict(transaction_id=gen_uuid(),amount_aud=round(random.uniform(10,400),2),
            hour_of_day=random.randint(7,22),chargeback_history=0,failed_attempts_24h=random.randint(0,1),
            velocity_score=round(random.uniform(0.0,0.3),3),new_payment_method=int(coin(0.15)),
            is_cross_border=int(coin(0.10)),is_round_amount=int(coin(0.15)),fraud_type="none",is_fraud=0)

def generate_transactions(n=4000):
    fn=int(n*0.15)
    rows=[tx_row(True) for _ in range(fn)]+[tx_row(False) for _ in range(n-fn)]
    random.shuffle(rows)
    df=pd.DataFrame(rows)
    df.to_csv(os.path.join(OUTPUT_DIR,"transactions.csv"),index=False)
    print(f"[✓] transactions.csv  – {len(df):>5} rows  (fraud: {df['is_fraud'].sum()})")
    return df

if __name__=="__main__":
    print("Generating ConnectMyTask fraud-detection training data …\n")
    generate_tasks(2000)
    generate_reviews(3000)
    generate_users(1500)
    generate_transactions(4000)
    print(f"\nAll datasets saved to: {OUTPUT_DIR}")
