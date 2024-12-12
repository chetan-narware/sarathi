import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import Navbar from "./Navbar";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom icon for damage markers (deep red)
const redMarkerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
  className: "red-icon",
});

const ReportDamage = () => {
  const defaultLocation = [21.1458, 79.0882];
  const [currentLocation, setCurrentLocation] = useState(defaultLocation);
  const [markers, setMarkers] = useState([]); // Backend markers
  const [isUploading, setIsUploading] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [isDamageDetected, setIsDamageDetected] = useState(false); // Uploaded image result
  const [isDay, setIsDay] = useState(false); // Default is night mode (false)

  // Fetch user's current location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        setCurrentLocation(defaultLocation);
      }
    );
  }, []);

  // Fetch markers from the backend
  const fetchMarkers = async () => {
    try {
      const response = await axios.get("/api/get-markers");
      const updatedMarkers = response.data.markers.map((marker) => ({
        ...marker,
        latitude: parseFloat(marker.latitude),
        longitude: parseFloat(marker.longitude),
      }));
      setMarkers(updatedMarkers);
    } catch (error) {
      console.error("Error fetching markers:", error);
    }
  };

  useEffect(() => {
    fetchMarkers();
  }, []);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("latitude", currentLocation[0]);
    formData.append("longitude", currentLocation[1]);

    try {
      const response = await axios.post("/api/upload-image", formData);
      const { isDamaged, processedFrame } = response.data;
      if (isDamaged) {
        alert("Road damage detected! Marker added.");
        setIsDamageDetected(true); // Set damage detected to true
        setProcessedImage(`data:image/jpeg;base64,${processedFrame}`);
        fetchMarkers(); // Update markers
      } else {
        alert("No road damage detected.");
        setIsDamageDetected(false); // Reset damage detected
        setProcessedImage(null); // Clear any previous image
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Center the map to the current location
  const goToCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
      },
      () => alert("Could not fetch current location.")
    );
  };

  return (
    <div style={{ backgroundColor: isDay ? "#fff" : "#1a1a1a", color: isDay ? "#000" : "#fff", minHeight: "100vh" }}>
      <Navbar />
      <div className="container py-4">
        <h1 className="text-center">Report Road Damage</h1>
        <div className="card mb-3">
          <div className="card-body">
            <MapContainer center={currentLocation} zoom={14} style={{ height: "400px" }}>
              <TileLayer
                url={`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {/* Current Location Marker (red) */}
              <Marker position={currentLocation} icon={redMarkerIcon}>
                <Popup>Your Location</Popup>
              </Marker>
              <Circle
                center={currentLocation}
                radius={1000}
                pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.2 }}
              />
              {/* Render all backend markers */}
              {markers.map((marker, index) => (
                <Marker
                  key={index}
                  position={[marker.latitude, marker.longitude]}
                  icon={redMarkerIcon} // Use the red icon for damage markers
                >
                  <Popup>Reported Damage</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
        <button className="btn btn-primary mb-3" onClick={goToCurrentLocation}>
          Go to My Location
        </button>
        <div className="card mb-3">
          <div className="card-body">
            <input type="file" onChange={handleImageUpload} disabled={isUploading} />
            {isUploading && <p>Uploading...</p>}
          </div>
        </div>
        {processedImage && (
          <div className="card mb-3">
            <div className="card-body">
              <h3>Processed Image</h3>
              <img src={processedImage} alt="Processed" className="img-fluid" />
            </div>
          </div>
        )}
      </div>
      <footer style={{ backgroundColor: "#343a40", color: "#fff", textAlign: "center", padding: "1rem 0" }}>
        <p>© 2024 Sarthi - All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default ReportDamage;
