from flask import Flask, render_template
from flask import Flask, send_from_directory
from flask import Blueprint, render_template
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from xgboost import XGBRegressor
from sklearn.impute import SimpleImputer
from imblearn.over_sampling import RandomOverSampler
from sklearn.model_selection import train_test_split, GridSearchCV
import requests

bp = Blueprint('homepage', __name__)

# Load your dataset
file_path = 'app/data/2019-2023.csv'
data = pd.read_csv(file_path)


def load_data():
    # Load dataset
    df = pd.read_csv(file_path)
    return df


def preprocess_data(df):

    # Merge weather data with accident data based on timestamps
    df['DATE COMMITTED'] = pd.to_datetime(df['DATE COMMITTED'], format='%m/%d/%Y')
    # Feature engineering for weather conditions
    df['WIND CHILL'] = calculate_wind_chill(df['WIND_SPEED'], df['TMIN'])
    df['WEATHER CATEGORY'] = categorize_weather(df['RAINFALL'], df['TMAX'], df['TMIN'], df['WIND_SPEED'])

    # Extract time features from 'TIME COMMITTED'
    df['HOUR COMMITTED'] = pd.to_datetime(df['TIME COMMITTED'], format='%H:%M:%S').dt.hour
    df['MINUTE COMMITTED'] = pd.to_datetime(df['TIME COMMITTED'], format='%H:%M:%S').dt.minute

    # Drop unnecessary columns except 'VICTIMS COUNT'
    columns_to_drop = ['ID', 'BARANGAY', 'TIME COMMITTED', 'OFFENSE', 'VEHICLE KIND', 'VICTIMS Gender',
                       'SUSPECTS Gender', 'VICTIMS Age', 'SUSPECTS Age', 'SUSPECTS COUNT', 'LONGITUDE', 'LATITUDE']
    df = df.drop(columns=columns_to_drop, axis=1)

    # Drop non-numeric columns before imputation
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    df_numeric = df[numeric_columns]

    # Impute missing values for numeric columns only
    imputer = SimpleImputer(strategy='mean')
    df_numeric = pd.DataFrame(imputer.fit_transform(df_numeric), columns=df_numeric.columns)

    # Combine the imputed numeric columns with non-numeric columns
    df[df_numeric.columns] = df_numeric

    return df


def calculate_wind_chill(wind_speed, temperature):
    # Calculate wind chill using a common formula
    wind_chill = (35.74 + 0.6215 * temperature - 35.75 * (wind_speed ** 0.16) + 0.4275 * temperature *
                  (wind_speed ** 0.16))
    return wind_chill


def categorize_weather(rainfall, max_temp, min_temp, wind_speed):
    # Categorize weather based on given parameters
    weather_category = []
    for idx in range(len(rainfall)):
        if rainfall[idx] > 4:
            weather_category.append('Rainy')
        elif max_temp[idx] > 35:
            weather_category.append('Hot')
        elif min_temp[idx] < 25:
            weather_category.append('Cold')
        else:
            weather_category.append('Normal')
    return weather_category


# Preprocess data using the existing dataset
df = data.copy()  # Create a copy of the DataFrame to avoid modifying the original
df = preprocess_data(df)


def create_monthly_data(df):

    # Ensure all months from 2019-2023 are covered
    years = range(2019, 2024)
    months = range(1, 13)
    all_months = [(year, month) for year in years for month in months]

    # Count the total accidents per month
    monthly_data = df.groupby(['YEAR COMMITTED', 'MONTH COMMITTED']).size().reset_index(name='ACCIDENT COUNT')

    # Fill missing months with zero accidents
    all_data = pd.DataFrame(all_months, columns=['YEAR COMMITTED', 'MONTH COMMITTED'])
    monthly_data = pd.merge(all_data, monthly_data, on=['YEAR COMMITTED', 'MONTH COMMITTED'], how='left').fillna(0)

    return monthly_data


def split_data_oversample(df, target='VICTIMS COUNT', test_size=0.3, random_state=42):
    features = df.drop(target, axis=1)
    target_values = df[target]

    oversampler = RandomOverSampler(sampling_strategy='auto', random_state=random_state)
    features_resampled, target_resampled = oversampler.fit_resample(features, target_values)

    X_train, X_test, y_train, y_test = train_test_split(features_resampled, target_resampled, test_size=test_size, random_state=random_state)

    return X_train, X_test, y_train, y_test


# Define functions for modeling
def tune_xgboost_parameters(X_train, y_train):
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [3, 5, 7],
        'learning_rate': [0.01, 0.1, 0.2],
        'subsample': [0.6, 0.8, 1.0]
    }
    xgb_regressor = XGBRegressor(random_state=42)
    grid_search = GridSearchCV(estimator=xgb_regressor, param_grid=param_grid, scoring='neg_mean_squared_error', n_jobs=-1)
    grid_search.fit(X_train, y_train)
    best_params = grid_search.best_params_
    return XGBRegressor(random_state=42, **best_params)


months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
month_mapping = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
                 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12}


def predict_2024_accidents(xgb_regressor, features):
    # Ensure that feature names match those used during training
    features['MONTH COMMITTED'] = features['Month'].map(month_mapping)
    features['YEAR COMMITTED'] = 2024
    features = features[['YEAR COMMITTED', 'MONTH COMMITTED']]
    predicted_accidents_2024 = xgb_regressor.predict(features)
    return predicted_accidents_2024


