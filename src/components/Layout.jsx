import React from 'react';
import Navigation from './Navigation';
import Header from './Header';

const Layout = ({ children, showHeader = true }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      {showHeader && <Header />}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
