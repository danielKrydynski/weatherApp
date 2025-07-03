const apiKey = 'dab6b154d307014a9c105fdcd5dd8d46';
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/weather';
const forecastApiUrl = 'https://api.openweathermap.org/data/2.5/forecast';

const locationInput = document.getElementById('locationInput');
const searchButton = document.getElementById('searchButton');
const geoButton = document.getElementById('geoButton');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const FahrenheitElement = document.getElementById('Fahrenheit');
const iconElement = document.getElementById("weather-icon");
const saveFavoriteButton = document.getElementById('saveFavorite');
const favoritesList = document.getElementById('favorites-list');
// On page load: load favorites and try to show current location weather
window.addEventListener('DOMContentLoaded', () => {
    renderFavorites();
    // Try to get current location weather on load
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            (error) => {
                // If denied or failed, do nothing (UI remains ready for manual search)
            }
        );
    }
});

// Save as Favorite button event
saveFavoriteButton.addEventListener('click', () => {
    const city = locationInput.value.trim() || locationElement.textContent.trim();
    if (!city) return;
    let favorites = JSON.parse(localStorage.getItem('weatherFavorites') || '[]');
    if (!favorites.includes(city)) {
        favorites.push(city);
        localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
        renderFavorites();
    }
});

// Render favorites list
function renderFavorites() {
    let favorites = JSON.parse(localStorage.getItem('weatherFavorites') || '[]');
    favoritesList.innerHTML = '';
    favorites.forEach(city => {
        const favDiv = document.createElement('div');
        favDiv.className = 'favorite-item';
        favDiv.innerHTML = `
            <span class="fav-city" style="cursor:pointer;">${city}</span>
            <button class="remove-fav" title="Remove">&times;</button>
        `;
        favDiv.querySelector('.fav-city').onclick = () => {
            locationInput.value = city;
            fetchWeather(city);
        };
        favDiv.querySelector('.remove-fav').onclick = () => {
            favorites = favorites.filter(fav => fav !== city);
            localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
            renderFavorites();
        };
        favoritesList.appendChild(favDiv);
    });
}
// Geolocation button event
geoButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherByCoords(lat, lon);
        }, (error) => {
            alert('Unable to retrieve your location.');
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }
});

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        // Step 1: Get current weather
        const weatherUrl = `${weatherApiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        if (weatherData.cod !== 200) {
            alert('Location not found!');
            return;
        }
        // Step 2: Get 5-day/3-hour forecast
        const forecastUrl = `${forecastApiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const forecastRes = await fetch(forecastUrl);
        const forecastData = await forecastRes.json();
        // Step 3: Display current weather
        locationElement.textContent = weatherData.name;
        temperatureElement.textContent = `${Math.round(weatherData.main.temp)}°C`;
        descriptionElement.textContent = weatherData.weather[0].description;
        const fahrenheit = Math.round(weatherData.main.temp * 9 / 5 + 32);
        FahrenheitElement.textContent = `${fahrenheit}°F`;
        const iconCode = weatherData.weather[0].icon;
        const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
        iconElement.src = iconUrl;
        iconElement.style.display = "block";
        // Step 4: Render forecasts
        renderHourlyForecast(forecastData.list);
        renderDailyForecast(forecastData.list);
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

searchButton.addEventListener('click', () => {
    const location = locationInput.value;
    if (location) {
        fetchWeather(location);
    }
});

/**
 * Fetches the weather data for a given location and displays it in the UI.
 * @param {string} location - The location to fetch weather data for.
 */
async function fetchWeather(location) {
    try {
        // Step 1: Get current weather
        const weatherUrl = `${weatherApiUrl}?q=${location}&appid=${apiKey}&units=metric`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        if (weatherData.cod !== 200) {
            alert('Location not found!');
            return;
        }
        // Step 2: Get 5-day/3-hour forecast
        const forecastUrl = `${forecastApiUrl}?q=${location}&appid=${apiKey}&units=metric`;
        const forecastRes = await fetch(forecastUrl);
        const forecastData = await forecastRes.json();
        // Step 3: Display current weather
        locationElement.textContent = weatherData.name;
        temperatureElement.textContent = `${Math.round(weatherData.main.temp)}°C`;
        descriptionElement.textContent = weatherData.weather[0].description;
        const fahrenheit = Math.round(weatherData.main.temp * 9 / 5 + 32);
        FahrenheitElement.textContent = `${fahrenheit}°F`;
        const iconCode = weatherData.weather[0].icon;
        const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
        iconElement.src = iconUrl;
        iconElement.style.display = "block";
        // Step 4: Render forecasts
        renderHourlyForecast(forecastData.list);
        renderDailyForecast(forecastData.list);
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

// Render hourly forecast cards (next 8 periods, 3-hourly)
function renderHourlyForecast(list) {
    const hourlyCards = document.getElementById('hourly-cards');
    hourlyCards.innerHTML = '';
    if (!list) {
        console.warn('No forecast data to render');
        return;
    }
    for (let i = 0; i < 8 && i < list.length; i++) {
        const hour = list[i];
        const date = new Date(hour.dt * 1000);
        const hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHour = ((hours + 11) % 12 + 1) + ampm;
        const iconUrl = `http://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png`;
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="time">${displayHour}</div>
            <img src="${iconUrl}" alt="icon">
            <div class="temp">${Math.round(hour.main.temp)}°C</div>
            <div>${hour.weather[0].main}</div>
        `;
        hourlyCards.appendChild(card);
    }
}

// Render daily forecast cards (next 5 days, using midday values)
function renderDailyForecast(list) {
    const dailyCards = document.getElementById('daily-cards');
    dailyCards.innerHTML = '';
    if (!list) {
        console.warn('No forecast data to render');
        return;
    }
    // Group by day
    const days = {};
    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString();
        if (!days[day]) days[day] = [];
        days[day].push(item);
    });
    const dayKeys = Object.keys(days).slice(0, 5); // Next 5 days
    dayKeys.forEach(dayKey => {
        const dayItems = days[dayKey];
        // Pick the forecast closest to midday (12:00)
        let midday = dayItems.reduce((prev, curr) => {
            const prevHour = new Date(prev.dt * 1000).getHours();
            const currHour = new Date(curr.dt * 1000).getHours();
            return Math.abs(currHour - 12) < Math.abs(prevHour - 12) ? curr : prev;
        });
        const date = new Date(midday.dt * 1000);
        const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
        const iconUrl = `http://openweathermap.org/img/wn/${midday.weather[0].icon}@2x.png`;
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="date">${dayName}</div>
            <img src="${iconUrl}" alt="icon">
            <div class="temp">${Math.round(midday.main.temp)}°C</div>
            <div>${midday.weather[0].main}</div>
        `;
        dailyCards.appendChild(card);
    });
}

// Use the dark mode toggle button from the HTML
const darkModeToggle = document.getElementById('darkModeToggle');

// Set theme from localStorage
function setThemeFromStorage() {
    const theme = localStorage.getItem('weatherTheme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.innerHTML = '🌙';
    }
}
setThemeFromStorage();

darkModeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('weatherTheme', isDark ? 'dark' : 'light');
    darkModeToggle.innerHTML = isDark ? '☀️' : '🌙';
});
