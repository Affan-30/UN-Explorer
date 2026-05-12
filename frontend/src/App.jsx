import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import LandingPage from "./LandingPage";
import Dashboard from "./pages/dashoard";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>
);

export default App();