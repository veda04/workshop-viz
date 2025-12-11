import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardSummary from './pages/DashboardSummary';
import ComponentBuilder from './pages/ComponentBuilder';
import Home from './pages/home';
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
              <Route path="/" element={<Home replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/dashboard-summary" element={<DashboardSummary />} />
              <Route path="/component-builder" element={<ComponentBuilder />} />
            </Routes>
          </div>
        </Router>
       </EditLayoutProvider>
    </DarkModeProvider>
  );
}

export default App;