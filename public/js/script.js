const socket = io();

// Initialize the map with a default view
const map = L.map('map').setView([20.5937, 78.9629], 5); // Default to India

// Add the OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Object to store markers by their socket IDs
const markers = {};

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Fetched location: Latitude ${latitude}, Longitude ${longitude}`); // Log fetched coordinates
        socket.emit('send-location', { latitude, longitude });

        // Center the map on the user's location
        map.setView([latitude, longitude], 13);

        // Add a marker for the user's location
        if (!markers['self']) {
            markers['self'] = L.marker([latitude, longitude]).addTo(map).bindPopup("You are here").openPopup();
        } else {
            markers['self'].setLatLng([latitude, longitude]).openPopup();
        }
    }, (error) => {
        console.error('Error fetching location:', error.message); // Log error
        alert('Unable to fetch location.');
    }, {
        enableHighAccuracy: true, // Request high accuracy
        timeout: 5000, // Timeout after 5 seconds
        maximumAge: 0 // Do not use cached location
    });
} else {
    alert('Geolocation is not supported by your browser.');
}

// Handle receiving location data from other clients
socket.on('receive-location', (data) => {
    const { id, latitude, longitude } = data;
    console.log(`Received location: ID ${id}, Latitude ${latitude}, Longitude ${longitude}`); // Log received coordinates

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map).bindPopup(`User ${id}`);
    }
});

// Handle disconnection events
socket.on('disconnected', (id) => {
    console.log(`User disconnected: ID ${id}`); // Log disconnection

    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
