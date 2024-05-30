from flask import Flask, render_template, request, send_file, jsonify, redirect, url_for
import pandas as pd
import os, csv
from datetime import datetime, date
from flask import Blueprint, render_template, redirect, url_for
import requests

bp = Blueprint('report', __name__)

# Constants
CURRENT_DIR = os.path.dirname(__file__)
CSV_FILE_PATH = os.path.join(CURRENT_DIR, "data", "2019-2023.csv")


# Your API key
api_key = '454eba53d8edf476f08de195c2672e1b'

# Coordinates for the location
latitude = 15.9753
longitude = 120.5670


def kelvin_to_celsius(kelvin):
    return kelvin - 273.15


def load_data():
    if os.path.exists(CSV_FILE_PATH):
        # Load CSV data
        df = pd.read_csv(CSV_FILE_PATH)

        # Drop rows with non-finite ID values
        df = df.dropna(subset=['ID'])

        # Convert the 'ID' column to integers
        df['ID'] = df['ID'].astype(int)

        return df
    else:
        print("CSV file not found.")
        return pd.DataFrame()


def format_date(date_str):
    # Assuming the input date is in the format 'DD/MM/YYYY'
    datetime_obj = datetime.strptime(date_str, '%Y-%m-%d')
    # Format the date to 'YYYY-MM-DD'
    return datetime_obj.strftime('%m/%d/%Y')


def save_data(df):
    df.to_csv(CSV_FILE_PATH, index=False)


def get_next_id(df):
    try:
        if df.empty:
            return 1  # Start with ID 1 if DataFrame is empty
        else:
            return int(df['ID'].max()) + 1  # Cast the result to integer
    except Exception as e:
        print(f"Error getting next ID: {str(e)}")
        return 1  # Return 1 in case of any error


# Routes
@bp.route('/')
def index():
    return render_template('report.html')


@bp.route('/get_csv_data')
def get_csv_data():
    if os.path.exists(CSV_FILE_PATH):
        return send_file(CSV_FILE_PATH, as_attachment=True)
    else:
        return "CSV file not found."


@bp.route('/get_weather_data', methods=['GET'])
def get_weather_data():
    try:
        date_str = request.args.get('date')
        requested_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        today = date.today()

        if requested_date > today:
            return jsonify({'error': 'Cannot fetch weather data for future dates.'}), 400

        url = f"https://api.openweathermap.org/data/3.0/onecall/day_summary?lat={latitude}&lon={longitude}&date={date_str}&appid={api_key}"

        response = requests.get(url)

        if response.status_code == 200:
            weather_data = response.json()
            # Extract relevant weather information
            min_temp_k = weather_data['temperature']['min']
            max_temp_k = weather_data['temperature']['max']
            wind_speed = weather_data['wind']['max']['speed']
            wind_direction = round(weather_data['wind']['max']['direction'])
            rainfall = weather_data.get('rainfall', 0)
            # Convert Kelvin to Celsius and round to two decimal places
            min_temp_c = round(kelvin_to_celsius(min_temp_k), 2)
            max_temp_c = round(kelvin_to_celsius(max_temp_k), 2)
            # Construct response JSON
            response_data = {
                'tMin': min_temp_c,
                'tMax': max_temp_c,
                'windSpeed': wind_speed,
                'windDirection': wind_direction,
                'rainfall': rainfall
            }
            return jsonify(response_data)
        else:
            return jsonify({'error': 'Failed to fetch weather data.'}), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/submit-crime-report', methods=['POST'])
