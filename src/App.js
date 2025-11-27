import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MachineSummary from './components/dashboard/MachineSummary';
import CustomGraphs from './pages/CustomGraphs';
import BasicLayout from './pages/test';
import { DarkModeProvider } from './context/DarkModeContext';
import { EditLayoutProvider } from './context/EditLayoutContext';
import './App.css';

function App() {
  return (
    <DarkModeProvider>
      <EditLayoutProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<MachineSummary replace />} />
              <Route path="/machine-summary" element={<MachineSummary />} />
              <Route path="/customize-graphs" element={<CustomGraphs />} />
              <Route path="/test" element={<BasicLayout />} />
            </Routes>
          </div>
        </Router>
      </EditLayoutProvider>
    </DarkModeProvider>
  );
}

export default App;