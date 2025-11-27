import React, { createContext, useContext, useState } from 'react';

const EditLayoutContext = createContext();

export const useEditLayout = () => {
  const context = useContext(EditLayoutContext);
  if (!context) {
    throw new Error('useEditLayout must be used within EditLayoutProvider');
  }
  return context;
};

export const EditLayoutProvider = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
  };

  const enableEditMode = () => {
    setIsEditMode(true);
  };

  const disableEditMode = () => {
    setIsEditMode(false);
  };

  const triggerLayoutReset = () => {
    setResetTrigger(prev => prev + 1);
  };

  return (
    <EditLayoutContext.Provider value={{ 
      isEditMode, 
      toggleEditMode, 
      enableEditMode, 
      disableEditMode,
      resetTrigger,
      triggerLayoutReset
    }}>
      {children}
    </EditLayoutContext.Provider>
  );
};
