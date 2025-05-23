const destinations = [
    { name: 'Париж', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34', description: 'Город любви и света', lat: 48.8566, lng: 2.3522, continent: 'Europe', type: 'City', budget: 'Standard' },
    { name: 'Токио', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', description: 'Современность и традиции', lat: 35.6762, lng: 139.6503, continent: 'Asia', type: 'City', budget: 'Premium' },
    { name: 'Мальдивы', image: 'https://images.unsplash.com/photo-1514282401047-d79a71fac224', description: 'Райские острова', lat: 3.2028, lng: 73.2207, continent: 'Indian Ocean', type: 'Beach', budget: 'Premium' },
    { name: 'Нью-Йорк', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9', description: 'Город, который никогда не спит', lat: 40.7128, lng: -74.0060, continent: 'North America', type: 'City', budget: 'Premium' },
    { name: 'Рим', image: 'https://images.unsplash.com/photo-1552832230-c5457b1942c7', description: 'Вечный город', lat: 41.9028, lng: 12.4964, continent: 'Europe', type: 'Culture', budget: 'Standard' },
    { name: 'Бали', image: 'https://images.unsplash.com/photo-1539367628448-33c7a4f8fc3c', description: 'Остров богов', lat: -8.3405, lng: 115.0920, continent: 'Asia', type: 'Beach', budget: 'Economy' }
];

// Примерные данные отелей (заглушка для Hotelbeds API)
const hotels = {
    'Париж': [
        { id: 'PAR1', name: 'Hotel Paris', price: 150, rating: 4.5 },
        { id: 'PAR2', name: 'Luxury Paris Resort', price: 300, rating: 5.0 }
    ],
    'Токио': [
        { id: 'TOK1', name: 'Tokyo Inn', price: 200, rating: 4.0 },
        { id: 'TOK2', name: 'Shibuya Grand', price: 350, rating: 4.8 }
    ],
    'Мальдивы': [
        { id: 'MAL1', name: 'Maldives Paradise', price: 500, rating: 5.0 }
    ],
    'Нью-Йорк': [
        { id: 'NYC1', name: 'NYC Budget Hotel', price: 180, rating: 3.5 },
        { id: 'NYC2', name: 'Manhattan Elite', price: 400, rating: 4.7 }
    ],
    'Рим': [
        { id: 'ROM1', name: 'Rome Classic', price: 120, rating: 4.0 },
        { id: 'ROM2', name: 'Colosseum Suites', price: 250, rating: 4.6 }
    ],
    'Бали': [
        { id: 'BAL1', name: 'Bali Beach Hut', price: 80, rating: 3.8 },
        { id: 'BAL2', name: 'Ubud Retreat', price: 150, rating: 4.2 }
    ]
};

const elements = {
    grid: document.getElementById('destinations-grid'),
    destinationSelect: document.getElementById('destination'),
    hotelSelect: document.getElementById('hotel'),
    bookingForm: document.getElementById('booking-form'),
    continentFilter: document.getElementById('continent-filter'),
    typeFilter: document.getElementById('type-filter'),
    budgetFilter: document.getElementById('budget-filter'),
    ratingFilter: document.getElementById('rating-filter'),
    priceFilter: document.getElementById('price-filter'),
    resetFilters: document.getElementById('reset-filters'),
    map: document.getElementById('map'),
    themeToggle: document.getElementById('theme-toggle')
};

// Кэширование погодных данных
const weatherCache = {
    data: {},
    ttl: 3600000, // 1 час в миллисекундах
    get: function(key) {
        const cached = this.data[key];
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.weather;
        }
        return null;
    },
    set: function(key, weather) {
        this.data[key] = { weather, timestamp: Date.now() };
    }
};

// Кэширование данных отелей
const hotelCache = {
    data: {},
    ttl: 3600000, // 1 час в миллисекундах
    get: function(key) {
        const cached = this.data[key];
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.hotels;
        }
        return null;
    },
    set: function(key, hotels) {
        this.data[key] = { hotels, timestamp: Date.now() };
    }
};

async function fetchWeather(lat, lng) {
    const cacheKey = `${lat},${lng}`;
    const cachedWeather = weatherCache.get(cacheKey);
    if (cachedWeather) return cachedWeather;

    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}¤t=temperature_2m,weather_code`);
        const data = await response.json();
        const weather = {
            temperature: data.current.temperature_2m,
            condition: getWeatherCondition(data.current.weather_code)
        };
        weatherCache.set(cacheKey, weather);
        return weather;
    } catch (error) {
        console.error('Ошибка загрузки погоды:', error);
        return { temperature: 'N/A', condition: 'Погода недоступна', emoji: '❓' };
    }
}

function getWeatherCondition(code) {
    const conditions = {
        0: { text: 'Ясно', emoji: '☀️' },
        1: { text: 'Переменная облачность', emoji: '⛅' },
        2: { text: 'Облачно', emoji: '☁️' },
        3: { text: 'Пасмурно', emoji: '☁️' },
        45: { text: 'Туман', emoji: '🌫️' },
        61: { text: 'Дождь', emoji: '🌧️' },
        71: { text: 'Снег', emoji: '❄️' }
    };
    return conditions[code] || { text: 'Неизвестно', emoji: '❓' };
}

async function fetchHotels(destination) {
    const cacheKey = destination;
    const cachedHotels = hotelCache.get(cacheKey);
    if (cachedHotels) return cachedHotels;

    // Заглушка для Hotelbeds API
    const hotelsData = hotels[destination] || [];
    hotelCache.set(cacheKey, hotelsData);
    return hotelsData;
}

async function createCard(dest, index, map, markers) {
    const weather = await fetchWeather(dest.lat, dest.lng);
    const hotels = await fetchHotels(dest.name);
    const hotel = hotels[0] || { name: 'Отель не найден', price: 'N/A', rating: 'N/A' };
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img src="${dest.image}" alt="${dest.name}" loading="lazy">
        <div class="card-content">
            <h3>${dest.name}</h3>
            <p>${dest.description}</p>
            <p><b>Бюджет:</b> ${dest.budget === 'Economy' ? '$' : dest.budget === 'Standard' ? '$$' : '$$$'}</p>
            <p><b>Погода:</b> ${weather.emoji} ${weather.temperature}°C, ${weather.condition}</p>
            <p><b>Отель:</b> ${hotel.name} ($${hotel.price}/ночь, ★${hotel.rating})</p>
        </div>
    `;
    card.addEventListener('click', () => {
        map.setView([dest.lat, dest.lng], 5);
        markers[index].openPopup();
    });
    return card;
}

