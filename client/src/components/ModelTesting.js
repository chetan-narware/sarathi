import React, { useState, useRef } from 'react';
import Navbar from './Navbar';
import axios from 'axios';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ModelTesting = () => {
  const [modelFile, setModelFile] = useState(null);
  const [validationImages, setValidationImages] = useState([]); // Array to store validation images
  const [isDay, setIsDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null); // Reference to the map instance

  const styles = {
    pageContainer: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: isDay ? '#ffffff' : '#1a1a1a',
      color: isDay ? '#000000' : '#ffffff',
      fontFamily: 'Arial, sans-serif',
    },
    heading: {
      textAlign: 'center',
      fontSize: '2.5rem',
      margin: '30px 0 10px',
      color: isDay ? '#000' : '#fff',
    },
    uploadButton: {
      display: 'block',
      margin: '20px auto',
      backgroundColor: isDay ? '#007bff' : '#28a745',
      color: '#fff',
      padding: '10px 20px',
      fontSize: '1rem',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
    },
    footer: {
      backgroundColor: '#343a40',
      color: 'white',
      textAlign: 'center',
      padding: '1rem 0',
      marginTop: 'auto',
    },
    mapContainer: {
      height: '300px',
      width: '80%',
      margin: '20px auto',
      borderRadius: '10px',
      overflow: 'hidden',
    },
    collageContainer: {
      width: '80%',  // Fixed width (80% of the page width or use a specific value like '800px')
      margin: '0 auto', // Centering the container
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', // Auto-adjusts columns based on screen size
      gap: '20px',
      padding: '20px',
      border: '2px solid #ccc', // Optional border for the container
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    imageStyle: {
      width: '100%',
      height: 'auto',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    fetchButton: {
      display: 'block',
      margin: '20px auto',
      backgroundColor: isDay ? '#17a2b8' : '#007bff',
      color: '#fff',
      padding: '10px 20px',
      fontSize: '1rem',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setModelFile(file);

    if (!file) return;

    const formData = new FormData();
    formData.append('model', file);

    setLoading(true);

    try {
      // Show popup
      showPopup('Uploading model...');

      const response = await axios.post('/upload-model', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showPopup('Model uploaded successfully!');
    } catch (error) {
      console.error('Error uploading the model:', error);
      showPopup('An error occurred while uploading the model.');
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (message) => {
    const map = mapRef.current;
    if (map) {
      const center = map.getCenter(); // Get map center
      L.popup()
        .setLatLng(center)
        .setContent(message)
        .openOn(map);
    }
  };

  const fetchValidationImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/fetch-validation-images');
      if (response.data && response.data.images) {
        setValidationImages(response.data.images);
      } else {
        showPopup('Failed to fetch validation images.');
      }
    } catch (error) {
      console.error('Error fetching validation images:', error);
      showPopup('An error occurred while fetching the validation images.');
    } finally {
      setLoading(false);
    }
  };

  const MapComponent = () => {
    const map = useMap();
    mapRef.current = map; // Assign the map instance to the ref
    return null;
  };

  return (
    <div style={styles.pageContainer}>
      <Navbar />
      <h1 style={styles.heading}>Model Testing</h1>
      <p style={{ textAlign: 'center', color: isDay ? '#000' : '#fff' }}>
        Upload a model to test its performance. Once uploaded, validation images will appear below in a collage.
      </p>

      <label htmlFor="modelUpload" style={styles.uploadButton}>
        {loading ? 'Uploading...' : 'Upload Model'}
      </label>
      <input
        id="modelUpload"
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        disabled={loading}
      />

      {/* Fetch Images Button */}
      <button style={styles.fetchButton} onClick={fetchValidationImages} disabled={loading}>
        {loading ? 'Fetching Images...' : 'Fetch Validation Images'}
      </button>

      {validationImages.length > 0 ? (
        <div style={styles.collageContainer}>
          {validationImages.map((imageData, index) => (
            <div key={index}>
              <img
                src={`data:image/jpeg;base64,${imageData}`}
                alt={`Validation Image ${index + 1}`}
                style={styles.imageStyle}
              />
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: isDay ? '#000' : '#fff' }}>
          No validation images to display yet.
        </p>
      )}

      <div style={styles.mapContainer}>
        <MapContainer center={[0, 0]} zoom={2} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapComponent />
        </MapContainer>
      </div>

      <footer style={styles.footer}>
        &copy; {new Date().getFullYear()} Your Company Name
      </footer>
    </div>
  );
};

export default ModelTesting;
