/* Wisconsin Supreme Court Election Margins Map */

// Declare global variables
var map;
var minValue;

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

// Calculate minimum value across all margin attributes
function calculateMinValue(data){
    // Create empty array to store all data values
    var allValues = [];
    
    // Loop through each county
    for(var county of data.features){
        // Loop through each election year
        for(var year = 2011; year <= 2023; year += 2){
            // Get margin value for current year
            var value = county.properties["Margin_" + String(year)];
            // Add value to array
            if (value !== null && value !== undefined) {
                allValues.push(Math.abs(value));
            }
        }
    }
    
    // Get minimum value of our array
    var minValue = Math.min(...allValues);

    return minValue;
}

// Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    // Constant factor adjusts symbol sizes evenly
    var minRadius = 3;
    // Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue, 0.5715) * minRadius;

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

    // Build popup content string
    var year = attribute.split("_")[1];
    var popupContent = "<p><b>County:</b> " + feature.properties.County + "</p>";
    
    // Format margin with party label and sign
    var partyLabel = attValue > 0 ? "Liberal" : "Conservative";
    var sign = "+";
    popupContent += "<p><b>" + year + ":</b> " + partyLabel + " " + sign + Math.abs(attValue).toFixed(1) + "</p>";

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

            // Build popup content string
            var year = attribute.split("_")[1];
            var popupContent = "<p><b>County:</b> " + props.County + "</p>";
            
            // Format margin with party label and sign
            var partyLabel = attValue > 0 ? "Liberal" : "Conservative";
            var sign = "+";
            popupContent += "<p><b>" + year + ":</b> " + partyLabel + " " + sign + Math.abs(attValue).toFixed(1) + "</p>";

            // Update popup content
            var popup = layer.getPopup();
            popup.setContent(popupContent).update();
        };
    });
};

// Step 1: Create new sequence controls
function createSequenceControls(attributes){
    // Create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend', slider);

    // Set slider attributes
    document.querySelector(".range-slider").max = attributes.length - 1;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    // Step 2: Add step buttons
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');

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
            // Calculate minimum data value
            minValue = calculateMinValue(json);
            // Call function to create proportional symbols
            createPropSymbols(json, attributes);
            // Create sequence controls
            createSequenceControls(attributes);
        });
};

// Initialize map once DOM is loaded
document.addEventListener('DOMContentLoaded', createMap);