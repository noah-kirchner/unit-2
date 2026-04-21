/* Example from Leaflet Quick Start Guide */

// L.map(): Creates a new Leaflet map instance inside the HTML element with id 'map'
// .setView(): Sets the initial geographic center [lat, lng] and zoom level of the map
var map = L.map('map').setView([51.505, -0.09], 13);

// L.tileLayer(): Creates a tile layer from a URL template with {z}/{x}/{y} zoom/coordinate variables
// .addTo(): Inherited from Layer class - adds this layer to the specified map instance
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// L.marker(): Creates a marker at the specified [lat, lng] coordinates
var marker = L.marker([51.5, -0.09]).addTo(map);

// L.circle(): Creates a circle at [lat, lng] with specified radius in meters and style options
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

// L.polygon(): Creates a polygon from an array of [lat, lng] coordinate pairs
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

// .bindPopup(): Binds a popup with HTML content to a layer, shown on click
// .openPopup(): Immediately opens the bound popup on page load
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

// L.popup(): Creates a standalone popup object not bound to a specific layer
// .setLatLng(): Sets the geographic position of the popup
// .setContent(): Sets the HTML content displayed inside the popup
// .openOn(): Adds the popup to the map, closing any previously opened popup
var popup = L.popup()
    .setLatLng([51.513, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);

var popup = L.popup();

// Event handler function that displays click coordinates in a popup
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)        // e.latlng: coordinates of the click event
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

// .on(): Attaches an event listener to the map - fires onMapClick whenever map is clicked
map.on('click', onMapClick);