/* Wisconsin Supreme Court Election Margins Map */

// Declare map variable in global scope
var map;

// Function to instantiate the Leaflet map
function createMap(){
    // Create map centered on Wisconsin
    map = L.map('map', {
        center: [44.5, -89.5],  // Wisconsin center
        zoom: 7
    });

    // Add Stamen Toner Lite tileset
    L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://www.stamen.com/">Stamen Design</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 20
    }).addTo(map);

    // Call getData to load WI Supreme Court data
    getData();
};

// Function to attach popups to each county
function onEachFeature(feature, layer) {
    // Build HTML string showing all election margins
    var popupContent = "";
    if (feature.properties) {
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

// Function to retrieve GeoJSON data and place it on the map
function getData(){
    // Fetch WI Supreme Court GeoJSON
    fetch("data/scowis_margins.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            // Circle marker styling
            var geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#E89C5C",  // Warm orange from palette
                color: "#000",          // Black stroke
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            
            // Create Leaflet GeoJSON layer
            L.geoJson(json, {
                pointToLayer: function(feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                onEachFeature: onEachFeature
            }).addTo(map);
        });
};

// Initialize map once DOM is loaded
document.addEventListener('DOMContentLoaded', createMap);