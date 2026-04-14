from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import random
import re
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer

from fraud_task import load_fraud_bundle, predict_fraud


app = FastAPI(
    title="ConnectMyTask Budget AI",
    description="Title-first, AI budget suggestion service for ConnectMyTask.",
)


class TaskInput(BaseModel):
    category: str | None = None
    title: str | None = ""
    description: str | None = ""
    location: str | None = ""
    budget: float | None = None
    complexity: str | None = None
    urgency: str | None = None
    # Legacy payload support
    Category: str | None = None
    Distance_km: float | None = None
    Duration_hours: float | None = None
    Is_Urgent: int | None = None


class RecommendInput(BaseModel):
    title: str | None = ""
    category: str
    description: str | None = ""
    location: str | None = ""
    urgency: str | None = ""
    budget: float | None = None

class FraudInput(BaseModel):
    title: str | None = ""
    description: str | None = ""
    budget: float
    expected_min_budget: float


@dataclass
class ParsedContext:
    category: str
    effective_category: str
    title: str
    description: str
    location: str
    is_urgent_flag: int
    distance_km: float
    quantity: float
    text_features: str


MODEL_BUNDLE: dict[str, Any] | None = None
FRAUD_BUNDLE: dict[str, Any] | None = None

DISTRICT_NAMES = [
    "district 1", "district 2", "district 3", "district 4", "district 5", "district 6",
    "district 7", "district 8", "district 9", "district 10", "district 11", "district 12",
    "thu duc", "binh thanh", "phu nhuan", "tan binh", "tan phu", "go vap",
    "binh chanh", "nha be", "hoc mon", "cu chi",
]


def normalize_text(text: str | None) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())

def to_vnd_round(value: float) -> int:
    step = 50_000 if value >= 1_000_000 else 10_000
    return int(max(step, round(value / step) * step))

def extract_first_number(text: str) -> int | None:
    m = re.search(r"\b(\d{1,3})\b", text)
    return int(m.group(1)) if m else None

def detect_urgency(text: str) -> bool:
    urgent_keywords = ["urgent", "asap", "today", "now", "immediately", "same day"]
    return any(k in text for k in urgent_keywords)

def detect_distance_hint(location_text: str, merged_text: str) -> float:
    text = f"{location_text} {merged_text}"
    km_match = re.search(r"(\d{1,2})\s?(km|kilometer|kilometre)", text)
    if km_match:
        return float(max(1, min(30, int(km_match.group(1)))))
    district_hits = [d for d in DISTRICT_NAMES if d in text]
    if len(district_hits) >= 2:
        return 12.0
    if len(district_hits) == 1:
        return 5.0
    return 6.0


def estimate_cleaning_budget(title: str, desc: str) -> tuple[float, float, list[str]]:
    min_val, max_val = 180_000, 350_000
    factors = []
    text = f"{title} {desc}"
    n = extract_first_number(text)
    if n and n >= 2:
        add = min(n, 6) * 70_000
        min_val += add; max_val += add + 70_000
        factors.append(f"{n} room(s) mentioned")
    if "deep" in title or "deep" in desc or "full" in desc:
        min_val += 180_000; max_val += 350_000
        factors.append("deep/full cleaning scope")
    if "kitchen" in desc or "bathroom" in desc:
        min_val += 90_000; max_val += 170_000
        factors.append("kitchen/bathroom included")
    return min_val, max_val, factors

def estimate_delivery_budget(title: str, desc: str, location: str, urgent: bool) -> tuple[float, float, list[str]]:
    min_val, max_val = 80_000, 180_000
    factors = []
    dist = detect_distance_hint(location, f"{title} {desc}")
    min_val += dist * 6_000; max_val += dist * 12_000
    factors.append(f"estimated distance around {dist}km")
    if "document" in title or "document" in desc:
        min_val += 20_000; max_val += 50_000
        factors.append("document handling")
    if "heavy" in title or "heavy" in desc or "fragile" in desc:
        min_val += 40_000; max_val += 90_000
        factors.append("special package handling")
    if urgent:
        min_val += 80_000; max_val += 150_000
        factors.append("urgent delivery")
    return min_val, max_val, factors

