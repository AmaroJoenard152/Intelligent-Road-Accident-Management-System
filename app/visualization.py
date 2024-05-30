from flask import Flask, render_template, request
from flask import Flask, send_from_directory
from flask import Blueprint, render_template, redirect, url_for
from flask import jsonify
import pandas as pd
import json
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import calendar
import seaborn as sns
import io
import plotly.express as px
import plotly.io as pio
from plotly.subplots import make_subplots
import glob
import plotly.graph_objects as go

bp = Blueprint('visualization', __name__)

# Define the file path for the dataset
file_path = 'app/data/2019-2023.csv'


def load_data():
    # Load dataset
    df = pd.read_csv(file_path)
    return df


# Common margin, height, and width settings
common_layout = dict(
    margin=dict(l=0, r=0, t=30, b=0),
    height=400,  # Set your desired height
    width=600  # Set your desired width
)


def generate_heatmap_plot(df):
    # Step 1: No changes in column dropping
    columns_to_drop = ['RAINFALL', 'TMAX', 'TMIN', 'WIND_SPEED', 'WIND_DIRECTION', 'LONGITUDE', 'LATITUDE']
    df = df.drop(columns=columns_to_drop, axis=1)

    # Step 2: No changes in data transformation
    df['Hour'] = pd.to_datetime(df['TIME COMMITTED']).dt.hour
    df['Month'] = pd.to_datetime(df['DATE COMMITTED']).dt.month

    # Step 3: Group by hour and month to get the count of accidents
    heatmap_data = df.groupby(['Hour', 'Month']).size().unstack(fill_value=0)

    # Step 4: Plotting using Plotly
    fig = go.Figure(data=go.Heatmap(
        z=heatmap_data.values.tolist(),
        x=heatmap_data.columns,
        y=heatmap_data.index,
        colorscale='YlOrRd'
    ))

    # Step 5: Layout customization
    fig.update_layout(
        xaxis_title='Month',
        yaxis_title='Hour',
        xaxis=dict(tickmode='array', tickvals=list(range(1, 13)), ticktext=[str(i) for i in range(1, 13)]),
        yaxis=dict(tickmode='array', tickvals=list(range(24)), ticktext=[str(i) for i in range(24)]),
        **common_layout,
        coloraxis_colorbar=dict(
            title='Number of Accidents',
            titlefont=dict(size=14)
        )
    )

    # Step 6: HTML conversion
    heatmap_plot_html = fig.to_html(include_plotlyjs=False, full_html=False)
    return heatmap_plot_html


months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
month_mapping = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10,
                 'Nov': 11, 'Dec': 12}


def generate_month_plot(df):
    columns_to_drop = ['RAINFALL', 'TMAX', 'TMIN', 'WIND_SPEED', 'WIND_DIRECTION', 'LONGITUDE', 'LATITUDE']
    df = df.drop(columns=columns_to_drop, axis=1)

    df['DATE COMMITTED'] = pd.to_datetime(df['DATE COMMITTED'])
    df['Year'] = df['DATE COMMITTED'].dt.year
    df['Month'] = df['DATE COMMITTED'].dt.month_name().str.slice(stop=3)

    accidents_by_year_month = df.groupby(['Year', 'Month']).size().reset_index(name='Accidents')

    fig = go.Figure()

    for year in accidents_by_year_month['Year'].unique():
        year_data = accidents_by_year_month[accidents_by_year_month['Year'] == year]
        fig.add_trace(go.Bar(
            x=months,
            y=[year_data[year_data['Month'] == month]['Accidents'].values[0] if month in year_data['Month'].values
               else 0 for month in months],
            name=f'{year}'
        ))

    fig.update_layout(
        xaxis_title='Month',
        yaxis_title='Number of Accidents',
        barmode='group',
        xaxis=dict(tickmode='array', tickvals=list(range(0, 12)), ticktext=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                                                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']),
        **common_layout
    )

    month_plot_html = fig.to_html(include_plotlyjs=False, full_html=False)
    return month_plot_html


def generate_number_plot(df):
    columns_to_drop = ['RAINFALL', 'TMAX', 'TMIN', 'WIND_SPEED', 'WIND_DIRECTION', 'LONGITUDE', 'LATITUDE']
    df = df.drop(columns=columns_to_drop, axis=1)

    df['DATE COMMITTED'] = pd.to_datetime(df['DATE COMMITTED']).dt.strftime('%m/%d/%Y')
    df['Year'] = pd.to_datetime(df['DATE COMMITTED']).dt.year

    victims_suspects_by_year = df.groupby('Year')[['VICTIMS COUNT', 'SUSPECTS COUNT']].sum()

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=victims_suspects_by_year.index,
        y=victims_suspects_by_year['VICTIMS COUNT'],
        name='Victims',
        marker_color='#1f77b4'
    ))
    fig.add_trace(go.Bar(
        x=victims_suspects_by_year.index,
        y=victims_suspects_by_year['SUSPECTS COUNT'],
        name='Suspects',
        marker_color='#ff7f0e'
    ))

    fig.update_layout(
        xaxis_title='Year',
        yaxis_title='Count',
        barmode='group',
        xaxis=dict(tickvals=victims_suspects_by_year.index.tolist(), ticktext=victims_suspects_by_year.index.tolist()),
        **common_layout
    )

    number_plot_html = fig.to_html(include_plotlyjs=False, full_html=False)
    return number_plot_html


