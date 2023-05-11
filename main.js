/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true,
}).setView([ibk.lat, ibk.lng], 11);

// thematische Layer
let themaLayer = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    windspeed: L.featureGroup()
}

// Hintergrundlayer
let layerControl = L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://lawinen.report">CC BY avalanche.report</a>`,
        maxZoom: 12
    }).addTo(map),
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery")
}, {
    "Wetterstationen": themaLayer.stations,
    "Temperatur": themaLayer.temperature,
    "Windgeschwindigkeit": themaLayer.windspeed.addTo(map)
}).addTo(map);

layerControl.expand();

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

function getColor(value, ramp) {
    for (let rule of ramp) {
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
}

// Wetterstationen mit Icons und Popups implementieren 
function writeStationLayer(jsondata) {
    L.geoJSON(jsondata, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                // icon von https://mapicons.mapsmarker.com/markers/restaurants-bars/wi-fi/?custom_color=3d9970
                icon: L.icon({
                    iconUrl: `icons/icon.png`,
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37],
                })
            });
        },
        onEachFeature: function (feature, layer) {
            let prop = feature.properties;
            let pointInTime = new Date(prop.date);
            layer.bindPopup(`
            <h4>${prop.name} ${feature.geometry.coordinates[2]} müA</h4>
            <ul> 
                <li> Lufttemperatur: ${prop.LT || "-"} °C </li> 
                <li> Relative Luftfeuchte: ${prop.RH || "-"} % </li>
                <li> Windgeschwindigkeit: ${prop.WG ? prop.WG.toFixed(1) : "-"} km/h </li>
                <li> Schneehöhe: ${prop.HS || "-"} cm </li>
            </ul>
            <span>${pointInTime.toLocaleString()}</span>
            `)
        }
    }).addTo(themaLayer.stations);
}

function writeTemperatureLayer(jsondata) {
    L.geoJSON(jsondata, {
        filter: function(feature) {
            if (feature.properties.LT > -50 && feature.properties.LT < 50) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.LT, COLORS.temperature);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color: ${color}">${feature.properties.LT.toFixed(1)}</span>`
                })
            });
        },        
    }).addTo(themaLayer.temperature);
}

function writeWindspeedLayer(jsondata) {
    L.geoJSON(jsondata, {
        filter: function(feature) {
            if (feature.properties.WG > 0) {
                return true;
            }
        }, 
        pointToLayer: function(feature, latlng) {
            let windKMH = feature.properties.WG
            let color = getColor(windKMH, COLORS.windspeed);
            
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color: ${color}">${windKMH.toFixed(1)}</span>`
                })
            })
        }
    }).addTo(themaLayer.windspeed);
}

// Vienna Sightseeing Haltestellen - 
async function loadStations(url) {
    let response = await fetch(url);
    let jsondata = await response.json();
    writeStationLayer(jsondata);
    writeTemperatureLayer(jsondata);
    writeWindspeedLayer(jsondata)
}
loadStations("https://static.avalanche.report/weather_stations/stations.geojson");
