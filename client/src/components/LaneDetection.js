import React, { useState, useRef } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import { FaCamera } from 'react-icons/fa';  // For Camera icon
import { ToastContainer, toast } from 'react-toastify';  // For notifications
import 'react-toastify/dist/ReactToastify.css';  // For toast styles
import { useNavigate } from 'react-router-dom';


const LaneDetection = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDay, setIsDay] = useState(false);
  const imageRef = useRef(null);
  const imageStreamRef = useRef(null);

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
    uploadWrapper: {
      textAlign: 'center',
      marginTop: '20px',
    },
    uploadButton: {
      backgroundColor: isDay ? '#007bff' : '#28a745',
      color: '#fff',
      padding: '10px 20px',
      fontSize: '1rem',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    uploadButtonDisabled: {
      backgroundColor: '#6c757d',
      cursor: 'not-allowed',
    },
    stopButton: {
      backgroundColor: '#dc3545',
      color: '#fff',
      padding: '10px 20px',
      fontSize: '1rem',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
      marginLeft: '20px',
    },
    fileInput: {
      margin: '10px 0',
      padding: '10px',
      fontSize: '1rem',
      borderRadius: '5px',
    },
    cameraLink: {
      position: 'absolute',
      top: '80px',
      left: '20px',
      fontSize: '2rem',
      color: isDay ? '#000' : '#fff',
      cursor: 'pointer',
    },
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setFileName('');
    setIsProcessing(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a video file!');
      return;
    }

    if (isProcessing) {
      toast.info('Processing is already in progress. Please wait.');
      return;
    }

    setIsProcessing(true);
    toast.success('Uploading and processing video...');

    const formData = new FormData();
    formData.append('video', selectedFile);

    try {
      const uploadResponse = await axios.post('http://127.0.0.1:5000/upload/lane', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { file_path } = uploadResponse.data;
      const extractedFileName = file_path.split('/').pop();
      setFileName(extractedFileName);

      const imageStreamUrl = `http://127.0.0.1:5000/stream/lane/${extractedFileName}`;
      const imageStream = new EventSource(imageStreamUrl);
      imageStreamRef.current = imageStream;

      imageStream.onmessage = (event) => {
        if (event.data === 'end') {
          imageStream.close();
          toast.success('Video processing complete!');
          setIsProcessing(false);

          axios.delete(`http://127.0.0.1:5000/delete/lane/${extractedFileName}`).catch((error) => {
            console.error('Error deleting uploaded video:', error);
          });

          return;
        }

        const [frameData] = event.data.split('|');
        
        // Update the frame image
        const binaryData = new Uint8Array(frameData.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
        const frameBlob = new Blob([binaryData], { type: 'image/jpeg' });
        const frameUrl = URL.createObjectURL(frameBlob);
        imageRef.current.src = frameUrl;
      };

      imageStream.onerror = (error) => {
        console.error('Error streaming frames:', error);
        imageStream.close();
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Error uploading video:', error);
      setIsProcessing(false);
      toast.error('Error uploading video. Please try again.');
    }
  };

  const handleStopProcessing = () => {
    if (imageStreamRef.current) {
      imageStreamRef.current.close();
      setIsProcessing(false);
      toast.warning('Processing stopped.');
    }
  };

  const toggleMode = () => {
    setIsDay(!isDay);
  };

  return (
    <div style={styles.pageContainer}>
      <Navbar isDay={isDay} toggleMode={toggleMode} />
      <div style={styles.cameraLink} onClick={() => navigate('/lane-camera')}>
        <FaCamera />
      </div>
      <div>
        <h1 style={styles.heading}>Lane Detection</h1>
      </div>
      <div style={styles.contentWrap}>
        <div style={styles.videoWrapper}>
          {selectedFile ? (
            <video controls style={{ width: '100%', height: '100%' }}>
              <source src={URL.createObjectURL(selectedFile)} type="video/mp4" />
            </video>
          ) : (
            <p>No video uploaded</p>
          )}
        </div>
        <div style={styles.videoWrapper}>
          <img ref={imageRef} alt="Processed frame" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      <div style={styles.uploadWrapper}>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          style={styles.fileInput}
        />
        <button
          onClick={handleUpload}
          style={{
            ...styles.uploadButton,
            ...(isProcessing && styles.uploadButtonDisabled),
          }}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Upload and Process Video'}
        </button>
        {isProcessing && (
          <button
            onClick={handleStopProcessing}
            style={styles.stopButton}
          >
            Stop Processing
          </button>
        )}
      </div>

      <footer style={styles.footer}>
      <p>© 2024 Sarthi - All Rights Reserved</p>
      </footer>

      <ToastContainer position="bottom-center" autoClose={5000} hideProgressBar />
    </div>
  );
};

export default LaneDetection;
