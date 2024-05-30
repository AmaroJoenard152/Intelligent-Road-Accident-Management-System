from flask import Blueprint, render_template, redirect, url_for
import pandas as pd
import folium
import os

bp = Blueprint('webmap', __name__)


@bp.route('/webmap')
def webmap():
    # Load your dataset
    CURRENT_DIR = os.path.dirname(__file__)
    file_path = os.path.join(CURRENT_DIR, "data", "2019-2023.csv")
    data = pd.read_csv(file_path)

    # Convert 'LATITUDE' and 'LONGITUDE' to float data type
    data['LATITUDE'] = data['LATITUDE'].astype(float)
    data['LONGITUDE'] = data['LONGITUDE'].astype(float)

    # Pass the entire dataset to the template
    accidents_data = data.to_dict(orient='records')

    # Initialize the map centered at a specific location
    my_map = folium.Map(location=[15.9753, 120.5670], zoom_start=12)

    # Add markers for all data points
    for accident in accidents_data:
        folium.Marker([float(accident['LATITUDE']), float(accident['LONGITUDE'])],
                      popup=f"<b>ID:</b> {accident['ID']}<br>"
                            f"<b>Barangay:</b> {accident['BARANGAY']}<br>"
                            f"<b>Date Committed:</b> {accident['DATE COMMITTED']}<br>").add_to(my_map)

    # Generate the prescription
    prescription = generate_prescription(data)

    # Pass the map object and accidents_data to the template
    return render_template('webmap.html', my_map=my_map, accidents_data=accidents_data, prescription=prescription)


def generate_prescription(data):
    # Group the data by Barangay and count the number of accidents
    barangay_accidents = data['BARANGAY'].value_counts().reset_index()
    barangay_accidents.columns = ['Barangay', 'Recorded number of']

    # Find the Barangays with the highest and lowest accident counts
    highest_accidents_barangay = barangay_accidents.iloc[0]
    second_highest_accidents_barangay = barangay_accidents.iloc[1]
    third_highest_accidents_barangay = barangay_accidents.iloc[2]

    # Find the top three Barangays with the lowest accident counts
    lowest_accidents_barangays = barangay_accidents.tail(3)

    # Generate the prescription string
    prescription = (f"From the past few years, the Barangay with the highest recorded number of road accidents is {highest_accidents_barangay['Barangay']} "
                    f"with {int(highest_accidents_barangay['Recorded number of'])} accidents, followed by {second_highest_accidents_barangay['Barangay']} "
                    f"with {int(second_highest_accidents_barangay['Recorded number of'])} accidents, and {third_highest_accidents_barangay['Barangay']} "
                    f"with {int(third_highest_accidents_barangay['Recorded number of'])} accidents. While the top three Barangays with the lowest recorded number of accidents "
                    f"are {', '.join([f'{row[0]} with {row[1]} accident' for row in lowest_accidents_barangays.values])}, respectively. "
                    f"It's crucial for our traffic enforcers and police officers to closely monitor the Barangays with high number of recorded accidents.")

    return prescription


@bp.route('/goto_homepage')
def go_to_homepage():
    # Redirect to the index homepage
    return redirect(url_for('homepage.homepage'))


@bp.route('/goto_visualization')
def go_to_visualization():
    # Redirect to the visualization page
    return redirect(url_for('visualization.visualization'))


@bp.route('/goto_report')
def go_to_report():
    # Redirect to the report page
    return redirect(url_for('report.report'))
