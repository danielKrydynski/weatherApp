const apiKey = 'dab6b154d307014a9c105fdcd5dd8d46';
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/weather';
const forecastApiUrl = 'https://api.openweathermap.org/data/2.5/forecast';

const locationElement = document.getElementById('widget-location');
const tempElement = document.getElementById('widget-temp');
const descElement = document.getElementById('widget-desc');
const iconElement = document.getElementById('widget-icon');
const forecastContainer = document.getElementById('widget-forecast');

function fetchWidgetWeatherByCoords(lat, lon) {
    Promise.all([
        fetch(`${weatherApiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`).then(r => r.json()),
        fetch(`${forecastApiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`).then(r => r.json())
    ]).then(([weatherData, forecastData]) => {
        if (weatherData.cod !== 200) {
            locationElement.textContent = 'Not found';
            tempElement.textContent = '';
            descElement.textContent = '';
            iconElement.style.display = 'none';
            return;
        }
        locationElement.textContent = weatherData.name;
        tempElement.textContent = `${Math.round(weatherData.main.temp)}°C`;
        descElement.textContent = weatherData.weather[0].description;
        iconElement.src = `http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
        iconElement.style.display = 'block';
        forecastContainer.innerHTML = '';
        for (let i = 0; i < 4 && i < forecastData.list.length; i++) {
            const item = forecastData.list[i];
            const date = new Date(item.dt * 1000);
            const hours = date.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHour = ((hours + 11) % 12 + 1) + ampm;
            const card = document.createElement('div');
            card.className = 'widget-forecast-card';
            card.innerHTML = `
                <div>${displayHour}</div>
                <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="icon">
                <div>${Math.round(item.main.temp)}°C</div>
            `;
            forecastContainer.appendChild(card);
        }
    }).catch(() => {
        locationElement.textContent = 'Error';
        tempElement.textContent = '';
        descElement.textContent = '';
        iconElement.style.display = 'none';
    });
}

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        pos => fetchWidgetWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        err => {
            locationElement.textContent = 'Location denied';
            tempElement.textContent = '';
            descElement.textContent = '';
            iconElement.style.display = 'none';
        }
    );
} else {
    locationElement.textContent = 'No geolocation';
    tempElement.textContent = '';
    descElement.textContent = '';
    iconElement.style.display = 'none';
}
