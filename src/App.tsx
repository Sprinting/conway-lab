import React from "react";
import { HashRouter as Router, Route, Link, Routes } from "react-router-dom";
import { Helmet } from "react-helmet";
import ConwayGame from "./components/ConwayGame";
import Explanation from "./components/Explanation";
import LogicGates from "./components/LogicGates";
import DynamicFavicon from "./components/DynamicFavicon";
import "./utils/i18n";

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Helmet>
          <title>Conway's Game of Life</title>
        </Helmet>
        <DynamicFavicon />
        <nav>
          <ul>
            <li>
              <Link to="/">Game of Life</Link>
            </li>
            <li>
              <Link to="/explanation">Explanation</Link>
            </li>
            <li>
              <Link to="/logic">Logic Gates</Link>
            </li>
          </ul>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ConwayGame />} />
            <Route path="/explanation" element={<Explanation />} />
            <Route path="/logic" element={<LogicGates />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
