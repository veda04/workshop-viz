import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MachineSummary from './components/dashboard/MachineSummary';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MachineSummary replace />} />
          <Route path="/machine-summary" element={<MachineSummary />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;