def estimate_repair_budget(title: str, desc: str, is_electrical: bool) -> tuple[float, float, list[str]]:
    min_val, max_val = (250_000, 600_000) if is_electrical else (220_000, 550_000)
    factors = []
    text = f"{title} {desc}"
    n = extract_first_number(text)
    if n and n >= 2:
        add = min(n, 6) * 90_000
        min_val += add; max_val += add + 120_000
        factors.append(f"{n} issues/points mentioned")
    if "install" in title or "install" in desc:
        min_val += 80_000; max_val += 170_000
        factors.append("installation work included")
    if "leak" in title or "leak" in desc or "water" in desc:
        min_val += 60_000; max_val += 130_000
        factors.append("technical troubleshooting required")
    return min_val, max_val, factors

def estimate_plumbing_budget(title: str, desc: str) -> tuple[float, float, list[str]]:
    min_val, max_val = 260_000, 620_000
    factors = []
    text = f"{title} {desc}"
    n = extract_first_number(text)
    if n and n >= 2:
        add = min(n, 6) * 85_000
        min_val += add; max_val += add + 120_000
        factors.append(f"{n} plumbing issues/points mentioned")
    else:
        factors.append("single plumbing issue scope")
    if "leak" in desc:
        min_val += 60_000; max_val += 130_000
        factors.append("leak troubleshooting")
    if "toilet" in desc or "sink" in desc:
        min_val += 40_000; max_val += 90_000
        factors.append("fixture-specific repair")
    return min_val, max_val, factors

def estimate_installation_budget(title: str, desc: str) -> tuple[float, float, list[str]]:
    min_val, max_val = 220_000, 520_000
    factors = []
    text = f"{title} {desc}"
    n = extract_first_number(text)
    if n and n >= 2:
        add = min(n, 8) * 70_000
        min_val += add; max_val += add + 110_000
        factors.append(f"{n} installation items mentioned")
    else:
        factors.append("single installation item scope")
    if "wall" in desc or "ceiling" in desc or "drill" in desc:
        min_val += 50_000; max_val += 110_000
        factors.append("mounting/drilling complexity")
    return min_val, max_val, factors

def detect_sub_service_by_keywords(title: str, desc: str) -> tuple[str, str]:
    combined = f"{title} {desc}"
    p_kws = ['pipe', 'sink', 'toilet', 'leak', 'water', 'faucet', 'drain']
    e_kws = ['switch', 'outlet', 'socket', 'wiring', 'wire', 'fan', 'light', 'power']
    i_kws = ['install', 'mount', 'assemble', 'set up']
    
    ps = sum(1 for kw in p_kws if kw in combined) + sum(2 for kw in p_kws if kw in title)
    es = sum(1 for kw in e_kws if kw in combined) + sum(2 for kw in e_kws if kw in title)
    is_s = sum(1 for kw in i_kws if kw in combined) + sum(2 for kw in i_kws if kw in title)
    
    scores = [('PLUMBING', ps), ('ELECTRICAL', es), ('INSTALLATION', is_s)]
    scores.sort(key=lambda x: x[1], reverse=True)
    
    if scores[0][1] <= 0:
        return 'GENERAL_REPAIR', 'no strong title keywords matched'
    return scores[0][0], f"title/description keywords matched {scores[0][0].lower()}"

def estimate_moving_budget(title: str, desc: str, location: str) -> tuple[float, float, list[str]]:
    min_val, max_val = 300_000, 700_000
    factors = []
    text = f"{title} {desc}"
    n = extract_first_number(text)
    if n and n >= 3:
        add = min(n, 20) * 45_000
        min_val += add; max_val += add + 150_000
        factors.append(f"{n} items/furniture mentioned")
    
    dist = detect_distance_hint(location, f"{title} {desc}")
    min_val += dist * 12_000; max_val += dist * 22_000
    factors.append(f"moving distance around {dist}km")
    
    if "stairs" in desc or "no lift" in desc:
        min_val += 120_000; max_val += 220_000
        factors.append("stairs/no-lift condition")
    if "fragile" in desc or "heavy" in desc:
        min_val += 90_000; max_val += 180_000
        factors.append("fragile/heavy handling")
    return min_val, max_val, factors