def generate_trend_plot(rf_regressor, height=235, width=710):
    # Load dataset
    file_path = 'app/data/2019-2023.csv'
    df = pd.read_csv(file_path)

    # Convert 'DATE COMMITTED' to datetime and format
    df['DATE COMMITTED'] = pd.to_datetime(df['DATE COMMITTED'])
    df['Month'] = df['DATE COMMITTED'].dt.strftime('%b')
    df['Year'] = df['DATE COMMITTED'].dt.year

    # Filter data for years 2019-2023
    df_filtered = df[df['Year'].between(2019, 2023)]

    # Group by 'YEAR COMMITTED' and 'MONTH COMMITTED' to count accidents
    accidents_by_year_month = df_filtered.groupby(['Year', 'Month']).size().unstack(fill_value=0)

    # Sort the months in the correct order
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    accidents_by_year_month = accidents_by_year_month.reindex(columns=months)

    # Create a line chart using Plotly for both trend and predicted values
    fig = go.Figure()

    # Add actual trend data
    years = accidents_by_year_month.index.tolist()
    for year in years:
        fig.add_trace(go.Scatter(
            x=accidents_by_year_month.columns,
            y=accidents_by_year_month.loc[year],
            mode='lines+markers',
            name=str(year),
            line=dict(color='blue')
        ))

    # Generate predicted values for 2024 using your regression model
    features_2024 = pd.DataFrame({'Month': months})
    predicted_values_2024 = predict_2024_accidents(rf_regressor, features_2024)

    # Add predicted values to the plot
    months_2024 = [f"{month} " for month in months]  # Generate labels for 2024
    fig.add_trace(go.Scatter(
        x=months_2024,
        y=predicted_values_2024,
        mode='lines+markers',
        name='Predicted 2024',
        line=dict(color='red')  # Set color for Predicted 2024 to red
    ))

    # Update layout for the figure
    fig.update_layout(
        xaxis_title='Month',
        yaxis_title='Number of Accidents',
        showlegend=True,
        margin=dict(l=0, r=0, t=30, b=0),
        height=height,
        width=width
    )

    # Convert the plot to HTML and return it
    trend_plot_html = fig.to_html(include_plotlyjs=False, full_html=False)

    return trend_plot_html


def get_weather(api_key, city):
    base_url = "http://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": api_key, "units": "metric"}
    response = requests.get(base_url, params=params)
    data = response.json()
    return data


def generate_accident_prescription(predicted_values_2024, months):
    # Combine predicted values with months for easy analysis
    predictions_df = pd.DataFrame({'Month': months, 'Predicted Accidents': predicted_values_2024})

    # Find the month with the highest predicted accidents
    highest_accidents_month = predictions_df.loc[predictions_df['Predicted Accidents'].idxmax()]

    # Find the month with the lowest predicted accidents
    lowest_accidents_month = predictions_df.loc[predictions_df['Predicted Accidents'].idxmin()]

    # Generate the prescription string
    prescription = (f"In 2024, the month with the highest predicted number of road accidents is {highest_accidents_month['Month']} "
                    f"with {int(highest_accidents_month['Predicted Accidents'])} accidents, while the month with the lowest predicted "
                    f"accidents is {lowest_accidents_month['Month']} with {int(lowest_accidents_month['Predicted Accidents'])} accidents. "
                    f"It's crucial for our traffic enforcers and police officers to closely monitor major roads and accident-prone areas durint this month.")

    return prescription


@bp.route('/')
def homepage():
    # Preprocess data using the existing dataset
    df = data.copy()  # Assuming 'data' is defined somewhere in your code
    df = preprocess_data(df)
    monthly_data = create_monthly_data(df)  # Assuming create_monthly_data is defined
    X_train, X_test, y_train, y_test = split_data_oversample(monthly_data, target='ACCIDENT COUNT')
    xgb_regressor = tune_xgboost_parameters(X_train, y_train)
    xgb_regressor.fit(X_train, y_train)

    trend_plot_html = generate_trend_plot(xgb_regressor)

    # Assuming you have rf_regressor, features_2024, and months defined
    features_2024 = pd.DataFrame({'Month': months})
    predicted_values_2024 = predict_2024_accidents(xgb_regressor, features_2024)

    # Generate the prescription
    prescription = generate_accident_prescription(predicted_values_2024, months)

    # Weather API integration
    api_key = "b3157daeee69981a9f55aff05785b3b9"
    city = "Urdaneta, Pangasinan"
    weather_data = get_weather(api_key, city)
    if weather_data["cod"] == 200:
        weather = weather_data["weather"][0]["description"].capitalize()
        temperature = weather_data["main"]["temp"]
        rainfall = weather_data.get("rain", {}).get("1h", 0)
        wind_speed = weather_data["wind"]["speed"]
    else:
        weather = "N/A"
        temperature = 0
        rainfall = 0
        wind_speed = 0

    return render_template('homepage.html', trend_plot_html=trend_plot_html,
                           weather=weather, temperature=temperature,
                           rainfall=rainfall, wind_speed=wind_speed, prescription=prescription)