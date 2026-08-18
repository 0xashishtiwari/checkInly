const searchListings = window.searchListings || [];
const USD_TO_INR = 83;

const toInr = (usdValue) =>
    Math.round(Number(usdValue || 0) * USD_TO_INR);

const map = L.map("search-map");

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const markers = [];

searchListings.forEach((listing) => {
    if (
        !Array.isArray(listing.coordinates) ||
        listing.coordinates.length !== 2
    ) {
        return;
    }

    const [longitude, latitude] = listing.coordinates;

    const marker = L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(`
            <strong>${listing.title}</strong><br>
            ₹${toInr(listing.price).toLocaleString("en-IN")}/night<br>
            ${listing.location}, ${listing.country}<br><br>
            <a href="/listings/${listing.id}">
                View Property
            </a>
        `);

    markers.push(marker);
});


/*
 * Adjust map according to number/location of listings
 */

if (markers.length === 1) {

    // One listing → zoom in closely
    map.setView(
        markers[0].getLatLng(),
        13
    );

} else if (markers.length > 1) {

    // Multiple listings → fit all markers
    const group = L.featureGroup(markers);

    map.fitBounds(group.getBounds(), {
        padding: [50, 50],
        maxZoom: 12
    });

} else {

    // No listings with coordinates
    map.setView(
        [20.5937, 78.9629],
        4
    );
}