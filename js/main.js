/* Wisconsin Supreme Court Election Margins Map */

// Declare global variables
var map;
var dataStats = {};
var countyLayer;
var cityLayer;

// Function to instantiate the Leaflet map
function createMap(){
    // Create map centered on Wisconsin
    map = L.map('map', {
        center: [44.5, -89.5],
        zoom: 7,
        minZoom: 6,
        maxZoom: 10
    });

    // Add CartoDB Positron NoLabels tileset
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Add zoom event listener to adjust styles
    map.on('zoomend', function(){
        updateStylesForZoom();
    });

    // Call getData to load WI Supreme Court data
    getData();
};

// Calculate min, mean, and max for all data values
function calcStats(data){
    // Create empty array to store all data values
    var allValues = [];
    
    // Loop through each county
    for(var county of data.features){
        // Loop through properties to find all Margin attributes
        for(var prop in county.properties){
            if (prop.indexOf("Margin") > -1){
                var value = county.properties[prop];
                // Add absolute value to array
                if (value !== null && value !== undefined) {
                    allValues.push(Math.abs(value));
                }
            }
        }
    }
    
    // Get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    
    // Calculate mean value
    var sum = allValues.reduce(function(a, b){return a + b;});
    dataStats.mean = sum / allValues.length;
    
    console.log("Data stats:", dataStats);
};

// Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    // Simple linear scaling - no logarithms, no power functions
    // Normalize to 0-1 range
    var normalized = (attValue - dataStats.min) / (dataStats.max - dataStats.min);
    
    // Map to radius range: 5px (min) to 26px (max) - LOCKED
    var minRadius = 3;
    var maxRadius = 37;
    var radius = minRadius + (normalized * (maxRadius - minRadius));
    
    return radius;
};

// Build an attributes array from the data
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

    // Sort attributes by year to ensure proper order
    attributes.sort(function(a, b){
        var yearA = parseInt(a.split("_")[1]);
        var yearB = parseInt(b.split("_")[1]);
        return yearA - yearB;
    });

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
    // Assign the current attribute based on the LAST index (2026)
    var attribute = attributes[attributes.length - 1];
    
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
    
    // Get current zoom and calculate zoom factor
    var currentZoom = map.getZoom();
    var zoomFactor;
    if (currentZoom <= 6) {
        zoomFactor = 0.5;
    } else if (currentZoom === 7) {
        zoomFactor = 0.7;
    } else if (currentZoom === 8) {
        zoomFactor = 0.85;
    } else {
        zoomFactor = 1.0;
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
    // Apply zoom factor to initial radius
    var baseRadius = calcPropRadius(Math.abs(attValue));
    options.radius = baseRadius * zoomFactor;

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

// Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    console.log("updatePropSymbols called with attribute:", attribute);
    
    // Extract year from attribute name
    var year = attribute.split("_")[1];
    
    // Update active tick mark based on current attribute
    document.querySelectorAll('.tick-circle').forEach(function(tick){
        var tickYear = tick.getAttribute('data-year');
        if (tickYear === year) {
            tick.classList.add('active');
        } else {
            tick.classList.remove('active');
        }
    });
    
    var currentZoom = map.getZoom();
    var zoomFactor;
    if (currentZoom <= 6) {
        zoomFactor = 0.5;
    } else if (currentZoom === 7) {
        zoomFactor = 0.7;
    } else if (currentZoom === 8) {
        zoomFactor = 0.85;
    } else {
        zoomFactor = 1.0;
    }
    
    var layersUpdated = 0;
    
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties && layer.feature.properties[attribute]){
            layersUpdated++;
            
            // Access feature properties
            var props = layer.feature.properties;

            // Update each feature's radius based on new attribute values
            var attValue = Number(props[attribute]);
            var baseRadius = calcPropRadius(Math.abs(attValue));
            layer.setRadius(baseRadius * zoomFactor);

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
            if (popup) {
                popup.setContent(popupContent).update();
            }
        };
    });
    
    console.log("Layers updated:", layersUpdated);
};