def estimate_tech_support_budget(title: str, desc: str) -> tuple[float, float, list[str]]:
    min_val, max_val = 150_000, 400_000
    factors = []
    text = f"{title} {desc}"
    n = extract_first_number(text)
    if n and n >= 2:
        add = min(n, 5) * 60_000
        min_val += add; max_val += add + 90_000
        factors.append(f"{n} issues to fix")
        
    if "hardware" in desc or "install" in desc or "replace" in desc:
        min_val += 70_000; max_val += 150_000
        factors.append("hardware-level support")
    if "onsite" in desc or "at home" in desc:
        min_val += 50_000; max_val += 90_000
        factors.append("onsite support required")
    return min_val, max_val, factors

def estimate_other_budget(title: str, desc: str) -> tuple[float, float, list[str]]:
    min_val, max_val = 180_000, 450_000
    factors = []
    if len(title) + len(desc) > 180:
        min_val += 50_000; max_val += 120_000
        factors.append("detailed scope indicates medium-high complexity")
    return min_val, max_val, factors


def get_rule_estimate(category: str, title: str, desc: str, loc: str, urgent: bool) -> tuple[float, float, list[str], str]:
    sub_cat_reason = None
    eff_cat = category
    if category == 'HOME_REPAIR':
        eff_cat, sub_cat_reason = detect_sub_service_by_keywords(title, desc)
        if eff_cat == 'GENERAL_REPAIR':
            eff_cat = category

    if eff_cat == 'CLEANING': res = estimate_cleaning_budget(title, desc)
    elif eff_cat == 'DELIVERY': res = estimate_delivery_budget(title, desc, loc, urgent)
    elif eff_cat == 'MOVING': res = estimate_moving_budget(title, desc, loc)
    elif eff_cat in ('IT_SUPPORT', 'TECH_SUPPORT'): res = estimate_tech_support_budget(title, desc)
    elif eff_cat == 'HOME_REPAIR': res = estimate_repair_budget(title, desc, False)
    elif eff_cat == 'ELECTRICAL': res = estimate_repair_budget(title, desc, True)
    elif eff_cat == 'PLUMBING': res = estimate_plumbing_budget(title, desc)
    elif eff_cat == 'INSTALLATION': res = estimate_installation_budget(title, desc)
    else: res = estimate_other_budget(title, desc)

    min_val, max_val, factors = res
    all_fac = [f"category input: {category or 'OTHER'}", f"pricing logic used: {eff_cat or 'OTHER'}"] + factors
    if sub_cat_reason:
        all_fac.append(f"sub-service detection: {sub_cat_reason}")
    if urgent:
        min_val += 60_000; max_val += 120_000
        all_fac.append('urgent keyword detected in title/description')

    return min_val, max_val, all_fac, eff_cat


def parse_task_context(cat: str, title: str, desc: str, loc: str) -> ParsedContext:
    title_text = normalize_text(title)
    desc_text = normalize_text(desc)
    cat_text = (cat or "OTHER").strip().upper()
    loc_text = normalize_text(loc)
    urgent = detect_urgency(f"{title_text} {desc_text}")
    _, _, _, eff_cat = get_rule_estimate(cat_text, title_text, desc_text, loc_text, urgent)

    q = extract_first_number(f"{title_text} {desc_text}") or 1
    dist = detect_distance_hint(loc_text, f"{title_text} {desc_text}")

    return ParsedContext(
        category=cat_text,
        effective_category=eff_cat,
        title=title_text,
        description=desc_text,
        location=loc_text,
        is_urgent_flag=int(urgent),
        distance_km=dist,
        quantity=float(q),
        text_features=f"{title_text} {desc_text} category {cat_text.lower()} {eff_cat.lower()}"
    )

def text_feature(context: ParsedContext) -> str:
    return context.text_features

def numerical_features(context: ParsedContext) -> np.ndarray:
    return np.array([
        context.distance_km,
        float(context.is_urgent_flag),
        context.quantity
    ], dtype=float)

