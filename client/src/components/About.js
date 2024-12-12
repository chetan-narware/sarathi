import React, { useState } from 'react';
import Navbar from './Navbar';  

const About = () => {
  const [theme, setTheme] = useState('night'); // Default theme is night

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'night' ? 'day' : 'night'));
  };

  return (
    <div className={`about-container ${theme}`} style={theme === 'night' ? styles.nightContainer : styles.dayContainer}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      <section className="about-section" style={styles.section}>
        <div className="about-item" style={styles.item}>
          <div className="about-image" style={styles.image}>
            <img src="/images/Capture.jpeg" alt="Lane Detection" style={styles.img} />
          </div>
          <div className="about-text" style={styles.text}>
            <h2>Lane Detection</h2>
            <p>
              Sarthi’s lane detection system uses advanced computer vision techniques, including Canny Edge Detection and Hough Transformation, to identify lane boundaries on roads. This feature is vital for autonomous vehicles, helping them stay within clearly marked lanes during travel. The system works by analyzing the road ahead, detecting the edges of lanes, and ensuring the vehicle follows the correct path. However, it is essential to note that the system requires roads to have visible lane markings for optimal performance. This makes it particularly effective on highways and roads with well-defined lanes.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section" style={styles.section}>
        <div className="about-item" style={styles.item}>
          <div className="about-text" style={styles.text}>
            <h2>Road Damage Detection</h2>
            <p>
              Sarthi utilizes state-of-the-art deep learning techniques, powered by YOLOv8, to detect road damage such as potholes, cracks, and other irregularities. This system continuously scans the road in real-time, identifying potential hazards that may pose a risk to the vehicle and its passengers. By detecting road damage, Sarthi helps autonomous vehicles navigate around these obstacles, enhancing safety and reducing the likelihood of accidents. Furthermore, the system can contribute to road maintenance by providing valuable data on damaged areas, helping authorities identify sections in need of repair.
            </p>
          </div>
          <div className="about-image" style={styles.image}>
            <img src="/images/nIhRc7lUofliuS8mPczNX.jpg" alt="Road Damage Detection" style={styles.img} />
          </div>
        </div>
      </section>

      <section className="about-section" style={styles.section}>
        <div className="about-item" style={styles.item}>
          <div className="about-image" style={styles.image}>
            <img src="/images/car.jpg" alt="Damage Reporting" style={styles.img} />
          </div>
          <div className="about-text" style={styles.text}>
            <h2>Report Damage</h2>
            <p>
              With Sarthi’s damage reporting feature, users can easily upload images of road damage, such as potholes or cracks, to be analyzed by the system. Once detected, the damage information is stored in Firebase and shown on an interactive map. This feature enables users to track road conditions and report hazards for better monitoring and maintenance. By crowdsourcing road condition data, Sarthi empowers users to actively contribute to improving road safety and assisting local authorities in addressing infrastructure issues in a timely manner.
            </p>
          </div>
        </div>
      </section>

      <section className="team-section" style={styles.teamSection}>
        <h2>Meet the Team</h2>
        <div className="team-container" style={styles.teamContainer}>
          <div className="team-member" style={styles.teamMember}>
            <div className="circle-image" style={styles.circleImage}>
              <img src="/images/Sunglasses.png" alt="Aman Zade" style={styles.circleImg} />
            </div>
            <p>Aman Zade</p>
          </div>
          <div className="team-member" style={styles.teamMember}>
            <div className="circle-image" style={styles.circleImage}>
              <img src="/images/Thinking.png" alt="Chetan Rajesh Narware" style={styles.circleImg} />
            </div>
            <p>Chetan Rajesh Narware</p>
          </div>
          <div className="team-member" style={styles.teamMember}>
            <div className="circle-image" style={styles.circleImage}>
              <img src="/images/Emoji.png" alt="Kshitij Tripathi" style={styles.circleImg} />
            </div>
            <p>Kshitij Tripathi</p>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <p>© 2024 Sarthi - All Rights Reserved</p>
      </footer>
    </div>
  );
};

// Inline Styles
const styles = {
  navbar: {
    backgroundColor: '#333',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navbarBrand: {
    color: '#fff',
  },
  themeToggle: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    padding: '8px 16px',
    backgroundColor: '#555',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  aboutContainer: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    minHeight: '100vh', // Ensures that the content takes up at least the full screen height
    display: 'flex',
    flexDirection: 'column',
  },
  nightContainer: {
    backgroundColor: '#121212',
    color: '#fff',
  },
  dayContainer: {
    backgroundColor: '#fff',
    color: '#000',
  },
  section: {
    margin: '40px 0',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
  },
  image: {
    flex: 1,
    borderRadius: "50%",
  },
  text: {
    flex: 2,
    fontSize: '20px',
  },
  img: {
    width: '100%',
    borderRadius: '50%',
  },
  teamSection: {
    textAlign: 'center',
    marginTop: '60px',
  },
  teamContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginTop: '20px',
  },
  teamMember: {
    textAlign: 'center',
  },
  circleImage: {
    borderRadius: '50%',
    width: '120px',
    height: '120px',
    overflow: 'hidden',
    margin: '0 auto',
  },
  circleImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  footer: {
    marginTop: 'auto',  // Ensures the footer is at the bottom
    backgroundColor: '#333',
    color: '#fff',
    textAlign: 'center',
    padding: '10px',
  },
};

export default About;
