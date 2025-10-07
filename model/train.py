import torch, torch.nn as nn, torch.optim as optim
import requests, numpy as np
from model import Flood1DCNN
from datetime import date,timedelta
import openmeteo_requests
import pandas as pd
import requests_cache
from retry_requests import retry


def build_data_list(daily_data, static_features, labels, seq_len=7):
    feature_names = list(daily_data.keys())
    # Remove 'date' if present
    if 'date' in feature_names:
        feature_names.remove('date')
    num_features = len(feature_names)
    num_days = len(next(iter(daily_data.values())))
    data_list = []

    for end in range(seq_len - 1, num_days):
        start = end - seq_len + 1
        # Stack features: shape (C,L)
        series = np.array(
            [daily_data[feat][start:end+1] for feat in feature_names],
            dtype=np.float32
        )  # (C=8, L=7)

        static = np.array(static_features, dtype=np.float32)
        label = labels[end]  # label of last day in window
        data_list.append((series, static, label))

    return data_list

def fetch_data_for_location(lat,lon):
    cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
    retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
    openmeteo = openmeteo_requests.Client(session = retry_session)

    # Make sure all required weather variables are listed here
    # The order of variables in hourly or daily is important to assign them correctly below
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": ["temperature_2m_mean", "cloud_cover_mean", "precipitation_probability_mean", "relative_humidity_2m_mean", "pressure_msl_mean", "surface_pressure_mean", "wind_speed_10m_mean"],
        "timezone": "auto",
        "start_date": "2025-09-06",
        "end_date": "2025-09-20",
    }
    responses = openmeteo.weather_api(url, params=params)

    # Process first location. Add a for-loop for multiple locations or weather models
    response = responses[0]
    print(f"Coordinates: {response.Latitude()}°N {response.Longitude()}°E")
    print(f"Elevation: {response.Elevation()} m asl")
    print(f"Timezone: {response.Timezone()}{response.TimezoneAbbreviation()}")
    print(f"Timezone difference to GMT+0: {response.UtcOffsetSeconds()}s")

    # Process daily data. The order of variables needs to be the same as requested.
    daily = response.Daily()
    daily_temperature_2m_mean = daily.Variables(0).ValuesAsNumpy()
    daily_cloud_cover_mean = daily.Variables(1).ValuesAsNumpy()
    daily_precipitation_probability_mean = daily.Variables(2).ValuesAsNumpy()
    daily_relative_humidity_2m_mean = daily.Variables(3).ValuesAsNumpy()
    daily_pressure_msl_mean = daily.Variables(4).ValuesAsNumpy()
    daily_surface_pressure_mean = daily.Variables(5).ValuesAsNumpy()
    daily_wind_speed_10m_mean = daily.Variables(6).ValuesAsNumpy()

    daily_data = {}

    daily_data["temperature_2m_mean"] = daily_temperature_2m_mean
    daily_data["cloud_cover_mean"] = daily_cloud_cover_mean
    daily_data["precipitation_probability_mean"] = daily_precipitation_probability_mean
    daily_data["relative_humidity_2m_mean"] = daily_relative_humidity_2m_mean
    daily_data["pressure_msl_mean"] = daily_pressure_msl_mean
    daily_data["surface_pressure_mean"] = daily_surface_pressure_mean
    daily_data["wind_speed_10m_mean"] = daily_wind_speed_10m_mean
    

    

    
    static_features = [120.0, 1.0, 0.5]
    labels = [0, 0, 0, 1, 1, 0, 1,1,0,1,0,0,0,1,1]
    data_list = build_data_list(daily_data, static_features, labels, seq_len=7)
   
    return data_list

def train_model(data_list, epochs=5, lr=0.001, model_path="best_model.pth"):
    device = "cuda" if torch.cuda.is_available() else "cpu"

    IN_CHANNELS = 7  # 8 time-series features
    SEQ_LEN = 7      # 7 days per sequence
    STATIC_DIM = 3   # static features

    model = Flood1DCNN(in_channels=IN_CHANNELS, seq_len=SEQ_LEN, static_dim=STATIC_DIM).to(device)
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    best_val_loss = float('inf')

    for epoch in range(epochs):
        total_loss = 0
        for series, static, label in data_list:
            series_t = torch.tensor(series, dtype=torch.float32).unsqueeze(0).to(device)  # (1,8,7)
            static_t = torch.tensor(static, dtype=torch.float32).unsqueeze(0).to(device)  # (1,3)
            label_t = torch.tensor([label], dtype=torch.float32).to(device)  # (1,)

            optimizer.zero_grad()
            _, prob = model(series_t, static_t)
            loss = criterion(prob, label_t)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg_loss = total_loss / len(data_list)
        print(f"Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.4f}")

        if avg_loss < best_val_loss:
            best_val_loss = avg_loss
            torch.save(model.state_dict(), model_path)
            print(f"Saved best model at epoch {epoch+1}")

    print("Training finished. Best loss:", best_val_loss)
    return best_val_loss