/* Example from Leaflet GeoJSON Tutorial */

// L.map(): Creates map instance in #map div
// .setView(): Centers map on Colorado at zoom level 4
var map = L.map('map').setView([39.74, -104.99], 4);

// L.tileLayer(): Loads OpenStreetMap tiles using {z}/{x}/{y} URL variables
// .addTo(): Adds tile layer to map instance
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Define a GeoJSON Feature object with properties and point geometry
var geojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "amenity": "Baseball Stadium",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
};

// L.geoJSON(): Creates a Leaflet layer from a GeoJSON object or array
// Extends FeatureGroup, which extends LayerGroup - inherits all their methods
L.geoJSON(geojsonFeature).addTo(map);

// Define two LineString features as a GeoJSON array
var myLines = [{
    "type": "LineString",
    "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
}, {
    "type": "LineString",
    "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
}];

// Define a style object to apply uniform styling to all path features
var myStyle = {
    "color": "#ff7800",
    "weight": 5,
    "opacity": 0.65
};

// style option: applies a style object or function to all polylines and polygons
L.geoJSON(myLines, {
    style: myStyle
}).addTo(map);

// Define two polygon features with a party property for conditional styling
var states = [{
    "type": "Feature",
    "properties": {"party": "Republican"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-104.05, 48.99],
            [-97.22,  48.98],
            [-96.58,  45.94],
            [-104.03, 45.94],
            [-104.05, 48.99]
        ]]
    }
}, {
    "type": "Feature",
    "properties": {"party": "Democrat"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-109.05, 41.00],
            [-102.06, 40.99],
            [-102.03, 36.99],
            [-109.04, 36.99],
            [-109.05, 41.00]
        ]]
    }
}];

// style as function: conditionally styles each feature based on its properties
L.geoJSON(states, {
    style: function(feature) {
        switch (feature.properties.party) {
            case 'Republican': return {color: "#ff0000"};
            case 'Democrat':   return {color: "#0000ff"};
        }
    }
}).addTo(map);

// Define styling options for circle markers
var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

// pointToLayer option: overrides default marker rendering for GeoJSON Point features
// L.circleMarker(): Creates a circle marker with radius in pixels rather than meters
L.geoJSON(geojsonFeature, {
    pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    }
}).addTo(map);

// onEachFeature option: runs a function on each feature before adding it to the layer
// commonly used to bind popups or event listeners to individual features
function onEachFeature(feature, layer) {
    // .bindPopup(): attaches a popup to the layer using the feature's popupContent property
    if (feature.properties && feature.properties.popupContent) {
        layer.bindPopup(feature.properties.popupContent);
    }
}

L.geoJSON(geojsonFeature, {
    onEachFeature: onEachFeature
}).addTo(map);

// Define features with show_on_map boolean property to control visibility
var someFeatures = [{
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "show_on_map": true
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
}, {
    "type": "Feature",
    "properties": {
        "name": "Busch Field",
        "show_on_map": false
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.98404, 39.74621]
    }
}];

// filter option: controls feature visibility by returning true/false for each feature
// Busch Field will not render because show_on_map is false
L.geoJSON(someFeatures, {
    filter: function(feature, layer) {
        return feature.properties.show_on_map;
    }
}).addTo(map);