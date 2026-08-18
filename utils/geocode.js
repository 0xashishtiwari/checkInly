const geocode = async (location, country) => {
    const query = `${location}, ${country}`;

    const url = new URL("https://photon.komoot.io/api/");

    url.searchParams.set("q", query);
    url.searchParams.set("limit", "1");

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Photon API request failed with status ${response.status}`
        );
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
        return null;
    }

    const coordinates = data.features[0].geometry.coordinates;

    return {
        type: "Point",
        coordinates: [
            Number(coordinates[0]),
            Number(coordinates[1])
        ]
    };
};

module.exports = geocode;