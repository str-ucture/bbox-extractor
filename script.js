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
  // "ESRI World Imagery": esriWorldImagery,
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

// Variable to store the current zoom level
let currentZoomLevel = map.getZoom(); // Initialize with the current zoom level

// Custom grid layer
var GridLayer = L.GridLayer.extend({
  createTile: function (coords) {
    var tile = document.createElement("canvas");
    var size = this.getTileSize();
    tile.width = size.x;
    tile.height = size.y;

    var ctx = tile.getContext("2d");

    // Grid toggle logic
    var tileBounds = this._tileCoordsToBounds(coords);
    var latRange = [tileBounds.getSouth(), tileBounds.getNorth()];
    var lngRange = [tileBounds.getWest(), tileBounds.getEast()];

    // Major grid settings
    var majorStep = 0.1;
    var drawMajorGrid = currentZoomLevel > 6; // Only draw major grid if zoom > 6

    // Minor grid settings
    var minorStep = majorStep / 10;
    var drawMinorGrid = currentZoomLevel > 8; // Only draw minor grid if zoom > 8

    // Draw minor grid
    if (drawMinorGrid) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 0.4;

      // Draw minor vertical lines (longitude)
      for (
        var lng = Math.ceil(lngRange[0] / minorStep) * minorStep;
        lng < lngRange[1];
        lng += minorStep
      ) {
        var x = ((lng - lngRange[0]) / (lngRange[1] - lngRange[0])) * size.x;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size.y);
        ctx.stroke();
      }

      // Draw minor horizontal lines (latitude)
      for (
        var lat = Math.ceil(latRange[0] / minorStep) * minorStep;
        lat < latRange[1];
        lat += minorStep
      ) {
        var y = ((latRange[1] - lat) / (latRange[1] - latRange[0])) * size.y;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size.x, y);
        ctx.stroke();
      }
    }

    // Draw major grid
    if (drawMajorGrid) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      ctx.lineWidth = 0.65;

      // Draw major vertical lines
      for (
        var lng = Math.ceil(lngRange[0] / majorStep) * majorStep;
        lng < lngRange[1];
        lng += majorStep
      ) {
        var x = ((lng - lngRange[0]) / (lngRange[1] - lngRange[0])) * size.x;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size.y);
        ctx.stroke();
      }

      // Draw major horizontal lines
      for (
        var lat = Math.ceil(latRange[0] / majorStep) * majorStep;
        lat < latRange[1];
        lat += majorStep
      ) {
        var y = ((latRange[1] - lat) / (latRange[1] - latRange[0])) * size.y;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size.x, y);
        ctx.stroke();
      }
    }

    return tile;
  },
});

var grid = new GridLayer();
map.addLayer(grid);

// Save zoom level to the variable on zoom change and refresh the grid
map.on("zoomend", function () {
  currentZoomLevel = map.getZoom();
  console.log("Current zoom level:", currentZoomLevel);

  // Redraw the grid to reflect the new zoom level
  grid.redraw();
});


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


let inputElement = document.getElementById("coordinateDecimalPlaces");
let decimalPlaces = parseFloat(inputElement.value);
console.log(decimalPlaces);

inputElement.addEventListener('change', function() {
    let decimalPlaces = parseFloat(inputElement.value);
    console.log(decimalPlaces);
});
// Function to round up a number to a specified number of decimal places
function roundUp(num, decimalPlaces) {
  var factor = Math.pow(10, decimalPlaces);
  return Math.ceil(num * factor) / factor;
}

function roundDown(num, decimalPlaces) {
  var factor = Math.pow(10, decimalPlaces);
  return Math.floor(num * factor) / factor;
}

