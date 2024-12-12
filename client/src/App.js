import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import LaneDetection from "./components/LaneDetection";
import LaneCamera from "./components/LaneCamera";
import RoadDamageDetection from "./components/RoadDamageDetection";
import ReportDamage from "./components/ReportDamage";
import DamageCamera from "./components/DamageCamera";
import About from "./components/About";
import ModelTesting from "./components/ModelTesting"; // Import the ModelTesting component
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} /> {/* Set Home.js as the home route */}
      <Route path="/lane-detection" element={<LaneDetection />} />
      <Route path="/lane-camera" element={<LaneCamera />} /> {/* New LaneCamera route */}
      <Route path="/road-damage-detection" element={<RoadDamageDetection />} />
      <Route path="/damage-camera" element={<DamageCamera />} />
      <Route path="/report-damage" element={<ReportDamage />} />
      <Route path="/about" element={<About />} />
      <Route path="/model-testing" element={<ModelTesting />} /> {/* Add new ModelTesting route */}
    </Routes>
  );
}

export default App;
