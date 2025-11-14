import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MachineSummary from './components/dashboard/MachineSummary';
import CustomGraphs from './pages/CustomGraphs';
import { DarkModeProvider } from './context/DarkModeContext';
import './App.css';

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<MachineSummary replace />} />
            <Route path="/machine-summary" element={<MachineSummary />} />
            <Route path="/customize-graphs" element={<CustomGraphs />} />
          </Routes>
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;