def generate_location_plot(df):
    columns_to_drop = ['RAINFALL', 'TMAX', 'TMIN', 'WIND_SPEED', 'WIND_DIRECTION', 'LONGITUDE', 'LATITUDE']
    df = df.drop(columns=columns_to_drop, axis=1)

    barangay_counts = df['BARANGAY'].value_counts()

    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22',
              '#17becf']

    fig = go.Figure(go.Bar(
        x=barangay_counts.index,
        y=barangay_counts.values,
        marker_color=[colors[i % len(colors)] for i in range(len(barangay_counts))],
        text=barangay_counts.values,
        textposition='auto'
    ))

    fig.update_layout(
        xaxis_title='Locations',
        yaxis_title='Number of Road Accidents',
        xaxis_tickangle=-45,
        **common_layout
    )

    location_plot_html = fig.to_html(include_plotlyjs=False, full_html=False)
    return location_plot_html


def generate_offense_plot(df):
    offenses_counts = df['OFFENSE'].value_counts()
    offenses = offenses_counts.index.tolist()
    offense_counts = offenses_counts.tolist()

    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22',
              '#17becf']

    fig = go.Figure()

    for i, (offense, count) in enumerate(zip(offenses, offense_counts)):
        color_index = i % len(colors)
        fig.add_trace(go.Bar(
            x=[offense],
            y=[count],
            hovertemplate='<b>%{x}</b><br>Occurrences: %{y}',
            marker_color=colors[color_index],
            showlegend=False,
        ))

    fig.update_layout(
        yaxis_title='Number of Occurrences',
        xaxis_title='Criminal Offense',
        xaxis=dict(
            tickmode='array',
            tickvals=[],
        ),
        hoverlabel=dict(
            font=dict(
                size=10,
            )
        ),
        **common_layout
    )

    offense_plot_html = fig.to_html(include_plotlyjs=False, full_html=False)
    return offense_plot_html


def generate_vehicle_plot(df):
    columns_to_drop = ['RAINFALL', 'TMAX', 'TMIN', 'WIND_SPEED', 'WIND_DIRECTION', 'LONGITUDE', 'LATITUDE']
    df = df.drop(columns=columns_to_drop, axis=1)

    df = df.drop('VEHICLE KIND', axis=1).join(
        df['VEHICLE KIND'].str.split(',', expand=True).stack().reset_index(level=1, drop=True).rename('VEHICLE KIND'))

    vehicle_counts = df['VEHICLE KIND'].value_counts()

    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22',
              '#17becf']

    fig = go.Figure(go.Bar(
        x=vehicle_counts.index,
        y=vehicle_counts.values,
        marker_color=colors,
        text=vehicle_counts.values,
        textposition='auto'
    ))

    fig.update_layout(
        xaxis_title='Vehicle Type',
        yaxis_title='Number of Road Accidents',
        xaxis_tickangle=-45,
        **common_layout
    )

    vehicle_plot_html = fig.to_html(include_plotlyjs=False, full_html=False)

    return vehicle_plot_html


def generate_gender_plot(df):
    df['DATE COMMITTED'] = pd.to_datetime(df['DATE COMMITTED']).dt.strftime('%m/%d/%Y')
    df['Year'] = pd.to_datetime(df['DATE COMMITTED']).dt.year

    victims_female_count = []
    victims_male_count = []
    suspects_female_count = []
    suspects_male_count = []

    years = df['Year'].unique()

    for year in years:
        df_year = df[df['Year'] == year]
        df_year['VICTIMS Gender'] = df_year['VICTIMS Gender'].map({'M': 0, 'F': 1})
        df_year['SUSPECTS Gender'] = df_year['SUSPECTS Gender'].map({'M': 0, 'F': 1})

        victims_male_count.append(len(df_year[df_year['VICTIMS Gender'] == 0]))
        victims_female_count.append(len(df_year[df_year['VICTIMS Gender'] == 1]))
        suspects_male_count.append(len(df_year[df_year['SUSPECTS Gender'] == 0]))
        suspects_female_count.append(len(df_year[df_year['SUSPECTS Gender'] == 1]))

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=years,
        y=victims_female_count,
        name='Victims Female',
        marker_color='lightblue'
    ))
    fig.add_trace(go.Bar(
        x=years,
        y=victims_male_count,
        name='Victims Male',
        marker_color='blue'
    ))
    fig.add_trace(go.Bar(
        x=years,
        y=suspects_female_count,
        name='Suspects Female',
        marker_color='yellow'
    ))
    fig.add_trace(go.Bar(
        x=years,
        y=suspects_male_count,
        name='Suspects Male',
        marker_color='orange'
    ))

    fig.update_layout(
        xaxis_title='Year',
        yaxis_title='Count',
        barmode='group',
        **common_layout
    )

    fig.update_xaxes(tickvals=years, ticktext=[str(year) for year in years])

    gender_plot_html = fig.to_html(include_plotlyjs=False, full_html=False)

    return gender_plot_html


