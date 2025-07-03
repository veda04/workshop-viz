import React from 'react';
import Navigation from './Navigation';
import Header from './Header';

const Layout = ({ children, showHeader = true }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      {showHeader && <Header />}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
