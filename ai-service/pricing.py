from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib

# Initialize the API
app = FastAPI(title="ConnectMyTask Pricing AI", description="AI Pricing Intelligence API")

# Define the exact inputs we expect from the Node.js frontend/backend
class TaskInput(BaseModel):
    Category: str
    Distance_km: float
    Duration_hours: float
    Is_Urgent: int

# Global variables to hold our models in memory
ai_model = None
model_columns = None

@app.on_event("startup")
def load_models():
    """Loads the newly trained randomized model into memory when the server starts."""
    global ai_model, model_columns
    try:
        # This will load your new, smarter .pkl file trained on the messy dataset
        ai_model = joblib.load("models/pricing_regressor.pkl")
        model_columns = joblib.load("models/model_columns.pkl")
        print("✅ Randomized Pricing Models loaded successfully.")
    except Exception as e:
        print(f"⚠️ Error loading models. Make sure .pkl files are in the 'models/' folder: {e}")

def calculate_rule_based(task: TaskInput) -> float:
    """
    The baseline formula logic for Capstone comparison. 
    This represents the 'rigid' pricing before AI was introduced.
    """
    base_price = 0
    if task.Category == 'Cleaning': base_price = 50
    elif task.Category == 'Delivery': base_price = 30
    elif task.Category == 'Plumbing': base_price = 80
    elif task.Category == 'Moving Help': base_price = 100
    
    urgency_fee = 20 if task.Is_Urgent == 1 else 0
    
    # The fixed formula the professor wanted you to beat
    return base_price + (task.Distance_km * 2) + (task.Duration_hours * 10) + urgency_fee

@app.post("/predict-price")
def predict_price(task: TaskInput):
    """The endpoint the Node.js backend will call to get a price."""
    if not ai_model or not model_columns:
        raise HTTPException(status_code=500, detail="AI Model is not loaded into the server.")

    # 1. Calculate Rule-Based Price (The fixed baseline)
    rule_price = calculate_rule_based(task)

    # 2. Prepare Data for AI Model (Convert JSON to DataFrame, then One-Hot Encode)
    input_df = pd.DataFrame([task.model_dump()]) 
    input_encoded = pd.get_dummies(input_df, columns=['Category'])
    
    # Ensure API columns perfectly match the Kaggle training columns
    for col in model_columns:
        if col not in input_encoded.columns:
            input_encoded[col] = 0
            
    # Reorder columns to match the training data exactly
    input_encoded = input_encoded[model_columns]

    # 3. Predict using the newly trained AI Model
    predicted_price = float(ai_model.predict(input_encoded)[0])
    
    # 4. Define Confidence Band (Margin of Error)
    # Note: You can update this 8.50 to whatever the MAE output was in your Kaggle notebook!
    margin_of_error = 8.50  
    
    # 5. Return the structured JSON response back to Node.js
    return {
        "rule_based_price": round(rule_price, 2),
        "ai_suggested_price": round(predicted_price, 2),
        "price_band_min": round(predicted_price - margin_of_error, 2),
        "price_band_max": round(predicted_price + margin_of_error, 2),
        "currency": "USD",
        "rationale": f"AI calculated fair market price for {task.Category} over {task.Distance_km}km."
    }