def create_synthetic_training_data(size: int = 1500) -> tuple[list[str], np.ndarray, np.ndarray]:
    random.seed(2026)
    texts: list[str] = []
    nums: list[np.ndarray] = []
    targets: list[float] = []

    categories = ['CLEANING', 'DELIVERY', 'MOVING', 'IT_SUPPORT', 'HOME_REPAIR']
    kws = ['deep', 'full', 'kitchen', 'bathroom', 'document', 'heavy', 'fragile', 'leak', 'water', 'install', 'wall', 'drill', 'stairs', 'hardware']

    for _ in range(size):
        c = random.choice(categories)
        urgent = random.choice([True, False, False, False])
        loc = random.choice(["district 1", "district 7", "cu chi", "", "tan binh"])
        q = random.randint(1, 10)
        kw1 = random.choice(kws) if random.random() > 0.4 else ""
        kw2 = random.choice(kws) if random.random() > 0.6 else ""
        
        title = f"{kw1} {c.lower()} service {random.choice(['urgent', 'today']) if urgent else ''}"
        desc = f"Need {q} things fixed or handled. {kw1} and {kw2} included potentially."

        context = parse_task_context(c, title, desc, loc)
        min_v, max_v, _, _ = get_rule_estimate(c, title, desc, loc, urgent)
        mid_v = (min_v + max_v) / 2
        
        target = mid_v * random.uniform(0.9, 1.1)

        texts.append(text_feature(context))
        nums.append(numerical_features(context))
        targets.append(target)

    return texts, np.vstack(nums), np.array(targets, dtype=float)


def train_fallback_model() -> dict[str, Any]:
    texts, nums, targets = create_synthetic_training_data()

    vectorizer = TfidfVectorizer(max_features=350, ngram_range=(1, 2))
    x_text = vectorizer.fit_transform(texts).toarray()
    x_all = np.hstack([x_text, nums])

    gbr = GradientBoostingRegressor(random_state=2026, n_estimators=260, max_depth=3)
    rf = RandomForestRegressor(random_state=2026, n_estimators=220, max_depth=12, n_jobs=1)
    gbr.fit(x_all, targets)
    rf.fit(x_all, targets)

    return {
        "vectorizer": vectorizer,
        "gbr": gbr,
        "rf": rf,
        "mode": "trained_fallback_ensemble",
        "model_name": "GradientBoosting + RandomForest",
    }


def load_model_bundle() -> dict[str, Any]:
    model_dir = Path(__file__).resolve().parent / "models"
    bundle_path = model_dir / "pricing_bundle.pkl"
    if bundle_path.exists():
        try:
            bundle = joblib.load(bundle_path)
            if isinstance(bundle, dict) and "vectorizer" in bundle:
                if "gbr" in bundle and "rf" in bundle:
                    bundle["mode"] = "pretrained_ensemble"
                    bundle.setdefault("model_name", "GradientBoosting + RandomForest")
                    return bundle
        except Exception as e:
            print("Failed to load bundle:", e)
    return train_fallback_model()


@app.on_event("startup")
def startup() -> None:
    global MODEL_BUNDLE, FRAUD_BUNDLE
    MODEL_BUNDLE = load_model_bundle()
    FRAUD_BUNDLE = load_fraud_bundle()
    print(f"AI model initialized in mode: {MODEL_BUNDLE.get('mode', 'unknown')}")
    print(f"Fraud model initialized in mode: {FRAUD_BUNDLE.get('mode', 'unknown')}")


def ml_predict_vnd(context: ParsedContext) -> float:
    if not MODEL_BUNDLE:
        return 0.0

    try:
        vectorizer: TfidfVectorizer = MODEL_BUNDLE["vectorizer"]
        x_text = vectorizer.transform([text_feature(context)]).toarray()
        x_num = numerical_features(context).reshape(1, -1)
        x_all = np.hstack([x_text, x_num])

        gbr_val = float(MODEL_BUNDLE["gbr"].predict(x_all)[0])
        rf_val = float(MODEL_BUNDLE["rf"].predict(x_all)[0])
        return gbr_val * 0.55 + rf_val * 0.45
    except Exception:
        return 0.0


