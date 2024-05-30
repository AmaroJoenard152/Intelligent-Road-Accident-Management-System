// Function to change content based on dropdown selection
function changeContent() {
    var dropdown = document.getElementById("dropdown-menu");
    var selectedValue = dropdown.value;
    var contentContainers = document.querySelectorAll(".map-container");

    // Hide all content containers
    contentContainers.forEach(function(container) {
      container.style.display = "none";
    });

    // Show the selected content container
    var selectedContainer = document.getElementById(selectedValue);
    if (selectedContainer) {
      selectedContainer.style.display = "block";
    }
  }

  // Ensure only the default map is visible on page load
  document.addEventListener("DOMContentLoaded", function() {
    var defaultContainer = document.getElementById("urdaneta-map");
    var otherContainers = document.querySelectorAll(".map-container:not(#urdaneta-map)");
    var contentContainer = document.getElementById("content-container");

    // Hide content container initially
    contentContainer.style.visibility = "visible";

    // Hide other containers
    otherContainers.forEach(function(container) {
      container.style.display = "none";
    });

    // Show the default container
    if (defaultContainer) {
      defaultContainer.style.display = "block";
    }
  });

document.getElementById('city').addEventListener('input', function () {
  var city = this.value;
  getWeather(city);
});

async function getWeather() {
  try {
    var city = document.getElementById('city').value;
    console.log('Şəhər adı:', city);

    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        q: city,
        appid: '54a57bc234ad752a4f59e59cd372201d',
        units: 'metric'
      },
    });
    const currentTemperature = response.data.list[0].main.temp;

    document.querySelector('.weather-temp').textContent = Math.round(currentTemperature) + '°';

    const forecastData = response.data.list;
    const todayDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' });

    const dailyForecast = {};
    forecastData.forEach((data) => {
      const forecastDate = new Date(data.dt * 1000);
      const day = forecastDate.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = forecastDate.toLocaleDateString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' });

      if (!dailyForecast[fullDate]) {
        dailyForecast[fullDate] = {
          dayName: fullDate === todayDate ? 'Today' : day,
          minTemp: data.main.temp_min,
          maxTemp: data.main.temp_max,
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          // rain: data.rain ? data.rain['3h'] : 0,
          windDirection: data.wind.deg,
          icon: data.weather[0].icon,
        };
      } else {
        dailyForecast[fullDate].minTemp = Math.min(dailyForecast[fullDate].minTemp, data.main.temp_min);
        dailyForecast[fullDate].maxTemp = Math.max(dailyForecast[fullDate].maxTemp, data.main.temp_max);
      }
    });

    document.querySelector('.date-dayname').textContent = 'Today';

    const date = new Date().toUTCString();
    const extractedDateTime = date.slice(5, 16);
    document.querySelector('.date-day').textContent = extractedDateTime.toLocaleString('en-US');

    const currentWeatherIconCode = dailyForecast[todayDate].icon;
    const weatherIconElement = document.querySelector('.weather-icon');
    weatherIconElement.innerHTML = getWeatherIcon(currentWeatherIconCode);

    document.querySelector('.location').textContent = response.data.city.name;
    document.querySelector('.weather-desc').textContent = dailyForecast[todayDate].description.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    document.querySelector('.humidity .value').textContent = dailyForecast[todayDate].humidity + ' %';
    document.querySelector('.wind .value').textContent = dailyForecast[todayDate].windSpeed + ' km/s';
    document.querySelector('.wind-direction .value').textContent = getWindDirection(dailyForecast[todayDate].windDirection);
    // document.querySelector('.rain .value').textContent = calculateRainPercentage(dailyForecast[todayDate].rain);

    const dayElements = document.querySelectorAll('.day-name');
    const tempElements = document.querySelectorAll('.day-temp');
    const iconElements = document.querySelectorAll('.day-icon');

    const forecastKeys = Object.keys(dailyForecast);
    dayElements.forEach((dayElement, index) => {
      const key = forecastKeys[index];
      const data = dailyForecast[key];
      dayElement.textContent = data.dayName;
      tempElements[index].textContent = `${Math.round(data.minTemp)}º/${Math.round(data.maxTemp)}º`;
      iconElements[index].innerHTML = getWeatherIcon(data.icon);
    });

  } catch (error) {
    console.error('Məlumat alınarkən səhv baş verdi:', error.message);
  }
}
function getWindDirection(degrees) {
  const directions = [
    { name: 'N', min: 348.75, max: 360 },
    { name: 'N', min: 0, max: 11.25 },
    { name: 'NNE', min: 11.25, max: 33.75 },
    { name: 'NE', min: 33.75, max: 56.25 },
    { name: 'ENE', min: 56.25, max: 78.75 },
    { name: 'E', min: 78.75, max: 101.25 },
    { name: 'ESE', min: 101.25, max: 123.75 },
    { name: 'SE', min: 123.75, max: 146.25 },
    { name: 'SSE', min: 146.25, max: 168.75 },
    { name: 'S', min: 168.75, max: 191.25 },
    { name: 'SSW', min: 191.25, max: 213.75 },
    { name: 'SW', min: 213.75, max: 236.25 },
    { name: 'WSW', min: 236.25, max: 258.75 },
    { name: 'W', min: 258.75, max: 281.25 },
    { name: 'WNW', min: 281.25, max: 303.75 },
    { name: 'NW', min: 303.75, max: 326.25 },
    { name: 'NNW', min: 326.25, max: 348.75 }
  ];
  for (const direction of directions) {
    if (degrees >= direction.min && degrees < direction.max) {
      return `${direction.name} (${degrees}°)`;
    }
  }
  return `${degrees}°`; // Fallback in case of an error
}
function calculateRainPercentage(rainAmount) {
  // Adjust this threshold based on your preference
  const threshold = 0.1; // If rain amount is greater than 0.1 mm, consider it as a chance of rain
  const chanceOfRain = rainAmount > threshold ? 100 : 0; // Convert rain amount to percentage
  return chanceOfRain + ' %';
}
function getWeatherIcon(iconCode) {
  const iconBaseUrl = 'https://openweathermap.org/img/wn/';
  const iconSize = '@2x.png';
  return `<img src="${iconBaseUrl}${iconCode}${iconSize}" alt="Weather Icon">`;
}

document.addEventListener("DOMContentLoaded", function () {
  getWeather();
  setInterval(getWeather, 1800000);
});

function showPrescription() {
  var prescriptionContent = document.querySelector('.prescription');
  if (prescriptionContent) {
    document.getElementById('prescriptionContent').innerHTML = prescriptionContent.innerHTML;
    document.getElementById('prescriptionModal').classList.add('show');
    document.getElementById('overlay').style.display = 'block';
  } else {
    console.error('Prescription content not found.');
  }
}

function closePrescription() {
  document.getElementById('prescriptionModal').classList.remove('show');
  document.getElementById('overlay').style.display = 'none';
}