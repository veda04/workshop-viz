import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MachineSummary from './pages/MachineSummary';
import CustomGraphs from './pages/CustomGraphs';
import Home from './pages/home';
import { DarkModeProvider } from './context/DarkModeContext';
import './App.css';

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* <Route path="/" element={<MachineSummary replace />} /> */}
            <Route path="/" element={<Home replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/machine-summary" element={<MachineSummary />} />
            <Route path="/customize-graphs" element={<CustomGraphs />} />
          </Routes>
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;