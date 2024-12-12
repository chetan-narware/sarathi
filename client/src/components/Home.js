import React, { useState } from "react";
import Navbar from "./Navbar";
import { Link } from "react-router-dom";

const Home = () => {
  // Set the default theme to night mode
  const [isDay, setIsDay] = useState(false);

  // Toggle between day and night modes
  const toggleTheme = () => setIsDay((prev) => !prev);

  // Define the theme styles based on the isDay state
  const themeStyles = {
    backgroundColor: isDay ? "#1a1a1a" : "#000000", // Keep black for day and night
    color: "#ffffff", // White text for all modes
  };

  return (
    <div style={themeStyles}>
      {/* Navbar with theme toggle */}
      <Navbar isDay={isDay} toggleMode={toggleTheme} />

      {/* Hero Section */}
      <div className={`py-5 bg-dark text-white`}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-3">SARATHI</h1>
              <p className="lead">
                Sarathi is a simulator for autonomous vehicles, designed to help with lane detection, pothole identification, and GPS tracking for safer roads and better vehicle navigation.
              </p>
            </div>
            <div className="col-lg-6 text-center">
              <img
                src="/images/sarthi.png"
                className="img-fluid rounded-circle border border-white shadow"
                alt="Sarthi"
                width="400"
                height="300"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Features */}
      <div className="container py-5">
        <h2 className="text-center pb-3 fw-bold">Our Features</h2>
        <div className="row g-4">
          {/* Lane Detection Feature */}
          <div className="col-md-4 text-center">
            <div
              className={`card border-0 shadow-sm ${isDay ? "bg-light" : "bg-dark text-white"}`}
            >
              <div
                className="card-img-top mx-auto my-3 rounded-circle bg-light d-flex justify-content-center align-items-center"
                style={{
                  width: "120px",
                  height: "120px",
                  border: isDay ? "5px solid black" : "5px solid white",
                }}
              >
                <img
                  src="/images/road-with-broken-line.png"
                  className="rounded-circle"
                  alt="Lane Detection"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <div className="card-body">
                <h5 className="card-title fw-bold">Lane Detection</h5>
                <p className={`card-text ${isDay ? "text-muted" : "text-light"}`}>
                  Detect and track road lanes in uploaded videos with precise coordinates for better navigation.
                </p>
                <Link to="/lane-detection" className="btn btn-primary btn-sm">
                  Explore
                </Link>
              </div>
            </div>
          </div>

          {/* Road Damage Detection Feature */}
          <div className="col-md-4 text-center">
            <div
              className={`card border-0 shadow-sm ${isDay ? "bg-light" : "bg-dark text-white"}`}
            >
              <div
                className="card-img-top mx-auto my-3 rounded-circle bg-light d-flex justify-content-center align-items-center"
                style={{
                  width: "120px",
                  height: "120px",
                  border: isDay ? "5px solid black" : "5px solid white",
                }}
              >
                <img
                  src="/images/damage.png"
                  className="rounded-circle"
                  alt="Road Damage Detection"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <div className="card-body">
                <h5 className="card-title fw-bold">Road Damage Detection</h5>
                <p className={`card-text ${isDay ? "text-muted" : "text-light"}`}>
                  Identify potholes and road damage in real-time, with coordinates provided for maintenance tracking.
                </p>
                <Link
                  to="/road-damage-detection"
                  className="btn btn-primary btn-sm"
                >
                  Explore
                </Link>
              </div>
            </div>
          </div>

          {/* Report Road Damage Feature */}
          <div className="col-md-4 text-center">
            <div
              className={`card border-0 shadow-sm ${isDay ? "bg-light" : "bg-dark text-white"}`}
            >
              <div
                className="card-img-top mx-auto my-3 rounded-circle bg-light d-flex justify-content-center align-items-center"
                style={{
                  width: "120px",
                  height: "120px",
                  border: isDay ? "5px solid black" : "5px solid white",
                }}
              >
                <img
                  src="/images/map.png"
                  className="rounded-circle"
                  alt="Report Road Damage"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <div className="card-body">
                <h5 className="card-title fw-bold">Report Road Damage</h5>
                <p className={`card-text ${isDay ? "text-muted" : "text-light"}`}>
                  Upload images to report potholes and plot GPS coordinates on an interactive map.
                </p>
                <Link to="/report-damage" className="btn btn-primary btn-sm">
                  Explore
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`py-4 ${isDay ? "bg-light text-dark" : "bg-dark text-white"}`}>
        <div className="container">
          <footer>
            <p className="text-center mb-0">&copy; 2024 SARATHI. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Home;
