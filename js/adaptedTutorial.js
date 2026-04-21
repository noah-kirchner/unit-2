/* Map of GeoJSON data from MegaCities.geojson */

// Declare map variable in global scope so both functions can access it
var map;

// Function to instantiate the Leaflet map
function createMap(){
    // Create map instance centered on world view
    map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    // Add OpenStreetMap tile layer as basemap
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    // Call getData to load and display MegaCities data
    getData();
};

// Function to attach popups to each mapped feature
function onEachFeature(feature, layer) {
    // Build HTML string by looping through all feature properties
    var popupContent = "";
    if (feature.properties) {
        // Loop adds each property name and value as a paragraph element
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        // Bind completed HTML string as popup to the layer
        layer.bindPopup(popupContent);
    };
};

// Function to retrieve GeoJSON data via AJAX and place it on the map
function getData(){
    // Fetch MegaCities GeoJSON file from data folder
    fetch("data/MegaCities.geojson")
        .then(function(response){
            return response.json();         // Convert raw response to usable JSON
        })
        .then(function(json){
            // Define circle marker styling options
            var geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            // Create Leaflet GeoJSON layer with circle markers and popups
            L.geoJson(json, {
                // pointToLayer: converts each GeoJSON point to a styled circle marker
                pointToLayer: function(feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                // onEachFeature: binds a popup to each feature showing all properties
                onEachFeature: onEachFeature
            }).addTo(map);
        });
};

// Initialize map once DOM is fully loaded
document.addEventListener('DOMContentLoaded', createMap);