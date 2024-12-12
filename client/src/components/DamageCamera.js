import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LaneCamera = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDay, setIsDay] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processedFrameRef = useRef(null);
  const streamInterval = useRef(null);

  const styles = {
    pageContainer: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: isDay ? '#ffffff' : '#1a1a1a',
      color: isDay ? '#000000' : '#ffffff',
      fontFamily: 'Arial, sans-serif',
    },
    contentWrap: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      gap: '20px',
      flexWrap: 'wrap',
    },
    videoWrapper: {
      width: '40%',
      height: '550px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '10px',
      backgroundColor: isDay ? '#f8f9fa' : '#333',
      border: `5px solid ${isDay ? 'yellowgreen' : 'lightblue'}`,
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    },
    heading: {
      textAlign: 'center',
      fontSize: '2.5rem',
      margin: '30px 0',
      color: isDay ? '#000' : '#fff',
    },
    footer: {
      backgroundColor: '#343a40',
      color: 'white',
      textAlign: 'center',
      padding: '1rem 0',
      marginTop: 'auto',
    },
    controlButton: {
      backgroundColor: isDay ? '#007bff' : '#28a745',
      color: '#fff',
      padding: '10px 20px',
      fontSize: '1rem',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      margin: '10px',
    },
    stopButton: {
      backgroundColor: '#dc3545',
      color: '#fff',
    },
    uploadWrapper: {
      display: 'flex',
      justifyContent: 'center',  // Center the buttons horizontally
      alignItems: 'center',      // Center the buttons vertically
      gap: '20px',
      marginTop: '20px',         // Add some space between the frames and buttons
    },
  };
    

  useEffect(() => {
    if (isStreaming) {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [isStreaming]);

  const startCamera = async () => {
    try {
      // Get list of media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      // Find the USB camera (filter for video input devices)
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length > 0) {
        const usbCamera = videoDevices[0]; // Choose the first video device or pick one specifically
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: usbCamera.deviceId }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        
        streamInterval.current = setInterval(sendFrameToBackend, 100); // Capture frame every 100ms
      } else {
        throw new Error('No video input devices found.');
      }
    } catch (error) {
      toast.error('Unable to access camera. Please check permissions.');
      setIsStreaming(false);
    }
  };
  

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    clearInterval(streamInterval.current);
  };

  const sendFrameToBackend = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameData = canvas.toDataURL('image/jpeg'); // Get frame as base64
    const frameBlob = await (await fetch(frameData)).blob(); // Convert base64 to Blob

    const formData = new FormData();
    formData.append('frame', frameBlob);

    try {
      const response = await axios.post('http://127.0.0.1:5000/process/damage-frame', formData);
      const { processed_frame } = response.data;

      // Update the processed frame
      if (processed_frame && processedFrameRef.current) {
        processedFrameRef.current.src = `data:image/jpeg;base64,${processed_frame}`;
      }
    } catch (error) {
      console.error('Error processing frame:', error);
      toast.error('Error processing frame. Check backend logs.');
    }
  };

  const toggleMode = () => {
    setIsDay(!isDay);
  };

  return (
    <div style={styles.pageContainer}>
      <Navbar isDay={isDay} toggleMode={toggleMode} />
      <div>
        <h1 style={styles.heading}>Damage Detection</h1>
      </div>
      <div style={styles.contentWrap}>
        <div style={styles.videoWrapper}>
          <video ref={videoRef} style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={styles.videoWrapper}>
          <img ref={processedFrameRef} alt="Processed frame" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
      <div style={styles.uploadWrapper}>
        <button
          style={styles.controlButton}
          onClick={() => setIsStreaming(true)}
          disabled={isStreaming}
        >
          Start Streaming
        </button>
        <button
          style={{ ...styles.controlButton, ...styles.stopButton }}
          onClick={() => setIsStreaming(false)}
          disabled={!isStreaming}
        >
          Stop Streaming
        </button>
      </div>
      <footer style={styles.footer}>
      <p>© 2024 Sarthi - All Rights Reserved</p>
      </footer>
      <ToastContainer position="bottom-center" autoClose={5000} hideProgressBar />
      {/* Hidden canvas to capture video frame */}
      <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480"></canvas>
    </div>
  );
};

export default LaneCamera;