function populateDestinationSelect() {
    destinations.forEach(dest => {
        const option = document.createElement('option');
        option.value = dest.name;
        option.textContent = dest.name;
        elements.destinationSelect.appendChild(option);
    });

    elements.destinationSelect.addEventListener('change', async () => {
        const selectedDestination = elements.destinationSelect.value;
        elements.hotelSelect.innerHTML = '<option value="" disabled selected>Выберите отель</option>';
        if (selectedDestination) {
            const hotels = await fetchHotels(selectedDestination);
            hotels.forEach(hotel => {
                const option = document.createElement('option');
                option.value = hotel.id;
                option.textContent = `${hotel.name} ($${hotel.price}/ночь, ★${hotel.rating})`;
                elements.hotelSelect.appendChild(option);
            });
        }
    });
}

async function initMap() {
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const markers = await Promise.all(destinations.map(async dest => {
        const weather = await fetchWeather(dest.lat, dest.lng);
        const hotels = await fetchHotels(dest.name);
        const hotel = hotels[0] || { name: 'Отель не найден', price: 'N/A', rating: 'N/A' };
        return L.marker([dest.lat, dest.lng])
            .addTo(map)
            .bindPopup(`<b>${dest.name}</b><br>${dest.description}<br>Тип: ${dest.type}<br>Бюджет: ${dest.budget}<br>Погода: ${weather.emoji} ${weather.temperature}°C, ${weather.condition}<br>Отель: ${hotel.name} ($${hotel.price}/ночь, ★${hotel.rating})`);
    }));

    elements.map.classList.add('loaded');

    async function updateMapAndCards() {
        const continent = elements.continentFilter.value;
        const type = elements.typeFilter.value;
        const budget = elements.budgetFilter.value;
        const rating = elements.ratingFilter.value;
        const price = elements.priceFilter.value;

        // Очистить текущие карточки
        elements.grid.innerHTML = '';

        const filtered = [];
        for (let i = 0; i < destinations.length; i++) {
            const dest = destinations[i];
            const hotels = await fetchHotels(dest.name);
            const continentMatch = continent === 'all' || dest.continent === continent;
            const typeMatch = type === 'all' || dest.type === type;
            const budgetMatch = budget === 'all' || dest.budget === budget;
            const ratingMatch = rating === 'all' || hotels.some(hotel => hotel.rating >= parseFloat(rating));
            const priceMatch = price === 'all' || hotels.some(hotel => hotel.price <= parseFloat(price));

            if (continentMatch && typeMatch && budgetMatch && ratingMatch && priceMatch) {
                filtered.push(dest);
                markers[i].addTo(map);
                const card = await createCard(dest, i, map, markers);
                elements.grid.appendChild(card);
            } else {
                map.removeLayer(markers[i]);
            }
        }

        // Анимация новых карточек
        animateCards();

        if (filtered.length) {
            const avgLat = filtered.reduce((sum, dest) => sum + dest.lat, 0) / filtered.length;
            const avgLng = filtered.reduce((sum, dest) => sum + dest.lng, 0) / filtered.length;
            map.setView([avgLat, avgLng], filtered.length === 1 ? 5 : 3);
        } else {
            map.setView([20, 0], 2);
        }
    }

    elements.continentFilter.addEventListener('change', updateMapAndCards);
    elements.typeFilter.addEventListener('change', updateMapAndCards);
    elements.budgetFilter.addEventListener('change', updateMapAndCards);
    elements.ratingFilter.addEventListener('change', updateMapAndCards);
    elements.priceFilter.addEventListener('change', updateMapAndCards);
    elements.resetFilters.addEventListener('click', () => {
        elements.continentFilter.value = 'all';
        elements.typeFilter.value = 'all';
        elements.budgetFilter.value = 'all';
        elements.ratingFilter.value = 'all';
        elements.priceFilter.value = 'all';
        updateMapAndCards();
    });

    return { map, markers };
}