// Function to attach popups to county boundaries
function onEachCountyFeature(feature, layer) {
    if (feature.properties && feature.properties.NAME) {
        var countyName = feature.properties.NAME;
        
        // Find the matching county in the election data to get current margin
        var popupContent = "<p><b>County:</b> " + countyName + "</p>";
        
        // Try to find this county's election data
        map.eachLayer(function(circleLayer){
            if (circleLayer.feature && 
                circleLayer.feature.properties && 
                circleLayer.feature.properties.County === countyName) {
                
                // Get the currently displayed attribute (year)
                var currentAttribute = null;
                for (var prop in circleLayer.feature.properties) {
                    if (prop.indexOf("Margin") > -1 && circleLayer.feature.properties[prop] !== null) {
                        currentAttribute = prop;
                    }
                }
                
                // Get current year from the active tick mark
                var activeYear = document.querySelector('.tick-circle.active');
                if (activeYear) {
                    var year = activeYear.getAttribute('data-year');
                    var attribute = "Margin_" + year;
                    var attValue = circleLayer.feature.properties[attribute];
                    
                    if (attValue !== null && attValue !== undefined) {
                        var partyLabel = attValue > 0 ? "Liberal" : "Conservative";
                        popupContent += "<p><b>" + year + ":</b> " + partyLabel + " +" + Math.abs(attValue).toFixed(1) + "</p>";
                    }
                }
            }
        });
        
        layer.bindPopup(popupContent);
    }
};

// Load county boundaries (filter for Wisconsin only)
function loadCountyBoundaries(){
    fetch("data/us_counties.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            // Filter for Wisconsin counties only (STATE = "55")
            var wiCounties = {
                type: "FeatureCollection",
                features: json.features.filter(function(feature){
                    return feature.properties.STATE === "55";
                })
            };
            
            countyLayer = L.geoJson(wiCounties, {
                style: {
                    color: "#000",
                    weight: 1.5,
                    fillColor: "#F7F9FA",
                    fillOpacity: 0.3
                },
                onEachFeature: onEachCountyFeature
            });
            
            // Remove the overlayadd event listener since we're handling it in createOverlayControls
        });
};

// Add major Wisconsin cities
function addMajorCities(){
    var cities = [
        {name: "Milwaukee", lat: 43.0389, lng: -87.9065},
        {name: "Madison", lat: 43.0731, lng: -89.4012},
        {name: "Green Bay", lat: 44.5133, lng: -88.0133},
        {name: "Kenosha", lat: 42.5847, lng: -87.8212},
        {name: "Racine", lat: 42.7261, lng: -87.7829},
        {name: "Appleton", lat: 44.2619, lng: -88.4154},
        {name: "Eau Claire", lat: 44.8113, lng: -91.4985},
        {name: "Oshkosh", lat: 44.0247, lng: -88.5426},
        {name: "Janesville", lat: 42.6828, lng: -89.0187}
    ];

    var cityMarkers = [];

    cities.forEach(function(city){
        var marker = L.circleMarker([city.lat, city.lng], {
            radius: 3,
            fillColor: "#000",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 1
        }).bindTooltip(city.name, {
            permanent: true,
            direction: 'right',
            className: 'city-label',
            offset: [6, 0]
        });
        
        cityMarkers.push(marker);
    });

    cityLayer = L.layerGroup(cityMarkers);
};

// Create overlay controls
function createOverlayControls(){
    // Add only county layer to map by default (not cities)
    countyLayer.addTo(map);
    
    // Send counties to back so circles show on top
    countyLayer.bringToBack();
    
    var overlays = {
        "County Boundaries": countyLayer,
        "Major Cities": cityLayer
    };

    L.control.layers(null, overlays, {
        position: 'topleft',  // Move to top-left to avoid legend overlap
        collapsed: false
    }).addTo(map);
    
    // Also ensure counties go to back when toggled off and back on
    map.on('overlayadd', function(event){
        if (event.name === 'County Boundaries'){
            countyLayer.bringToBack();
        }
    });
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

            // Add title
            container.innerHTML = '<p class="legend-title"><strong>Margin</strong><br/>(Percentage Points)</p>';

            // Legend
            var svgWidth = 180;  // Match the max-width of legend-control-container
            var svgHeight = 90;

            // Radii
            var largeRadius = 30;
            var mediumRadius = 18;
            var smallRadius = 10;

            // Center horizontally
            var circleCenterX = svgWidth / 2;

            // Bottom baseline
            var bottomY = svgHeight - 8;

            // Start SVG
            var svg = '<svg id="attribute-legend" width="' + svgWidth + 'px" height="' + svgHeight + 'px">';
            
            // Draw circles - centered, bottom-aligned
            svg += '<circle r="' + largeRadius + 
                '" cx="' + circleCenterX + '" cy="' + (bottomY - largeRadius) + 
                '" fill="none" stroke="#000000" stroke-width="1.5"/>';
            
            svg += '<circle r="' + mediumRadius + 
                '" cx="' + circleCenterX + '" cy="' + (bottomY - mediumRadius) + 
                '" fill="none" stroke="#000000" stroke-width="1.5"/>';
            
            svg += '<circle r="' + smallRadius + 
                '" cx="' + circleCenterX + '" cy="' + (bottomY - smallRadius) + 
                '" fill="none" stroke="#000000" stroke-width="1.5"/>';

            // Add labels at the TOP/outside of each circle (like wireframe)
            svg += '<text x="' + circleCenterX + '" y="' + (bottomY - largeRadius * 2 - 3) + 
                '" font-size="13" text-anchor="middle">+50</text>';
            
            svg += '<text x="' + circleCenterX + '" y="' + (bottomY - mediumRadius * 2 - 3) + 
                '" font-size="13" text-anchor="middle">+25</text>';
            
            svg += '<text x="' + circleCenterX + '" y="' + (bottomY - smallRadius * 2 - 3) + 
                '" font-size="13" text-anchor="middle">+5</text>';

            svg += "</svg>";

            container.insertAdjacentHTML('beforeend', svg);

            // Color legend
            var partyLegend = '<div class="party-legend-bottom">';
            partyLegend += '<div class="party-item-bottom"><span class="color-dot-bottom liberal"></span><span class="party-label-bottom">Liberal Majority</span></div>';
            partyLegend += '<div class="party-item-bottom"><span class="color-dot-bottom conservative"></span><span class="party-label-bottom">Conservative Majority</span></div>';
            partyLegend += '</div>';
            
            partyLegend += '<div class="legend-disclaimer"><strong>Note:</strong> <em>Judicial Elections in Wisconsin are officially non-partisan</em></div>';
            
            container.insertAdjacentHTML('beforeend', partyLegend);

            return container;
        }
    });

    map.addControl(new LegendControl());
};

