/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true
}).setView([ibk.lat, ibk.lng], 11);

// thematische Layer
let themaLayer = {
    stations: L.featureGroup()
}

// Hintergrundlayer
let layerControl = L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://lawinen.report">CC BY avalanche.report</a>`
    }).addTo(map),
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery")
}, {
    "Wetterstationen": themaLayer.stations.addTo(map)
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// Vienna Sightseeing Haltestellen
async function showStations(url) {
    let response = await fetch(url);
    let jsondata = await response.json();

    // Wetterstationen mit Icons und Popups implementieren 
    L.geoJSON(jsondata, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                // icon von https://mapicons.mapsmarker.com/markers/restaurants-bars/wi-fi/?custom_color=3d9970
                icon: L.icon({
                    iconUrl: `icons/icon.png`,
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37],
                })
            }
            );
        },
        onEachFeature: function (feature, layer) {
            let prop = feature.properties;
            layer.bindPopup(`
            <h4>${prop.name} ${feature.geometry.coordinates[2]} müA</h4>
            <p> Lufttemperatur: ${prop.LT || "Kein Wert"} °C <br>
            Relative Luftfeuchte: ${prop.RH || "Kein Wert"} % <br>
            Windgeschwindigkeit: ${prop.WG || "Kein Wert"} km/h <br>
            Schneehöhe: ${prop.HS || "Kein Wert"} cm
            </p>
            `)
        }
    }).addTo(themaLayer.stations);

}
showStations("https://static.avalanche.report/weather_stations/stations.geojson");