def submit_crime_report():
    try:
        form_data = request.form.to_dict()
        df = load_data()

        # Fetch weather data
        date = form_data.get('dateCommitted')
        weather_url = url_for('report.get_weather_data', date=date, _external=True)
        weather_response = requests.get(weather_url)

        if weather_response.status_code != 200:
            return jsonify({'error': 'Failed to fetch weather data.'}), weather_response.status_code

        weather_data = weather_response.json()

        # Extract relevant weather information
        t_min = weather_data.get('tMin', '')
        t_max = weather_data.get('tMax', '')
        wind_speed = weather_data.get('windSpeed', '')
        wind_direction = weather_data.get('windDirection', '')
        rainfall = weather_data.get('rainfall', '')

        # Format date
        date_committed = format_date(date)
        if not date_committed:
            return jsonify({'error': 'Invalid date format. Should be YYYY-MM-DD.'}), 400

        date_obj = datetime.strptime(date_committed, '%m/%d/%Y')

        # Construct new row data
        new_row_data = {
            'ID': get_next_id(df),
            'BARANGAY': form_data.get('barangay'),
            'DATE COMMITTED': date_committed,
            'MONTH COMMITTED': date_obj.month,
            'DAY COMMITTED': date_obj.day,
            'YEAR COMMITTED': date_obj.year,
            'TIME COMMITTED': form_data.get('timeCommitted') + ':00',
            'TMAX': t_max,
            'TMIN': t_min,
            'OFFENSE': form_data.get('offense'),
            'VICTIMS Age': form_data.get('victimsAge'),
            'VICTIMS Gender': form_data.get('victimsGender'),
            'SUSPECTS Age': form_data.get('suspectsAge'),
            'SUSPECTS Gender': form_data.get('suspectsGender'),
            'VICTIMS COUNT': form_data.get('victimsCount'),
            'SUSPECTS COUNT': form_data.get('suspectsCount'),
            'VEHICLE KIND': form_data.get('vehicleKind'),
            'LONGITUDE': form_data.get('longitude'),
            'LATITUDE': form_data.get('latitude'),
            'RAINFALL': rainfall,
            'WIND_SPEED': wind_speed,
            'WIND_DIRECTION': wind_direction
        }

        # Append new row to DataFrame
        df = pd.concat([df, pd.DataFrame([new_row_data])], ignore_index=True)

        # Save DataFrame to CSV
        save_data(df)

        # Redirect with a success flag
        return redirect(url_for('report.report', success=True))

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/delete_row', methods=['POST'])
def delete_row():
    data = request.get_json()
    id_to_delete = data.get('id')

    try:
        # Attempt to convert id_to_delete to integer
        id_to_delete = int(float(id_to_delete))
    except ValueError:
        return jsonify({'error': 'Invalid ID value'}), 400

    df = load_data()
    df = df[df['ID'] != id_to_delete]
    save_data(df)

    return jsonify({'message': 'Row deleted successfully'})


@bp.route('/edit_row', methods=['POST'])
def edit_row():
    try:
        edited_data = request.json

        # Format the date before updating the CSV file
        edited_data['date'] = format_date(edited_data['date'])

        # Convert the date string to a datetime object
        date_obj = datetime.strptime(edited_data['date'], '%m/%d/%Y')

        # Extract day, month, and year
        day_committed = date_obj.day
        month_committed = date_obj.month
        year_committed = date_obj.year

        # Ensure time input format is HH:MM:SS
        time_committed = edited_data['time']
        if len(time_committed.split(':')) == 2:
            time_committed += ':00'

        # Read the existing CSV data
        with open(CSV_FILE_PATH, 'r', newline='') as file:
            reader = csv.DictReader(file)
            rows = list(reader)

        # Update the corresponding row with the edited data
        for row in rows:
            if row['ID'] == edited_data['id']:
                row['OFFENSE'] = edited_data['crimeType']
                row['DATE COMMITTED'] = edited_data['date']
                row['TIME COMMITTED'] = time_committed
                row['VICTIMS Age'] = edited_data['victimAge']
                row['VICTIMS Gender'] = edited_data['victimGender']
                row['SUSPECTS Age'] = edited_data['suspectAge']
                row['SUSPECTS Gender'] = edited_data['suspectGender']
                row['VICTIMS COUNT'] = edited_data['victimCount']
                row['SUSPECTS COUNT'] = edited_data['suspectCount']
                row['VEHICLE KIND'] = edited_data['vehicleKind']
                row['LONGITUDE'] = edited_data['longitude']
                row['LATITUDE'] = edited_data['latitude']
                row['RAINFALL'] = edited_data['rainfall']
                row['TMAX'] = edited_data['tmax']
                row['TMIN'] = edited_data['tmin']
                row['WIND_SPEED'] = edited_data['windSpeed']
                row['WIND_DIRECTION'] = edited_data['windDirection']
                row['BARANGAY'] = edited_data['location']

                # Update day, month, and year
                row['DAY COMMITTED'] = day_committed
                row['MONTH COMMITTED'] = month_committed
                row['YEAR COMMITTED'] = year_committed
                break

        # Write the updated data back to the CSV file
        with open(CSV_FILE_PATH, 'w', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=reader.fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        return jsonify({'message': 'Data updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Routes
@bp.route('/report')
def report():
    return render_template('report.html', current_page='report')


@bp.route('/goto_homepage')
def go_to_homepage():
    # Redirect to the homepage
    return redirect(url_for('homepage.homepage', current_page='home'))


@bp.route('/goto_webmap')
def go_to_webmap():
    # Redirect to the webmap page
    return redirect(url_for('webmap.webmap', current_page='webmap'))


@bp.route('/goto_visualization')
def go_to_report():
    # Redirect to the report page
    return redirect(url_for('visualization.visualization', current_page='visualization'))