function handleFormSubmit(e) {
    e.preventDefault();
    const formData = {
        name: elements.bookingForm.name.value,
        email: elements.bookingForm.email.value,
        destination: elements.bookingForm.destination.value,
        hotel: elements.bookingForm.hotel.value,
        date: elements.bookingForm.date.value
    };
    if (Object.values(formData).every(val => val)) {
        const selectedHotel = hotels[formData.destination]?.find(h => h.id === formData.hotel);
        const hotelName = selectedHotel ? selectedHotel.name : 'Не выбран';
        alert(`Заявка отправлена!\nИмя: ${formData.name}\nEmail: ${formData.email}\nНаправление: ${formData.destination}\nОтель: ${hotelName}\nДата: ${formData.date}`);
        elements.bookingForm.reset();
        elements.hotelSelect.innerHTML = '<option value="" disabled selected>Выберите отель</option>';
    } else {
        alert('Пожалуйста, заполните все поля');
    }
}

// Анимация появления карточек при прокрутке
function animateCards() {
    const cards = document.querySelectorAll('.card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    cards.forEach(card => observer.observe(card));
}

// Управление темной темой
function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
        document.body.classList.add('dark-theme');
        elements.themeToggle.textContent = '🌙';
    } else {
        elements.themeToggle.textContent = '☀️';
    }

    elements.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDarkNow = document.body.classList.contains('dark-theme');
        elements.themeToggle.textContent = isDarkNow ? '🌙' : '☀️';
        localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
    });
}

async function init() {
    const { map, markers } = await initMap();
    for (let i = 0; i < destinations.length; i++) {
        elements.grid.appendChild(await createCard(destinations[i], i, map, markers));
    }
    populateDestinationSelect();
    elements.bookingForm.addEventListener('submit', handleFormSubmit);
    animateCards();
    initTheme();
}

document.addEventListener('DOMContentLoaded', init);
