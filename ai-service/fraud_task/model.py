import random
import numpy as np
from typing import Any, Tuple, List
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer

SCAM_KEYWORDS = [
    "whatsapp", "telegram", "transfer fee", "cash advance", 
    "pay outside", "gift card", "crypto", "bitcoin"
]

def generate_synthetic_fraud_data(size: int = 1500) -> Tuple[List[str], np.ndarray, np.ndarray]:
    """
    Generates dataset mapping task text and budget ratios to a binary fraud label.
    Label 1 = Fraud / Suspicious, 0 = Normal
    """
    random.seed(2026)
    texts = []
    nums = []
    labels = []

    normal_categories = ['CLEANING', 'DELIVERY', 'HOME_REPAIR', 'IT_SUPPORT']
    
    for _ in range(size):
        is_fraud = random.random() < 0.3  # 30% fraud class
        
        category = random.choice(normal_categories)
        expected_budget = random.uniform(150_000, 800_000)
        
        if is_fraud:
            # Generate fraudulent signature
            fraud_type = random.choice(['keywords', 'low_budget', 'both'])
            
            if fraud_type in ('keywords', 'both'):
                spam_kw = random.choice(SCAM_KEYWORDS)
                text = f"Urgent task {category}. Please contact me on {spam_kw}."
            else:
                text = f"Normal looking {category} task, but unrealistic budget."
                
            if fraud_type in ('low_budget', 'both'):
                # Extremely low budget
                budget = expected_budget * random.uniform(0.1, 0.4)
            else:
                budget = expected_budget * random.uniform(0.9, 1.2)
                
            # Ratio of budget/expected
            ratio = budget / max(1.0, expected_budget)
            
            texts.append(text)
            nums.append(np.array([ratio]))
            labels.append(1)
        else:
            # Normal task
            text = f"I need a {category} job done properly. Standard scope."
            budget = expected_budget * random.uniform(0.85, 1.3)
            ratio = budget / max(1.0, expected_budget)
            
            texts.append(text)
            nums.append(np.array([ratio]))
            labels.append(0)

    return texts, np.vstack(nums), np.array(labels)

def train_fraud_model() -> dict[str, Any]:
    texts, nums, labels = generate_synthetic_fraud_data()
    
    vectorizer = TfidfVectorizer(max_features=200, stop_words="english")
    x_text = vectorizer.fit_transform(texts).toarray()
    
    x_all = np.hstack([x_text, nums])
    
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=2026)
    clf.fit(x_all, labels)
    
    return {
        "vectorizer": vectorizer,
        "classifier": clf,
        "mode": "trained_fraud_classifier"
    }

def load_fraud_bundle() -> dict[str, Any]:
    model_dir = Path(__file__).resolve().parent.parent / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    bundle_path = model_dir / "fraud_bundle.pkl"
    
    if bundle_path.exists():
        try:
            bundle = joblib.load(bundle_path)
            if "vectorizer" in bundle and "classifier" in bundle:
                return bundle
        except Exception:
            pass
            
    # Train and save if not found
    bundle = train_fraud_model()
    try:
        joblib.dump(bundle, bundle_path)
    except Exception as e:
        print(f"Warning: Could not save fraud bundle: {e}")
    return bundle

def predict_fraud(bundle: dict[str, Any], title: str, description: str, budget: float, expected_min_budget: float) -> Tuple[bool, str]:
    if not bundle:
        ratio = budget / max(1.0, expected_min_budget)
        return ratio < 0.5, "Budget looks unusually low. The system expected at least the minimum."

    # Inference logic
    text = f"{title} {description}"
    ratio = budget / max(1.0, expected_min_budget)
    
    vectorizer = bundle["vectorizer"]
    clf = bundle["classifier"]
    
    x_text = vectorizer.transform([text]).toarray()
    x_num = np.array([[ratio]])
    
    x_all = np.hstack([x_text, x_num])
    
    pred = clf.predict(x_all)[0]
    prob = clf.predict_proba(x_all)[0][1] # Probability of fraud
    
    # Generate reasoning
    if pred == 1:
        if any(kw in text.lower() for kw in SCAM_KEYWORDS):
            return True, "Task flagged due to suspicious communication keywords in description."
        if ratio < 0.5:
            return True, f"Budget looks unusually low compared to standard expected ({expected_min_budget} VND)."
        return True, "Task flagged as high-risk by our AI security model."
    
    return False, ""