// Create sequence controls
function createSequenceControls(attributes){
    // Candidate data by year
    // Candidate data by year (winner listed first)
    var candidateData = {
        "2011": {
            first: { party: "", name: "" },
            second: { party: "", name: "" }
        },
        "2013": {
            first: { party: "", name: "" },
            second: { party: "", name: "" }
        },
        "2015": {
            first: { party: "", name: "" },
            second: { party: "", name: "" }
        },
        "2016": {
            first: { party: "Conservative", name: "Rebecca Bradley (Winner)" },
            second: { party: "Liberal", name: "JoAnne Kloppenburg" }
        },
        "2018": {
            first: { party: "Liberal", name: "Rebecca Dallet (Winner)" },
            second: { party: "Conservative", name: "Michael Screnock" }
        },
        "2019": {
            first: { party: "Conservative", name: "Brian Hagedorn (Winner)" },
            second: { party: "Liberal", name: "Lisa Neubauer" }
        },
        "2020": {
            first: { party: "Liberal", name: "Jill Karofsky (Winner)" },
            second: { party: "Conservative", name: "Daniel Kelly" }
        },
        "2023": {
            first: { party: "Liberal", name: "Janet Protasiewicz (Winner)" },
            second: { party: "Conservative", name: "Daniel Kelly" }
        },
        "2025": {
            first: { party: "Liberal", name: "Susan Crawford (Winner)" },
            second: { party: "Conservative", name: "Brad Schimel" }
        },
        "2026": {
            first: { party: "Liberal", name: "Chris Taylor (Winner)" },
            second: { party: "Conservative", name: "Maria Lazar" }
        }
    };
    
    var SequenceControl = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function () {
            // Create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            // Add title
            container.insertAdjacentHTML('beforeend', '<div class="sequence-title">Wisconsin Supreme Court Election Year</div>');

            // Create year labels and tick marks
            var yearsHTML = '<div class="year-ticks">';
            
            // Extract years from attributes
            var years = attributes.map(function(attr){
                return attr.split("_")[1];
            });
            
            // Create tick mark for each year
            years.forEach(function(year, index){
                var isLast = index === (years.length - 1); // Change to check if it's the last year
                yearsHTML += '<div class="tick-mark">';
                yearsHTML += '<div class="year-label-top">' + year + '</div>';
                yearsHTML += '<div class="tick-circle' + (isLast ? ' active' : '') + '" data-index="' + index + '" data-year="' + year + '"></div>';
                yearsHTML += '</div>';
            });
            
            yearsHTML += '</div>';
            container.insertAdjacentHTML('beforeend', yearsHTML);

            // Add color legend with initial candidates (2026, not first year)
            var initialYear = years[years.length - 1]; // Change to last year
            var initialCandidates = candidateData[initialYear];

            var legendHTML = '<div class="party-legend" id="candidate-legend">';
            if (initialCandidates.first.name && initialCandidates.second.name) {
                legendHTML += '<div class="party-item">';
                legendHTML += '<span class="color-dot ' + initialCandidates.first.party.toLowerCase() + '"></span>';
                legendHTML += '<span class="party-label"><strong>' + initialCandidates.first.party + ':</strong> ' + initialCandidates.first.name + '</span>';
                legendHTML += '</div>';
                
                legendHTML += '<div class="party-item">';
                legendHTML += '<span class="color-dot ' + initialCandidates.second.party.toLowerCase() + '"></span>';
                legendHTML += '<span class="party-label"><strong>' + initialCandidates.second.party + ':</strong> ' + initialCandidates.second.name + '</span>';
                legendHTML += '</div>';
            } else {
                legendHTML += '<div class="party-item"><span class="color-dot liberal"></span><span class="party-label"><strong>Liberal</strong></span></div>';
                legendHTML += '<div class="party-item"><span class="color-dot conservative"></span><span class="party-label"><strong>Conservative</strong></span></div>';
            }
            legendHTML += '</div>';

            // Add note about 2017
            legendHTML += '<div class="election-note"><strong>Note:</strong> 2017 was uncontested</div>';

            container.insertAdjacentHTML('beforeend', legendHTML);
            // Disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());

    // Add click listeners to tick marks
    document.querySelectorAll('.tick-circle').forEach(function(tick){
        tick.addEventListener('click', function(){
            var index = parseInt(this.getAttribute('data-index'));
            var year = this.getAttribute('data-year');
            
            // Update active state
            document.querySelectorAll('.tick-circle').forEach(function(t){
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update candidate legend
            updateCandidateLegend(year, candidateData);
            
            // Update symbols
            updatePropSymbols(attributes[index]);
        });
    });
    
    // Function to update candidate legend based on year
    function updateCandidateLegend(year, candidateData){
        var candidates = candidateData[year];
        
        // Check if candidates exist for this year
        if (!candidates || !candidates.first) {
            console.log("No candidate data for year:", year);
            return;
        }
        
        var legendHTML = '';
        
        if (candidates.first.name && candidates.second.name) {
            legendHTML += '<div class="party-item">';
            legendHTML += '<span class="color-dot ' + candidates.first.party.toLowerCase() + '"></span>';
            legendHTML += '<span class="party-label"><strong>' + candidates.first.party + ':</strong> ' + candidates.first.name + '</span>';
            legendHTML += '</div>';
            
            legendHTML += '<div class="party-item">';
            legendHTML += '<span class="color-dot ' + candidates.second.party.toLowerCase() + '"></span>';
            legendHTML += '<span class="party-label"><strong>' + candidates.second.party + ':</strong> ' + candidates.second.name + '</span>';
            legendHTML += '</div>';
        } else {
            legendHTML += '<div class="party-item"><span class="color-dot liberal"></span><span class="party-label"><strong>Liberal</strong></span></div>';
            legendHTML += '<div class="party-item"><span class="color-dot conservative"></span><span class="party-label"><strong>Conservative</strong></span></div>';
        }
        
        document.getElementById('candidate-legend').innerHTML = legendHTML;
    }
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
            // Load county boundaries
            loadCountyBoundaries();
            // Add major cities
            addMajorCities();
            // Create overlay controls (must be after boundaries and cities are loaded)
            setTimeout(function(){
                createOverlayControls();
                // Force counties to back after everything loads
                if (countyLayer && map.hasLayer(countyLayer)) {
                    countyLayer.bringToBack();
                }
            }, 500);
        });
};

// Update circle sizes and county border weights based on zoom level
function updateStylesForZoom(){
    var currentZoom = map.getZoom();
    
    // Adjust circle marker sizes
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties){
            var props = layer.feature.properties;
            // Find current attribute
            var attribute;
            for (var attr in props){
                if (attr.indexOf("Margin") > -1){
                    attribute = attr;
                    break;
                }
            }
            if (attribute){
                var attValue = Number(props[attribute]);
                var baseRadius = calcPropRadius(Math.abs(attValue));
                
                // Scale radius based on zoom (smaller at lower zooms)
                var zoomFactor;
                if (currentZoom <= 6) {
                    zoomFactor = 0.5;
                } else if (currentZoom === 7) {
                    zoomFactor = 0.7;
                } else if (currentZoom === 8) {
                    zoomFactor = 0.85;
                } else {
                    zoomFactor = 1.0;
                }
                
                layer.setRadius(baseRadius * zoomFactor);
            }
        }
    });
    
    // Adjust county border weight if layer exists
    if (countyLayer && map.hasLayer(countyLayer)){
        var borderWeight;
        if (currentZoom <= 6) {
            borderWeight = 0.5;  // Changed from 1
        } else if (currentZoom === 7) {
            borderWeight = 1;    // Changed from 1.5
        } else if (currentZoom === 8) {
            borderWeight = 1.5;  // Changed from 2
        } else {
            borderWeight = 2;
        }
        
        countyLayer.setStyle({
            weight: borderWeight
        });
    }
};

// Initialize map once DOM is loaded
document.addEventListener('DOMContentLoaded', createMap);