/* Wisconsin Supreme Court Election Margins Map */

// Declare global variables
// Declare global variables
var map;
var minValue;
var dataStats = {};

// Function to instantiate the Leaflet map
function createMap(){
    // Create map centered on Wisconsin
    map = L.map('map', {
        center: [44.5, -89.5],
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

// Calculate min, mean, and max for all data values
function calcStats(data){
    // Create empty array to store all data values
    var allValues = [];
    
    // Loop through each county
    for(var county of data.features){
        // Loop through each election year
        for(var year = 2011; year <= 2023; year += 2){
            // Get margin value for current year
            var value = county.properties["Margin_" + String(year)];
            // Add absolute value to array
            if (value !== null && value !== undefined) {
                allValues.push(Math.abs(value));
            }
        }
    }
    
    // Get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    
    // Calculate mean value
    var sum = allValues.reduce(function(a, b){return a + b;});
    dataStats.mean = sum / allValues.length;
};

// Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    // Constant factor adjusts symbol sizes evenly
    var minRadius = 3;
    // Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/dataStats.min, 0.5715) * minRadius;

    return radius;
};

// Step 3: Build an attributes array from the data
function processData(data){
    // Empty array to hold attributes
    var attributes = [];

    // Properties of the first feature in the dataset
    var properties = data.features[0].properties;

    // Push each attribute name into attributes array
    for (var attribute in properties){
        // Only take attributes with Margin values
        if (attribute.indexOf("Margin") > -1){
            attributes.push(attribute);
        };
    };

    // Check result
    console.log(attributes);

    return attributes;
};

// Create popup content string for a given feature and attribute
function createPopupContent(properties, attribute){
    // Extract year from attribute name
    var year = attribute.split("_")[1];
    
    // Build popup content
    var popupContent = "<p><b>County:</b> " + properties.County + "</p>";
    
    // Get attribute value and determine party
    var attValue = Number(properties[attribute]);
    var partyLabel = attValue > 0 ? "Liberal" : "Conservative";
    var sign = "+";
    
    popupContent += "<p><b>" + year + ":</b> " + partyLabel + " " + sign + Math.abs(attValue).toFixed(1) + "</p>";
    
    return popupContent;
};

// Function to convert markers to circle markers with popups
function pointToLayer(feature, latlng, attributes){
    // Step 4: Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    
    // Determine value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    
    // Determine color based on margin direction
    // Negative margin = conservative win, positive margin = liberal win
    var fillColor;
    if (attValue > 0) {
        fillColor = "#7FB77E"; // Liberal (positive margin)
    } else {
        fillColor = "#FAA61F"; // Conservative (negative margin)
    }
    
    // Create marker options
    var options = {
        fillColor: fillColor,
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    // Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(Math.abs(attValue));

    // Create circle marker layer
    var layer = L.circleMarker(latlng, options);

    // Create popup content using consolidated function
    var popupContent = createPopupContent(feature.properties, attribute);

    // Bind the popup to the circle marker with offset
    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -options.radius)
    });

    // Return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

// Add circle markers for point features to the map
function createPropSymbols(data, attributes){
    // Create Leaflet GeoJSON layer
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

// Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    // Update temporal legend with current year
    var year = attribute.split("_")[1];
    document.querySelector("span.year").innerHTML = year;
    
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            // Access feature properties
            var props = layer.feature.properties;

            // Update each feature's radius based on new attribute values
            var attValue = Number(props[attribute]);
            var radius = calcPropRadius(Math.abs(attValue));
            layer.setRadius(radius);

            // Update color based on new margin direction
            var fillColor;
            if (attValue > 0) {
                fillColor = "#7FB77E"; // Liberal
            } else {
                fillColor = "#FAA61F"; // Conservative
            }
            layer.setStyle({fillColor: fillColor});

            // Create popup content using consolidated function
            var popupContent = createPopupContent(props, attribute);

            // Update popup content
            var popup = layer.getPopup();
            popup.setContent(popupContent).update();
        };
    });
};

// Update the temporal legend with the current attribute
function updateLegend(attribute){
    // Extract year from attribute name
    var year = attribute.split("_")[1];
    
    // Update legend content
    document.querySelector(".legend-control-container").innerHTML = '<p class="temporalLegend">WI Supreme Court Election: <span class="year">' + year + '</span></p>';
};

// Create temporal and attribute legend
function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // Create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            // Add temporal legend
            var year = attributes[0].split("_")[1];
            container.innerHTML = '<p class="temporalLegend">WI Supreme Court Election: <span class="year">' + year + '</span></p>';

            // Step 1: Start attribute legend SVG string
            var svg = '<svg id="attribute-legend" width="180px" height="130px">';

            // Array of circle names to base loop on
            var circles = ["max", "mean", "min"];

            // Step 2: Loop to add each circle and text to SVG string
            for (var i=0; i<circles.length; i++){
                // Step 3: Assign the r and cy attributes
                var radius = calcPropRadius(dataStats[circles[i]]);
                var cy = 125 - radius;

                // Circle string (using conservative color as default)
                svg += '<circle class="legend-circle" id="' + circles[i] + 
                    '" r="' + radius + '" cy="' + cy + 
                    '" fill="#FAA61F" fill-opacity="0.8" stroke="#000000" cx="40"/>';

                // Step 4: Evenly space out labels
                var textY = i * 22 + 30;

                // Text string
                svg += '<text id="' + circles[i] + '-text" x="85" y="' + textY + 
                    '">' + Math.round(dataStats[circles[i]]*10)/10 + "% margin" + '</text>';
            };

            // Close SVG string
            svg += "</svg>";

            // Add attribute legend SVG to container
            container.insertAdjacentHTML('beforeend', svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
};

// Step 1: Create new sequence controls
function createSequenceControls(attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // Create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            // Create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">');

            // Add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse">Reverse</button>');
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward">Forward</button>');

            // Disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());

    // Set slider attributes AFTER adding control to map
    document.querySelector(".range-slider").max = attributes.length - 1;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    // Step 5: Click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;

            // Step 6: Increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                // Step 7: If past the last attribute, wrap around to first attribute
                index = index > attributes.length - 1 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                // Step 7: If past the first attribute, wrap around to last attribute
                index = index < 0 ? attributes.length - 1 : index;
            };

            // Step 8: Update slider
            document.querySelector('.range-slider').value = index;

            // Step 9: Pass new attribute to update symbols
            updatePropSymbols(attributes[index]);
        })
    })

    // Step 5: Input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        // Step 6: Get the new index value
        var index = this.value;

        // Step 9: Pass new attribute to update symbols
        updatePropSymbols(attributes[index]);
    });
};

// Function to retrieve GeoJSON data and place it on the map
function getData(){
    // Fetch WI Supreme Court GeoJSON
    fetch("data/scowis_margins.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            // Create an attributes array
            var attributes = processData(json);
            // Calculate min, mean, max statistics
            calcStats(json);
            // Call function to create proportional symbols
            createPropSymbols(json, attributes);
            // Create sequence controls
            createSequenceControls(attributes);
            // Create temporal and attribute legend
            createLegend(attributes);
        });
};

// Initialize map once DOM is loaded
document.addEventListener('DOMContentLoaded', createMap);