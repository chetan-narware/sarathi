import React from "react";
import { Link } from "react-router-dom";

const Navbar = ({ isDay, toggleMode }) => {
  return (
    <nav className={`navbar navbar-expand-lg navbar-dark bg-dark`}>
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          Sarathi
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about">
                About
              </Link>
            </li>
          </ul>
          {/* Day-Night Toggle */}
          <button
            onClick={toggleMode}
            className="btn btn-light ms-3"
          >
            {isDay ? "Night Mode" : "Day Mode"}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
