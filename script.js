// Function to round up a number to a specified number of decimal places
function roundUp(num, decimalPlaces) {
  var factor = Math.pow(10, decimalPlaces);
  return Math.ceil(num * factor) / factor;
}

function roundDown(num, decimalPlaces) {
  var factor = Math.pow(10, decimalPlaces);
  return Math.floor(num * factor) / factor;
}

// Add OpenStreetMap tile layer
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
});

var esriWorldImagery = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  }
);

var tileLayers = {
  OSM: osm,
  "ESRI World Imagery": esriWorldImagery,
};

var map = L.map("map", {
  center: [47.7, 9.15],
  zoom: 11,
  layers: [osm],
});

var layerControl = L.control.layers(tileLayers).addTo(map);

// Add a div for displaying the coordinates
var coordDiv = document.getElementById("leafletCoordinates");

map.on("mousemove", function (e) {
  var lat = e.latlng.lat.toFixed(2);
  var lng = e.latlng.lng.toFixed(2);
  coordDiv.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
});

// Create a new pane for the grid layer
map.createPane("gridPane");
map.getPane("gridPane").style.zIndex = 650; // Set a higher zIndex for the grid

// Custom grid layer to draw 0.1° lines
var GridLayer = L.GridLayer.extend({
  createTile: function (coords) {
    var tile = document.createElement("canvas");
    var size = this.getTileSize();
    tile.width = size.x;
    tile.height = size.y;

    var ctx = tile.getContext("2d");
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.lineWidth = 0.5;

    var tileBounds = this._tileCoordsToBounds(coords);
    var latRange = [tileBounds.getSouth(), tileBounds.getNorth()];
    var lngRange = [tileBounds.getWest(), tileBounds.getEast()];

    var step = 0.1; // Step for grid lines in degrees

    // Draw vertical lines (longitude)
    for (
      var lng = Math.ceil(lngRange[0] / step) * step;
      lng < lngRange[1];
      lng += step
    ) {
      var x = ((lng - lngRange[0]) / (lngRange[1] - lngRange[0])) * size.x;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size.y);
      ctx.stroke();
    }

    // Draw horizontal lines (latitude)
    for (
      var lat = Math.ceil(latRange[0] / step) * step;
      lat < latRange[1];
      lat += step
    ) {
      var y = ((latRange[1] - lat) / (latRange[1] - latRange[0])) * size.y;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size.x, y);
      ctx.stroke();
    }
    return tile;
  },
});

// Assign the grid layer to the new pane
var grid = new GridLayer({ pane: "gridPane" });
map.addLayer(grid);

// Add GeoSearch control
const provider = new window.GeoSearch.OpenStreetMapProvider();
const searchControl = new window.GeoSearch.GeoSearchControl({
  provider: provider,
  style: "button",
  autoComplete: true,
  autoCompleteDelay: 250,
  showMarker: true,
  animateZoom: true,
});

map.addControl(searchControl);

// FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialize the draw control
var drawControl = new L.Control.Draw({
  draw: {
    polyline: false,
    polygon: false,
    circle: false,
    circlemarker: false,
    marker: false,
    rectangle: true,
  },
  // edit: {
  //     featureGroup: drawnItems,
  //     remove: false,
  // },
});
map.addControl(drawControl);

// Event listener for when a rectangle is created
map.on(L.Draw.Event.CREATED, function (event) {
  var layer = event.layer;
  var bounds = layer.getBounds();

  // Original coordinates with 6 decimal places
  var lon_min = bounds.getWest().toFixed(6);
  var lat_min = bounds.getSouth().toFixed(6);
  var lon_max = bounds.getEast().toFixed(6);
  var lat_max = bounds.getNorth().toFixed(6);

  // Coordinates rounded up to 1 decimal place
  var lon_min_rounded = roundDown(bounds.getWest(), 1).toFixed(1);
  var lat_min_rounded = roundDown(bounds.getSouth(), 1).toFixed(1);
  var lon_max_rounded = roundUp(bounds.getEast(), 1).toFixed(1);
  var lat_max_rounded = roundUp(bounds.getNorth(), 1).toFixed(1);

  coordinatesText =
    "[" + lon_min + ", " + lat_min + ", " + lon_max + ", " + lat_max + "]";
  coordinatesText_roundup =
    "[" +
    lat_max_rounded +
    ", " +
    lon_min_rounded +
    ", " +
    lat_min_rounded +
    ", " +
    lon_max_rounded +
    "]";

  // Output the coordinates
  document.getElementById("coordinateText").innerHTML =
    "<strong>Coordinates (WGS84):</strong> " + coordinatesText_roundup;

  // Enable the copy button
  copyButton.disabled = false;

  // Parse rounded coordinates
  var rectBounds = [
    [parseFloat(lat_min_rounded), parseFloat(lon_min_rounded)], // Southwest corner
    [parseFloat(lat_max_rounded), parseFloat(lon_max_rounded)], // Northeast corner
  ];

  // Create a new rectangle with rounded coordinates
  var rectangle = L.rectangle(rectBounds, {
    color: "#ff7800",
    weight: 1,
  });

  // Add the rectangle to the map
  drawnItems.clearLayers(); // Clear previous rectangles
  drawnItems.addLayer(rectangle);
});

var copyButton = document.getElementById("copyButton");

// Copy button click event
copyButton.addEventListener("click", function () {
  // Create a temporary textarea to hold the text to copy
  var tempInput = document.createElement("textarea");
  tempInput.value = coordinatesText_roundup;
  document.body.appendChild(tempInput);
  tempInput.select();
  tempInput.setSelectionRange(0, 99999); // For mobile devices

  try {
    var successful = document.execCommand("copy");
    if (successful) {
      alert("Coordinates copied to clipboard!");
    } else {
      alert("Failed to copy coordinates.");
    }
  } catch (err) {
    alert("Browser does not support copying to clipboard.");
  }

  // Remove the temporary textarea
  document.body.removeChild(tempInput);
});

// Upload geojson file
document
  .getElementById("geojsonForm")
  .addEventListener("submit", function (event) {
    const fileInput = document.getElementById("geojsonFile");
    const file = fileInput.files[0];

    if (!file) {
      alert("Please select a file to upload.");
      event.preventDefault(); // Stop form submission
      return;
    }

    if (file.type !== "application/json" && !file.name.endsWith(".geojson")) {
      alert("Only GeoJSON files are allowed.");
      event.preventDefault(); // Stop form submission
      return;
    }

    // Optionally, provide additional feedback
    console.log("File is valid. Proceeding with upload.");
  });
