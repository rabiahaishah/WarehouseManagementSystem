import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Inbound from "./pages/Inbound";
import Outbound from "./pages/Outbound";
import CycleCount from "./pages/CycleCount";
import Forecast from "./pages/Forecast";

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    setToken(storedToken);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={token ? <Home /> : <Navigate to="/login" replace />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/inventory" element={token ? <Inventory /> : <Navigate to="/login" replace />} />
        <Route path="/inbound" element={token ? <Inbound /> : <Navigate to="/login" replace />} />
        <Route path="/outbound" element={token ? <Outbound /> : <Navigate to="/login" replace />} />
        <Route path="/cycle-count" element={token ? <CycleCount /> : <Navigate to="/login" replace />} />
        <Route path="/forecast" element={token ? <Forecast /> : <Navigate to="/login" replace />} />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;