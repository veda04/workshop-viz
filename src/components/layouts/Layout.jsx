import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from './Header';
import Modal from '../Modal';
import NotesForm from '../forms/NotesForm';

const Layout = ({ children, showHeader = true, componentCount = 0 }) => {
  const [searchParams] = useSearchParams();
  const dashboardId = searchParams.get('dashboardId');
  const machineName = searchParams.get('machineName');
  const title = searchParams.get('title');
  
  // Determine if this is a new dashboard (has dashboardId but no old-style machineName param without dashboardId)
  // New dashboards will have dashboardId, and may have machineName if machine-specific
  const isNewDashboard = dashboardId !== null;

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
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen overflow-hidden transition-colors duration-200">
      {showHeader && <Header machineName={machineName} title={title} isNewDashboard={isNewDashboard} componentCount={componentCount} />}
      <main>
        {children}
      </main>

      {/* Global Notes Modal - accessible from all pages via Header button */}
      <Modal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} size="large">
        <NotesForm onClose={() => setIsNotesModalOpen(false)} machineName={machineName} />
      </Modal>
    </div>
  );
};

export default Layout;
