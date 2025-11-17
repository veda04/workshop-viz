import React, { useEffect, useState } from 'react';
import Header from './Header';
import Modal from '../Modal';
import NotesForm from '../forms/NotesForm';

const Layout = ({ children, showHeader = true }) => {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Add event listener for opening notes modal
  // This listens to the button click in Header component
  useEffect(() => {
    const handleOpenNotesModal = () => {
      setIsNotesModalOpen(true);
    };

    window.addEventListener('openNotesModal', handleOpenNotesModal);
    
    return () => {
      window.removeEventListener('openNotesModal', handleOpenNotesModal);
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen transition-colors duration-200">
      {showHeader && <Header />}
      <main>
        {children}
      </main>

      {/* Global Notes Modal - accessible from all pages via Header button */}
      <Modal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} size="large">
        <NotesForm onClose={() => setIsNotesModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Layout;
