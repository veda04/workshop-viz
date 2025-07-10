import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import MachineSummary from './components/MachineSummary';
import SensorDetails from './components/SensorDetails';
import Analytics from './components/Analytics';
import InfluxDBTest from './components/InfluxDBTest';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MachineSummary replace />} />
          <Route path="/influxdb-test" element={<InfluxDBTest />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          <Route path="/machine-summary" element={<MachineSummary />} />
          <Route path="/sensors" element={<SensorDetails />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;