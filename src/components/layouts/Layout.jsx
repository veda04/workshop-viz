import React from 'react';
import Header from './Header';

const Layout = ({ children, showHeader = true }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {showHeader && <Header />}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