// Event listener for when a rectangle is created
map.on(L.Draw.Event.CREATED, function (event) {
  var layer = event.layer;
  var bounds = layer.getBounds();
  var decimalPlaces = parseFloat(inputElement.value);

  // Original coordinates with 6 decimal places
  var lon_min = bounds.getWest().toFixed(6);
  var lat_min = bounds.getSouth().toFixed(6);
  var lon_max = bounds.getEast().toFixed(6);
  var lat_max = bounds.getNorth().toFixed(6);

  // Coordinates rounded up to 1 decimal place
  var lon_min_rounded = roundDown(bounds.getWest(), decimalPlaces).toFixed(decimalPlaces);
  var lat_min_rounded = roundDown(bounds.getSouth(), decimalPlaces).toFixed(decimalPlaces);
  var lon_max_rounded = roundUp(bounds.getEast(), decimalPlaces).toFixed(decimalPlaces);
  var lat_max_rounded = roundUp(bounds.getNorth(), decimalPlaces).toFixed(decimalPlaces);

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

  coordinatesText_roundupStandard =
    "[" +
    lon_min_rounded +
    ", " +
    lat_min_rounded +
    ", " +
    lon_max_rounded +
    ", " +
    lat_max_rounded +
    "]";

  // Output the coordinates
  document.getElementById("coordinateText").innerHTML = coordinatesText_roundup;
  document.getElementById("coordinateTextStandard").innerHTML = coordinatesText_roundupStandard;

  // Enable the copy button
  copyButton.disabled = false;

  var rectBoundsRound = [
    [parseFloat(lat_min_rounded), parseFloat(lon_min_rounded)], // Southwest corner
    [parseFloat(lat_max_rounded), parseFloat(lon_max_rounded)], // Northeast corner
  ];

  // Create a new rectangle with rounded coordinates
  var rectangleRound = L.rectangle(rectBoundsRound, {
    color: "#ff7800",
    weight: 1,
    fillOpacity: 0.2,
  });

  // Add the rectangle to the map
  drawnItems.clearLayers(); // Clear previous rectangles
  drawnItems.addLayer(rectangleRound);
});


// BUTTON 1
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

// BUTTON 2
var copyButton = document.getElementById("copyButtonStandard");
// Copy button click event
copyButton.addEventListener("click", function () {
  // Create a temporary textarea to hold the text to copy
  var tempInput = document.createElement("textarea");
  tempInput.value = coordinatesText_roundupStandard;
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


var copyDynamicCoordinateButton = document.getElementById("copyDynamicCoordinateButton");

// // Upload geojson file
// document
//   .getElementById("geojsonForm")
//   .addEventListener("submit", function (event) {
//     const fileInput = document.getElementById("geojsonFile");
//     const file = fileInput.files[0];

//     if (!file) {
//       alert("Please select a file to upload.");
//       event.preventDefault(); // Stop form submission
//       return;
//     }

//     if (file.type !== "application/json" && !file.name.endsWith(".geojson")) {
//       alert("Only GeoJSON files are allowed.");
//       event.preventDefault(); // Stop form submission
//       return;
//     }

//     // Optionally, provide additional feedback
//     console.log("File is valid. Proceeding with upload.");
//   });


// Variable to store the GeoJSON of the drawn rectangle
let currentGeoJSON = null;

// Event listener for rectangle creation
map.on(L.Draw.Event.CREATED, function (event) {
  let layer = event.layer;
  let bounds = layer.getBounds();

  // Rounded coordinates
  let lonMin = roundDown(bounds.getWest(), decimalPlaces);
  let latMin = roundDown(bounds.getSouth(), decimalPlaces);
  let lonMax = roundUp(bounds.getEast(), decimalPlaces);
  let latMax = roundUp(bounds.getNorth(), decimalPlaces);

  let rectBounds = [
    [latMin, lonMin],
    [latMax, lonMax],
  ];

  // Draw rectangle with rounded coordinates
  let rectangle = L.rectangle(rectBounds, {
    color: "#ff7800",
    weight: 1,
    fillOpacity: 0.2,
  });

  drawnItems.clearLayers();
  drawnItems.addLayer(rectangle);

  // Update the current GeoJSON
  currentGeoJSON = rectangle.toGeoJSON();
});


// Add download GeoJSON functionality
let downloadButton = document.getElementById("downloadGeojson");
downloadButton.addEventListener("click", function () {
  if (currentGeoJSON) {
    let geoJSONString = JSON.stringify(currentGeoJSON, null, 2);

    // Create a Blob object
    let blob = new Blob([geoJSONString], { type: "application/json" });

    // Use the File System Access API to show the Save As dialog
    if (window.showSaveFilePicker) {
      (async () => {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: "rectangle.geojson",
          types: [
            {
              description: "GeoJSON File",
              accept: { "application/json": [".geojson"] },
            },
          ],
        });

        const writableStream = await fileHandle.createWritable();
        await writableStream.write(blob);
        await writableStream.close();
      })().catch((err) => {
        console.error("Save As dialog failed", err);
      });
    } else {
      // Fallback for browsers that don't support showSaveFilePicker
      let url = URL.createObjectURL(blob);

      let a = document.createElement("a");
      a.href = url;
      a.download = "rectangle.geojson";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } else {
    alert("No rectangle drawn to save!");
  }
});
