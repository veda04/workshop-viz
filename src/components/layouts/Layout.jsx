import React from 'react';
import Header from './Header';

const Layout = ({ children, showHeader = true }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen transition-colors duration-200">
      {showHeader && <Header />}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
