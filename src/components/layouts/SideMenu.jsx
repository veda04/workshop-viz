import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SideMenu = ({ isOpen, onClose, machineName }) => {
  return (
    <>
      {/* Side Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Side Menu */}
      <div 
        className={`fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
          </div>

          {/* Menu Content */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <a href="/" className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Home
                </a>
              </li>
              {machineName && (
                <>
                  <li>
                    <a href={`/machine-summary?machineName=${machineName}`} className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      Machine Summary
                    </a>
                  </li>
                  <li>
                    <a href={`/customize-graphs?machineName=${machineName}`} className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      Customize Graphs
                    </a>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Menu Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Workshop Viz v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
