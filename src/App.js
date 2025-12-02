import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardSummary from './pages/DashboardSummary';
import DashboardBuilder from './pages/DashboardBuilder';
import Home from './pages/home';
import { DarkModeProvider } from './context/DarkModeContext';
import './App.css';

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard-summary" element={<DashboardSummary />} />
            <Route path="/dashboard-builder" element={<DashboardBuilder />} />
          </Routes>
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;