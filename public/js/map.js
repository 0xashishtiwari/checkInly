

const coordingates = window.listingCoordinates;


if(coordingates && coordingates.length === 2) {
    const [lng, lat] = coordingates;
    const map = L.map('map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([lat, lng]).addTo(map)
        .bindPopup(window.listingTitle)
        .openPopup();
}