def generate_victims_age(df):
    mean_age = df['VICTIMS Age'].mean()
    df['VICTIMS Age'].fillna(mean_age, inplace=True)

    age_groups = ['1-18', '19-30', '31-45', '46-above']
    victims_age_counts = {age_group: 0 for age_group in age_groups}

    victims_bins = pd.cut(df['VICTIMS Age'], bins=[0, 18, 30, 45, 99], labels=age_groups)
    victims_counts = victims_bins.value_counts().sort_index()
    victims_age_counts = {k: victims_age_counts.get(k, 0) + victims_counts.get(k, 0) for k in age_groups}

    fig_victims = go.Figure()
    fig_victims.add_trace(go.Pie(
        labels=age_groups,
        values=list(victims_age_counts.values()),
        name='Victims',
        hole=0.3,
    ))

    fig_victims.update_layout(
        **common_layout
    )

    victims_age_html = fig_victims.to_html(include_plotlyjs=False, full_html=False)

    return victims_age_html


def generate_suspects_age(df):
    mean_age = df['SUSPECTS Age'].mean()
    df['SUSPECTS Age'].fillna(mean_age, inplace=True)

    age_groups = ['1-18', '19-30', '31-45', '46-above']
    suspects_age_counts = {age_group: 0 for age_group in age_groups}

    suspects_bins = pd.cut(df['SUSPECTS Age'], bins=[0, 18, 30, 45, 99], labels=age_groups)
    suspects_counts = suspects_bins.value_counts().sort_index()
    suspects_age_counts = {k: suspects_age_counts.get(k, 0) + suspects_counts.get(k, 0) for k in age_groups}

    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']

    fig_suspects = go.Figure()
    fig_suspects.add_trace(go.Pie(
        labels=age_groups,
        values=list(suspects_age_counts.values()),
        name='Suspects',
        hole=0.3,
        marker=dict(colors=colors),
    ))

    fig_suspects.update_layout(
        **common_layout
    )

    suspects_age_html = fig_suspects.to_html(include_plotlyjs=False, full_html=False)

    return suspects_age_html


@bp.route('/visualization', methods=['GET', 'POST'])
def visualization():
    df = load_data()

    if request.method == 'POST':
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')

        if start_date and end_date:
            df['DATE COMMITTED'] = pd.to_datetime(df['DATE COMMITTED'])
            df = df[(df['DATE COMMITTED'] >= start_date) & (df['DATE COMMITTED'] <= end_date)]

    heatmap_plot_html = generate_heatmap_plot(df)
    month_plot_html = generate_month_plot(df)
    location_plot_html = generate_location_plot(df)
    offense_plot_html = generate_offense_plot(df)
    vehicle_plot_html = generate_vehicle_plot(df)
    number_plot_html = generate_number_plot(df)
    gender_plot_html = generate_gender_plot(df)
    victims_age_html = generate_victims_age(df)
    suspects_age_html = generate_suspects_age(df)

    return render_template('visualization.html',
                           heatmap_plot_html=heatmap_plot_html, month_plot_html=month_plot_html,
                           location_plot_html=location_plot_html, offense_plot_html=offense_plot_html,
                           vehicle_plot_html=vehicle_plot_html, number_plot_html=number_plot_html,
                           gender_plot_html=gender_plot_html, victims_age_html=victims_age_html,
                           suspects_age_html=suspects_age_html)


@bp.route('/goto_homepage')
def go_to_homepage():
    # Redirect to the homepage
    return redirect(url_for('homepage.homepage'))


@bp.route('/goto_webmap')
def go_to_webmap():
    # Redirect to the webmap page
    return redirect(url_for('webmap.webmap'))


@bp.route('/goto_report')
def go_to_report():
    # Redirect to the report page
    return redirect(url_for('report.report'))

