from fastapi import FastAPI
from pydantic import BaseModel
import httpx
import requests_cache
import torch
import numpy as np
from model import Flood1DCNN
import torch.nn as nn
import torch.optim as optim
from train import build_data_list, fetch_data_for_location, train_model
from retry_requests import retry
import openmeteo_requests
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Flood Prediction API")
origins = [
    "*"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrainRequest(BaseModel):
    latitude: float
    longitude: float

class PredictRequest(BaseModel):
    series:list[list[float]]
    static:list[float]      


device = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_PATH = "best_model.pth"


NUM_CHANNELS = 7      
SEQ_LEN = 7           
NUM_STATIC = 3 

model = Flood1DCNN(in_channels=NUM_CHANNELS, seq_len=SEQ_LEN, static_dim=NUM_STATIC)
try:
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.to(device)
    model.eval()
    print("Loaded trained model for prediction")
except FileNotFoundError:
    print("No saved model found. Train first.")


def getcurrentdata(lat,lon):
    cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
    retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
    openmeteo = openmeteo_requests.Client(session = retry_session)

    
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude":lat,
        "longitude": lon,
        "daily": ["temperature_2m_mean", "cloud_cover_mean", "precipitation_probability_mean", "relative_humidity_2m_mean", "pressure_msl_mean", "surface_pressure_mean", "wind_speed_10m_mean"],
        "timezone": "auto",
    }
    responses = openmeteo.weather_api(url, params=params)

  
    response = responses[0]
    print(f"Coordinates: {response.Latitude()}°N {response.Longitude()}°E")
    print(f"Elevation: {response.Elevation()} m asl")
    print(f"Timezone: {response.Timezone()}{response.TimezoneAbbreviation()}")
    print(f"Timezone difference to GMT+0: {response.UtcOffsetSeconds()}s")

    daily = response.Daily()
    daily_temperature_2m_mean = daily.Variables(0).ValuesAsNumpy()
    daily_cloud_cover_mean = daily.Variables(1).ValuesAsNumpy()
    daily_precipitation_probability_mean = daily.Variables(2).ValuesAsNumpy()
    daily_relative_humidity_2m_mean = daily.Variables(3).ValuesAsNumpy()
    daily_pressure_msl_mean = daily.Variables(4).ValuesAsNumpy()
    daily_surface_pressure_mean = daily.Variables(5).ValuesAsNumpy()
    daily_wind_speed_10m_mean = daily.Variables(6).ValuesAsNumpy()

    daily_data = {"date": pd.date_range(
        start = pd.to_datetime(daily.Time(), unit = "s", utc = True),
        end = pd.to_datetime(daily.TimeEnd(), unit = "s", utc = True),
        freq = pd.Timedelta(seconds = daily.Interval()),
        inclusive = "left"
    )}

    daily_data["temperature_2m_mean"] = daily_temperature_2m_mean
    daily_data["cloud_cover_mean"] = daily_cloud_cover_mean
    daily_data["precipitation_probability_mean"] = daily_precipitation_probability_mean
    daily_data["relative_humidity_2m_mean"] = daily_relative_humidity_2m_mean
    daily_data["pressure_msl_mean"] = daily_pressure_msl_mean
    daily_data["surface_pressure_mean"] = daily_surface_pressure_mean
    daily_data["wind_speed_10m_mean"] = daily_wind_speed_10m_mean
    static_features = [120.0, 1.0, 0.5] 

    series = []
    for key in ["temperature_2m_mean", "cloud_cover_mean", "precipitation_probability_mean",
                "relative_humidity_2m_mean", "pressure_msl_mean", "surface_pressure_mean",
                "wind_speed_10m_mean"]:
       
        series.append([float(x) for x in daily_data[key]])

    predict_request = PredictRequest(
        series=series,      
        static=static_features
    )
    return predict_request
    
@app.post("/train-location")
def train_location(req: TrainRequest):
    lat, lon = req.latitude, req.longitude
    try:
        data_list = fetch_data_for_location(lat, lon)
    except req.RequestException as e:
        return {"status": "error", "message": f"Failed to fetch data: {e}"}

    if not data_list:
        return {"status": "error", "message": "No data found for this location"}

    best_loss = train_model(data_list)
    return {"status": "success", "best_val_loss": best_loss,
            "message": f"Model trained for location ({lat},{lon})"}

@app.post("/predict")
def predict_flood(req:TrainRequest):
    lat, lon = req.latitude, req.longitude
    predict_request = getcurrentdata(lat,lon)
    series_t = torch.tensor(np.array(predict_request.series, dtype=np.float32)).unsqueeze(0)  # (1,C,L)
    static_t = torch.tensor(np.array(predict_request.static, dtype=np.float32)).unsqueeze(0)
    print(series_t,static_t)
    with torch.no_grad():
        _, prob = model(series_t, static_t)
        prob_val = prob.item()
    return {"flood_probability": prob_val, "flood_likely": prob_val > 0.5}

