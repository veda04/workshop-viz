import React from 'react';

const Modal = ({ isOpen, onClose, children, size = 'full'}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
    full: 'w-full h-full',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`${sizeClasses[size]} relative overflow-hidden border border-transparent rounded-lg shadow-2xl`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-100 bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        
        {/* Modal Content - Full screen */}
        <div className="w-full h-full rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
