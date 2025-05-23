const destinations = [
    { name: 'Мальдивы', image: 'https://images.unsplash.com/photo-1514282401047-d79a71fac224', description: 'Райские острова', lat: 3.2028, lng: 73.2207, continent: 'Indian Ocean', type: 'Beach', budget: 'Premium' },
    { name: 'Бали', image: 'https://images.unsplash.com/photo-1539367628448-33c7a4f8fc3c', description: 'Остров богов', lat: -8.3405, lng: 115.0920, continent: 'Asia', type: 'Beach', budget: 'Economy' },
    { name: 'Канары', image: 'https://images.unsplash.com/photo-1596434510089-92d3e67001b2', description: 'Вулканические пляжи', lat: 28.2916, lng: -16.6291, continent: 'Atlantic Ocean', type: 'Beach', budget: 'Standard' },
    { name: 'Гавайи', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', description: 'Тропический рай', lat: 19.8968, lng: -155.5828, continent: 'Atlantic Ocean', type: 'Luxury', budget: 'Premium' },
    { name: 'Багамы', image: 'https://images.unsplash.com/photo-1501466044931-62695aada8e9', description: 'Кристальные воды', lat: 25.0343, lng: -77.3963, continent: 'Atlantic Ocean', type: 'Luxury', budget: 'Premium' }
];

// Примерные данные отелей (заглушка для Hotelbeds API)
const hotels = {
    'Мальдивы': [
        { id: 'MAL1', name: 'Maldives Paradise', price: 500, rating: 5.0 },
        { id: 'MAL2', name: 'Ocean Villa', price: 350, rating: 4.8 }
    ],
    'Бали': [
        { id: 'BAL1', name: 'Bali Beach Hut', price: 80, rating: 3.8 },
        { id: 'BAL2', name: 'Ubud Retreat', price: 150, rating: 4.2 }
    ],
    'Канары': [
        { id: 'CAN1', name: 'Tenerife Resort', price: 200, rating: 4.3 },
        { id: 'CAN2', name: 'Gran Canaria Inn', price: 120, rating: 4.0 }
    ],
    'Гавайи': [
        { id: 'HAW1', name: 'Hawaii Luxury', price: 400, rating: 4.9 },
        { id: 'HAW2', name: 'Maui Beach Hotel', price: 250, rating: 4.5 }
    ],
    'Багамы': [
        { id: 'BAH1', name: 'Nassau Grand', price: 300, rating: 4.7 },
        { id: 'BAH2', name: 'Bahamas Coraltip:mediawiki/images/thumb/a/aa/Palm_tree_icon_02.svg/20px-Palm_tree_icon_02.svg.png', { id: 'BAH2', name: 'Paradise Island Resort', price: 350, rating: 4.8 }
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
    ttl: 3600000, // 1 час
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
    ttl: 3600000, // 1 час
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
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`);
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
        <span class="card-label">${dest.type}</span>
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
    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map);

    const palmIcon = L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Palm_tree_icon_02.svg/20px-Palm_tree_icon_02.svg.png',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });

    const markers = await Promise.all(destinations.map(async dest => {
        const weather = await fetchWeather(dest.lat, dest.lng);
        const hotels = await fetchHotels(dest.name);
        const hotel = hotels[0] || { name: 'Отель не найден', price: 'N/A', rating: 'N/A' };
        return L.marker([dest.lat, dest.lng], { icon: palmIcon })
            .addTo(map)
            .bindPopup(`
                <div style="background: linear-gradient(45deg, #00b4d8, #48cae4); color: white; padding: 10px; border-radius: 10px;">
                    <b>${dest.name}</b><br>
                    ${dest.description}<br>
                    Тип: ${dest.type}<br>
                    Бюджет: ${dest.budget}<br>
                    Погода: ${weather.emoji} ${weather.temperature}°C, ${weather.condition}<br>
                    Отель: ${hotel.name} ($${hotel.price}/ночь, ★${hotel.rating})
                </div>
            `);
    }));

    elements.map.classList.add('loaded');

    async function updateMapAndCards() {
        const continent = elements.continentFilter.value;
        const type = elements.typeFilter.value;
        const budget = elements.budgetFilter.value;
        const rating = elements.ratingFilter.value;
        const price = elements.priceFilter.value;

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

        animateCards();

        if (filtered.length) {
            const avgLat = filtered.reduce((sum, dest) => sum + dest.lat, 0) / filtered.length;
            const avgLng = filtered.reduce((sum, dest) => sum + dest.lng, 0) / filtered.length;
            map.setView([avgLat, avgLng], filtered.length === 1 ? 5 : 3);
        } else {
            map.setView([0, 0], 2);
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

// Анимация появления карточек
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
    }

    elements.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDarkNow = document.body.classList.contains('dark-theme');
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