def predict_budget(context: ParsedContext) -> dict[str, Any]:
    min_rule, max_rule, factors, eff_cat = get_rule_estimate(
        context.category, 
        context.title, 
        context.description, 
        context.location, 
        bool(context.is_urgent_flag)
    )
    
    ml_vnd = ml_predict_vnd(context)
    if ml_vnd > 0:
        rule_mid = (min_rule + max_rule) / 2
        blended_mid = rule_mid * 0.8 + ml_vnd * 0.2
        spread = max(60_000, (max_rule - min_rule) * 0.6)
        min_vnd = blended_mid - spread / 2
        max_vnd = blended_mid + spread / 2
        factors.append('blended with existing AI model signal')
    else:
        min_vnd, max_vnd = min_rule, max_rule
        
    s_min = to_vnd_round(min_vnd)
    s_max = to_vnd_round(max(s_min + 20_000, max_vnd))
    suggested = to_vnd_round((s_min + s_max) / 2)
    
    reason = "including urgency" if context.is_urgent_flag else ""
    explanation = f"Suggested from {eff_cat or 'OTHER'} job type detected mainly from title, then refined by description{', ' + reason if reason else ''}."

    # Return structure matching what service.js expects in meta payload
    return {
        "suggestedPrice": int(suggested),
        "minPrice": int(s_min),
        "maxPrice": int(s_max),
        "currency": "VND",
        "confidenceScore": round(0.85, 2),
        "explanation": explanation,
        "detectedSubtype": eff_cat,
        "factorsUsed": factors,
        # Legacy/meta backward compatibility
        "ai_suggested_price": int(suggested),
        "priceBandMin": int(s_min),
        "priceBandMax": int(s_max),
        "price_band_min": int(s_min),
        "price_band_max": int(s_max),
        "rationale": explanation,
        "model_mode": MODEL_BUNDLE.get("mode") if MODEL_BUNDLE else "hybrid-ai-rule-engine",
    }


def resolve_payload(task: TaskInput) -> ParsedContext:
    category = task.category or task.Category or "OTHER"
    title = task.title or ""
    description = task.description or ""
    location = task.location or ""
    if not title and not description:
        title = f"{category} task"
        description = f"{category} service request"
    return parse_task_context(cat=category, title=title, desc=description, loc=location)


@app.post("/predict-price")
def predict_price(task: TaskInput) -> dict[str, Any]:
    try:
        context = resolve_payload(task)
        return predict_budget(context)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {error}") from error


@app.post("/recommend")
def recommend(task: RecommendInput) -> dict[str, Any]:
    try:
        context = parse_task_context(
            cat=task.category,
            title=task.title or "",
            desc=task.description or "",
            loc=task.location or ""
        )
        pred = predict_budget(context)

        return {
            "suggestedPrice": pred["suggestedPrice"],
            "minPrice": pred["minPrice"],
            "maxPrice": pred["maxPrice"],
            "currency": pred["currency"],
            "confidenceScore": pred["confidenceScore"],
            "explanation": pred["explanation"],
            "detectedSubtype": pred["detectedSubtype"],
            "factorsUsed": pred["factorsUsed"],
            "recommendedProviders": [],
            "meta": {
                "mappedCategory": context.category,
                "detectedSubtype": pred["detectedSubtype"],
                "priceBandMin": pred["minPrice"],
                "priceBandMax": pred["maxPrice"],
                "currency": pred["currency"],
                "explanation": pred["explanation"],
                "factorsUsed": pred["factorsUsed"],
            },
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {error}") from error

@app.post("/detect-fraud")
def detect_fraud(task: FraudInput) -> dict[str, Any]:
    try:
        is_fraud, reason = predict_fraud(
            bundle=FRAUD_BUNDLE,
            title=task.title or "",
            description=task.description or "",
            budget=task.budget,
            expected_min_budget=task.expected_min_budget
        )
        
        return {
            "is_suspicious": is_fraud,
            "risk_level": "HIGH" if is_fraud else "MEDIUM" if task.budget < task.expected_min_budget else "LOW",
            "reason": reason if is_fraud else ""
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Fraud detection failed: {error}") from error
